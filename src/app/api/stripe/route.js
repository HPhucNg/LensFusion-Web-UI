import { NextResponse } from 'next/server';
import Stripe from 'stripe';

//handle STRIPE checkout session creation ( used metadata to get the userId )

const stripe = new Stripe(process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY);

const getDomain = () => {
  return process.env.NEXT_PUBLIC_DOMAIN || 'http://localhost:3000'; //test
};

//api route handeling
export async function POST(req) {
  try {
    const { priceId, amount, tokens, userId, userEmail, type } = await req.json();
    const domain = getDomain();

    //credit purchase handler - create 1 time payment at checkout
    if (type === 'credit_purchase') {
      const numericAmount = Number(amount);

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `${tokens} Credits`,
                description: `Purchase ${tokens} credits`,
              },
              unit_amount: Math.round(numericAmount * 100),
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${domain}/payment/success`,
        metadata: {
          userId,
          userEmail,
          tokens: tokens.toString(),
          amount: amount.toString(),
          type: 'credit_purchase'
        },
      });
      return NextResponse.json({ sessionId: session.id });
    }else{
      
      //subscription handler
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
        cancel_url: `${domain}/payment/cancel?subscription={CHECKOUT_SESSION_ID}`,
        metadata: {
          userId: userId,
          userEmail: userEmail,
        },
      });
  
      return NextResponse.json({ sessionId: session.id });}
    
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: error.message || 'Error creating checkout session' },
      { status: 500 }
    );
  }
}