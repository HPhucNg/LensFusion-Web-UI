import React from 'react';
import Image from 'next/image';

export const FullscreenModal = ({ 
  isFullscreen, 
  fullscreenImage, 
  closeFullscreen 
}) => {
  if (!isFullscreen) return null;
  
  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
      <button
        onClick={closeFullscreen}
        className="absolute top-4 right-4 p-3 bg-gray-900/80 hover:bg-gray-700/90 rounded-lg backdrop-blur-sm border border-gray-600/50 shadow-md transition-all hover:scale-110"
      >
        <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      
      <div className="relative w-full h-full max-w-6xl flex items-center justify-center">
        <Image
          src={fullscreenImage}
          alt="Fullscreen view"
          fill
          className="object-contain"
          style={{ imageRendering: 'auto' }}
        />
      </div>
    </div>
  );
};