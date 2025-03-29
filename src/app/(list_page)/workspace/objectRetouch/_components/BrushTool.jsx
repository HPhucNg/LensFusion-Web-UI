"use client";
import { useState, useRef, useEffect } from 'react';

const BrushTool = ({ 
  inputImage,
  onMaskCreated,
  initialSize = 25,
  initialColor = '#ffffff',
  maxWidth = 800,
  maxHeight = 600
}) => {
  const [brushColor] = useState(initialColor);
  const [brushSize, setBrushSize] = useState(initialSize);
  const [isDrawing, setIsDrawing] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [containerStyle, setContainerStyle] = useState({ width: '100%', height: 'auto'});
  
  const imageCanvasRef = useRef(null);
  const maskCanvasRef = useRef(null);
  const containerRef = useRef(null);
  
  useEffect(() => {
    const handleResize = () => {
      if (inputImage) {
        updateCanvasSize();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [inputImage]);

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
    if (!inputImage) return;
    
    const img = new Image();
    img.onload = () => {
      let availableWidth = 0;
      
      if (containerRef.current && containerRef.current.parentElement) {
        const parentWidth = containerRef.current.parentElement.clientWidth;
        availableWidth = parentWidth * 0.9;
      } else {
        availableWidth = Math.min(maxWidth, window.innerWidth * 0.85);
      }
      
      const availableHeight = Math.min(maxHeight, window.innerHeight * 0.5);
      
      const newSize = calculateAspectRatioFit(
        img.width,
        img.height,
        availableWidth,
        availableHeight
      );
      
      setCanvasSize(newSize);
      setContainerStyle({
        width: `${newSize.width}px`,
        height: `${newSize.height}px`,
        maxWidth: '100%'
      });
      
      //re-render the image on the canvas with new dimensions
      if (imageCanvasRef.current) {
        const ctx = imageCanvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, newSize.width, newSize.height);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, newSize.width, newSize.height);
      }
      
      //clear and resize the mask canvas
      if (maskCanvasRef.current) {
        const ctx = maskCanvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, newSize.width, newSize.height);
        ctx.fillStyle = 'rgba(0, 0, 0, 0)';
        ctx.fillRect(0, 0, newSize.width, newSize.height);
      }
    };
    img.src = inputImage;
  };
  
  //gets the image to resize when it is in brush mode
  useEffect(() => {
    if (inputImage) {
      updateCanvasSize();
    }
  }, [inputImage]);
  
  const startDrawing = (e) => {
    setIsDrawing(true);
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
    //cursor position on canvas
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    
    //brush properties
    ctx.fillStyle = brushColor;
    ctx.strokeStyle = brushColor;
    
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    
    ctx.beginPath();
    ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
    ctx.fill();
  };
  
  //removes all drawing (mask) from canvas 
  const clearMask = () => {
    if (maskCanvasRef.current) {
      const ctx = maskCanvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);
      
      //update to pass to callback function
      if (onMaskCreated) {
        const imageData = imageCanvasRef.current.toDataURL('image/png', 1.0);
        const emptyMask = maskCanvasRef.current.toDataURL('mask/png', 1.0);
        onMaskCreated({ imageData, maskData: emptyMask });
      }
    }
  };
  
  return (
    <div className="brush-tool-container w-full overflow-hidden">
      <div className="flex flex-col space-y-4">
        <div className="rounded-lg">
          <h3 className="text-lg font-semibold mb-3">Brush Tool</h3>
          <div className="mb-3">
            <label className="block text-sm mb-1">Brush Size: {brushSize}px</label>
            <input
              type="range"
              min="1"
              max="50"
              value={brushSize}
              onChange={(e) => setBrushSize(parseInt(e.target.value))}
              className="w-full"
            />
          </div>
          <button 
            onClick={clearMask}
            className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded-md text-white"
          >
            Clear Mask
          </button>
        </div>
        
        <div className="w-full flex justify-center">
          <div 
            ref={containerRef}
            className="relative rounded overflow-hidden" 
            style={containerStyle}
          >
            <canvas
              ref={imageCanvasRef}
              width={canvasSize.width}
              height={canvasSize.height}
              className="absolute top-0 left-0"
            />
            <canvas
              ref={maskCanvasRef}
              width={canvasSize.width}
              height={canvasSize.height}
              className="absolute top-0 left-0 cursor-pointer"
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
        </div>
      </div>
    </div>
  );
};

export default BrushTool;