"use client"
import React, { useState, useEffect } from "react";
import { doc, getDoc, setDoc, collection, query, where, getDocs, serverTimestamp } from "firebase/firestore";
import { db } from "./FirebaseConfig";
import { getAuth } from "firebase/auth";


export const getUserByEmail = async (email) => {
    try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", email));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) { 
            return querySnapshot.docs[0]?.data() || null;
        } else {
            console.error(`No user found with this email: ${email}`);
            return null;
        }
    } catch (error) {
        console.error("Error fetching user by email:", error);
        return null;
    }
};

export const updateUserDocument = async (userId, data) => {
    try {
        const userRef = doc(db, "users", userId);
        await setDoc(userRef, data, { merge: true });
        console.log(`User document updated with: ${JSON.stringify(data)}`);
    } catch (error) {
        console.error("Error updating user document:", error);
    }
};

export const saveUserToFirebase = async (userData, tokensToAdd = 0, customerId = null, subscriptionStatus = 'inactive', currentPlan = 'No Plan') => {
    try {
        if (!userData || !userData.uid) {
            console.error("User data is missing essential properties.");
            return;
        }
        const userRef = doc(db, 'users', userData.uid); 
        const userDoc = await getDoc(userRef);

        // If the user doesn't exist, create a new doc/user
        if (!userDoc.exists()) {
            const newUser = {
                email: userData.email,
                name: userData.displayName || "guest",
                photoURL: userData.photoURL,
                lastLogin: serverTimestamp(),
                tokens: tokensToAdd, 
                customerId: customerId,
                subscriptionStatus: subscriptionStatus,
                currentPlan: currentPlan,
            };
            await setDoc(userRef, newUser);
            console.log("New user created in Firebase");
        } else {
            const existingData = userDoc.data();
            const updatedData = {
                email: userData.email,
                name: userData.displayName || existingData.name,
                photoURL: userData.photoURL,
                lastLogin: serverTimestamp(),
                tokens: (existingData.tokens || 0) + tokensToAdd,
                customerId: customerId || existingData.customerId,
                subscriptionStatus: subscriptionStatus !== undefined ? subscriptionStatus : existingData.subscriptionStatus,
                currentPlan: currentPlan !== undefined ? currentPlan : existingData.currentPlan,
            };
            await setDoc(userRef, updatedData, { merge: true });
            console.log("User saved to Firebase");
        }
    } catch (error) {
        console.error("Error saving user data:", error);
    }
};

export const checkEventProcessed = async (eventId) => {
    const user = getAuth().currentUser;
    const userId = user?.uid;

    if (!userId) {
        console.error("User is not authenticated.");
        return false;
      }
    console.log(`Checking event for user: ${userId}`);

    try {
        const eventRef = doc(db, 'processed_events', eventId);
        const eventSnapshot = await getDoc(eventRef);

        if (!eventSnapshot.exists()) {
            console.log(`Event ${eventId} does not exist or is not processed yet.`);
            return false;
        }

        const eventData = eventSnapshot.data();
        if (eventData.processedBy !== userId) {
            console.log('Event is not processed by the current user');
            return false;
        }
        return true;
    } catch (error) {
        console.error("Error checking if event is processed:", error.code, error.message);
        return false;
    }
};


export const markEventAsProcessed = async (eventId) => {
    try {
        const eventRef = doc(db, 'processed_events', eventId);
        await setDoc(eventRef, { processedAt: serverTimestamp() });
        console.log(`Event marked as processed: ${eventId}`);
    } catch (error) {
        console.error("Error marking event as processed:", error);
    }
};
const FirebaseUtils = () => {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [eventProcessed, setEventProcessed] = useState(false); 
    const [eventId, setEventId] = useState("");

    const [tokens, setTokens] = useState(0);
    const [subscriptionStatus, setSubscriptionStatus] = useState('inactive');
    const [currentPlan, setCurrentPlan] = useState('No Plan');

    const previousValuesRef = useRef({
        tokens: 0,
        subscriptionStatus: 'inactive',
        currentPlan: 'No Plan'
    });

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const user = getAuth().currentUser;
                if (user) {
                    const userRef = doc(db, 'users', user.uid);
                    const userDoc = await getDoc(userRef);

                    if (userDoc.exists()) {
                        const existingData = userDoc.data();
                        const customerId = existingData.customerId || null;

                        setTokens(existingData.tokens || 0); 
                        setSubscriptionStatus(existingData.subscriptionStatus || 'inactive');
                        setCurrentPlan(existingData.currentPlan || 'No Plan');

                        const userInfo = await getUserByEmail(user.email);
                        setUserData(userInfo);

                        await saveUserToFirebase(user, existingData.tokens, customerId, existingData.subscriptionStatus, existingData.currentPlan);
                        
                    } else {
                        console.error("User document does not exist");
                    }
                }
            } catch (error) {
                console.error("Error fetching user data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, []); 

    useEffect(() => {
        if (
            userData && (
                tokens !== previousValuesRef.current.tokens ||
                subscriptionStatus !== previousValuesRef.current.subscriptionStatus ||
                currentPlan !== previousValuesRef.current.currentPlan
            )
        ) {
            const saveData = async () => {
                const user = getAuth().currentUser;
                if (user) {
                    const customerId = userData?.customerId || null;
                    console.log("Saving user to Firebase with data:", { user, tokens, customerId, subscriptionStatus, currentPlan });
                    await saveUserToFirebase(user, tokens, customerId, subscriptionStatus, currentPlan);
                }
            };
            saveData();

            previousValuesRef.current = { tokens, subscriptionStatus, currentPlan };
        }
        //updates the "previousValueRef"
        if (userData) {
            previousValuesRef.current = {
                tokens: tokens,
                subscriptionStatus: subscriptionStatus,
                currentPlan: currentPlan
            };
        }
    }, [tokens, subscriptionStatus, currentPlan, userData]);

    const handleCheckEventProcessed = async () => {
        if (userData && eventId) {
            const result = await checkEventProcessed(eventId);
            setEventProcessed(result);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                Loading...
            </div>
        );
    }
    if (!userData) {
        return (
          <div className="flex items-center justify-center min-h-screen">
            <p>No user data found</p>
          </div>
        );
      }

    return(
        <div className="flex items-center justify-center min-h-screen">
            
            <input
                type="text"
                placeholder="Enter Event ID"
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
            />
            <button onClick={handleCheckEventProcessed}>Check Event Processed</button>

            {eventProcessed !== undefined && (
                <p>{eventProcessed ? "Event is processed" : "Event not processed or processed by another user"}</p>
            )}
        </div>
    );
};

export default FirebaseUtils;
