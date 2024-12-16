"use client"
import React, { useRef, useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import BrandSection from '../components/BrandSection';
import ProductCategory from '@/components/landing_page/ProductCategory';
import ScrollToTop from '@/components/ScrollToTop';
import {db} from '../firebase/FirebaseConfig';
import { addDoc, collection } from 'firebase/firestore';
import Image from 'next/image'

export default function Home() {
  const [displayText, setDisplayText] = useState("");
  const phrases = ["Sell More", "Save Time", "Reduce Cost"];
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);

  useEffect(() => {
    const currentPhrase = phrases[currentPhraseIndex];
    let charIndex = 0;

    const typingInterval = setInterval(() => {
      if (charIndex <= currentPhrase.length) {
        setDisplayText(currentPhrase.slice(0, charIndex));
        charIndex++;
      } else {
        clearInterval(typingInterval);
        setTimeout(() => {
          setCurrentPhraseIndex((prevIndex) => 
            prevIndex === phrases.length - 1 ? 0 : prevIndex + 1
          );
        }, 2000);
      }
    }, 100);

    return () => {
      clearInterval(typingInterval);
    };
  }, [currentPhraseIndex]);

  return (
    <div className='min-h-screen bg-gradient-to-r from-gray-900 via-gray-800 to-black text-white font-sans'>
      <Navbar />
      
      {/* Hero Section Container */}
      <div className='max-w-[1400px] mx-auto px-4 sm:px-6'>
        <section className='pt-20 pb-16'>
          <div className="text-center space-y-8">
            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold">
              AI Product Photos That Help You
            </h1>
            
            {/* Animated Text */}
            <div className="h-16 sm:h-20 lg:h-24">
              <div className="bg-clip-text text-transparent bg-gradient-to-r from-purple-500 via-violet-500 to-pink-500 text-4xl sm:text-5xl lg:text-7xl font-bold">
                <span>{displayText}</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-">
              <button className="relative inline-flex h-12 w-full sm:w-auto overflow-hidden rounded-full p-[1px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50">
                <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
                <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-950 px-8 sm:px-16 py-5 text-sm font-medium text-white backdrop-blur-3xl">
                  Get Started
                </span>
              </button>
              <button className="w-full sm:w-auto inline-flex h-12 font-semibold animate-shimmer items-center justify-center rounded-full border border-slate-800 bg-[linear-gradient(110deg,#000103,45%,#1e2631,55%,#000103)] bg-[length:200%_100%] px-8 sm:px-16 font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50">
                Live Demo
              </button>
            </div>

            {/* Hero Video */}
            <div className="mt-16 max-w-5xl mx-auto">
              <div className="relative rounded-xl bg-[#0D161F] p-4 shadow-2xl">
                <video 
                  className="rounded-lg w-full"
                  autoPlay 
                  loop 
                  muted 
                  playsInline
                >
                  <source src="/hero-video.mp4" type="video/mp4" />
                </video>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Brands Section - No Container */}
      <section className="w-full py-20">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-10">
          Compatible with Industry Leaders
        </h2>
        <BrandSection />
      </section>

      <section className="w-full">
        <div className="max-w-7xl mx-auto pt-10 pb-40 m-10">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Left Content */}
            <div className="space-y-6">
              <h2 className="text-3xl md:text-5xl text-white font-bold">
                Remove any Photo Background in One Click
              </h2>
              <p className="text-xl text-gray">
                Simply upload your product, and our AI will automatically remove the background for you.
              </p>
              <p className="text-xl text-gray">
                Our AI is trained to remove the background for a wide range of products—in seconds.
              </p>
            </div>

            {/* Right Content - Single Image */}
            <div className="relative w-[800px] max-w-full">
              <Image
                src="/background-removal.png"
                alt="Background removal demonstration"
                width={2400}
                height={1600}
                className="w-full h-auto object-contain"
                priority
              />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-8 items-center mt-10">
            {/* Left Content */}
            <div className="relative w-[800px] max-w-full">
              <Image
                src="/change_background.jpg"
                alt="Background removal demonstration"
                width={2400}
                height={1600}
                className="w-full h-auto object-contain"
                priority
              />
            </div>

            {/* Right Content - Single Image */}
            <div className="space-y-6 pl-4">
              <h2 className="text-3xl md:text-5xl text-white font-bold">
              Generate Photo Background with Any Image
              </h2>
              <p className="text-xl text-gray">
                Just upload your product, and our AI will automatically generate the background for you.
              </p>
              <p className="text-xl text-gray">
              Change the background of any photo with the image of your choice, creating a completely new visual look.
              </p>
            </div>
          </div>
        </div>
        
      </section>

      {/* Rest of the sections in container */}
      <div className='max-w-[1400px] mx-auto px-4 sm:px-6'>
        <section>
          <ProductCategory />
        </section>
      </div>

      {/* Background Removal Section - Moved outside the container */}
     
      {/* <div className='max-w-[1400px] mx-auto px-4 sm:px-6'>
        <section className="py-20 bg-clip-text text-transparent bg-gradient-to-r from-purple-500 via-violet-500 to-pink-500">
          <div className="space-y-4">
            <h2>Features</h2>
            <h2>Features</h2>
            <h2>Features</h2>
            <h2>Features</h2>
            <h2>Features</h2>
            <h2>Features</h2>
            <h2>Features</h2>
            <h2>Features</h2>
            <h2>Features</h2>
            <h2>Features</h2>
            <h2>Features</h2>
            <h2>Features</h2>
            <h2>Features</h2>
            <h2>Features</h2>
          </div>
        </section>
      </div> */}
      <ScrollToTop />
      <Footer/>
    </div>
  );
}
