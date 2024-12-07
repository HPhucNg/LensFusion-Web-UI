'use client'
import React, { useState } from 'react'
import Navbar from '@/components/Navbar';
import '../style.css';
import Footer from '../../../components/Footer';
import {Accordion, AccordionContent, AccordionItem, AccordionTrigger,} from "@/components/ui/accordion"


function page() {
  // State to toggle between monthly and yearly pricing
  const [pricingType, setPricingType] = useState('monthly');

  //handle the toggle
  const togglePricing = (type) => {
    setPricingType(type);
  };

  //convert price based on the selected pricing type
  const formatPrice = (price, type) => {
    let priceText = `$${price}`;
    let periodText = '';
  
    if (type === 'monthly') {
      periodText = '/mo';
    } else {
      // Assuming yearly price is 12 times the monthly price
      priceText = `$${price * 12}`;
      periodText = '/yr';
    }
  
    //spans for styling
    return (
      <>
        <span className="price">{priceText}</span>
        <span className="period">{periodText}</span>
      </>
    );
  };

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
        <section className="cards">
          <div className="card bg-gradient-to-r from-gray-900 via-gray-800 to-black">
            <h3>Title</h3>
            <p>{formatPrice(5, pricingType)}</p>
            <ul>
              <li>list item</li>
              <li>list item</li>
              <li>list item</li>
              <li>list item</li>
            </ul>
            <button>Button</button>
          </div>
          <div className="card cardmiddle text-gradient-to-r from-gray-900 via-gray-800 to-black">
            <h3>Title</h3>
            <p>{formatPrice(10, pricingType)}</p>
            <ul>
              <li>list item</li>
              <li>list item</li>
              <li>list item</li>
              <li>list item</li>
            </ul>
            <button className='bg-gradient-to-r from-gray-900 via-gray-800 to-black text-white'>Button</button>
          </div>
          <div className="card bg-gradient-to-r from-gray-900 via-gray-800 to-black">
            <h3>Title</h3>
            <p>{formatPrice(20, pricingType)}</p>
            <ul>
              <li>list item</li>
              <li>list item</li>
              <li>list item</li>
              <li>list item</li>
            </ul>
            <button>Button</button>
          </div>
        </section>

        <section className="faqItem ">
          <h2>Frequently asked questions</h2>
          <Accordion type="single" collapsible>
            <AccordionItem value="item-1">
              <AccordionTrigger className='bg-gradient-to-r from-gray-900 via-gray-800 to-black text-white'>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore.</AccordionTrigger>
              <AccordionContent> Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</AccordionContent>
            </AccordionItem>
          </Accordion>
          <Accordion type="single" collapsible>
            <AccordionItem value="item-2">
              <AccordionTrigger className='bg-gradient-to-r from-gray-900 via-gray-800 to-black text-white'>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore.</AccordionTrigger>
              <AccordionContent> Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</AccordionContent>
            </AccordionItem>
          </Accordion>
          <Accordion type="single" collapsible>
            <AccordionItem value="item-2">
              <AccordionTrigger className='bg-gradient-to-r from-gray-900 via-gray-800 to-black text-white'>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore.</AccordionTrigger>
              <AccordionContent> Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

      </main>
      <Footer />
      </div>
    </>
  );
  
}

export default page
