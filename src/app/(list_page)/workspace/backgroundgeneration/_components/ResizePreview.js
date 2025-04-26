"use client";

import { useRef, useState, useEffect } from 'react';
import Image from 'next/image';

const ResizePreview = ({ originalDimensions, newDimensions, onPositionChange, scalePercentage = 1.0, imageSrc }) => {
  //resizing state managements
  const previewContainerRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [containerSize, setContainerSize] = useState({ width: 300, height: 300 });
  
  //image positioning by dragging the image in preview
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const positionInitialized = useRef(false);

  //used to track the size
  useEffect(() => {
    if (previewContainerRef.current) {
      const updateSize = () => {
        const container = previewContainerRef.current;
        setContainerSize({
          width: container.clientWidth,
          height: container.clientHeight
        });
      };
      updateSize();
      window.addEventListener('resize', updateSize);
      return () => window.removeEventListener('resize', updateSize);
    }
  }, []);
  
  //dynamically sclces the resizd image so it fit in the preview container.
  useEffect(() => {
    const widthScale = containerSize.width / newDimensions.width;
    const heightScale = containerSize.height / newDimensions.height;
    setScale(Math.min(widthScale, heightScale) * 0.9);
  }, [newDimensions, containerSize]);

  //center the image when user changes the canavs size
  useEffect(() => {
    if (!positionInitialized.current) {

      const scaledWidth = originalDimensions.width * scalePercentage;
      const scaledHeight = originalDimensions.height * scalePercentage;
      
      const x = (newDimensions.width - scaledWidth) / 2;
      const y = (newDimensions.height - scaledHeight) / 2;
      
      setImagePosition({ x, y });
      
      if (onPositionChange) {
        onPositionChange({ x, y });
      }
      
      positionInitialized.current = true;
    }
  }, [newDimensions, originalDimensions, scalePercentage, onPositionChange]);


  //resets the posiiton when there are any chnages to canvas (works together with top useEffect) 
  useEffect(() => {
    positionInitialized.current = false;
  }, [newDimensions.width, newDimensions.height, originalDimensions.width, originalDimensions.height,scalePercentage]);


  //allows user to drag the image on preview
  const handleMouseDown = (e) => {
    //this makes the resized image draggable
    e.preventDefault();
    setIsDragging(true);
    
    //This part makes the dragging smooth within canvas
    //note: getBoundingClientrRect() is expensive (can slow down performance,,)
    const rect = e.currentTarget.getBoundingClientRect();
    const scaleAdjustedX = (e.clientX - rect.left) / scale;
    const scaleAdjustedY = (e.clientY - rect.top) / scale;
    
    setDragStart({
      x: scaleAdjustedX - imagePosition.x,
      y: scaleAdjustedY - imagePosition.y
    });
  };

  const handleMouseMove = (e) => {
    //click and hold to drag (without thisit will just follow your curser)
    if (!isDragging) return;

    //note: getBoundingClientrRect() is expensive (can slow down performance,,)
    const rect = e.currentTarget.getBoundingClientRect();
    const scaleAdjustedX = (e.clientX - rect.left) / scale;
    const scaleAdjustedY = (e.clientY - rect.top) / scale;
    
    //gets the new position
    let newX = scaleAdjustedX - dragStart.x;
    let newY = scaleAdjustedY - dragStart.y;
    
    const scaledWidth = originalDimensions.width * scalePercentage;
    const scaledHeight = originalDimensions.height * scalePercentage;
    
    //keeps the image within canvas bounds
    newX = Math.max(0, Math.min(newDimensions.width - scaledWidth, newX));
    newY = Math.max(0, Math.min(newDimensions.height - scaledHeight, newY));
    
    //updates the new image position
    setImagePosition({ x: newX, y: newY });
    
    //moves the image to where the user chose to locate
    if (onPositionChange) {
      onPositionChange({ x: newX, y: newY });
    }
  };


  //lets go of the image when you are holding to position the image
  const handleMouseUp = () => {
    setIsDragging(false);
  };  

  //makes sure the image would not resize by it
  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  // Handle mouse wheel for resizing
  const handleWheel = (e) => {
    e.preventDefault();
    
    // Get scroll direction (-1 for up/zoom in, 1 for down/zoom out)
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    
    // Calculate new scale percentage (with limits)
    const newScalePercentage = Math.max(0.1, Math.min(1, scalePercentage + delta));
    
    // Pass the new scale to parent component
    if (onPositionChange) {
      const scaledWidth = originalDimensions.width * newScalePercentage;
      const scaledHeight = originalDimensions.height * newScalePercentage;
      
      const x = (newDimensions.width - scaledWidth) / 2;
      const y = (newDimensions.height - scaledHeight) / 2;
      
      setImagePosition({ x, y });
      onPositionChange({ x, y });
    }
    
    // This would be handled in the parent component which would update scalePercentage
    // The parent component needs to expose a callback function
    if (window.resizeCallbacks && window.resizeCallbacks.onScaleChange) {
      window.resizeCallbacks.onScaleChange(newScalePercentage);
    }
  };

  return (
    <div 
      ref={previewContainerRef} 
      className="relative w-full h-full flex items-center justify-center overflow-hidden"
    >
      {/* New canvas background */}
      <div 
        className="absolute bg-gray-800 flex items-center justify-center"
        style={{
          width: newDimensions.width,
          height: newDimensions.height,
          transform: `scale(${scale})`,
          transition: isDragging ? 'none' : 'all 0.3s ease',
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onWheel={handleWheel}
      >
        {/* Original image with actual image */}
        <div 
          className={`absolute ${isDragging ? 'border-purple-500' : 'border-blue-500'} flex items-center justify-center overflow-hidden`}
          style={{
            width: originalDimensions.width * scalePercentage,
            height: originalDimensions.height * scalePercentage,
            left: imagePosition.x,
            top: imagePosition.y,
          }}
        >
          {imageSrc ? (
            <div className="relative w-full h-full">
              <Image
                src={imageSrc}
                alt="Preview"
                fill
                className="object-contain"
                style={{ imageRendering: 'auto' }}
              />
            </div>
          ) : (
            <div className="w-full h-full bg-blue-500/10 border-2 border-dashed flex items-center justify-center">
              <span className="text-white/70 text-lg">Upload Image</span>
            </div>
          )}
        </div>
        
        {/* Dimensions indicator */}
        <div className="absolute bottom-2 right-2 text-xs text-gray-400 bg-gray-900/80 px-2 py-1 rounded">
          {newDimensions.width} × {newDimensions.height}
        </div>
        
        {/* Mouse wheel hint */}
        <div className="absolute top-2 right-2 text-xs text-gray-400 bg-gray-900/80 px-2 py-1 rounded opacity-70">
          <span>Use mouse wheel to resize</span>
        </div>
      </div>
    </div>
  );
};

//default valuee of onPositionChange just incase no changes made
ResizePreview.defaultProps = {
  onPositionChange: () => {},
  imageSrc: null
};

export default ResizePreview;