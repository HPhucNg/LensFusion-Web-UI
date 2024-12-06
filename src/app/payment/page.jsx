'use client'
import React, { useState } from 'react';
import '../(list_page)/style.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Input } from "@/components/ui/input"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue,} from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

 

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
      <div className='h1payment'>
      <h1>Upgrade to a Pro Membership</h1>
      <p>Get all access and an extra 20% off when you subscribe annually</p>
      </div>
      <div className='containerPayment'>
        <div className='paymentForm'>
          <div>
            <p>Billed To</p>
            <Input type="text" placeholder="Card Holder Name" />
            <Input type="text" placeholder="Card Number" />
            <span className='inline-block'><Input type="text" placeholder="MM/YY" /></span><span className='inline-block'><Input className='text' type="cvv" placeholder="CVV" /></span>
          </div>
          <div className='country'>
            <p>Country</p>
            <select>
              <option value="default">Select Country</option>
                <option value="canada">Canada</option>
                <option value="usa">United States</option>
                <option value="mexico">Mexico</option>
              </select>
            <Input type="text" placeholder="Zip Code" />
          </div>
          <div><p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p></div>
        </div>
        <div className='membership'>
          <p>Membership Type</p>
        </div>
      </div>
      <Footer />
    </div>
    </>
  );
}

export default Page;
