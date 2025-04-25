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
  getDoc
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

    // Check for existing session first, regardless of cache
    const existingSessionsQuery = query(
      sessionsRef,
      where('userId', '==', userId),
      where('expiresAt', '>', Timestamp.now())
    );
    
    const existingSessionsSnapshot = await getDocs(existingSessionsQuery);
    
    // Check if any existing session matches this device
    let existingSession = null;
    existingSessionsSnapshot.forEach(doc => {
      const session = { id: doc.id, ...doc.data() };
      
      // Compare more device properties for better matching
      if (session.deviceInfo && 
          session.deviceInfo.userAgent === deviceInfo.userAgent &&
          session.deviceInfo.platform === deviceInfo.platform &&
          session.deviceInfo.language === deviceInfo.language) {
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
          expiresAt: getExpirationTimestamp()
        });
        
        // Update cache if it exists
        if (isCacheValid() && sessionCache.data.userId === userId) {
          const sessionIndex = sessionCache.data.sessions.findIndex(s => s.id === existingSession.id);
          if (sessionIndex !== -1) {
            // Store actual Timestamp objects in cache, not serverTimestamp sentinel values
            sessionCache.data.sessions[sessionIndex].lastActive = Timestamp.now();
            sessionCache.data.sessions[sessionIndex].expiresAt = getExpirationTimestamp();
          }
        }
      }
      
      return existingSession.id;
    }

    // If no existing session for this device, check if we've reached the limit
    if (existingSessionsSnapshot.size >= MAX_SESSIONS_PER_USER) {
      // Sort sessions by lastActive date to find the oldest one
      const sessions = existingSessionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      sessions.sort((a, b) => {
        const aTime = a.lastActive?.toDate().getTime() || a.createdAt?.toDate().getTime() || 0;
        const bTime = b.lastActive?.toDate().getTime() || b.createdAt?.toDate().getTime() || 0;
        return aTime - bTime;
      });
      
      // Delete the oldest session
      const oldestSession = sessions[0];
      await deleteDoc(doc(db, 'user_sessions', oldestSession.id));
      
      // Update cache if it exists
      if (isCacheValid() && sessionCache.data.userId === userId) {
        sessionCache.data.sessions = sessionCache.data.sessions.filter(
          session => session.id !== oldestSession.id
        );
      }
    }

    // Create new session
    const sessionData = {
      userId,
      deviceInfo,
      lastActive: serverTimestamp(),
      createdAt: serverTimestamp(),
      expiresAt: getExpirationTimestamp()
    };

    const docRef = await addDoc(sessionsRef, sessionData);
    
    // Update cache with actual Timestamp objects
    const cacheSessionData = {
      ...sessionData,
      lastActive: Timestamp.now(),
      createdAt: Timestamp.now()
    };
    
    // Update cache
    if (isCacheValid() && sessionCache.data.userId === userId) {
      sessionCache.data.sessions.push({
        id: docRef.id,
        ...cacheSessionData
      });
    } else {
      // Initialize cache
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
      where('expiresAt', '>', getCurrentTimestamp()),
      limit(MAX_SESSIONS_PER_USER)
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
