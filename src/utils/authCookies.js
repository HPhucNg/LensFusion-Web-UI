import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/firebase/FirebaseConfig';
import { setCookie, deleteCookie } from 'cookies-next';

// Set auth cookie when user signs in
export const setAuthCookie = async (user) => {
  if (user) {
    // Get user's ID token
    const token = await user.getIdToken();
    
    // Set cookie that expires in 14 days
    setCookie('authToken', token, {
      maxAge: 60 * 60 * 24 * 14,
      path: '/',
    });
    
    // can also store user data in Firestore here if needed
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      // Create user document if it doesn't exist
      // already in saveUserToFirebase function
    }
  }
};

// Clear auth cookie when user signs out
export const clearAuthCookie = () => {
  deleteCookie('authToken');
};