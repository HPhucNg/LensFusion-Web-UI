import { db } from '@/firebase/FirebaseConfig';
import { collection, addDoc, deleteDoc, getDocs, query, where, serverTimestamp, doc } from 'firebase/firestore';

export const createSession = async (userId, deviceInfo) => {
  try {
    const sessionsRef = collection(db, 'user_sessions');
    const sessionData = {
      userId,
      deviceInfo,
      lastActive: serverTimestamp(),
      createdAt: serverTimestamp(),
    };
    
    const docRef = await addDoc(sessionsRef, sessionData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating session:', error);
    throw error;
  }
};

export const getSessions = async (userId) => {
  try {
    const sessionsRef = collection(db, 'user_sessions');
    const q = query(sessionsRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      lastActive: doc.data().lastActive?.toDate(),
      createdAt: doc.data().createdAt?.toDate(),
    }));
  } catch (error) {
    console.error('Error getting sessions:', error);
    throw error;
  }
};

export const deleteSession = async (sessionId) => {
  try {
    await deleteDoc(doc(db, 'user_sessions', sessionId));
    return true;
  } catch (error) {
    console.error('Error deleting session:', error);
    throw error;
  }
};

export const getDeviceInfo = () => {
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    timestamp: new Date().toISOString(),
  };
}; 