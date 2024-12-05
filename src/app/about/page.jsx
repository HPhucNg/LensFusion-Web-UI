'use client'
import React from 'react'
import '../(list_page)/style.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

function page() {
  return (
    <>
    <div className='min-h-screen bg-gradient-to-r from-gray-900 via-gray-800 to-black text-white font-sans relative overflow-hidden'>
    <Navbar />
    <main className="containerAbout">
      <div className="thumbnail-containerAbout">
        <img
          className="thumbnailAbout"
          src="/thumbnailAbout.png" // Adjust image path if necessary
          alt="Background Image"
        />
        <p className="centeredAbout">
          Leveraging AI to help Improve Businesses
        </p>
      </div>
      
      <div className="itemsAbout">
        <h2>Our Goal</h2>
        <p>
          is to empower businesses by providing an accessible solution that enables them to create images
          that effectively showcase their products and represent their vision.
        </p>
        <h2>Motivation</h2>
        <p>
          In digital advertising, high-quality product images are crucial for capturing customer attention and
          driving engagement. However, creating these professional images often involves significant costs for
          equipment and skilled photographers, which many small businesses and independent marketers simply
          cannot afford.
        </p>
        <h2>What We Do</h2>
        <p>
          We provide a user-friendly way to interact with an AI model. We give users the ability to tweak settings
          and parameters, so that they can generate images without needing to code or use command-line tools.
        </p>
      </div>
    </main>
    <Footer/>
    </div>
    </>
  );
};

export default page