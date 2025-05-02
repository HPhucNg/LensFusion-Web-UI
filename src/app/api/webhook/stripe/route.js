import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '../../../../firebase/FirebaseConfig';
import { limit, collection, addDoc, updateDoc, getDocs, serverTimestamp, query, where, getDoc, doc } from 'firebase/firestore';
import { PricingPlans } from '@/app/(list_page)/pricing/plans';

//time conversion
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

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

//set tokens for each price
const includedTokensInSubscriptions = {
    [process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID]: 50,
    [process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID]: 100,
    [process.env.NEXT_PUBLIC_STRIPE_EXPERTISE_PRICE_ID]: 200,

    [process.env.NEXT_PUBLIC_STRIPE_YEARLY_BASIC_PRICE_ID]: 600,
    [process.env.NEXT_PUBLIC_STRIPE_YEARLY_PRO_PRICE_ID]: 1200,
    [process.env.NEXT_PUBLIC_STRIPE_YEARLY_EXPERTISE_PRICE_ID]: 2400,
};

//finds the plan title (Basic/Pro/Expertise) from plans.js
const getPlanTitle = (priceId) => {
    for (const plan of PricingPlans) {
      if (plan.priceIdMonthly === priceId || plan.priceIdYearly === priceId) {
        return plan.title; 
      }
    }
    return 'No Plan';
  };

  //finds the plan cycle (Monthly/Yearly) from plans.js
  const getPlanCycle = (priceId) => {
  for (const plan of PricingPlans) {
    if (plan.priceIdMonthly === priceId || plan.priceIdYearly === priceId) {
      return plan.priceIdMonthly === priceId ? 'monthly' : 'yearly';
    }
  }
  return 'unknown';
};

