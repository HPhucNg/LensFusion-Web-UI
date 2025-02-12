import { loadStripe } from '@stripe/stripe-js';
import { auth } from '@/firebase/FirebaseConfig';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

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
