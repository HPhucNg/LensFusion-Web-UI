"use client";

import React, { useEffect, useState } from 'react';

export default function VideoTest() {
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {
    // Set loaded to true after component mounts
    setIsLoaded(true);
  }, []);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      <h1 className="text-white text-2xl mb-8">Video Test Page</h1>
      
      <div className="max-w-3xl w-full">
        <div className="bg-gray-800 p-4 rounded-lg">
          <h2 className="text-white text-xl mb-4">Direct Video Element</h2>
          <video 
            className="w-full rounded"
            autoPlay
            loop
            muted
            playsInline
            controls
          >
            <source src="/hero-video.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
        
        <div className="mt-8 bg-gray-800 p-4 rounded-lg">
          <h2 className="text-white text-xl mb-4">Client-Side Rendered Video</h2>
          {isLoaded ? (
            <video 
              className="w-full rounded"
              autoPlay
              loop
              muted
              playsInline
              controls
            >
              <source src="/hero-video.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          ) : (
            <div className="bg-gray-700 w-full h-64 rounded flex items-center justify-center">
              <p className="text-white">Loading video...</p>
            </div>
          )}
        </div>
        
        <div className="mt-8">
          <a 
            href="/"
            className="text-blue-400 hover:text-blue-300 underline"
          >
            Back to Home
          </a>
        </div>
      </div>
    </div>
  );
} 