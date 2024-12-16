import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '../../../../firebase/FirebaseConfig';

import { collection, addDoc } from 'firebase/firestore';

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
                // Retrieve session details
                const session = await stripe.checkout.sessions.retrieve(data.object.id, {
                    expand: ['line_items'],
                });

                const customerId = session.customer; // Stripe customer ID
                const customerEmail = session.customer_email; // Email used during checkout

                if (!customerId && !customerEmail) {
                    console.error('No customer ID or email found in session.');
                    break;
                }

                let customer = null;
                if (customerId) {
                    try {
                        customer = await stripe.customers.retrieve(customerId);
                    } catch (error) {
                        console.error(`Error retrieving customer: ${error.message}`);
                    }
                }

                const email = customer?.email || customerEmail;
                const priceId = session.line_items?.data[0]?.price.id;
                const subscriptionPlan = subscriptionPlans[priceId];

                
                const subscription = session.subscription
                    ? await stripe.subscriptions.retrieve(session.subscription)
                    : null;

                const subscriptionStartDate = subscription
                    ? new Date(subscription.current_period_start * 1000).toISOString()
                    : null;
                const subscriptionEndDate = subscription
                    ? new Date(subscription.current_period_end * 1000).toISOString()
                    : null;

                if (!email || !priceId) {
                    console.error('No valid email or price ID found.');
                    break;
                }

                // Firestore operation
                try {
                    console.log('Attempting Firestore write...');
                    const docRef = await addDoc(collection(db, 'subscriptions'), {
                        email: email,
                        customerId: customerId,
                        priceId: priceId,
                        hasAccess: true,
                        subscriptionPlan: subscriptionPlan,
                        subscriptionStartDate: getPSTTime(subscriptionStartDate),
                        subscriptionEndDate: getPSTTime(subscriptionEndDate),
                    });
                    console.log(`Document written with ID: ${docRef.id}`);
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
