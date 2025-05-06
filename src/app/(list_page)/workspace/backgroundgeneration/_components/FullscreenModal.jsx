import React from 'react';
import Image from 'next/image';

export const FullscreenModal = ({ 
  isFullscreen, 
  fullscreenImage, 
  closeFullscreen 
}) => {
  if (!isFullscreen) return null;
  
  // Handle backdrop click to close modal
  const handleBackdropClick = (e) => {
    // Close only if clicking directly on the backdrop, not on the image or close button
    if (e.target === e.currentTarget) {
      closeFullscreen();
    }
  };
  
  return (
    <div 
      className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <button
        onClick={closeFullscreen}
        className="absolute top-4 right-4 p-3 bg-gray-900/80 hover:bg-gray-700/90 rounded-full backdrop-blur-sm border border-gray-600/50 shadow-md transition-all hover:scale-110 z-[110]"
        aria-label="Close fullscreen view"
      >
        <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      
      <div className="relative max-w-6xl max-h-[90vh] pointer-events-auto" onClick={(e) => e.stopPropagation()}>
        <Image
          src={fullscreenImage}
          alt="Fullscreen view"
          width={1200}
          height={900}
          className="object-contain max-h-[90vh] max-w-full rounded-lg"
          style={{ imageRendering: 'auto' }}
          priority={true}
        />
      </div>
    </div>
  );
};