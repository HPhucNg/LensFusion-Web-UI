'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '@/firebase/FirebaseConfig';
import { doc, onSnapshot, updateDoc, getDoc } from 'firebase/firestore';
import { saveUserToFirebase, checkFreeTrialExpiration } from '@/firebase/firebaseUtils';

// this is used to manage the subscription status
const SubscriptionContext = createContext();

export function SubscriptionProvider({ children }) {
  const [subscriptionData, setSubscriptionData] = useState({
    status: 'inactive',
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

  const refreshSubscription = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        await checkFreeTrialExpiration(user.uid);
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          // Format the subscription end date
          let formattedEndDate = null;
          if (userData.subscriptionEndDate) {
            if (userData.subscriptionEndDate.toDate) {
              formattedEndDate = userData.subscriptionEndDate.toDate().toLocaleDateString();
            } 
            else if (typeof userData.subscriptionEndDate === 'string') {
              formattedEndDate = new Date(userData.subscriptionEndDate).toLocaleDateString();
            }
          }
          
          // Update the subscription data state with fresh data
          setSubscriptionData({
            status: userData.subscriptionStatus || 'inactive',
            currentPlan: userData.currentPlan || 'No Plan',
            planCycle: userData.planCycle || null,
            tokens: userData.tokens || 0,
            freeTrialTokens: userData.freeTrialTokens || 0,
            customerId: userData.customerId || null,
            subscriptionId: userData.subscriptionId,
            cancel_at_period_end: userData.cancel_at_period_end || false,
            cancelationDate: userData.cancelationDate || null,
            loading: false,
            subscriptionEndDate: formattedEndDate
          });
          
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
        
        const unsubscribeSnapshot = onSnapshot(userRef, async (userDoc) => {
          if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log('Firestore user data:', userData); // Debug log
        
        try {
          await checkFreeTrialExpiration(user.uid);
          const freshDoc = await getDoc(userRef);
          
          if (freshDoc.exists()) {
            const freshData = freshDoc.data();
            let formattedEndDate = null;
            
          if (freshData.subscriptionEndDate) {
            if (freshData.subscriptionEndDate.toDate) {
              formattedEndDate = freshData.subscriptionEndDate.toDate().toLocaleDateString();
            } else if (typeof freshData.subscriptionEndDate === 'string') {
              formattedEndDate = new Date(freshData.subscriptionEndDate).toLocaleDateString();
            }
          }
          
          setSubscriptionData({
            status: freshData.subscriptionStatus || 'inactive',
            currentPlan: freshData.currentPlan || 'No Plan',
            planCycle: freshData.planCycle || null,
            tokens: freshData.tokens || 0,
            freeTrialTokens: freshData.freeTrialTokens || 0,
            customerId: freshData.customerId || null,
            subscriptionId: freshData.subscriptionId,
            cancel_at_period_end: freshData.cancel_at_period_end || false,
            cancelationDate: freshData.cancelationDate || null,
            loading: false,
            subscriptionEndDate: formattedEndDate
          });
          }
        } catch (error) {
          console.error("Error refreshing user data:", error);
        }
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

