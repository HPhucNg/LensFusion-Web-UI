'use client'
import React, { useState } from 'react'
import Navbar from '@/components/Navbar';
import '../style.css';

function page() {
  // State to toggle between monthly and yearly pricing
  const [pricingType, setPricingType] = useState('monthly');

  //handle the toggle
  const togglePricing = () => {
    setPricingType(pricingType === 'monthly' ? 'yearly' : 'monthly');
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
  
    //With spans for styling
    return (
      <>
        <span className="price">{priceText}</span>
        <span className="period">{periodText}</span>
      </>
    );
  };

  return (
    <>
      <Navbar />
      <h1 className="priceh1">How much is your time worth?</h1>
      <main className="containerPrice">
        <p className='termFees'>
          {pricingType === 'monthly' ? 'Monthly' : 'Yearly'}
          <button onClick={togglePricing}>
            {pricingType === 'monthly' ? 'Yearly' : 'Monthly'}
          </button>
        </p>
        <section className="cards">
          <div className="card">
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
          <div className="card cardmiddle">
            <h3>Title</h3>
            <p>{formatPrice(10, pricingType)}</p>
            <ul>
              <li>list item</li>
              <li>list item</li>
              <li>list item</li>
              <li>list item</li>
            </ul>
            <button>Button</button>
          </div>
          <div className="card">
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

        <section className="faqItem">
          <h2>Frequently asked questions</h2>
          <select>
            <option>Lorem ipsum dolor sit amet, consectetur adipiscing elit</option>
          </select>
        </section>
      </main>
    </>
  );
}

export default page
