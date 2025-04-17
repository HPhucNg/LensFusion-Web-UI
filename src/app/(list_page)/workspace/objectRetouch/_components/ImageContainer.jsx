import React from 'react';
import Image from 'next/image';

export const ImageContainer = ({ 
  imageSrc, 
  altText, 
  onClear, 
  onDownload, 
  onFullscreen, 
  uploadHandler,
  isInput,
}) => (
  <div className={`group relative flex-1 rounded-2xl shadow-xl ${isInput ? "hover:shadow-2xl transition-all duration-300" : ""}`}>
    <div className="h-full w-full flex flex-col items-center justify-center rounded-xl backdrop-blur-sm">
      {/* Image Container */}
      <div className="relative w-full h-[500px] flex items-center justify-center rounded-xl overflow-hidden bg-gray-800/30 px-4 py-4">
        <div className="w-full h-full flex items-center justify-center">
          {imageSrc ? (
            <div className="relative w-full h-full">
              <Image
                src={imageSrc}
                alt={altText}
                fill
                className={`object-contain transform transition-transform duration-300`}                style={{ imageRendering: 'auto' }}
              />
              
              {/* Overlay Controls */}
              <div className="absolute top-1 right-1 flex gap-2 z-50">
                {onFullscreen && (
                  <button
                    onClick={() => onFullscreen()}
                    className="p-2 bg-gray-900/80 hover:bg-gray-700/90 rounded-lg backdrop-blur-sm border border-gray-600/50 shadow-md transition-all hover:scale-110"
                    title="View fullscreen"
                  >
                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                  </button>
                )}
                {onClear && (
                  <button
                    onClick={() => onClear()}
                    className="p-2 bg-gray-900/80 hover:bg-red-500/90 rounded-lg backdrop-blur-sm border border-gray-600/50 shadow-md transition-all hover:scale-110"
                    title="Remove image"
                  >
                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
                {!isInput && onDownload && imageSrc && (
                  <button
                    onClick={() => onDownload()}
                    className="p-2 bg-gray-900/80 hover:bg-blue-500/90 rounded-lg backdrop-blur-sm border border-gray-600/50 shadow-md transition-all hover:scale-110"
                    title="Download image"
                  >
                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ) : (
          <div className="w-full h-full flex items-center justify-center">
            <label className={`w-full h-full flex items-center justify-center border-2 border-dashed border-gray-600 ${isInput ? "hover:border-purple-900 transition-all duration-300" : ""} rounded-lg`}>
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
                      className={`w-16 h-16 text-white/70 ${isInput ? "group-hover:scale-110 transition-transform duration-300" : ""}`}
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
                  className="w-16 h-16 text-white/70" 
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
            </div>
          )}
        </div>
      </div>
      <div className="h-[72px] w-full mt-4"></div>
    </div>
  </div>
);