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

    // Check cache for existing session
    if (isCacheValid() && sessionCache.data.userId === userId) {
      const existingSession = sessionCache.data.sessions.find(
        session => 
          session.deviceInfo.userAgent === deviceInfo.userAgent &&
          session.deviceInfo.platform === deviceInfo.platform
      );

      if (existingSession) {
        const now = getCurrentTimestamp();
        const lastActive = getTimestampValue(existingSession.lastActive);
        
        if (!lastActive || 
            (now.toDate().getTime() - lastActive.getTime()) > LAST_ACTIVE_UPDATE_INTERVAL) {
          await updateDoc(doc(db, 'user_sessions', existingSession.id), {
            lastActive: serverTimestamp(),
            expiresAt: getExpirationTimestamp()
          });
          
          // Update cache
          existingSession.lastActive = serverTimestamp();
          existingSession.expiresAt = getExpirationTimestamp();
        }
        return existingSession.id;
      }
    }

    // Get all active sessions for user with limit
    const activeSessionsQuery = query(
      sessionsRef,
      where('userId', '==', userId),
      where('expiresAt', '>', getCurrentTimestamp()),
      orderBy('expiresAt', 'asc'),
      limit(MAX_SESSIONS_PER_USER)
    );
    const activeSessions = await getDocs(activeSessionsQuery);

    // If max sessions reached, delete oldest
    if (activeSessions.size >= MAX_SESSIONS_PER_USER) {
      const oldestSession = activeSessions.docs[0];
      await deleteDoc(doc(db, 'user_sessions', oldestSession.id));
      
      // Update cache if exists
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
    
    // Update cache
    if (isCacheValid() && sessionCache.data.userId === userId) {
      sessionCache.data.sessions.push({
        id: docRef.id,
        ...sessionData
      });
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
        lastActive: getTimestampValue(session.lastActive),
        createdAt: getTimestampValue(session.createdAt),
        expiresAt: getTimestampValue(session.expiresAt)
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

/**
 * Delete a session by ID
 */
export const deleteSession = async (sessionId) => {
  try {
    console.log('Starting session deletion for ID:', sessionId);
    
    // Get the session
    const sessionRef = doc(db, 'user_sessions', sessionId);
    const sessionDoc = await getDoc(sessionRef);

    if (!sessionDoc.exists()) {
      console.log('Session not found:', sessionId);
      throw new Error('Session not found');
    }

    const sessionData = sessionDoc.data();
    
    // Check if this is the current session
    const isCurrentSession = 
      sessionData.deviceInfo.userAgent === navigator.userAgent && 
      sessionData.deviceInfo.platform === navigator.platform;

    // Delete the session
    await deleteDoc(sessionRef);
    console.log('Successfully terminated session:', sessionId);
    
    // If this is the current session, sign out the user and clear all data
    if (isCurrentSession) {
      console.log('Terminating current session, signing out user');
      
      try {
        // List of all possible auth-related cookies
        const authCookies = [
          'auth_token',
          'session_id',
          'user_id',
          'authToken',
          'firebase:authUser',
          'firebase:host:lensfusion-fc879.firebaseapp.com',
          'firebase:host:lensfusion-fc879.firebaseapp.com:session',
          'firebase:host:lensfusion-fc879.firebaseapp.com:session:last',
          'firebase:host:lensfusion-fc879.firebaseapp.com:session:last:last',
          'firebase:host:lensfusion-fc879.firebaseapp.com:session:last:last:last'
        ];

        // Clear all auth-related cookies
        authCookies.forEach(cookieName => {
          try {
            deleteCookie(cookieName);
            // Also try to delete with domain
            deleteCookie(cookieName, { domain: window.location.hostname });
            // And with path
            deleteCookie(cookieName, { path: '/' });
          } catch (error) {
            console.warn(`Failed to delete cookie ${cookieName}:`, error);
          }
        });
        
        // Clear local storage
        localStorage.clear();
        sessionStorage.clear();
        
        // Clear the session cache
        sessionCache = {
          data: null,
          timestamp: null
        };
        
        // Sign out from Firebase
        await signOut(auth);
        
        // Add a small delay to ensure cleanup is complete
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Get the base URL
        const baseUrl = window.location.origin;
        
        // Force a complete page reload with cache clearing
        window.location.replace(`${baseUrl}/login?clear=1&t=${Date.now()}`);
      } catch (error) {
        console.error('Error during cleanup:', error);
        // Even if cleanup fails, still redirect to login
        const baseUrl = window.location.origin;
        window.location.replace(`${baseUrl}/login?clear=1&t=${Date.now()}`);
      }
    }
    
    // Update cache if exists
    if (isCacheValid()) {
      sessionCache.data.sessions = sessionCache.data.sessions.filter(
        session => session.id !== sessionId
      );
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting session:', error);
    throw error;
  }
};
