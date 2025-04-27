import { db, auth } from '@/firebase/FirebaseConfig';
import {
  collection,
  addDoc,
  deleteDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  doc,
  writeBatch,
  Timestamp,
  limit,
  getDoc,
  onSnapshot,
  collectionGroup
} from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { deleteCookie } from 'cookies-next';

// Constants
const SESSION_EXPIRY_DAYS = 14;
const LAST_ACTIVE_UPDATE_INTERVAL = 30 * 60 * 1000; // 30 minutes in milliseconds
const MAX_SESSIONS_PER_USER = 5;
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes in milliseconds
const BATCH_SIZE = 20; // Maximum number of operations per batch

// Helper function to safely get timestamp
const getTimestampValue = (timestamp) => {
  if (!timestamp) return null;
  if (timestamp.toDate) return timestamp.toDate();
  if (timestamp instanceof Date) return timestamp;
  return new Date(timestamp);
};

// Client-side cache
let sessionCache = {
  data: null,
  timestamp: null
};

/**
 * Get device info for tracking sessions
 */
export const getDeviceInfo = () => {
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Calculate expiration timestamp
 */
const getExpirationTimestamp = () => {
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + SESSION_EXPIRY_DAYS);
  return Timestamp.fromDate(expirationDate);
};

/**
 * Get current timestamp
 */
const getCurrentTimestamp = () => {
  return Timestamp.fromDate(new Date());
};

/**
 * Check if cache is valid
 */
const isCacheValid = () => {
  if (!sessionCache.data || !sessionCache.timestamp) return false;
  return (Date.now() - sessionCache.timestamp) < CACHE_EXPIRY;
};

/**
 * Process batch operations with size limit
 */
const processBatch = async (operations) => {
  const batches = [];
  let currentBatch = writeBatch(db);
  let operationCount = 0;

  for (const operation of operations) {
    if (operationCount >= BATCH_SIZE) {
      batches.push(currentBatch);
      currentBatch = writeBatch(db);
      operationCount = 0;
    }
    operation(currentBatch);
    operationCount++;
  }

  if (operationCount > 0) {
    batches.push(currentBatch);
  }

  for (const batch of batches) {
    await batch.commit();
  }
};

/**
 * Clean up expired sessions for a user
 */
const cleanupExpiredSessions = async (userId) => {
  try {
    // Check cache first
    if (isCacheValid() && sessionCache.data.userId === userId) {
      const now = getCurrentTimestamp();
      const expiredSessions = sessionCache.data.sessions.filter(
        session => {
          const expiresAt = getTimestampValue(session.expiresAt);
          return expiresAt && expiresAt.getTime() <= now.toDate().getTime();
        }
      );
      
      if (expiredSessions.length > 0) {
        const operations = expiredSessions.map(session => 
          batch => batch.delete(doc(db, 'user_sessions', session.id))
        );
        await processBatch(operations);
        
        // Update cache
        sessionCache.data.sessions = sessionCache.data.sessions.filter(
          session => {
            const expiresAt = getTimestampValue(session.expiresAt);
            return expiresAt && expiresAt.getTime() > now.toDate().getTime();
          }
        );
      }
      return;
    }

    const sessionsRef = collection(db, 'user_sessions');
    const expiredQuery = query(
      sessionsRef,
      where('userId', '==', userId),
      where('expiresAt', '<=', getCurrentTimestamp()),
      limit(BATCH_SIZE)
    );
    
    const expiredSessions = await getDocs(expiredQuery);
    
    if (!expiredSessions.empty) {
      const operations = expiredSessions.docs.map(doc => 
        batch => batch.delete(doc.ref)
      );
      await processBatch(operations);
    }
  } catch (error) {
    console.error('Error cleaning up expired sessions:', error);
  }
};

/**
 * Create or update a user session
 */
