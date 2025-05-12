import { useRef, useEffect, useState } from 'react';
import { FiMaximize2, FiTrash2 } from 'react-icons/fi';
import { FullscreenModal } from './FullscreenModal';

export default function ImageUploader({ handleImageUpload, originalImage, clearMask, setOriginalImage, canvasRef, maskCanvasRef, setIsCanvasHovered, isCanvasHovered, isDrawing, startDrawing, draw, stopDrawing, cursorPosition, brushSize, isEraser, setCursorPosition, resultImage }) {
  const originalFileInputRef = useRef(null);
  const containerRef = useRef(null);
  const canvasContainerRef = useRef(null);
  const [localCursorPosition, setLocalCursorPosition] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isResultFullscreen, setIsResultFullscreen] = useState(false);

  // Add effect to log when canvasRef changes
  useEffect(() => {
    if (canvasRef.current) {
      console.log('Canvas ref available in ImageUploader');
    }
  }, [canvasRef.current]);

  // Create a safe version of setCursorPosition
  const updateCursorPosition = (position) => {
    if (typeof setCursorPosition === 'function') {
      setCursorPosition(position);
    } else {
      console.log('Using local cursor position fallback');
      setLocalCursorPosition(position);
    }
  };

  // Function to view image in fullscreen
  const openFullscreen = () => {
    setIsFullscreen(true);
  };

  const closeFullscreen = () => {
    setIsFullscreen(false);
  };

  // Function to open result image in fullscreen
  const openResultFullscreen = () => {
    setIsResultFullscreen(true);
  };

  // Function to close result image fullscreen
  const closeResultFullscreen = () => {
    setIsResultFullscreen(false);
  };

  // Function to delete the uploaded image
  const deleteImage = () => {
    setOriginalImage(null);
    clearMask();
  };

  // Use either cursorPosition from props or local state
  const currentCursorPosition = typeof setCursorPosition === 'function' ? cursorPosition : localCursorPosition;

  return (
    <div className="w-full h-[450px] flex items-center justify-center relative" ref={containerRef}>
      {/* Action buttons */}
      {originalImage && (
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
            onClick={() => {
              setOriginalImage(null);
              clearMask();
              if (originalFileInputRef.current) originalFileInputRef.current.value = '';
            }}
            className="p-2 bg-gray-900/80 hover:bg-red-500/90 rounded-lg backdrop-blur-sm border border-gray-600/50 shadow-md transition-all"
            title="Remove image"
          >
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
      {/* Fullscreen Modal */}
      <FullscreenModal 
        isFullscreen={isFullscreen} 
        fullscreenImage={originalImage} 
        closeFullscreen={closeFullscreen} 
      />
      {/* Result Image Fullscreen Modal */}
      <FullscreenModal 
        isFullscreen={isResultFullscreen} 
        fullscreenImage={resultImage} 
        closeFullscreen={closeResultFullscreen} 
      />
      {originalImage ? (
        <div className="relative flex items-center justify-center" style={{ width: '100%', height: '100%', margin: 0, padding: 0 }}>
          <div className="relative" ref={canvasContainerRef} style={{ margin: 0, padding: 0, lineHeight: 0, overflow: 'hidden' }}>
            {/* Main image canvas */}
            <canvas 
              ref={canvasRef}
              style={{ 
                display: 'block',
                margin: 0,
                padding: 0
              }}
            />
            
            {/* Drawing canvas - absolutely positioned over main canvas */}
            <canvas 
              ref={maskCanvasRef}
              style={{ 
                position: 'absolute',
                top: 0,
                left: 0,
                cursor: 'none',
                pointerEvents: 'auto',
                display: 'block',
                margin: 0,
                padding: 0
              }}
              onMouseEnter={() => {
                setIsCanvasHovered(true);
              }}
              onMouseLeave={() => {
                if (!isDrawing) {
                  setIsCanvasHovered(false);
                }
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                const rect = e.target.getBoundingClientRect();
                
                // Get exact pixel position
                const x = Math.round(e.clientX - rect.left);
                const y = Math.round(e.clientY - rect.top);
                
                // Update cursor position first
                updateCursorPosition({ x, y });
                
                // Then start drawing at the same position
                startDrawing({
                  nativeEvent: {
                    offsetX: x,
                    offsetY: y
                  }
                });
              }}
              onMouseMove={(e) => {
                const rect = e.target.getBoundingClientRect();
                
                // Get exact pixel position
                const x = Math.round(e.clientX - rect.left);
                const y = Math.round(e.clientY - rect.top);
                
                // Update cursor position
                updateCursorPosition({ x, y });
                
                // Draw if actively drawing
                if (isDrawing) {
                  draw({
                    nativeEvent: {
                      offsetX: x,
                      offsetY: y
                    }
                  });
                }
              }}
              onMouseUp={stopDrawing}
            />
            
            {/* Custom cursor overlay */}
            {originalImage && (isCanvasHovered || isDrawing) && (
              <div 
                className="absolute pointer-events-none"
                style={{
                  position: 'absolute',
                  width: brushSize,
                  height: brushSize,
                  borderRadius: '50%',
                  left: currentCursorPosition.x - brushSize/2,
                  top: currentCursorPosition.y - brushSize/2,
                  border: `2px solid ${isEraser ? '#ff6666' : '#ffffff'}`,
                  backgroundColor: 'transparent',
                  boxShadow: '0 0 1px rgba(0,0,0,0.5)',
                  zIndex: 100
                }}
              />
            )}
          </div>
        </div>
      ) : (
        <label className="w-full h-full flex items-center justify-center cursor-pointer rounded-xl border-2 border-dashed  border-[var(--border-gray)] hover:border-blue-600 dark:hover:border-purple-900 transition-all duration-300">
          <div className="text-center p-6 space-y-4">
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                ref={originalFileInputRef}
              />
              <div className="flex flex-col items-center justify-center space-y-3">
                <svg 
                  className="w-16 h-16 text-blue-200 dark:text-white opacity-70  transition-transform duration-300" 
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
        </label>
      )}
      {/* Add button to open result image in fullscreen */}
      {resultImage && (
        <button
          onClick={openResultFullscreen}
          className="p-2 bg-gray-900/80 hover:bg-gray-700/90 rounded-lg backdrop-blur-sm border border-gray-600/50 shadow-md transition-all"
          title="View result fullscreen"
        >
          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>
      )}
    </div>
  );
} 