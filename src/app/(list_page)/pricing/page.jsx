'use client'
import React, { useState } from 'react'
import Navbar from '@/components/Navbar';
import '../style.css';
import Footer from '../../../components/Footer';

function page() {
  // State to toggle between monthly and yearly pricing
  const [pricingType, setPricingType] = useState('monthly');

  //handle the toggle
  const togglePricing = (type) => {
    setPricingType(type);
  };

   // State to track visibility of individual answers
  const [visibleAnswer, setVisibleAnswer] = useState(null);

   // Toggle the visibility of a specific answer
  const toggleAnswer = (index) => {
     // If the clicked answer is already visible, collapse it (null), else expand it
    setVisibleAnswer(prevState => (prevState === index ? null : index));
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
          <div>
            <button onClick={() => toggleAnswer(0)}>
              {visibleAnswer === 0 ? 'Answer is here.' : 'Lorem ipsum dolor sit amet, consectetur adipiscing elit'}
            </button>
            {visibleAnswer === 0 && <p>This is the answer to the first question.</p>}
          </div>

          <div>
            <button onClick={() => toggleAnswer(1)}>
              {visibleAnswer === 1 ? 'Answer is here.' : 'Lorem ipsum dolor sit amet, consectetur adipiscing elit'}
            </button>
            {visibleAnswer === 1 && <p>This is the answer to the second question.</p>}
          </div>

          <div>
            <button onClick={() => toggleAnswer(2)}>
              {visibleAnswer === 2 ? 'Answer is here.' : 'Lorem ipsum dolor sit amet, consectetur adipiscing elit'}
            </button>
            {visibleAnswer === 2 && <p>This is the answer to the third question.</p>}
          </div>

          <div>
            <button onClick={() => toggleAnswer(3)}>
              {visibleAnswer === 3 ? 'Answer is here.' : 'Lorem ipsum dolor sit amet, consectetur adipiscing elit'}
            </button>
            {visibleAnswer === 3 && <p>This is the answer to the fourth question.</p>}
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}

export default page
