export const PricingPlans = [
  {
    title: 'Basic Plan',
    priceMonthly: 5,
    priceYearly: 60,
    linkMonthly: process.env.NEXT_PUBLIC_STRIPE_BASIC_MONTHLY_LINK,
    linkYearly: process.env.NEXT_PUBLIC_STRIPE_BASIC_YEARLY_LINK,
    priceIdMonthly: process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID,
    priceIdYearly: process.env.NEXT_PUBLIC_STRIPE_YEARLY_BASIC_PRICE_ID,
    features: {
      monthly: ['Feature 1', 'Feature 2', '50 tokens included'],
      yearly: ['Feature 1', 'Feature 2', '120 tokens included']
    },

  },
  {
    title: 'Pro Plan',
    priceMonthly: 10,
    priceYearly: 120,
    linkMonthly: process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_LINK,
    linkYearly: process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_LINK,
    priceIdMonthly: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,
    priceIdYearly: process.env.NEXT_PUBLIC_STRIPE_YEARLY_PRO_PRICE_ID,
    features: {
      monthly: ['Feature 1', 'Feature 2', '100 tokens included'],
      yearly: ['Feature 1', 'Feature 2', '1200 tokens included']
    },
  },
  {
    title: 'Expertise Plan',
    priceMonthly: 20,
    priceYearly: 240,
    linkMonthly: process.env.NEXT_PUBLIC_STRIPE_EXPERTISE_MONTHLY_LINK,
    linkYearly: process.env.NEXT_PUBLIC_STRIPE_EXPERTISE_YEARLY_LINK,
    priceIdMonthly: process.env.NEXT_PUBLIC_STRIPE_EXPERTISE_PRICE_ID,
    priceIdYearly: process.env.NEXT_PUBLIC_STRIPE_YEARLY_EXPERTISE_PRICE_ID,
    features: {
      monthly: ['Feature 1', 'Feature 2', '200 tokens included'],
      yearly: ['Feature 1', 'Feature 2', '2400 tokens included']
    },
  },
];