export const createSession = async (userId, deviceInfo) => {
  try {
    const sessionsRef = collection(db, 'user_sessions');
    
    // Clean up expired sessions first
    await cleanupExpiredSessions(userId);

    // Check cache first for existing session
    if (isCacheValid() && sessionCache.data?.userId === userId) {
      const cachedSession = sessionCache.data.sessions.find(session => 
        session.deviceInfo.userAgent === deviceInfo.userAgent &&
        session.deviceInfo.platform === deviceInfo.platform &&
        session.deviceInfo.language === deviceInfo.language &&
        session.status === 'active'
      );

      if (cachedSession) {
        const expiresAt = getTimestampValue(cachedSession.expiresAt);
        if (expiresAt && expiresAt > new Date()) {
          return cachedSession.id;
        }
      }
    }

    // If no valid cached session, check Firestore
    const existingSessionsQuery = query(
      sessionsRef,
      where('userId', '==', userId),
      where('status', '==', 'active'),
      orderBy('expiresAt', 'desc'),
      limit(1) // Only get the most recent active session
    );
    
    const existingSessionsSnapshot = await getDocs(existingSessionsQuery);
    
    // Check if any existing session matches this device
    let existingSession = null;
    existingSessionsSnapshot.forEach(doc => {
      const session = { id: doc.id, ...doc.data() };
      const expiresAt = getTimestampValue(session.expiresAt);
      const now = new Date();
      
      if (session.deviceInfo && 
          session.deviceInfo.userAgent === deviceInfo.userAgent &&
          session.deviceInfo.platform === deviceInfo.platform &&
          session.deviceInfo.language === deviceInfo.language &&
          expiresAt && expiresAt > now) {
        existingSession = session;
      }
    });

    // If we found a matching session, update it
    if (existingSession) {
      const now = Date.now();
      const lastActiveTime = existingSession.lastActive?.toDate().getTime() || 0;
      
      if ((now - lastActiveTime) > LAST_ACTIVE_UPDATE_INTERVAL) {
        await updateDoc(doc(db, 'user_sessions', existingSession.id), {
          lastActive: serverTimestamp(),
          expiresAt: getExpirationTimestamp(),
          status: 'active'
        });
        
        // Update cache
        if (isCacheValid() && sessionCache.data.userId === userId) {
          const sessionIndex = sessionCache.data.sessions.findIndex(s => s.id === existingSession.id);
          if (sessionIndex !== -1) {
            sessionCache.data.sessions[sessionIndex].lastActive = Timestamp.now();
            sessionCache.data.sessions[sessionIndex].expiresAt = getExpirationTimestamp();
            sessionCache.data.sessions[sessionIndex].status = 'active';
          }
        }
      }
      
      return existingSession.id;
    }

    // Create new session
    const sessionData = {
      userId,
      deviceInfo,
      lastActive: serverTimestamp(),
      createdAt: serverTimestamp(),
      expiresAt: getExpirationTimestamp(),
      status: 'active'
    };

    const docRef = await addDoc(sessionsRef, sessionData);
    
    // Update cache
    const cacheSessionData = {
      ...sessionData,
      lastActive: Timestamp.now(),
      createdAt: Timestamp.now()
    };
    
    if (isCacheValid() && sessionCache.data.userId === userId) {
      sessionCache.data.sessions.push({
        id: docRef.id,
        ...cacheSessionData
      });
    } else {
      sessionCache = {
        data: {
          userId,
          sessions: [{
            id: docRef.id,
            ...cacheSessionData
          }]
        },
        timestamp: Date.now()
      };
    }

    return docRef.id;
  } catch (error) {
    console.error('Error creating session:', error);
    throw error;
  }
};

/**
 * Get all active sessions for a user
 */
