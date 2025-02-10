import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '../../../../firebase/FirebaseConfig';
import { collection, addDoc, doc, getDocs, setDoc, serverTimestamp, query, where } from 'firebase/firestore';

const getPSTTime = (utcTimestamp) => {
    return new Date(utcTimestamp).toLocaleString('en-US', {
      timeZone: 'America/Los_Angeles',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false, 
    });
  };

const stripe = new Stripe(process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

const subscriptionPlans = {
    [process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID]: 'Monthly Basic Plan',
    [process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID]: 'Monthly Pro Plan',
    [process.env.NEXT_PUBLIC_STRIPE_EXPERTISE_PRICE_ID]: 'Monthly Expertise Plan',

    [process.env.NEXT_PUBLIC_STRIPE_YEARLY_BASIC_PRICE_ID]: 'Yearly Basic Plan',
    [process.env.NEXT_PUBLIC_STRIPE_YEARLY_PRO_PRICE_ID]: 'Yearly Pro Plan',
    [process.env.NEXT_PUBLIC_STRIPE_YEARLY_EXPERTISE_PRICE_ID]: 'Yearly Expertise Plan',
};

const includedTokensInSubscriptions = {
    [process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID]: 50,
    [process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID]: 100,
    [process.env.NEXT_PUBLIC_STRIPE_EXPERTISE_PRICE_ID]: 200,

    [process.env.NEXT_PUBLIC_STRIPE_YEARLY_BASIC_PRICE_ID]: 600,
    [process.env.NEXT_PUBLIC_STRIPE_YEARLY_PRO_PRICE_ID]: 1200,
    [process.env.NEXT_PUBLIC_STRIPE_YEARLY_EXPERTISE_PRICE_ID]: 2400,
};


const updateUserTokens = async (email, customerId, tokensToAdd) => {
    try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", email));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0]; //gets the user doc (only 1 matching doc)
            const userId = userDoc.id; //userId is assigned to the users document ID that is stored in Firebase

            const currentTokens = userDoc.data().tokens || 0;//finds 'tokens' from users documents and update current token
            const newTokenBalance = currentTokens + tokensToAdd;

            const userRef = doc(db, "users", userId); // once we know the user doc ID reference it
            await setDoc( 
                userRef, { 
                    customerId,
                    tokens: newTokenBalance, //updates tokens if the users added tokens
                }, { merge: true });

            console.log(`Tokens updated for customerId: ${customerId}. New balance: ${newTokenBalance}`);
        } else {
            console.error(`No user found for customerId: ${customerId}`);
        }
    } catch (error) {
        console.error("Error updating user tokens:", error);
    }
};

const updateSubscriptionStatus = async (email, customerId, subscriptionPlan) => {
    try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", email));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0]; 
            const userId = userDoc.id; 

            const newSubscriptionStatus = "active"

            const userRef = doc(db, "users", userId); 
            await setDoc( 
                userRef, { 
                    customerId,
                    subscriptionStatus: newSubscriptionStatus, 
                }, { merge: true });

            console.log(`Subscription status updated for customerId: ${customerId}. New stats: ${newSubscriptionStatus}`);
        } else {
            console.error(`No user found for customerId: ${customerId}`);
        }
    } catch (error) {
        console.error("Error updating user subscription:", error);
    }
    
  };
  

const getUserByEmail = async (email) => {
    try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", email));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) { 
            const userDoc = querySnapshot.docs[0];
            return userDoc.data();
        } else {
            console.error(`No user found with this email: ${email}`);
            return null;
        }
    } catch (error) {
        console.error("Error fetching user by email:", error);
        return null;
    }
};

const saveUserToFirebase = async (userData, tokensToAdd, customerId, subscriptionStatus, currentPlan) => {
    try {

        if (!userData || !userData.uid) {
            console.error("User data is missing");
            return;
          }
        const userId = userData.uid; 
        const userDataDoc = doc(db, "users", userId); 
        const currentTokens = userData.tokens || 0;
        const updatedTokens = currentTokens + tokensToAdd;

        await setDoc(
            userDataDoc, 
            {
                subscriptionStatus, 
                currentPlan,
                customerId,
                tokens: updatedTokens,
                lastSubscriptionUpdate: serverTimestamp(),
            }, 
            { merge: true } 
        );
        
        console.log(`User subscription status and plan updated for email: ${userRef.data().email}`);
    } catch (error) {
        console.error("Error  saving user subscription status to Firebase:", error);
    }
};

