'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '@/firebase/FirebaseConfig';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
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
    cancel_at_period_end: false,
    cancelationDate: null,
    loading: true,
    subscriptionEndDate: null,
  });

  // Token management - Token update when user subscribes to new plan
  const updateTokenCount = async (newTokens) => {
    try {
      const user = auth.currentUser;
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          tokens: newTokens
        });
        console.log('Token count updated');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating token count ', error);
      return false;
    }
  };

  //authentication and data sync
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const unsubscribeSnapshot = onSnapshot(userRef, (userDoc) => {
          if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log('Firestore user data:', userData); // Debug log

            let formattedEndDate = null;
            if (userData.subscriptionEndDate) {
              if (userData.subscriptionEndDate.toDate) {
                formattedEndDate = userData.subscriptionEndDate.toDate().toLocaleDateString();
              } 
              else if (typeof userData.subscriptionEndDate === 'string') {
                formattedEndDate = new Date(userData.subscriptionEndDate).toLocaleDateString();
              }
            }

            setSubscriptionData({
              status: userData.subscriptionStatus || 'inactive',
              currentPlan: userData.currentPlan || 'No Plan',
              planCycle: userData.planCycle || null,
              tokens: userData.tokens || 0,
              customerId: userData.customerId || null,
              subscriptionId: userData.subscriptionId,
              cancel_at_period_end: userData.cancel_at_period_end || false,
              cancelationDate: userData.cancelationDate || null,
              loading: false,
              subscriptionEndDate: formattedEndDate
            });
          } else {
            //If user document doesn't exist, create default values
            saveUserToFirebase(user);
            setSubscriptionData({
              status: 'inactive',
              currentPlan: 'No Plan',
              planCycle: null,
              tokens: 0,
              customerId: null,
              subscriptionId: null,
              cancel_at_period_end: false,
              cancelationDate: null,
              loading: false,
              subscriptionEndDate: null
            });
          }
        });
        return () => unsubscribeSnapshot();
      } else {
        // Resets the states when user not authenticated
        setSubscriptionData({
          status: 'inactive',
          currentPlan: 'No Plan',
          planCycle: null,
          tokens: 0,
          customerId: null,
          subscriptionId: null,
          cancel_at_period_end: false,
          cancelationDate: null,
          loading: false,
          subscriptionEndDate: null
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const value = {
    ...subscriptionData,
    updateTokenCount,
  };

  //context provider rendering
  return (
    <SubscriptionContext.Provider value={value}>
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

