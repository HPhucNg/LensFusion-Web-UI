import React from 'react';
import Image from 'next/image';

const ViewModal = ({ 
  isOpen, 
  onClose, 
  imageSrc, 
  prompt,
  onUpscale,
  onRetouch,
  onInpaint,
  onExpand,
  onRemove,
  onRegenerate,
  onReprompt,
  onDownload
}) => {
  if (!isOpen) return null;

  // Handle backdrop click to close modal
  const handleBackdropClick = (e) => {
    // Close only if clicking directly on the backdrop, not on the modal content
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center overflow-hidden backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      {/* Close button */}
      <button 
        onClick={onClose}
        className="absolute top-6 left-6 z-10 p-2 rounded-full bg-gray-800/80 hover:bg-gray-700 transition-colors"
      >
        <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="flex w-full h-full md:w-11/12 md:h-5/6 max-w-7xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Image section */}
        <div className="flex-grow relative">
          {imageSrc ? (
            <div className="relative w-full h-full flex items-center justify-center">
              <Image
                src={imageSrc}
                alt="Generated image"
                fill
                className="object-contain"
                priority
              />
              
              {/* Download, bookmark buttons */}
              <div className="absolute top-6 right-6 flex gap-2">
                <button 
                  onClick={onDownload}
                  className="p-2 rounded-full bg-gray-800/80 hover:bg-gray-700 transition-colors"
                >
                  <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <p className="text-gray-400">No image available</p>
            </div>
          )}
        </div>

        {/* Info sidebar */}
        <div className="w-96 bg-gray-900/80 backdrop-blur-md border-l border-gray-800 p-6 overflow-y-auto">
          <div className="space-y-6">
            {/* Timestamp */}
            <div className="text-gray-400 text-sm">
              {new Date().toISOString().split('T')[0]} {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </div>
            
            {/* Image prompt section */}
            <div className="space-y-2">
              <h3 className="text-gray-400 text-sm">Image prompt</h3>
              <p className="text-gray-300 text-sm">{prompt || "No prompt information available"}</p>
              {prompt && (
                <div className="mt-2 flex items-center gap-1 text-blue-400 text-xs">
                  <span className="bg-blue-400/20 p-1 rounded">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </span>
                  <span>Referenced an object in the image</span>
                </div>
              )}
            </div>

            {/* Edit options section */}
            <div className="space-y-3">
              <h3 className="text-gray-300 font-medium text-sm">Edit</h3>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={onUpscale} 
                  className="flex items-center justify-center space-x-2 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 11l5-5m0 0l5 5m-5-5v12" />
                  </svg>
                  <span className="text-xs">Upscale</span>
                </button>
                
                <button 
                  onClick={onRetouch} 
                  className="flex items-center justify-center space-x-2 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  <span className="text-xs">Retouch</span>
                </button>
                
                <button 
                  onClick={onInpaint} 
                  className="flex items-center justify-center space-x-2 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="text-xs">Inpaint</span>
                </button>
                
                <button 
                  onClick={onExpand} 
                  className="flex items-center justify-center space-x-2 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                  <span className="text-xs">Expand</span>
                </button>
                
                <button 
                  onClick={onRemove} 
                  className="flex items-center justify-center space-x-2 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span className="text-xs">Remove</span>
                </button>
              </div>
            </div>

            {/* Generate options section */}
            <div className="space-y-3">
              <h3 className="text-gray-300 font-medium text-sm">Generate</h3>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={onRegenerate} 
                  className="flex items-center justify-center space-x-2 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span className="text-xs">Regenerate</span>
                </button>
                
                <button 
                  onClick={onReprompt} 
                  className="flex items-center justify-center space-x-2 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span className="text-xs">Reprompt</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewModal; 