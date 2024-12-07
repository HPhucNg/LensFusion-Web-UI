'use client';
import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import '../style.css';
import Footer from '../../../components/Footer';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

function PricingPage() {
  // State to toggle between monthly and yearly pricing
  const [pricingType, setPricingType] = useState('monthly');

  // Handle the toggle
  const togglePricing = (type) => {
    setPricingType(type);
  };

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
      <div className="min-h-screen bg-gradient-to-r from-gray-900 via-gray-800 to-black text-white font-sans relative overflow-hidden">
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
          <section className="cards ">
            {pricingPlans.map((plan, index) => (
              <div key={index} className={`card ${index === 1 ? 'cardmiddle' : 'bg-gradient-to-r from-gray-900 via-gray-800 to-black'}`}
>
                <h3>{plan.title}</h3>
                <p>{formatPrice(plan[pricingType], pricingType)}</p>
                <ul>
                  <li key={`feature-1-${index}`}>Feature 1</li>
                  <li key={`feature-2-${index}`}>Feature 2</li>
                  <li key={`feature-3-${index}`}>Feature 3</li>
                  <li key={`feature-4-${index}`}>Feature 4</li>
                </ul>
                <button className={`${index === 1 ? 'bg-gradient-to-r from-gray-900 via-gray-800 to-black text-white' : ''}`}>Button</button>
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

