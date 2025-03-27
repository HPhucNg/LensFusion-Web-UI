import { useState } from 'react';
import { FullscreenModal } from './FullscreenModal';

export default function ResultViewer({ 
  resultImage, 
  isProcessing, 
  onDownload, 
  onRegenerate 
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const openFullscreen = () => {
    setIsFullscreen(true);
  };

  const closeFullscreen = () => {
    setIsFullscreen(false);
  };

  return (
    <div className="w-full h-[450px] flex items-center justify-center relative border-2 border-dashed border-gray-600 hover:border-purple-500 transition-all duration-300 rounded-xl bg-gray-800/30">
      {/* Action buttons */}
      {resultImage && (
        <div className="absolute top-2 right-2 flex gap-2 z-40">
          <button
            onClick={openFullscreen}
            className="p-2 bg-gray-900/80 hover:bg-gray-700/90 rounded-lg backdrop-blur-sm border border-gray-600/50 shadow-md transition-all"
            title="View fullscreen"
          >
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
          <button
            onClick={onDownload}
            className="p-2 bg-gray-900/80 hover:bg-blue-500/90 rounded-lg backdrop-blur-sm border border-gray-600/50 shadow-md transition-all"
            title="Download image"
          >
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
        </div>
      )}

      {/* Fullscreen Modal */}
      <FullscreenModal 
        isFullscreen={isFullscreen} 
        fullscreenImage={resultImage} 
        closeFullscreen={closeFullscreen} 
      />

      <div className="relative w-full h-full flex items-center justify-center">
        {resultImage ? (
          <img 
            src={resultImage} 
            alt="Result" 
            className="max-w-full max-h-full object-contain"
          />
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
            <p className="text-sm text-gray-400 font-medium">Result Image</p>
          </div>
        )}
        {isProcessing && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="text-white text-lg">Processing...</div>
          </div>
        )}
      </div>
    </div>
  );
} 