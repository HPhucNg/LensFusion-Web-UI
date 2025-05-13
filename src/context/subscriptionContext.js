'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '@/firebase/FirebaseConfig';
import { doc, onSnapshot, updateDoc, getDoc } from 'firebase/firestore';
import { saveUserToFirebase, checkFreeTrialExpiration } from '@/firebase/firebaseUtils';

// Context used to manage the subscription status
const SubscriptionContext = createContext();

// Store subscription data to use throughout application
export function SubscriptionProvider({ children }) {
  //default value for users with no active subscription
  const [subscriptionData, setSubscriptionData] = useState({
    subscriptionStatus: 'inactive',
    currentPlan: null,
    planCycle: null,
    tokens: 0,
    freeTrialTokens: 0,
    subscriptionId: null,
    cancel_at_period_end: false,
    cancelationDate: null,
    loading: true,
    subscriptionEndDate: null,
  });

  // Helper function to format the subscription end date consistently
  const formatEndDate = (dateValue) => {
    if (!dateValue) return null;
    
    if (dateValue.toDate) {
      return dateValue.toDate().toLocaleDateString();
    } else if (typeof dateValue === 'string') {
      return new Date(dateValue).toLocaleDateString();
    }
    return null;
  };

  // Helper function to create subscription data object from Firestore data
  const createSubscriptionDataFromFirestore = (userData) => {
    return {
      subscriptionStatus: userData.subscriptionStatus || 'inactive',
      currentPlan: userData.currentPlan || 'No Plan',
      planCycle: userData.planCycle || null,
      tokens: userData.tokens || 0,
      freeTrialTokens: userData.freeTrialTokens || 0,
      customerId: userData.customerId || null,
      subscriptionId: userData.subscriptionId,
      cancel_at_period_end: userData.cancel_at_period_end || false,
      cancelationDate: userData.cancelationDate || null,
      loading: false,
      subscriptionEndDate: formatEndDate(userData.subscriptionEndDate)
    };
  };

  // Refresh any changes made
  const refreshSubscription = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        // Check if free trial expired
        await checkFreeTrialExpiration(user.uid);
        
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setSubscriptionData(createSubscriptionDataFromFirestore(userData));
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error refreshing subscription data:', error);
      return false;
    }
  };

  // Token management - Token update when user subscribes to new plan
  const updateTokenCount = async (newTokens) => {
    try {
      const user = auth.currentUser;
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          tokens: Math.max(0, newTokens)
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
        const userDoc = await getDoc(userRef);
        if (!userDoc.exists()) {
          await saveUserToFirebase(user);
        }
        await checkFreeTrialExpiration(user.uid);
        await refreshSubscription();
        
        const unsubscribeSnapshot = onSnapshot(userRef, (userDoc) => {
          if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log('Firestore user data:', userData); // Debug log
        
            // Update subscription data
            setSubscriptionData(createSubscriptionDataFromFirestore(userData));
          }
        });

        return () => unsubscribeSnapshot();
      } else {
        // Resets the states when user not authenticated
        setSubscriptionData({
          subscriptionStatus: 'inactive',
          currentPlan: 'No Plan',
          planCycle: null,
          tokens: 0,
          freeTrialTokens: 0,
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
    refreshSubscription

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