export const getSessions = async (userId) => {
  try {
    // Check cache first
    if (isCacheValid() && sessionCache.data.userId === userId) {
      return sessionCache.data.sessions.map(session => ({
        ...session,
        lastActive: session.lastActive && typeof session.lastActive.toDate === 'function' 
          ? session.lastActive.toDate() 
          : session.lastActive,
        createdAt: session.createdAt && typeof session.createdAt.toDate === 'function' 
          ? session.createdAt.toDate() 
          : session.createdAt,
        expiresAt: session.expiresAt && typeof session.expiresAt.toDate === 'function' 
          ? session.expiresAt.toDate() 
          : session.expiresAt
      }));
    }

    const sessionsRef = collection(db, 'user_sessions');
    const q = query(
      sessionsRef,
      where('userId', '==', userId),
      where('status', '==', 'active'),
      orderBy('expiresAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);

    const sessions = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      lastActive: getTimestampValue(doc.data().lastActive),
      createdAt: getTimestampValue(doc.data().createdAt),
      expiresAt: getTimestampValue(doc.data().expiresAt)
    }));

    // Update cache
    sessionCache = {
      data: {
        userId,
        sessions
      },
      timestamp: Date.now()
    };

    return sessions;
  } catch (error) {
    console.error('Error getting sessions:', error);
    throw error;
  }
};

export async function deleteSession(sessionId) {
  try {
    const sessionRef = doc(db, 'user_sessions', sessionId);
    
    // First get the session data
    const sessionDoc = await getDoc(sessionRef);
    if (!sessionDoc.exists()) {
      console.warn('Session not found:', sessionId);
      return false;
    }

    const sessionData = sessionDoc.data();
    
    // Create a batch write for atomic operations
    const batch = writeBatch(db);
    
    // Mark the session as terminated
    batch.update(sessionRef, {
      status: 'terminated',
      terminatedAt: serverTimestamp(),
      terminatedBy: auth.currentUser?.uid,
      expiresAt: serverTimestamp() // Immediately expire the session
    });

    // Create a termination log
    const terminationLog = {
      sessionId,
      userId: sessionData.userId,
      deviceInfo: sessionData.deviceInfo,
      terminatedAt: serverTimestamp(),
      terminatedBy: auth.currentUser?.uid,
      reason: 'manual_termination',
      ipAddress: sessionData.deviceInfo?.ipAddress || 'unknown'
    };

    // Add termination log
    const terminationRef = doc(collection(db, 'session_terminations'));
    batch.set(terminationRef, terminationLog);
    
    // Commit the batch
    await batch.commit();
    
    // Update cache if it exists
    if (sessionCache && sessionCache.data && sessionCache.data.sessions) {
      sessionCache.data.sessions = sessionCache.data.sessions.filter(
        session => session.id !== sessionId
      );
    }

    return true;
  } catch (error) {
    console.error('Error deleting session:', error);
    throw error;
  }
}

export function monitorSessions(userId, onSessionRemoved) {
  if (!userId) return;

  // Use collection for monitoring
  const sessionsRef = collection(db, 'user_sessions');
  const q = query(
    sessionsRef,
    where('userId', '==', userId),
    where('status', '==', 'active'),
    orderBy('expiresAt', 'desc'),
    limit(1) // Only get the most recent active session
  );

  let initialSessionFound = false;
  let currentSessionId = null;
  let lastCheckTime = Date.now();
  const CHECK_INTERVAL = 30000; // 30 seconds

  // Set up real-time listener
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const now = Date.now();
    // Throttle checks to reduce reads
    if (now - lastCheckTime < CHECK_INTERVAL) {
      return;
    }
    lastCheckTime = now;

    // Get current device info
    const currentDeviceInfo = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language
    };

    // Check if current session exists in the snapshot
    const currentSession = snapshot.docs.find(doc => {
      const sessionData = doc.data();
      const expiresAt = getTimestampValue(sessionData.expiresAt);
      const now = new Date();
      
      return (
        sessionData.deviceInfo.userAgent === currentDeviceInfo.userAgent &&
        sessionData.deviceInfo.platform === currentDeviceInfo.platform &&
        sessionData.deviceInfo.language === currentDeviceInfo.language &&
        expiresAt && expiresAt > now
      );
    });

    if (currentSession) {
      initialSessionFound = true;
      currentSessionId = currentSession.id;
    } else if (initialSessionFound) {
      // Only trigger if we previously found the session and now it's gone or terminated
      onSessionRemoved();
    }
  }, (error) => {
    console.error('Error monitoring sessions:', error);
    // If there's an error, we should still trigger the reauth to be safe
    onSessionRemoved();
  });

  return unsubscribe;
}
