"use client";
import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { setupCanvas, renderImage } from './CanvasSetup'

const BrushTool = forwardRef(({ 
  inputImage,
  onMaskCreated,
  initialSize = 25,
  initialColor = '#ffffff',
  maxWidth = 1000,
  maxHeight = 700,
  isEraser = false
},ref) => {
  const [brushColor] = useState(initialColor);
  const [brushSize, setBrushSize] = useState(initialSize);
  const [isDrawing, setIsDrawing] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 1000, height: 700 });
  const [isLoading, setIsLoading] = useState(false);
  const imageCanvasRef = useRef(null);
  const maskCanvasRef = useRef(null);
  const containerRef = useRef(null);
  const imageObjRef = useRef(null);
  const lastPositionRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    setBrushSize(initialSize);
  }, [initialSize]);

  //used with forwardRef - to clear the mask
  useImperativeHandle(ref, () => ({
    resetCanvas: () => clearMask()
  }));

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


  
  useEffect(() => {
    const handleResize = () => {
      if (inputImage && imageObjRef.current && !isLoading) {
        updateCanvasSize();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [inputImage, isLoading]);

  useEffect(() => {
    if (maskCanvasRef.current) {
      maskCanvasRef.current.style.cursor = isEraser ? 'pointer' : 'pointer';
    }
  }, [isEraser]);

  //scale image to fit
  const calculateAspectRatioFit = (oriWidth, oriHeight, maxWidth, maxHeight) => {
    //add a constraint to prevent too much zooming for smaller images
    if (oriWidth < maxWidth && oriHeight < maxHeight) {
      const scaleFactor = Math.min(1, 0.8 * Math.min(maxWidth / oriWidth, maxHeight / oriHeight));
      return { 
        width: Math.round(oriWidth * scaleFactor),
        height: Math.round(oriHeight * scaleFactor)
      };
    }
    
    const ratio = Math.min(maxWidth / oriWidth, maxHeight / oriHeight);
    return { 
      width: Math.round(oriWidth * ratio),
      height: Math.round(oriHeight * ratio)
    };
  };
  
  //function to update canvas size based on container and window size
  const updateCanvasSize = () => {
    if (!imageObjRef.current) return;
    
    const dimensions = setupCanvas(imageObjRef.current, containerRef.current, { maxWidth, maxHeight });
    if (renderImage(imageObjRef.current, dimensions, { imageCanvasRef, maskCanvasRef })) {
      setCanvasSize(dimensions);
    }
  };
  
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
  
  const startDrawing = (e) => {
    if (!maskCanvasRef.current) return;
    setIsDrawing(true);
    const canvas = maskCanvasRef.current;
    const coords = getCanvasCoordinates(e, canvas);
    lastPositionRef.current = coords;
    draw(e);
  };
  
  const stopDrawing = () => {
    setIsDrawing(false);
    //creates mask and image and saves as png file to pass to callback function
    if (imageCanvasRef.current && maskCanvasRef.current && onMaskCreated) {
      console.log("Creating mask data...");
      const imageData = imageCanvasRef.current.toDataURL('image/png', 1.0);
      const maskData = maskCanvasRef.current.toDataURL('image/png', 1.0);
      
      onMaskCreated({ imageData, maskData });
    } else {
      console.log("Missing required refs or callback:", {
        imageCanvasRef: !!imageCanvasRef.current,
        maskCanvasRef: !!maskCanvasRef.current,
        onMaskCreated: !!onMaskCreated
      });
    }
  };
  
  const draw = (e) => {
    if (!isDrawing || !maskCanvasRef.current) return;
    
    const canvas = maskCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const coords = getCanvasCoordinates(e, canvas);

    if (isEraser) {
      //eraser mode
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,0)';
    } else {
      //brush mode
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = brushColor;
    }
    //brush properties
    ctx.fillStyle = brushColor;
    ctx.strokeStyle = brushColor;
    
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    
    ctx.beginPath();
    ctx.arc(coords.x, coords.y, brushSize / 2, 0, Math.PI * 2);
    ctx.fill();
    lastPositionRef.current = coords;
  };
  
  //removes all drawing (mask) from canvas 
  const clearMask = () => {
    if (maskCanvasRef.current) {
      const ctx = maskCanvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);
      
      //update to pass to callback function
      if (onMaskCreated) {
        const imageData = imageCanvasRef.current.toDataURL('image/png', 1.0);
        const emptyMask = maskCanvasRef.current.toDataURL('image/png', 1.0);
        onMaskCreated({ imageData, maskData: emptyMask });
      }
    }
  };
  
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
        <div className="relative rounded-md overflow-hidden border-2 border-gray-700" style={{
          width: canvasSize.width + 'px',
          height: canvasSize.height + 'px',
          maxWidth: '100%',
          maxHeight: '100%'
        }}>
          <canvas
            ref={imageCanvasRef}
            className="absolute top-0 left-0 w-full h-full"
          />
          <canvas
            ref={maskCanvasRef}
            className="absolute top-0 left-0 w-full h-full cursor-pointer"
            onMouseDown={startDrawing}
            onTouchStart={startDrawing}
            onMouseMove={draw}
            onTouchMove={draw}
            onMouseUp={stopDrawing}
            onTouchEnd={stopDrawing}
            onMouseOut={stopDrawing}
            onTouchCancel={stopDrawing}
          />
        </div>
      )}
    </div>
  );
});


export default BrushTool;