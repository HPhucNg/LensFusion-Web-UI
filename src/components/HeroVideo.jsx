"use client";

import React, { useEffect, useRef, useState } from 'react';

export default function HeroVideo() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    // Function to handle video loaded
    const handleVideoLoaded = () => {
      setIsLoaded(true);
      
      // Try to play the video
      if (videoRef.current) {
        videoRef.current.play()
          .then(() => {
            setIsPlaying(true);
          })
          .catch(error => {
            console.error("Video autoplay failed:", error);
            // Still mark as playing to remove loading state
            setIsPlaying(true);
          });
      }
    };

    // Set up event listeners
    const videoElement = videoRef.current;
    if (videoElement) {
      videoElement.addEventListener('loadeddata', handleVideoLoaded);
      
      // Force load the video
      videoElement.load();
    }

    // Cleanup
    return () => {
      if (videoElement) {
        videoElement.removeEventListener('loadeddata', handleVideoLoaded);
      }
    };
  }, []);

  return (
    <div className="relative rounded-xl bg-[#0D161F] p-2 sm:p-4 shadow-2xl">
      {/* Loading state */}
      {!isLoaded && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-800 rounded-lg">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-400">Loading video...</p>
          </div>
        </div>
      )}
      
      {/* Video element */}
      <video 
        ref={videoRef}
        className="rounded-lg w-full"
        autoPlay
        loop
        muted
        playsInline
        controls={false}
        poster="/change_background.jpg"
        style={{ opacity: isPlaying ? 1 : 0 }}
      >
        <source src="/hero-video.mp4" type="video/mp4" />
        {/* Fallback for browsers that don't support video */}
        <img 
          src="/change_background.jpg" 
          alt="Product demonstration" 
          className="rounded-lg w-full"
        />
      </video>
    </div>
  );
} 