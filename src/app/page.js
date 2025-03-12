"use client"
import React, { useRef, useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import BrandSection from '../components/BrandSection';
import ProductCategory from '@/components/landing_page/ProductCategory';
import ScrollToTop from '@/components/ScrollToTop';
import Image from 'next/image'
import HeroVideo from '@/components/HeroVideo';

export default function Home() {
  // State management for typing animation
  const [displayText, setDisplayText] = useState("");
  const [isClient, setIsClient] = useState(false);
  const phrases = ["Sell More", "Save Time", "Reduce Cost"];
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);

  // Initialize client-side rendering check
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Typing animation effect
  useEffect(() => {
    if (!isClient) return;

    const currentPhrase = phrases[currentPhraseIndex];
    let charIndex = 0;

    // Set up typing interval
    const typingInterval = setInterval(() => {
      if (charIndex <= currentPhrase.length) {
        setDisplayText(currentPhrase.slice(0, charIndex));
        charIndex++;
      } else {
        clearInterval(typingInterval);
        // Wait before starting next phrase
        setTimeout(() => {
          setCurrentPhraseIndex((prevIndex) => 
            prevIndex === phrases.length - 1 ? 0 : prevIndex + 1
          );
        }, 2000);
      }
    }, 100);

    // Cleanup interval on unmount
    return () => {
      clearInterval(typingInterval);
    };
  }, [currentPhraseIndex, isClient]);

  return (
    // Main container with gradient background
    <div className='min-h-screen bg-gradient-to-r from-gray-900 via-gray-800 to-black text-white font-sans'>
      {/* Navigation Bar */}
      <Navbar />
      
      {/* Hero Section */}
      <div className='max-w-[1400px] mx-auto px-4 sm:px-6'>
        <section className='pt-16 sm:pt-20 pb-12 sm:pb-16'>
          <div className="text-center space-y-6 sm:space-y-8">
            {/* Main Hero Heading */}
            <h1 className="text-3xl sm:text-5xl lg:text-7xl font-bold px-2">
              AI Product Photos That Help You
            </h1>
            
            {/* Animated Typing Text */}
            <div className="h-12 sm:h-16 lg:h-24">
              {isClient && (
                <div className="bg-clip-text text-transparent bg-gradient-to-r from-purple-500 via-violet-500 to-pink-500 text-3xl sm:text-5xl lg:text-7xl font-bold">
                  <span>{displayText}</span>
                </div>
              )}
            </div>

            {/* Call-to-Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              {/* Get Started Button with Animation */}
              <button className="relative inline-flex h-12 w-full sm:w-auto overflow-hidden rounded-full p-[1px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50">
                <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
                <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-950 px-8 sm:px-16 py-5 text-sm font-medium text-white backdrop-blur-3xl">
                  Get Started
                </span>
              </button>
              {/* Live Demo Button with Shimmer Effect */}
              <button className="w-full sm:w-auto inline-flex h-12 font-semibold animate-shimmer items-center justify-center rounded-full border border-slate-800 bg-[linear-gradient(110deg,#000103,45%,#1e2631,55%,#000103)] bg-[length:200%_100%] px-8 sm:px-16 font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50">
                Live Demo
              </button>
            </div>

            {/* Hero Video Section */}
            <div className="mt-8 sm:mt-16 max-w-5xl mx-auto px-2 sm:px-4">
              <HeroVideo />
            </div>
          </div>
        </section>
      </div>

      {/* Brands Section */}
      <section className="w-full py-12 sm:py-20">
        <h2 className="text-xl sm:text-3xl lg:text-4xl font-bold text-center mb-6 sm:mb-10 px-4">
          Compatible with Industry Leaders
        </h2>
        <BrandSection />
      </section>

      <section className="w-full">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
          <div className="pt-8 sm:pt-10 pb-20 sm:pb-40">
            {/* Background Removal Feature */}
            <div className="grid md:grid-cols-2 gap-4 sm:gap-8 items-center">
              {/* Left Content */}
              <div className="space-y-4 sm:space-y-6">
                <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold">
                  Remove any Photo Background in One Click
                </h2>
                <p className="text-lg sm:text-xl text-gray">
                  Simply upload your product, and our AI will automatically remove the background for you.
                </p>
                <p className="text-lg sm:text-xl text-gray">
                  Our AI is trained to remove the background for a wide range of products—in seconds.
                </p>
              </div>

              {/* Right Content - Demo Image */}
              <div className="relative w-full mt-4 sm:mt-0">
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

            {/* Background Generation Feature */}
            <div className="grid md:grid-cols-2 gap-4 sm:gap-8 items-center mt-8 sm:mt-10">
              {/* Left Content - Demo Image */}
              <div className="relative w-full order-2 md:order-1">
                <Image
                  src="/change_background.jpg"
                  alt="Background removal demonstration"
                  width={2400}
                  height={1600}
                  className="w-full h-auto object-contain"
                  priority
                />
              </div>

              {/* Right Content */}
              <div className="space-y-4 sm:space-y-6 order-1 md:order-2">
                <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold">
                  Generate Photo Background with Any Image
                </h2>
                <p className="text-lg sm:text-xl text-gray">
                  Just upload your product, and our AI will automatically generate the background for you.
                </p>
                <p className="text-lg sm:text-xl text-gray">
                  Change the background of any photo with the image of your choice, creating a completely new visual look.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Categories Section */}
      <div className='max-w-[1400px] mx-auto px-4 sm:px-6'>
        <section>
          <ProductCategory />
        </section>
      </div>

      {/* Scroll To Top Button */}
      <ScrollToTop />

      {/* Footer */}
      <Footer/>
    </div>
  );
}