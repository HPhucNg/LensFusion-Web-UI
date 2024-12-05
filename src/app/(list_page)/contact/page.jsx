'use client';
import React, { useState } from 'react'
import Navbar from '../../../components/Navbar';
import '../style.css';
import Footer from '../../../components/Footer';
import { Input } from "@/components/ui/input"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue,} from "@/components/ui/select"



function page() {
  const [formData, setFormData] = useState({
    subject: '',
    name: '',
    email: '',
    message: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // Here - could send the formData to a server or handle it however you need
  };

  return (
    <>
    <div className='min-h-screen bg-gradient-to-r from-gray-900 via-gray-800 to-black text-white font-sans relative overflow-hidden'>
      <Navbar />
      <main className="containerContact">
        <div className="prompt-container">
          <h1>Contact Us</h1>
          <h3>We are here to help</h3><br />
          <p>
            If you have any questions<br />
            about LensFusion, or<br />
            would like to leave us a<br />
            comment, feel free to<br />
            contact us.
          </p><br />
          <p>
            Simply, fill out the form<br />
            and we will get<br />
            back to you.
          </p>
        </div>

        <div className="form-container">
          <form onSubmit={handleSubmit}>
            <label htmlFor="subject">Subject</label><br />
            <Select 
              name="subject"
              id="subject"
              value={formData.subject}
              onChange={handleChange}>
              <SelectTrigger className="text-white">
                <SelectValue placeholder="Select Option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Select Option</SelectItem>
                <SelectItem value="feedback">Feedback</SelectItem>
                <SelectItem value="subscription">Subscription</SelectItem>
                </SelectContent>
              </Select>
            
            <label htmlFor="name">Name</label><br />
            <Input
              type="text"
              id="name"
              name="name"
              placeholder="Name"
              value={formData.name}
              onChange={handleChange}
            /><br />
            
            <label htmlFor="email">Email Address</label><br />
            <Input
              type="text"
              id="email"
              name="email"
              placeholder='Email'
              value={formData.email}
              onChange={handleChange}
            /><br />
            
            <label htmlFor="message">Message</label><br />
            <Input
              type="text"
              id="message"
              name="message"
              placeholder='Message'
              value={formData.message}
              onChange={handleChange}
            /><br />
            
            <input type="submit" value="Submit" onChange={handleSubmit}/>
          </form>
        </div>
      </main>
      <Footer />
      </div>
    </>
  );
}

export default page