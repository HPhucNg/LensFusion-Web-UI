import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export const createCheckoutSession = async (priceId) => {
  try {
    const stripe = await stripePromise;

    //get API to create the Stripe checkout session
    const response = await fetch('/api/webhook/stripe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceId }),
    });

    const { id } = await response.json();

    //redirect to Stripe payment page
    await stripe.redirectToCheckout({ sessionId: id });
  } catch (error) {
    console.error('Error in Stripe checkout session:', error);
    alert('Payment cannot be processed. Please try again.');
  }
};
