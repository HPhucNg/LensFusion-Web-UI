'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '@/firebase/FirebaseConfig';
import { doc, onSnapshot } from 'firebase/firestore';
import { saveUserToFirebase } from '@/firebase/firebaseUtils';

// this is used to manage the subscription status
const SubscriptionContext = createContext();

export function SubscriptionProvider({ children }) {
  const [subscriptionData, setSubscriptionData] = useState({
    status: 'inactive',
    currentPlan: null,
    planCycle: null,
    tokens: 0,
    subscriptionId: null,
    cancelAtPeriodEnd: false,
    cancellationDate: null,
    loading: true
  });

  //authentication and data sync
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const unsubscribeSnapshot = onSnapshot(userRef, (userDoc) => {
          if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log('Firestore user data:', userData); // Debug log

            setSubscriptionData({
              status: userData.subscriptionStatus || 'inactive',
              currentPlan: userData.currentPlan || 'No Plan',
              planCycle: userData.planCycle || null,
              tokens: userData.tokens || 0,
              customerId: userData.customerId || null,
              subscriptionId: userData.subscriptionId,
              cancelAtPeriodEnd: userData.cancelAtPeriodEnd || false,
              cancellationDate: userData.cancellationDate || null,
              loading: false
            });
          } else {
            //if the user document doesn't exist, create it with default values
            saveUserToFirebase(user);
            setSubscriptionData({
              status: 'inactive',
              currentPlan: 'No Plan',
              planCycle: null,
              tokens: 0,
              customerId: null,
              subscriptionId: null,
              cancelAtPeriodEnd: false,
              cancellationDate: null,
              loading: false
            });
          }
        });
        return () => unsubscribeSnapshot();
      } else {
        //this resets the states when user not authenticated
        setSubscriptionData({
          status: 'inactive',
          currentPlan: 'No Plan',
          planCycle: null,
          tokens: 0,
          customerId: null,
          subscriptionId: null,
          cancelAtPeriodEnd: false,
          cancellationDate: null,
          loading: false
        });
      }
    });

    return () => unsubscribe();
  }, []);

  //context provider rendering
  return (
    <SubscriptionContext.Provider value={subscriptionData}>
      {children}
    </SubscriptionContext.Provider>
  );
}
//custom hook for using context
export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a provider');
  }
  return context;
};

