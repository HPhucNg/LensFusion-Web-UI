"use client"
import React, { useState, useEffect } from 'react';

const ScrollToTop = () => {
  const [isVisible, setIsVisible] = useState(false);

  // Show button when page is scrolled up to given distance
  const toggleVisibility = () => {
    if (window.pageYOffset > 300) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  // Set the scroll event listener
  useEffect(() => {
    window.addEventListener('scroll', toggleVisibility);

    return () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, []);

  // Scroll to top smoothly
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <>
      {isVisible && (
        <button
          onClick={scrollToTop}
          className={`
            fixed 
            bottom-4 
            right-4 
            sm:bottom-6 
            sm:right-6 
            lg:bottom-8 
            lg:right-8 
            p-3 
            sm:p-4 
            rounded-full 
            bg-black 
            text-white 
            shadow-lg 
            cursor-pointer 
            hover:bg-slate-800
            focus:outline-none
            focus:ring-2
            focus:ring-white
            focus:ring-opacity-50
            transition-all 
            duration-300 
            border-2
            border-white
            z-50
            transform 
            hover:scale-110 
            active:scale-95
          `}
          aria-label="Scroll to Top"
        >
          <svg
            className="w-5 h-5 sm:w-6 sm:h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 10l7-7m0 0l7 7m-7-7v18"
            />
          </svg>
        </button>
      )}
    </>
  );
};

export default ScrollToTop;