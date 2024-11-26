'use client'
import React from 'react'
import Navbar from '@/components/Navbar';
import '../style.css';

function page() {
  return (
    <>
    <Navbar />
    <h1 className='priceh1'>How much is your time worth?</h1>
    <main className='containerPrice'>
      <section className='cards'>
        <div className='card'>
          <h3>Title</h3>
          <p>$10/mo</p>
          <ul>
            <li>list item</li>
            <li>list item</li>
            <li>list item</li>
            <li>list item</li>
          </ul>
        </div>
        <div className='card'>
          <h3>Title</h3>
          <p>$30/mo</p>
          <ul>
            <li>list item</li>
            <li>list item</li>
            <li>list item</li>
            <li>list item</li>
          </ul>
        </div>
        <div className='card'>
          <h3>Title</h3>
          <p>$50/mo</p>
          <ul>
            <li>list item</li>
            <li>list item</li>
            <li>list item</li>
            <li>list item</li>
          </ul>
        </div>
      </section>

      <section className='faqItem'>
        <h2>Frequently asked questions</h2>
        <select><option>Lorem ipsum dolor sit amet, consectetur adipiscing elit</option></select>
      </section>
    </main>
    
    </>
  )
}

export default page
