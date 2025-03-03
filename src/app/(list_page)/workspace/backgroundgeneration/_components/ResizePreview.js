"use client";

import { useRef, useState, useEffect } from 'react';

const ResizePreview = ({ originalDimensions, newDimensions }) => {
  //resizing state managements
  const previewContainerRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [containerSize, setContainerSize] = useState({ width: 300, height: 300 });
  
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

  return (
    <div ref={previewContainerRef} className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* New canvas background */}
      <div 
        className="absolute bg-gray-800 flex items-center justify-center"
        style={{
          width: newDimensions.width,
          height: newDimensions.height,
          transform: `scale(${scale})`,
          transition: 'all 0.3s ease'
        }}
      >
        {/* Original image indicator */}
        <div 
          className="absolute border-2 border-blue-500 bg-blue-500/10 flex items-center justify-center"
          style={{
            width: originalDimensions.width,
            height: originalDimensions.height,
            color: 'rgba(255,255,255,0.7)',
            fontSize: '10px'
          }}
        >
          Original image
        </div>
        
        {/* Dimensions indicator */}
        <div className="absolute bottom-2 right-2 text-xs text-gray-400 bg-gray-900/80 px-2 py-1 rounded">
          {newDimensions.width} × {newDimensions.height}
        </div>
      </div>
    </div>
  );
};

export default ResizePreview;