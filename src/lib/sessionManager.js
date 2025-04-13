import { db } from '@/firebase/FirebaseConfig';
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
  Timestamp
} from 'firebase/firestore';

// Constants
const SESSION_EXPIRY_DAYS = 14;
const LAST_ACTIVE_UPDATE_INTERVAL = 5 * 60 * 1000; // 5 minutes in milliseconds
const MAX_SESSIONS_PER_USER = 5;

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
 * Clean up expired sessions for a user
 */
const cleanupExpiredSessions = async (userId) => {
  try {
    const sessionsRef = collection(db, 'user_sessions');
    const expiredQuery = query(
      sessionsRef,
      where('userId', '==', userId),
      where('expiresAt', '<=', serverTimestamp())
    );
    
    const expiredSessions = await getDocs(expiredQuery);
    
    if (!expiredSessions.empty) {
      const batch = writeBatch(db);
      expiredSessions.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
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

    // Find if a session already exists for the same device
    const existingQuery = query(
      sessionsRef,
      where('userId', '==', userId),
      where('deviceInfo.userAgent', '==', deviceInfo.userAgent),
      where('deviceInfo.platform', '==', deviceInfo.platform)
    );
    const existingSessions = await getDocs(existingQuery);

    if (!existingSessions.empty) {
      const existingDoc = existingSessions.docs[0];
      const sessionData = existingDoc.data();
      
      // Only update lastActive if more than LAST_ACTIVE_UPDATE_INTERVAL has passed
      if (!sessionData.lastActive || 
          (Date.now() - sessionData.lastActive.toDate().getTime()) > LAST_ACTIVE_UPDATE_INTERVAL) {
        await updateDoc(doc(db, 'user_sessions', existingDoc.id), {
          lastActive: serverTimestamp(),
          expiresAt: getExpirationTimestamp()
        });
      }
      return existingDoc.id;
    }

    // Get all active sessions for user
    const activeSessionsQuery = query(
      sessionsRef,
      where('userId', '==', userId),
      where('expiresAt', '>', serverTimestamp()),
      orderBy('expiresAt', 'asc')
    );
    const activeSessions = await getDocs(activeSessionsQuery);

    // If max sessions reached, delete oldest
    if (activeSessions.size >= MAX_SESSIONS_PER_USER) {
      const oldestSession = activeSessions.docs[0];
      await deleteDoc(doc(db, 'user_sessions', oldestSession.id));
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
    const sessionsRef = collection(db, 'user_sessions');
    const q = query(
      sessionsRef,
      where('userId', '==', userId),
      where('expiresAt', '>', serverTimestamp())
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      lastActive: doc.data().lastActive?.toDate(),
      createdAt: doc.data().createdAt?.toDate(),
      expiresAt: doc.data().expiresAt?.toDate()
    }));
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
    await deleteDoc(doc(db, 'user_sessions', sessionId));
    return true;
  } catch (error) {
    console.error('Error deleting session:', error);
    throw error;
  }
};
