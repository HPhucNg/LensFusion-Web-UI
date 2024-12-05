'use client'
import React, { useState } from 'react';
import '../(list_page)/style.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

function Page() { 
  const [formData, setFormData] = useState({
    cardname: '',
    cardnumber: '',
    expiration: '',
    cvv: '',
    country: '',
    zipcode: '',
    membershipType: '',
    addOns: []
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleRadioChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      membershipType: e.target.value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
  };

  return (
    <>
    <div className='min-h-screen bg-gradient-to-r from-gray-900 via-gray-800 to-black text-white font-sans relative overflow-hidden'>
      <Navbar />
      <div>
        <h1>Upgrade to a Pro Membership</h1>
        <p>Get all access and an extra 20% off when you subscribe annually</p>
      </div>
        
      <form onSubmit={handleSubmit} className="containerPayment">
        <section className='paymentCardInfo'>
          <p>Billed to</p>
          <label htmlFor="cardname"></label><br />
          <input
            type="text"
            id="cardname"
            name="cardname"
            placeholder="Card Holder Name"
            value={formData.cardname}
            onChange={handleChange}
          /><br />
          
          <label htmlFor="cardnumber"></label><br />
          <input
            type="text"
            id="cardnumber"
            name="cardnumber"
            placeholder="Card Number"
            value={formData.cardnumber}
            onChange={handleChange}
          /><br />
          
          <div className='dateCvv'>
            <label htmlFor="expiration"></label><br />
            <input
              type="text"
              id="expiration"
              name="expiration"
              placeholder="MM/YY"
              value={formData.expiration}
              onChange={handleChange}
            /><br />

            <label htmlFor="cvv"></label><br />
            <input
              type="text"
              id="cvv"
              name="cvv"
              placeholder="CVV"
              value={formData.cvv}
              onChange={handleChange}
            /><br />
          </div>

          <div>
            <p>Country</p>
            <label htmlFor="country"></label><br />
            <select
              name="country"
              id="country"
              value={formData.country}
              onChange={handleChange}
            >
              <option value="default">Select Country</option>
              <option value="usa">United States</option>
              <option value="mexico">Mexico</option>
              <option value="canada">Canada</option>
              <option value="other">Other</option>
            </select><br />

            <label htmlFor="zipcode"></label><br />
            <input
              type="text"
              id="zipcode"
              name="zipcode"
              placeholder='Zip Code'
              value={formData.zipcode}
              onChange={handleChange}
            /><br />
          </div>
        </section>

        <section className='paymentSelect'>
          <p>Membership Type</p>
          <label>
            <input 
              type="radio" 
              name="membershipType" 
              value="monthly" 
              checked={formData.membershipType === 'monthly'}
              onChange={handleRadioChange}
            />
            Pay monthly
          </label>
          <label>
            <input 
              type="radio" 
              name="membershipType" 
              value="annually" 
              checked={formData.membershipType === 'annually'}
              onChange={handleRadioChange}
            />
            Pay annually
          </label>

          <p>Add-Ons</p>
          {/* Add Add-Ons inputs here if needed */}

          <input type="submit" value="Submit" />
        </section>
      </form>
      
      <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit</p>
      <Footer />
    </div>
    </>
  );
}

export default Page;