//handles users successful payment for the plan (match collection users/subscription, and update)
async function handleCheckoutSessionCompleted(session) {
    const userId = session.metadata?.userId;
    const type = session.metadata?.type;

    if (!userId) {
        throw new Error("Missing userId");
    }

    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
        console.error("User document not found!");
        return;
    }

    // Handle credit purchase
    if (type === 'credit_purchase') {
        const purchasedTokens = parseInt(session.metadata.tokens);
        
        await updateDoc(userRef, {
            tokens: (userDoc.data().tokens || 0) + purchasedTokens,
            lastTokenPurchase: serverTimestamp(),
        });
    }else{
        const customerId = session.customer;
        const email = session.customer_email || session.customer_details?.email;
        const priceId = session.line_items?.data[0]?.price.id;
        const planTitle = getPlanTitle(priceId);
        const planCycle = getPlanCycle(priceId);
        const userId = session.metadata?.userId;

        if (!session.line_items || session.line_items.data.length === 0) {
            throw new Error("No line items found in session");
        }

        if (!customerId || !userId || !priceId) {
            throw new Error("Missing customerId, email, or priceId");
        }
        
        //check for existing subscription by userID
        const existingSubscriptionQuery = query(
            collection(db, 'subscriptions'),
            where('userId', '==', userId),
            where('hasAccess', '==', true),
            limit(1)
        );

        const existingSubscriptions = await getDocs(existingSubscriptionQuery);

        if (!existingSubscriptions.empty) {
            for (const subscriptionDoc of existingSubscriptions.docs) {
                const subscriptionData = subscriptionDoc.data();
                
                if (subscriptionData.subscriptionId) {
                    try {
                        await stripe.subscriptions.cancel(subscriptionData.subscriptionId);
                    } catch (err) {
                        console.error(`Error canceling previous subscription: ${err.message}`);
                    }
                }
                
                try {
                    await updateDoc(doc(db, 'subscriptions', subscriptionDoc.id), {
                        hasAccess: false,
                        cancelationReason: 'plan_change',
                        updatedAt: serverTimestamp()
                    });
                } catch (err) {
                    console.error(`Error updating subscription document: ${err.message}`);
                }
            }
        }
        
        const tokensToAdd = includedTokensInSubscriptions[priceId] || 0;
        const subscription = session.subscription
            ? await stripe.subscriptions.retrieve(session.subscription)
            : null;
        const subscriptionStartDate = subscription
            ? new Date(subscription.current_period_start * 1000).toISOString()
            : null;
        const subscriptionEndDate = subscription
            ? new Date(subscription.current_period_end * 1000).toISOString()
            : null;

        if (!subscription) {
            throw new Error("No subscription found in session");
        }
        const subscriptionId = subscription.id;

        //update the user document on firebase
        if (userDoc.exists()) {
            const userData = userDoc.data();
            let newTokenCount;
            let tokensToRestore = 0;

            // Check if locked token is valid
            if (userData.lockedTokens && userData.lockedTokensExpirationDate) {
                const expirationDate = userData.lockedTokensExpirationDate.toDate 
                    ? userData.lockedTokensExpirationDate.toDate() 
                    : new Date(userData.lockedTokensExpirationDate);
                
                if (new Date() < expirationDate) {
                    tokensToRestore = userData.lockedTokens;
                    console.log(`Restoring ${tokensToRestore} locked tokens `);
                } else {
                    console.log(`Locked tokens have expired for user ${userId}`);
                }
            }

            if (userData.subscriptionStatus === 'active' || userData.subscriptionStatus === 'canceling') {
                const currentPlanTokens = includedTokensInSubscriptions[userData.currentPlanPriceId] || 0;
                const nonSubscriptionTokens = Math.max(0, userData.tokens - currentPlanTokens);
                
                newTokenCount = nonSubscriptionTokens + tokensToAdd;
            } else {
                newTokenCount = (userData.tokens || 0) + tokensToAdd;
            }
            
            await updateDoc(userRef, {
                tokens: newTokenCount,
                customerId,
                subscriptionStatus: "active",
                currentPlan: planTitle,
                subscriptionId: subscriptionId,
                subscriptionStartDate,
                subscriptionEndDate,
                planCycle,
                cancel_at_period_end: false,
                cancelationDate: null,
                lockedTokens: null,
                lockedTokensExpirationDate: null
            });
        } else {
            console.error("User document not found!");
        }

        // Firestore operation 
        await addDoc(collection(db, 'subscriptions'), {
            customerId,
            userId,
            email,
            priceId,
            hasAccess: true,
            subscriptionPlan: planTitle,
            subscriptionId: subscriptionId,
            subscriptionStartDate: getPSTTime(subscriptionStartDate),
            subscriptionEndDate: getPSTTime(subscriptionEndDate),
            includedTokensInSubscription: tokensToAdd,
            createdAt: serverTimestamp(),
        });
    }
}


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

    try {
        //stripe webhook handler that process events
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = await stripe.checkout.sessions.retrieve(event.data.object.id, {
                    expand: ['line_items'],
                });
                await handleCheckoutSessionCompleted(session);
                break;
            }
            case 'checkout.session.expired':
                console.log('Checkout session expired', event.data.object);
                break;
                
            //update user's subscription status after user unsubscribes
            case 'customer.subscription.deleted': {
                const subscription = event.data.object;
                const subscriptionId = subscription.id;
                
                // Find the user with this subscription
                const subscriptionsQuery = query(
                    collection(db, 'subscriptions'),
                    where('subscriptionId', '==', subscriptionId),
                    limit(1)
                );
                
                const subscriptionDocs = await getDocs(subscriptionsQuery);
                
                if (!subscriptionDocs.empty) {
                    const subscriptionDoc = subscriptionDocs.docs[0];
                    const userData = subscriptionDoc.data();
                    const userId = userData.userId;
                    
                    if (userId) {
                        const activeSubscriptionsQuery = query(
                            collection(db, 'subscriptions'),
                            where('userId', '==', userId),
                            where('hasAccess', '==', true),
                        );
                        const subscriptions = await getDocs(activeSubscriptionsQuery);
                        const otherActiveSubscriptions = subscriptions.docs.filter(
                            doc => doc.data().subscriptionId !== subscriptionId
                        );
                        
                        if (otherActiveSubscriptions.length === 0) {
                            const userRef = doc(db, 'users', userId);
                            const userDoc = await getDoc(userRef);
                            const currentTokens = userDoc.data().tokens;

                            await updateDoc(userRef, {
                                subscriptionStatus: 'inactive',
                                cancel_at_period_end: false,
                                cancelationDate: null,
                                lockedTokens: currentTokens,
                                // After 60 days credits willl set to 0
                                lockedTokensExpirationDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
                                tokens: currentTokens
                            });
                        }
                        
                        // Update subscription document
                        await updateDoc(doc(db, 'subscriptions', subscriptionDoc.id), {
                            hasAccess: false,
                            updatedAt: serverTimestamp()
                        });
                    }
                }             
                break;
            }
            case 'customer.subscription.created': {
                const subscription = event.data.object;
                const subscriptionId = subscription.id;
                
                // Find the user with this subscription
                const subscriptionQuery = query(
                    collection(db, 'subscriptions'),
                    where('subscriptionId', '==', subscriptionId),
                    limit(1)
                );
                
                const subscriptionDocs = await getDocs(subscriptionQuery);
                if (!subscriptionDocs.empty) {
                    const subscriptionDoc = subscriptionDocs.docs[0];
                    const userData = subscriptionDoc.data();
                    const userId = userData.userId;
                    
                    if (userId) {
                        const userRef = doc(db, 'users', userId);
                        await updateDoc(userRef, {
                            subscriptionStatus: 'active',
                            cancel_at_period_end: false,
                            cancelationDate: null
                        });
                        
                        console.log(`Subscription created event: Updated user ${userId} status to active`);
                    }
                }
                
                console.log('Subscription created:', subscription);
                break;
            }

            case 'customer.subscription.updated': {
                console.log('Subscription updated:', event.data.object);
                break;
            }

            case 'invoice.paid':
            case 'invoice.payment_succeeded': {
                console.log('Invoice paid:', event.data.object);
                break;
            }
            case 'invoice.upcoming':
                console.log('Invoice upcoming:', event.data.object);
                break;

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        return NextResponse.json({ received: true });
    } catch (err) {
        console.error(`Error handling Stripe webhook event: ${err.message}`);
        console.error('Detailed error:', err);
        return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
    }
}