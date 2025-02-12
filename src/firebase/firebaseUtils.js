"use client"
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./FirebaseConfig";


export const saveUserToFirebase = async (userData, tokensToAdd = 0, customerId = null, subscriptionStatus = 'inactive', currentPlan = 'No Plan', planCycle = null) => {    
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
                planCycle: planCycle ?? existingData.planCycle ?? null 
            };
            await setDoc(userRef, updatedData, { merge: true });
            console.log(`User ${userDoc.exists() ? 'updated' : 'created'} in Firebase`);
    } catch (error) {
        console.error("Error saving user data:", error);
    }
};
