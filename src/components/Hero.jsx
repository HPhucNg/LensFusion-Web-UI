import React from 'react';

function Hero({ children }) {
  return (
    <div className="relative w-full h-screen">
      {/* Background image */}
      <img 
        src="/Frame 21233.png" 
        alt="Hero Image" 
        className="absolute inset-0 object-cover w-full h-full z-0"
      />
      {/* Background overlay */}
      <div className="absolute inset-0 bg-black opacity-50 z-10"></div>
      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-center items-center z-20">
        {children && (
          <div className="text-center text-white">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

export default Hero;
