import React, { useState } from 'react';
import Image from 'next/image';
import {
  BookOpen,
  Bot,
  Command,
  Frame,
  LifeBuoy,
  Map,
  PieChart,
  Send,
  Settings2,
  SquareTerminal,
  Image as ImageIcon,
  Eraser,
  Scissors,
  Expand,
  Trash2,
  ZoomIn,
  History,
  Clock,
  ChevronRight,
  Brush,
  Stars,
  PanelLeftClose,
  PanelLeft,
  MoreHorizontal,
  X
} from "lucide-react"
import RetouchModal from './RetouchModal';

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
  const [showRetouchModal, setShowRetouchModal] = useState(false);

  if (!isOpen) return null;

  // Handle backdrop click to close modal
  const handleBackdropClick = (e) => {
    // Close only if clicking directly on the backdrop, not on the modal content
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleRetouchClick = () => {
    setShowRetouchModal(true);
  };

  // Handler for retouched image update
  const handleRetouchedImage = (newImageUrl) => {
    console.log('ViewModal.handleRetouchedImage called with URL:', newImageUrl);
    
    // Update the image in the parent component
    if (onRetouch) {
      console.log('ViewModal calling onRetouch with:', newImageUrl);
      onRetouch(newImageUrl);
    }
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center overflow-hidden backdrop-blur-sm"
        onClick={handleBackdropClick}
      >
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-6 left-6 z-10 p-2 rounded-full bg-gray-800/80 hover:bg-gray-700 transition-colors"
        >
          <X className="w-6 h-6 text-white" />
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
            <div className="flex flex-col h-full">
              {/* Top content - Timestamp and Prompt */}
              <div className="space-y-6">
                {/* Timestamp */}
                <div className="text-gray-400 text-sm">
                  {new Date().toISOString().split('T')[0]} {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
                
                {/* Image prompt section */}
                <div className="space-y-2">
                  <h3 className="text-gray-400 text-sm">Image prompt</h3>
                  <p className="text-gray-300 text-sm">{prompt || "No prompt information available"}</p>
                </div>
              </div>
              
              {/* Bottom content - Edit and Generate options */}
              <div className="mt-auto pt-6">
                {/* Divider */}
                <div className="border-t border-gray-800 pt-4 mb-6"></div>
                
                {/* Edit options section */}
                <div className="space-y-3 mb-6">
                  <h3 className="text-gray-300 font-medium text-sm">Edit</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={onUpscale} 
                      className="flex items-center justify-center space-x-2 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <Stars className="w-4 h-4" />
                      <span className="text-xs">Upscale</span>
                    </button>
                    
                    <button 
                      onClick={handleRetouchClick} 
                      className="flex items-center justify-center space-x-2 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <Brush className="w-4 h-4" />
                      <span className="text-xs">Retouch</span>
                    </button>
                    
                    <button 
                      onClick={onExpand} 
                      className="flex items-center justify-center space-x-2 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <Expand className="w-4 h-4" />
                      <span className="text-xs">Expand</span>
                    </button>
                    
                    <button 
                      onClick={onRemove} 
                      className="flex items-center justify-center space-x-2 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <Eraser className="w-4 h-4" />
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
      </div>

      {/* Retouch Modal */}
      <RetouchModal 
        isOpen={showRetouchModal} 
        onClose={() => setShowRetouchModal(false)} 
        imageSrc={imageSrc}
        onImageUpdate={handleRetouchedImage}
      />
    </>
  );
};

export default ViewModal; 