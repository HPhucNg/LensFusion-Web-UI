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
  doc
} from 'firebase/firestore';

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
 * Create or update a user session
 */
export const createSession = async (userId, deviceInfo) => {
  try {
    const sessionsRef = collection(db, 'user_sessions');

    // Find if a session already exists for the same device
    const existingQuery = query(
      sessionsRef,
      where('userId', '==', userId),
      where('deviceInfo.userAgent', '==', deviceInfo.userAgent),
      where('deviceInfo.platform', '==', deviceInfo.platform)
    );
    const existingSessions = await getDocs(existingQuery);

    if (!existingSessions.empty) {
      // Update lastActive if session already exists
      const existingDoc = existingSessions.docs[0];
      await updateDoc(doc(db, 'user_sessions', existingDoc.id), {
        lastActive: serverTimestamp()
      });
      return existingDoc.id;
    }

    // Limit to 5 sessions per user
    const allSessionsQuery = query(
      sessionsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'asc')
    );
    const allSessions = await getDocs(allSessionsQuery);

    if (allSessions.size >= 5) {
      const oldestSession = allSessions.docs[0];
      await deleteDoc(doc(db, 'user_sessions', oldestSession.id));
    }

    // Create new session
    const sessionData = {
      userId,
      deviceInfo,
      lastActive: serverTimestamp(),
      createdAt: serverTimestamp()
    };

    const docRef = await addDoc(sessionsRef, sessionData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating session:', error);
    throw error;
  }
};

/**
 * Get all sessions for a user
 */
export const getSessions = async (userId) => {
  try {
    const sessionsRef = collection(db, 'user_sessions');
    const q = query(sessionsRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      lastActive: doc.data().lastActive?.toDate(),
      createdAt: doc.data().createdAt?.toDate()
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
