import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/firebase/FirebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  try {
    const { subscriptionId, userId } = await req.json();
    
    if (!subscriptionId || !userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required parameters' 
      }, { status: 400 });
    }

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    // Reactivate canceling state of subscription plan
    if (subscription.cancel_at_period_end) {
      const reactivatedSubscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: false,
      });

      // Update Users collection on firebase
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        subscriptionStatus: 'active',
        cancel_at_period_end: false,
        cancelationDate: null
      });

      return NextResponse.json({ 
        success: true, 
        subscription: reactivatedSubscription 
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: 'Subscription cannot be reactivated..', 
        currentState: subscription.status 
      });
    }
  } catch (error) {
    console.error('Error reactivating subscription:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error reactivating subscription' },
      { status: 500 }
    );
  }
} 