import { loadStripe } from '@stripe/stripe-js';
import { auth } from '@/firebase/FirebaseConfig';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

//for subscription checkout
export const createCheckoutSession = async (priceId) => {
  try {
    const stripe = await stripePromise;

    //get API to create the Stripe checkout session
    //check if the user is authenticated (logged in)
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User must be logged in to make a purchase');
    }

    console.log('Creating checkout session for:', { priceId, userId: currentUser.uid });

    const response = await fetch('/api/stripe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        priceId,
        userId: currentUser.uid,
        userEmail: currentUser.email
      }),
    });

    const data = await response.json();

    //redirect to Stripe payment page
    const result = await stripe.redirectToCheckout({
      sessionId: data.sessionId
    });
    if (result.error) {
      throw result.error;
    }
  } catch (error) {
    console.error('Error in Stripe checkout session:', error);
    alert('Payment cannot be processed. Please try again.');
  }
};

//handle credit checkout
export const createCreditCheckout = async (tokens, pricePerToken) => {
  try {
    const stripe = await stripePromise;
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      throw new Error('User must be logged in to make a purchase');
    };
    
    const totalAmount = Number(tokens) * Number(pricePerToken);

    const response = await fetch('/api/stripe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        type: 'credit_purchase',
        priceId: process.env.NEXT_PUBLIC_STRIPE_CREDIT_PURCHASE_PRICE_ID,
        tokens,
        amount: totalAmount,
        userId: currentUser.uid,
        userEmail: currentUser.email
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Response not ok:', errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.sessionId) {
      console.error('No sessionId received:', data);
      throw new Error('Invalid session data received');
    }

    const result = await stripe.redirectToCheckout({
      sessionId: data.sessionId
    });

    if (result.error) {
      throw result.error;
    }
  } catch (error) {
    console.error('Error in credit checkout:', error);
    throw error;
  }
};

//handling subscription cancelation
export const cancelSubscription = async (subscriptionId) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User must be logged in to cancel subscription');
    }
    if (!subscriptionId) {
      throw new Error('Subscription ID is required');
    }
    const response = await fetch('/api/stripe/cancel', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subscriptionId: subscriptionId,
        userId: currentUser.uid,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to cancel subscription');
    }

    return true;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};