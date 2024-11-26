'use client';
import React, { useState } from 'react'
import Navbar from '../../../components/Navbar';
import '../style.css';

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
    // Here, you could send the formData to a server or handle it however you need
  };

  return (
    <>
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
            <select
              name="subject"
              id="subject"
              value={formData.subject}
              onChange={handleChange}
            >
              <option value="default">Select option</option>
              <option value="feedback">Feedback</option>
              <option value="trouble">Trouble-shooting</option>
              <option value="community">Community</option>
              <option value="subscription">Subscription</option>
              <option value="other">Other</option>
            </select><br />
            
            <label htmlFor="name">Name</label><br />
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
            /><br />
            
            <label htmlFor="email">Email Address</label><br />
            <input
              type="text"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
            /><br />
            
            <label htmlFor="message">Message</label><br />
            <input
              type="text"
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
            /><br />
            
            <input type="submit" value="Submit" />
          </form>
        </div>
      </main>
    </>
  );
}

export default page