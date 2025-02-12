import { NextResponse } from 'next/server';
import Stripe from 'stripe';

//handle STRIPE checkout session creation ( used metadata to get the userId )

const stripe = new Stripe(process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY);

const getDomain = () => {
  return process.env.NEXT_PUBLIC_DOMAIN || 'http://localhost:3000'; //test
};

export async function POST(req) {
  try {
    const { priceId, userId, userEmail } = await req.json();
    const domain = getDomain();

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'], 
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${domain}/payment/success`,
      cancel_url: `${domain}/payment/cancel`,  // i will add more to this page later
      metadata: {
        userId: userId,
        userEmail: userEmail
      },
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: error.message || 'Error creating checkout session' },
      { status: 500 }
    );
  }
}