import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '../../../../firebase/FirebaseConfig';
import { limit, collection, addDoc, doc, getDoc, updateDoc, getDocs, serverTimestamp, query, where } from 'firebase/firestore';
import { PricingPlans } from '@/app/(list_page)/pricing/plans';

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


const includedTokensInSubscriptions = {
    [process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID]: 50,
    [process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID]: 100,
    [process.env.NEXT_PUBLIC_STRIPE_EXPERTISE_PRICE_ID]: 200,

    [process.env.NEXT_PUBLIC_STRIPE_YEARLY_BASIC_PRICE_ID]: 600,
    [process.env.NEXT_PUBLIC_STRIPE_YEARLY_PRO_PRICE_ID]: 1200,
    [process.env.NEXT_PUBLIC_STRIPE_YEARLY_EXPERTISE_PRICE_ID]: 2400,
};

const getPlanTitle = (priceId) => {
    for (const plan of PricingPlans) {
      if (plan.priceIdMonthly === priceId || plan.priceIdYearly === priceId) {
        return plan.title; 
      }
    }
    return 'No Plan';
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
                //const planId = session.line_items.data[0].price.id;
                const email = session.customer_email || session.customer_details?.email;
                const priceId = session.line_items?.data[0]?.price.id;
                const planTitle = getPlanTitle(priceId);

                if (!session.line_items || session.line_items.data.length === 0) {
                    console.error("No line items found in session.");
                    return NextResponse.json({ error: "No line items found." }, { status: 400 });
                }
                

                if (!customerId || !email || !priceId) {
                    console.error("Missing customerId, email, or priceId");
                    return NextResponse.json({ error: "Missing customerId, email, or priceId" }, { status: 400 });
                }
                //first checks if there the user is already subscribed they cannont subscribe again unil the next subscription date
                const existingSubscriptionQuery = query(
                    collection(db, 'subscriptions'),
                    where('email', '==', email),
                    limit(1)
                );
                const existingSubscriptions = await getDocs(existingSubscriptionQuery);

                if (!existingSubscriptions.empty) {
                    const subscriptionData = existingSubscriptions.docs[0].data();
                    if (Date.now() < new Date(subscriptionData.subscriptionEndDate).getTime()) {
                        console.warn(`Subscription for ${email} is still active.`);
                        return NextResponse.json(
                            { error: "User already has an active subscription." },
                            { status: 400 }
                        );
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

                const userDocRef = query(
                    collection(db, 'users'),
                    where('email', '==', email),
                );
                const userDocSnapshot = await getDocs(userDocRef);

                if (!userDocSnapshot.empty) {
                    const userDoc = userDocSnapshot.docs[0];
                    const userRef = userDoc.ref;
                
                    console.log("User document data:", userDoc.data());
                
                    await updateDoc(userRef, {
                        tokens: (userDoc.data().tokens || 0) + tokensToAdd,
                        customerId: customerId,  
                        subscriptionStatus: "active",
                        currentPlan: planTitle,
                    });
                
                } else {
                    console.error("User document not found!");
                }
                        
                // Firestore operation
                console.log('Attempting Firestore write...');
                await addDoc(collection(db, 'subscriptions'), {
                    customerId: customerId,
                    email: email,
                    priceId: priceId,
                    hasAccess: true,
                    subscriptionPlan: planTitle,
                    subscriptionStartDate: getPSTTime(subscriptionStartDate),
                    subscriptionEndDate: getPSTTime(subscriptionEndDate),
                    includedTokensInSubscription: tokensToAdd,
                    createdAt: serverTimestamp(),
                });

                console.log(`Subscription recorded for customerId: ${customerId}`);
                break;
            }
            case 'checkout.session.expired':
                console.log('Checkout session expired', event.data.object);
                break;
            case 'invoice.payment_succeeded':
                break;
            case 'customer.subscription.updated':
                break;
            case 'invoice.payment_failed':
                break;
            case 'charge.succeeded':
                break;
            case 'invoice.created':
                break;
            case 'customer.updated':
                break;
            case 'invoice.paid':
                break;
            case 'customer.finalized':
                break;
            case 'customer.created':
                break;
            case 'customer.subscription.created':
                break;
            case 'payment_intent.succeeded':
                break;
            case 'payment_intent.created':
                break;
            case 'customer.subscription.updated':
                break;
            case 'invoice.updated':
                break;
            case 'payment_method.attached':
                break;
            case 'invoice.finalized':
                break;
            default:
                console.warn(`Unhandled event type: ${eventType}`);
                return NextResponse.json({ received: true }, { status: 200 });

        }
    } catch (err) {
        console.error(`Error handling Stripe webhook event: ${err.message}`);
        console.error('Detailed error:', err);
        return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
    }
    return NextResponse.json({ received: true });
}