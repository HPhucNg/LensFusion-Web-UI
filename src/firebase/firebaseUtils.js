"use client"
import { doc, getDoc, setDoc, serverTimestamp, updateDoc, getDocs, collection, query, where } from "firebase/firestore";
import { db } from "./FirebaseConfig";

// Checks free trial tokens expirations
export const checkFreeTrialExpiration = async (userId) => {
  if (!userId) return;
  
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    const userData = userDoc.data();

    if (!userDoc.exists()) return;

    if (userData.freeTrialTokens && userData.createdAt) {
      const creationTime = userData.createdAt.toDate ? userData.createdAt.toDate() : new Date(userData.createdAt);
      const currentTime = new Date();
      
      const daysSinceCreation = Math.floor((currentTime - creationTime) / (1000 * 60 * 60 * 24));
      
      // FreeTrialToken expires after 7 days
      if (daysSinceCreation > 7 && userData.freeTrialTokens > 0) {
        console.log("Free trial has expired");
        const newTotalTokens = Math.max(0, (userData.tokens || 0) - userData.freeTrialTokens);

        await updateDoc(userRef, {
        freeTrialTokens: 0,
        tokens: newTotalTokens
        });
      }
    }
  } catch (error) {
    console.error("Error checking free trial expiration:", error);
  }
};

// Updates user tokens tracking both total tokens and free trial tokens
export const updateUserTokens = async (userId, tokensToDeduct) => {
  if (!userId || tokensToDeduct <= 0) return;
  
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
        
    const userData = userDoc.data();
    const currentFreeTrialTokens = userData.freeTrialTokens || 0;
    const currentTotalTokens = userData.tokens || 0;
    
    const freeTrialDeduction = Math.min(currentFreeTrialTokens, tokensToDeduct);
    const newFreeTrialTokens = currentFreeTrialTokens - freeTrialDeduction;
    
    if (!userDoc.exists()) return;

    // Update both free trial tokens and total tokens
    await updateDoc(userRef, {
      freeTrialTokens: newFreeTrialTokens,
      tokens: currentTotalTokens - tokensToDeduct
    });
    
    return { 
      newTotalTokens: currentTotalTokens - tokensToDeduct,
      newFreeTrialTokens: newFreeTrialTokens
    };
  } catch (error) {
    console.error("Error updating user tokens:", error);
    return null;
  }
};

//saves users and updates data to firebase
export const saveUserToFirebase = async (userData, tokensToAdd = 0, customerId = null, subscriptionStatus = 'inactive', currentPlan = 'No Plan', planCycle = null, subscriptionId = null) => {    
    if (!userData || !userData.uid) {
        console.error("User data is missing essential properties.");
        return;
    }

    try {
        const userRef = doc(db, 'users', userData.uid); 
        const userDoc = await getDoc(userRef);
        const existingData = userDoc.exists() ? userDoc.data() : {};

        // If the user doesn't exist, create a new doc/user
            const updatedData = {
                email: userData.email,
                name: userData.displayName || existingData.name || "guest",
                photoURL: userData.photoURL,
                lastLogin: serverTimestamp(),
                tokens: (existingData.tokens || 0) + tokensToAdd,
                customerId: customerId ?? existingData.customerId ?? null,
                subscriptionStatus: subscriptionStatus ?? existingData.subscriptionStatus ?? 'inactive',
                currentPlan: currentPlan ?? existingData.currentPlan ?? 'No Plan',
                planCycle: planCycle ?? existingData.planCycle ?? null,
                subscriptionId: subscriptionId ?? existingData.subscriptionId ?? null          
            };

    if (!userDoc.exists()) {
      const hasExistingImages = await checkForExistingImages(userData.uid);
      
      updatedData.createdAt = serverTimestamp();
      
      if (!hasExistingImages) {
        updatedData.freeTrialTokens = 50;
        updatedData.tokens = 50; 
        console.log("New user, free trial token granted");
      } else {
        console.log("User has generated images in the past");
      }
    } else {
      await checkFreeTrialExpiration(userData.uid);
    }
    
            await setDoc(userRef, updatedData, { merge: true });
            console.log(`User ${userDoc.exists() ? 'updated' : 'created'} in Firebase`);
    } catch (error) {
        console.error("Error saving user data:", error);
    }
};

// Check if the user has existing images generated with their userId
export const checkForExistingImages = async (userId) => {
  if (!userId) {
    console.error("No userId provided for image check");
    return true;
  }
  
  try {
    const userImagesRef = collection(db, 'user_images');
    const q = query(userImagesRef, where('userID', '==', userId));
    const querySnapshot = await getDocs(q);
          
    return !querySnapshot.empty;
  } catch (error) {
    console.error("Error checking for existing images:", error);
    console.error(error.stack);
    return true;
  }
};