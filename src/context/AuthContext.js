import { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '@/firebase/FirebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { createSession, getDeviceInfo } from '@/lib/sessionManager';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Get user data from Firestore
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          // Update user data
          setUser({ ...user, ...userSnap.data() });
        } else {
          // Create new user document
          const userData = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            createdAt: new Date(),
            securitySettings: {
              loginNotifications: true
            }
          };
          await setDoc(userRef, userData);
          setUser({ ...user, ...userData });
        }

        // Create a new session
        try {
          const deviceInfo = getDeviceInfo();
          const sessionId = await createSession(user.uid, deviceInfo);
          
          // If login notifications are enabled, send notification
          const userDoc = await getDoc(userRef);
          if (userDoc.exists() && userDoc.data().securitySettings?.loginNotifications) {
            // Here you would implement your notification system
            // For example, sending an email or push notification
            console.log('New login detected, notification would be sent');
          }
        } catch (error) {
          console.error('Error creating session:', error);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthProvider }; 