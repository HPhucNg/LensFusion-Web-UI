"use client";
import { useState, useRef, useEffect, useCallback } from 'react';
import { setupCanvas, renderImage } from './CanvasSetup';

export default function BrushTool({ inputImage, onMaskCreated, initialSize, initialColor, maxWidth, maxHeight, isEraser, onReady
}) {
  const [brushSize, setBrushSize] = useState(initialSize);
  const [isDrawing, setIsDrawing] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [isLoading, setIsLoading] = useState(false);

  const [maskImageSrc, setMaskImageSrc] = useState(null);
  const [isCanvasHovered, setIsCanvasHovered] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });

  const imageCanvasRef = useRef(null);
  const maskCanvasRef = useRef(null);
  const containerRef = useRef(null);
  const imageObjRef = useRef(null);
  const lastPositionRef = useRef({ x: 0, y: 0 });

  // keeps track of brush size changes
  useEffect(() => {
    setBrushSize(initialSize);
  }, [initialSize]);

  //loads and render of an image 
  useEffect(() => {
    if (!inputImage) return;
    
    setIsLoading(true);
    const img = new Image();
    
    img.onload = () => {
      imageObjRef.current = img;
      const dimensions = setupCanvas(img, containerRef.current, { maxWidth, maxHeight });
      
      if (renderImage(img, dimensions, { imageCanvasRef, maskCanvasRef })) {
        setCanvasSize(dimensions);
        setIsLoading(false);
      }
    };
    
    img.onerror = () => {
      console.error("Failed to load image");
      setIsLoading(false);
    };
    
    img.src = inputImage;
  }, [inputImage, maxWidth, maxHeight]);

  const getCanvasCoordinates = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    
    if (e.type.includes('touch')) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height)
    };
  }; 

  useEffect(() => {
    const handleMouseUp = () => {
      if (isDrawing) {
        stopDrawing();
      }
    };

    const handleMouseMove = (e) => {
      if (isDrawing && maskCanvasRef.current) {
        const coords = getCanvasCoordinates(e, maskCanvasRef.current);
        
        const boundedCoords = {
          x: Math.min(Math.max(0, coords.x), canvasSize.width),
          y: Math.min(Math.max(0, coords.y), canvasSize.height)
        };
        
        setCursorPosition(boundedCoords);
        
        const drawEvent = {
          clientX: e.clientX,
          clientY: e.clientY,
          type: e.type
        };
        
        draw(drawEvent);
      }
    };

    if (isDrawing) {
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isDrawing, canvasSize.width, canvasSize.height]);

  
  //function to update canvas size based on container and window size
  const updateCanvasSize = useCallback(() => {
  if (!imageObjRef.current) return;
  
  const dimensions = setupCanvas(imageObjRef.current, containerRef.current, { maxWidth, maxHeight });
  if (renderImage(imageObjRef.current, dimensions, { imageCanvasRef, maskCanvasRef })) {
    setCanvasSize(dimensions);
    
    if (!isDrawing && maskCanvasRef.current && maskImageSrc) {
      const ctx = maskCanvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);
    }
  }
  }, [maxWidth, maxHeight, isDrawing, maskImageSrc]);

  // handeling canvas resize
  useEffect(() => {
    const handleResize = () => {
      if (inputImage && imageObjRef.current && !isLoading) {
        updateCanvasSize();
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [inputImage, isLoading, updateCanvasSize]);
    
  
  const startDrawing = (e) => {
    if (!maskCanvasRef.current) return;
    
    if (maskImageSrc && !isDrawing) {
      const ctx = maskCanvasRef.current.getContext('2d');

      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);

      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);
        
        continueDrawing(e);
      };
      img.src = maskImageSrc;
    } else {
      continueDrawing(e);
    }
  };
  
  const continueDrawing = (e) => {
    setIsDrawing(true);
    const canvas = maskCanvasRef.current;
    const coords = getCanvasCoordinates(e, canvas);
    lastPositionRef.current = coords;
  
    const ctx = canvas.getContext('2d');
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  
    if (isEraser) {
      ctx.globalCompositeOperation = 'destination-out';
    } else {
      ctx.globalCompositeOperation = 'source-over';
    }
  
    ctx.beginPath();
    ctx.arc(coords.x, coords.y, brushSize / 2, 0, 2 * Math.PI);
  
    ctx.fillStyle = initialColor;
    ctx.fill();  
  
    draw(e);
  };
  
  const stopDrawing = () => {
    setIsDrawing(false);
    //creates mask and image and saves as png url to pass to callback function
    if (imageCanvasRef.current && maskCanvasRef.current && onMaskCreated) {
      const imageData = imageCanvasRef.current.toDataURL('image/png', 1.0);
      const maskData = maskCanvasRef.current.toDataURL('image/png', 1.0);
      
      setMaskImageSrc(maskData);
      onMaskCreated({ imageData, maskData });
    }
  };
  
  const draw = (e) => {
    if (!isDrawing || !maskCanvasRef.current) return;
    
    const canvas = maskCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const coords = getCanvasCoordinates(e, canvas);

    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (isEraser) {
      //eraser mode
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
    } else {
      //brush mode
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = initialColor;
    }
    
    ctx.beginPath();
    ctx.moveTo(lastPositionRef.current.x, lastPositionRef.current.y);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
    lastPositionRef.current = coords;
  };
  
  //removes all drawing (mask) from canvas 
  const clearMask = useCallback(() => {
    if (maskCanvasRef.current) {
      const ctx = maskCanvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);
      
      setMaskImageSrc(null);
      return true;
    }
    return false;
  }, [canvasSize.width, canvasSize.height]);

  useEffect(() => {
    if (onReady) {
      onReady({
        resetCanvas: clearMask
      });
    }
  }, [onReady, clearMask]);

  return (
    <div className="brush-tool-container w-full h-full flex justify-center items-center" ref={containerRef}>
      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p>Loading...</p>
          </div>
        </div>
      ) : (
      <div
        className="relative w-full flex items-center justify-center rounded-lg overflow-hidden "
      >
      {inputImage ? (
        <div
          className="relative flex items-center justify-center"
          style={{
            width: canvasSize.width + 'px',
            height: canvasSize.height + 'px',
            maxWidth: '100%',
            maxHeight: '100%',
          }}
        >
          <canvas
            ref={imageCanvasRef}
            className="absolute top-0 left-0 w-full h-full"
          />
          <canvas
            ref={maskCanvasRef}
            className="absolute top-0 left-0 w-full h-full"
            onMouseEnter={() => setIsCanvasHovered(true)}
            onMouseLeave={() => {
              if (!isDrawing) {
                setIsCanvasHovered(false);
              }
            }}
            onMouseMove={(e) => {
              if (maskCanvasRef.current) {
                const coords = getCanvasCoordinates(e, maskCanvasRef.current);
                setCursorPosition(coords);
              }
            }}
            onMouseDown={startDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onMouseUp={stopDrawing}
            onTouchEnd={stopDrawing}
            onTouchCancel={stopDrawing}
          />
          
          {maskImageSrc && !isDrawing && (
            <img 
              src={maskImageSrc}
              className="absolute top-0 left-0 w-full h-full pointer-events-none"
              alt="Mask overlay"
            />
          )}

          {(isCanvasHovered || isDrawing) && (
            <div
              className="absolute pointer-events-none"
              style={{
                width: brushSize,
                height: brushSize,
                borderRadius: '50%',
                left: cursorPosition.x - brushSize/2,
                top: cursorPosition.y - brushSize/2,
                border: `2px solid ${isEraser ? '#ff6666' : '#ffffff'}`,
                backgroundColor: isEraser ? 'rgba(255, 102, 102, 0.15)' : 'rgba(255, 255, 255, 0.15)', 
                boxShadow: isEraser ? '0 0 1px 1px rgba(0, 0, 0, 0.2)' : '0 0 1px 1px rgba(0, 0, 0, 0.7)',
                zIndex: 100
              }}
            />
          )}
        </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <label className="w-full h-full flex items-center justify-center cursor-pointer border-2 border-dashed border-gray-600 hover:border-purple-900 transition-all duration-300 rounded-lg">
                <div className="text-center p-6 space-y-4">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <svg 
                      className="w-16 h-16 text-white/70 group-hover:scale-110 transition-transform duration-300" 
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
              </label>
            </div>
          )}
        </div>
      )}
    </div>
  );
}