export async function POST(req) {
    const rawBody = await req.text();
    const signature = req.headers.get('stripe-signature');

    let event;

    // Verify Stripe event
    try {
        event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        return NextResponse.json({ error: err.message }, { status: 400 });
    }

    const data = event.data;
    const eventType = event.type;

    try {
        switch (eventType) {
            case 'checkout.session.completed': {
                const session = await stripe.checkout.sessions.retrieve(data.object.id, {
                    expand: ['line_items'],
                });

                const customerId = session.customer; //stripe customerID (ex. cus_RVvAGOMBFcQXSn)
                const planId = session.line_items.data[0].price.id;
                const email = session.customer_email || session.customer_details?.email;
                const priceId = session.line_items?.data[0]?.price.id;


                if (!customerId || !email || !priceId) {
                    console.error("Missing customerId, email, or priceId");
                    return NextResponse.json({ error: "Missing customerId, email, or priceId" }, { status: 400 });
                }

                const subscriptionStatus = 'active';
                const currentPlan = subscriptionPlans[planId]
                const subscriptionPlan = currentPlan || 'defaultPlan';
               
                const tokensToAdd = includedTokensInSubscriptions[priceId] || 0;
                await updateUserTokens(email, customerId, tokensToAdd);
                await updateSubscriptionStatus(email, customerId, subscriptionPlan)
                const userRef = await getUserByEmail(email);
                if (userRef) {
                    console.log('User Data:', userRef);
                    await saveUserToFirebase(userRef, tokensToAdd, customerId, subscriptionStatus, currentPlan);
                }
                
                const subscription = session.subscription
                    ? await stripe.subscriptions.retrieve(session.subscription)
                    : null;

                const subscriptionStartDate = subscription
                    ? new Date(subscription.current_period_start * 1000).toISOString()
                    : null;
                const subscriptionEndDate = subscription
                    ? new Date(subscription.current_period_end * 1000).toISOString()
                    : null;

                // if there the user is already subscribed they cannont subscribe again unil the next subscription date
                const existingSubscriptionQuery = query(
                    collection(db, 'subscriptions'),
                    where('email', '==', email)
                );
                const existingSubscriptions = await getDocs(existingSubscriptionQuery);

                if (!existingSubscriptions.empty) {
                    const subscriptionDoc = existingSubscriptions.docs[0];
                    const subscriptionData = subscriptionDoc.data();
                    const currentTimestamp = Date.now();
                    const subscriptionEndTimestamp = new Date(subscriptionData.subscriptionEndDate).getTime();
                
                    if (currentTimestamp < subscriptionEndTimestamp) {
                        console.warn(
                            `Subscription for email: ${email} is still active until ${subscriptionData.subscriptionEndDate}`
                        );
                        return NextResponse.json(
                            { error: "User already has an active subscription. Try again after the current period ends." },
                            { status: 400 }
                        );
                    }
                }

                // Firestore operation
                try {
                    console.log('Attempting Firestore write...');
                    await addDoc(collection(db, 'subscriptions'), {
                        customerId: customerId,
                        email: email,
                        priceId: priceId,
                        hasAccess: true,
                        subscriptionPlan: currentPlan,
                        subscriptionStartDate: getPSTTime(subscriptionStartDate),
                        subscriptionEndDate: getPSTTime(subscriptionEndDate),
                        includedTokensInSubscription: tokensToAdd,
                        createdAt: serverTimestamp(),
                      });
                      console.log(`Subscription recorded for customerId: ${customerId}`);

                } catch (error) {
                    console.error('Firestore write failed:', error.message);
                }
                    break;
            }

            default:
                console.warn(`Unhandled event type: ${eventType}`);
        }
    } catch (err) {
        console.error(`Error handling Stripe webhook event: ${err.message}`);
        return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
    }

    return NextResponse.json({ received: true });
}
