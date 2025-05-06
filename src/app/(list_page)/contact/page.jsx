'use client';
import React, { useState } from 'react'
import Navbar from '../../../components/Navbar';
import '../style.css';
import Footer from '../../../components/Footer';
import { Input } from "@/components/ui/input"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue,} from "@/components/ui/select"
import { db } from '@/firebase/FirebaseConfig';
import { addDoc, collection } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from '@/components/ui/button';

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

  const handleSubmit = async(e) => {
    e.preventDefault();
    //basic validation
    if (!formData.subject || !formData.name || !formData.email || !formData.message) {
      alert('Please fill in all fields');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      alert('Please enter a valid email address');
      return;
    }
    console.log('Form submitted:', formData);


    try{
      const docRef = await addDoc(collection(db, "contact_us"),{
        subject: formData.subject,
        name: formData.name,
        email: formData.email,
        message: formData.message,
        timestamp: new Date()
      }); 
      console.log("Queries saved with ID:", docRef.id);
      
      // Here - could send the formData to a server or handle it however you need
      setFormData({ subject: '', name: '', email: '', message: '' }); // reset the form when submitted


    }catch (error){
        alert(error.message);

      }
  };

  return (
    <>
    <div className='min-h-screen bg-gradient-to-r from-gray-900 via-gray-800 to-black  font-sans relative overflow-hidden'>
      <Navbar />
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl md:text-3xl lg:text-5xl font-bold text-center mb-8">Contact Us</h1>
        <main className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          <Card className="bg-[var(--card-background)] dark:bg-gray-800 dark:border-gray-700 border-[var(--border-gray)]">
            <CardHeader>
              <CardTitle className="text-2xl ">We are here to help</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-400">
              <p>
                If you have any questions about LensFusion, or would like to leave us a
                comment, feel free to contact us.
              </p>
              <p>
                Simply, fill out the form and we will get back to you.
              </p>
            </CardContent>
          </Card>


          <Card className="bg-[var(--card-background)] dark:border-gray-700 dark:bg-gray-800 border-[var(--border-gray)]">
            <CardHeader>
              <CardTitle className="text-2xl ">Send us a message</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label>Subject</label>
                  <select 
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full bg-gradient-to-r from-gray-700 via-gray-700 to-gray-700 border border-[var(--border-gray)] rounded-lg p-2 "
                  >
                  <option value="">Select Option</option>
                  <option value="trouble-shooting">Trouble-shooting</option>
                  <option value="feedback">Feedback</option>
                  <option value="subscription">Subscription</option>
                  <option value="other">Other</option>

                </select><br />
              </div>
              <div className="space-y-3">
                <label htmlFor="name">Name</label><br />
                <Input
                  type="text"
                  id="name"
                  name="name"
                  placeholder="Enter your name"
                  value={formData.name}
                  onChange={handleChange}
                  className="bg-gradient-to-r from-gray-700 via-gray-700 to-gray-700 border border-[var(--border-gray)]"

                /><br />
                
                <label htmlFor="email">Email Address</label><br />
                <Input
                  type="email"
                  id="email"
                  name="email"
                  placeholder='Enter your email'
                  value={formData.email}
                  onChange={handleChange}
                  className="bg-gradient-to-r from-gray-700 via-gray-700 to-gray-700 border border-[var(--border-gray)]"

                /><br />
                
                <label htmlFor="message">Message</label><br />
                <textarea
                  id="message"
                  name="message"
                  placeholder='Message here...'
                  value={formData.message}
                  onChange={handleChange}
                  rows="5"  // row size for better UX
                  className="w-full bg-gradient-to-r from-gray-700 via-gray-700 to-gray-700 border border-[var(--border-gray)] rounded-lg p-2 "

                /><br />
              </div>
              <Button>Submit</Button>
            </form>
            </CardContent>
          </Card>
          
        </main>
    </div>
      <Footer />
      </div>
    </>
  );
}

export default page