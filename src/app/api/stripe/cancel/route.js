import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/firebase/FirebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

//API route handler
export async function POST(req) {
  try {
    const { subscriptionId, userId } = await req.json();

    if (!subscriptionId || !userId) {
        return NextResponse.json(
          { error: 'Missing required parameters' },
          { status: 400 }
        );
      }

    //get subscription details from stripe and update after cancelation
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
  
      //update user's subscription status in Firebase
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        subscriptionStatus: 'canceling',
        cancelAtPeriodEnd: true,
        cancellationDate: new Date(subscription.current_period_end * 1000).toISOString()
      });
  
      return NextResponse.json({ 
        success: true,
        cancelDate: new Date(subscription.current_period_end * 1000).toISOString()
      });
    } catch (error) {
      console.error('Error canceling subscription:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to cancel subscription' },
        { status: 500 }
      );
    }
  }