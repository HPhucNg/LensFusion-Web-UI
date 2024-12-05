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
      <div className='containerPayment'>
        <div>
          <div className='billed'>
            <p>Billed To</p>
            <Input type="cardholdername" placeholder="Card Holder Name" />
            <Input type="cardnumber" placeholder="Card Number" />
            <span className='inline-block'><Input type="expiration" placeholder="MM/YY" /></span><span className='inline-block'><Input className='inline-block' type="cvv" placeholder="CVV" /></span>
          </div>
          <div className='country'>
            <p>Country</p>
            <Select>
              <SelectTrigger className="text-white w-[180px]">
                <SelectValue placeholder="Select Country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="canada">Canada</SelectItem>
                <SelectItem value="usa">United States</SelectItem>
                <SelectItem value="mexico">Mexico</SelectItem>
                </SelectContent>
              </Select>
            <Input type="zipcode" placeholder="Zip Code" />
          </div>
        </div>
        <div>
          <p>Membership Type</p>
          <RadioGroup defaultValue="option-one">
            <div className="flex items-center space-x-1">
              <RadioGroupItem value="monthly" id="monthly" />
              <p>Monthly</p>
            </div>
            <div className="flex flex-col space-y-1">
              <RadioGroupItem value="yearly" id="yearly" />
              <p>Yearly</p>
            </div>
          </RadioGroup>

        </div>
      </div>
      <Footer />
    </div>
    </>
  );
}

export default Page;
