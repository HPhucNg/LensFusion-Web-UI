'use client';
import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import '../style.css';
import Footer from '../../../components/Footer';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { createCheckoutSession } from '../../../../stripe/createCheckoutSession';
import { loadStripe } from '@stripe/stripe-js';
import { PricingPlans } from '../pricing/plans';


function PricingPage() {

  // State to toggle between monthly and yearly pricing
  const [pricingType, setPricingType] = useState('monthly');


  const handleSubscription = (link) => {
    //redirect to stripe payment
    if (link) {
      window.location.href = link; 
    } else {
      console.error('No payment link provided.');
    }
  };
  
  
  //handle the toggle
  const togglePricing = (type) => {
    setPricingType(type);
  };
  /*Handle plan select
  const handlePlanSelect = (plan) => {
    navigate('/payment', { state: { plan, pricingType } });
  };*/


  // price based on the selected pricing type
  const formatPrice = (price, type) => {
    let priceText = `$${price}`;
    let periodText = '';

    if (type === 'monthly') {
      periodText = '/mo';
    } else {
      priceText = `$${price}`;
      periodText = '/yr';
    }

    // for styling
    return (
      <>
        <span className="price">{priceText}</span>
        <span className="period">{periodText}</span>
      </>
    );
  };

  // dynamic rendering
  const faqItems = [
    {
      question: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit?',
      answer: 'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.'
    },
    {
      question: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit?',
      answer: 'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.'
    },
    {
      question: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit?',
      answer: 'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.'
    }
  ];

  // dynamic rendering
  const pricingPlans = [
    { title: 'Basic Plan', monthly: 5, yearly: 50 },
    { title: 'Pro Plan', monthly: 10, yearly: 100 },
    { title: 'Enterprise Plan', monthly: 20, yearly: 200 },
  ];

  return (
    <>
    <div className='min-h-screen bg-gradient-to-r from-gray-900 via-gray-800 to-black text-white font-sans relative overflow-hidden'>
      <Navbar />
      <h1 className="priceh1">How much is your time worth?</h1>
      <main className="containerPrice">
        <div className="termFees">
          <button 
            className={pricingType === 'monthly' ? 'selected' : ''} 
            onClick={() => togglePricing('monthly')}
          >
            Monthly
          </button>
          <button
            className={pricingType === 'yearly' ? 'selected' : ''}
            onClick={() => togglePricing('yearly')}
          >
            Yearly
          </button>
        </div>


        {/* Pricing Cards */}
        <section className="flex flex-wrap justify-center gap-6 px-4">
          {PricingPlans.map((plan, index) => (
            <div
            key={plan.title}
            className={`rounded-lg p-6 shadow-lg w-full sm:w-80 md:w-72 lg:w-64 h-full flex flex-col justify-center items-center text-center ${
              index === 1 ? 'bg-white text-black' : 'bg-gradient-to-r from-gray-900 via-gray-800 to-black text-white'
            }`}
          >
            <h3 className="text-l font-bold mb-1">{plan.title}</h3>
            <div className="flex justify-center items-baseline mb-4">
              <span className="text-3xl font-bold">
                {pricingType === 'monthly' ? `$${plan.priceMonthly}` : `$${plan.priceYearly}`}
              </span>
              <span className="text-sm ml-1">
                /{pricingType === 'monthly' ? 'mo' : 'yr'}
              </span>
            </div>
            <ul className="mb-4 space-y-1 list-disc list-inside text-left w-full">
              {plan.features[pricingType].map((feature, index) => (
                <li key={index} className="text-sm">
                  {feature}
                </li>
              ))}
            </ul>
            <button
              className={`w-full px-4 py-2 rounded-lg ${
                index === 1 ? 'bg-black text-white' : 'bg-white text-black'
              }`}
              onClick={() => handleSubscription(pricingType === 'monthly' ? plan.linkMonthly : plan.linkYearly)}
            >
              {`Get ${plan.title}`}
            </button>
          </div>
          
          ))}
        </section>

         

          {/* FAQ Accordion */}
          <section className="faqItem">
            <h2>Frequently Asked Questions</h2>
            <Accordion type="single" collapsible>
              {faqItems.map((item, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="bg-gradient-to-r from-gray-900 via-gray-800 to-black text-white">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent>{item.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
}

export default PricingPage;