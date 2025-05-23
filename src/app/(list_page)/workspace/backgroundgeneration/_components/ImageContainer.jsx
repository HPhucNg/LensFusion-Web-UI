import React, { useState } from 'react';
import Image from 'next/image';
import ViewModal from './ViewModal';

export const ImageContainer = ({ 
  imageSrc, 
  altText, 
  onClear, 
  onDownload, 
  onFullscreen, 
  uploadHandler,
  isInput,
  onResize,
  onSaveToGallery,
  onUpscale,
  onRetouch,
  onInpaint,
  onExpand,
  onRemove,
  onRegenerate,
  onReprompt,
  prompt,
  setImageSrc
}) => {
  const [showViewModal, setShowViewModal] = useState(false);
  
  const toggleViewModal = () => {
    setShowViewModal(!showViewModal);
  };

  const handleFullscreen = () => {
    if (onFullscreen) {
      onFullscreen();
    } else {
      toggleViewModal();
    }
  };

  // Handle retouched images coming back from retouch modal
  const handleRetouchedImage = (newImageUrl) => {
    console.log('ImageContainer.handleRetouchedImage called with URL:', newImageUrl);
    
    // Update the image in the parent component if setImageSrc is provided
    if (setImageSrc) {
      console.log('ImageContainer calling setImageSrc with:', newImageUrl);
      setImageSrc(newImageUrl);
    }
    
    // Also call the original onRetouch handler if provided
    if (onRetouch) {
      console.log('ImageContainer calling onRetouch with:', newImageUrl);
      onRetouch(newImageUrl);
    }
  };

  return (
    <>
      <div className="group relative flex-1 rounded-2xl p-1 shadow-xl hover:shadow-2xl transition-all duration-300">
        <div className="h-full w-full flex flex-col items-center justify-center rounded-xl backdrop-blur-sm">
          <div className="w-full h-[450px] md:h-[450px] flex items-center justify-center relative">
            {imageSrc ? (
              <div className="relative w-full h-full rounded-lg overflow-hidden">
                {/* Image container, clickable if it's an input image */}
                <div 
                  className={`relative w-full h-full ${isInput ? 'cursor-pointer' : 'cursor-pointer'}`} 
                  onClick={isInput && onResize ? onResize : !isInput ? handleFullscreen : undefined}
                  title={isInput ? "Click to resize image" : "Click to view fullscreen"}
                >
                  <Image
                    src={imageSrc}
                    alt={altText}
                    fill
                    unoptimized={imageSrc && (imageSrc.includes('firebasestorage.googleapis.com') || imageSrc.startsWith('data:'))}
                    className="object-contain p-4 transform transition-transform duration-300 group-hover:scale-105"
                    style={{ imageRendering: 'auto' }}
                  />
                </div>
                
                {/* Mobile Action Buttons - Always visible */}
                <div className="absolute top-3 right-3 flex gap-2 md:hidden">
                  <button
                    onClick={handleFullscreen}
                    className="p-2 bg-gray-900/80 rounded-lg backdrop-blur-sm border border-gray-600/50 shadow-md"
                    title="View fullscreen"
                  >
                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                  </button>
                  
                  {isInput ? (
                    <button
                      onClick={onClear}
                      className="p-2 bg-gray-900/80 rounded-lg backdrop-blur-sm border border-gray-600/50 shadow-md"
                      title="Remove image"
                    >
                      <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  ) : (
                    <button
                      onClick={onDownload}
                      className="p-2 bg-gray-900/80 rounded-lg backdrop-blur-sm border border-gray-600/50 shadow-md"
                      title="Download image"
                    >
                      <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </button>
                  )}
                </div>
                
                {/* Desktop Action Buttons - Visible on hover */}
                <div className="absolute top-3 right-3 hidden md:flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <button
                    onClick={handleFullscreen}
                    className="p-2 bg-gray-900/80 hover:bg-gray-700/90 rounded-lg backdrop-blur-sm border border-gray-600/50 shadow-md transition-all hover:scale-110"
                    title="View fullscreen"
                  >
                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                  </button>
                  
                  {isInput ? (
                    <button
                      onClick={onClear}
                      className="p-2 bg-gray-900/80 hover:bg-red-500/90 rounded-lg backdrop-blur-sm border border-gray-600/50 shadow-md transition-all hover:scale-110"
                      title="Remove image"
                    >
                      <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={onDownload}
                        className="p-2 bg-gray-900/80 hover:bg-blue-500/90 rounded-lg backdrop-blur-sm border border-gray-600/50 shadow-md transition-all hover:scale-110"
                        title="Download image"
                      >
                        <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <label className="w-full h-full flex items-center justify-center cursor-pointer rounded-xl border-2 border-dashed border-[var(--border-gray)] hover:border-blue-600 dark:hover:border-purple-900 transition-all duration-300">
                {isInput ? (
                  <div className="text-center p-6 space-y-4">
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={uploadHandler}
                        className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                      />
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <svg 
                          className="w-16 h-16 text-blue-200 dark:text-white opacity-70  group-hover:scale-110 transition-transform duration-300" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                        >
                          <path d="M12 13v8" />
                          <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
                          <path d="m8 17 4-4 4 4" />
                        </svg>
                        <p className="text-sm text-gray-400 font-medium">Drag & drop image<br/>or click to upload</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center space-y-4 text-white">
                    <svg 
                      className="w-16 h-16 text-blue-200 dark:text-white opacity-70 " 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    >
                      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                      <circle cx="9" cy="9" r="2" />
                      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                    </svg>
                    <p className="text-sm text-gray-400 font-medium">Generated Image</p>
                  </div>
                )}
              </label>
            )}
          </div>
        </div>
      </div>

      {/* View Modal for fullscreen and detailed view */}
      {!isInput && (
        <ViewModal
          isOpen={showViewModal}
          onClose={toggleViewModal}
          imageSrc={imageSrc}
          prompt={prompt}
          onUpscale={onUpscale}
          onRetouch={handleRetouchedImage}
          onInpaint={onInpaint}
          onExpand={onExpand}
          onRemove={onRemove}
          onRegenerate={onRegenerate}
          onReprompt={onReprompt}
          onDownload={onDownload}
        />
      )}
    </>
  );
};