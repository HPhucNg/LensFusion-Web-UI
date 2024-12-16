export const PricingPlans = [
  {
    title: 'Basic Plan',
    priceMonthly: 5,
    priceYearly: 60,
    linkMonthly: process.env.NEXT_PUBLIC_STRIPE_BASIC_MONTHLY_LINK,
    linkYearly: process.env.NEXT_PUBLIC_STRIPE_BASIC_YEARLY_LINK,
    priceIdMonthly: process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID,
    priceIdYearly: process.env.NEXT_PUBLIC_STRIPE_YEARLY_BASIC_PRICE_ID,
    features: ['Feature 1', 'Feature 2', 'Feature 3', 'Feature 4'],

  },
  {
    title: 'Pro Plan',
    priceMonthly: 10,
    priceYearly: 120,
    linkMonthly: process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_LINK,
    linkYearly: process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_LINK,
    priceIdMonthly: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,
    priceIdYearly: process.env.NEXT_PUBLIC_STRIPE_YEARLY_PRO_PRICE_ID,
    features: ['Feature 1', 'Feature 2', 'Feature 3', 'Feature 4'],

  },
  {
    title: 'Expertise Plan',
    priceMonthly: 20,
    priceYearly: 240,
    linkMonthly: process.env.NEXT_PUBLIC_STRIPE_EXPERTISE_MONTHLY_LINK,
    linkYearly: process.env.NEXT_PUBLIC_STRIPE_EXPERTISE_YEARLY_LINK,
    priceIdMonthly: process.env.NEXT_PUBLIC_STRIPE_EXPERTISE_PRICE_ID,
    priceIdYearly: process.env.NEXT_PUBLIC_STRIPE_YEARLY_EXPERTISE_PRICE_ID,
    features: ['Feature 1', 'Feature 2', 'Feature 3', 'Feature 4'],

  },
];
