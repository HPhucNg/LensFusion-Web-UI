'use client';

import { useState, useRef, useEffect } from 'react';
import { removeObjectFromImage } from '@/lib/huggingface/objectRemovalClient';
import { FiEdit2, FiX } from 'react-icons/fi';

export default function ObjectRemovalUI() {
  const [uploadLoading, setUploadLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [originalImage, setOriginalImage] = useState(null);
  const [brushSize, setBrushSize] = useState(20);
  const [isDrawing, setIsDrawing] = useState(false);
  const [resultImage, setResultImage] = useState(null);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [isEraser, setIsEraser] = useState(false);
  const [paddingMetadata, setPaddingMetadata] = useState(null);
  const [originalDimensions, setOriginalDimensions] = useState(null);
  const [resultDimensions, setResultDimensions] = useState(null);
  
  const [paddedDebugImage, setPaddedDebugImage] = useState(null);
  const [paddedDebugMask, setPaddedDebugMask] = useState(null);
  const [showDebug, setShowDebug] = useState(true);
  
  const [isCanvasHovered, setIsCanvasHovered] = useState(false);
  
  const originalFileInputRef = useRef(null);
  const imageContainerRef = useRef(null);
  const canvasRef = useRef(null);
  const maskCanvasRef = useRef(null);
  const contextRef = useRef(null);
  const imageRef = useRef(null);
  const resultImageRef = useRef(null);

  // Set up the canvas when original image is loaded
  useEffect(() => {
    if (originalImage && canvasRef.current && maskCanvasRef.current && imageContainerRef.current) {
      console.log("Original image changed, setting up canvas");
      const img = new Image();
      
      img.onload = async () => {
        imageRef.current = img; // Store the image reference
        const originalWidth = img.width;
        const originalHeight = img.height;
        console.log("Original image dimensions:", { width: originalWidth, height: originalHeight });
        setOriginalDimensions({ width: originalWidth, height: originalHeight });
        
        // Get container dimensions
        const container = imageContainerRef.current;
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        console.log("Container dimensions:", { width: containerWidth, height: containerHeight });
        
        // Calculate scale to fit image within container while preserving aspect ratio
        const scaleWidth = containerWidth / img.width;
        const scaleHeight = containerHeight / img.height;
        const scale = Math.min(scaleWidth, scaleHeight, 1); // Don't scale up, only down
        console.log("Calculated scale factor:", scale);
        
        // Calculate new dimensions
        const width = Math.floor(img.width * scale);
        const height = Math.floor(img.height * scale);
        console.log("Scaled image dimensions:", { width, height });
        
        // Set canvas dimensions
        const canvas = canvasRef.current;
        const maskCanvas = maskCanvasRef.current;
        canvas.width = width;
        canvas.height = height;
        maskCanvas.width = width;
        maskCanvas.height = height;
        
        // Draw the image
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        console.log("Image drawn to canvas");
        
        // Set up mask canvas
        const maskCtx = maskCanvas.getContext('2d', { alpha: true });
        maskCtx.clearRect(0, 0, width, height);
        maskCtx.lineJoin = 'round';
        maskCtx.lineCap = 'round';
        maskCtx.strokeStyle = 'black';
        maskCtx.fillStyle = 'black';
        maskCtx.globalCompositeOperation = 'source-over'; // Default to drawing mode
        contextRef.current = maskCtx;
        
        // Calculate padding metadata for 1:1 ratio
        const metadata = calculatePaddingMetadata(originalWidth, originalHeight);
        setPaddingMetadata(metadata);
        console.log("Calculated padding metadata:", metadata);
      };
      
      img.src = originalImage;
    }
  }, [originalImage]);

  // Helper function to calculate padding for 1:1 aspect ratio
  const calculatePaddingMetadata = (width, height) => {
    // Determine the target size (the larger dimension)
    const maxDimension = Math.max(width, height);
    
    // Calculate padding
    let paddingLeft = 0;
    let paddingTop = 0;
    let paddingRight = 0;
    let paddingBottom = 0;
    
    if (width < height) {
      // Portrait image - add padding on left and right
      const totalWidthPadding = height - width;
      paddingLeft = Math.floor(totalWidthPadding / 2);
      paddingRight = totalWidthPadding - paddingLeft; // Handle odd padding
    } else if (width > height) {
      // Landscape image - add padding on top and bottom
      const totalHeightPadding = width - height;
      paddingTop = Math.floor(totalHeightPadding / 2);
      paddingBottom = totalHeightPadding - paddingTop; // Handle odd padding
    }
    
    return {
      originalWidth: width,
      originalHeight: height,
      paddingLeft,
      paddingTop,
      paddingRight,
      paddingBottom,
      paddingLeftPercent: (paddingLeft / maxDimension) * 100,
      paddingTopPercent: (paddingTop / maxDimension) * 100,
      paddingRightPercent: (paddingRight / maxDimension) * 100,
      paddingBottomPercent: (paddingBottom / maxDimension) * 100,
      squareSize: maxDimension
    };
  };

  // Function to pad image to square 1:1 ratio
  const padImageToSquare = (imageDataUrl, metadata) => {
    return new Promise((resolve, reject) => {
      console.log("Starting to pad image to square");
      const img = new Image();
      img.onload = () => {
        console.log("Image loaded for padding, dimensions:", { width: img.width, height: img.height });
        const { originalWidth, originalHeight, paddingLeft, paddingTop, squareSize } = metadata;
        console.log("Using padding metadata:", { originalWidth, originalHeight, paddingLeft, paddingTop, squareSize });
        
        // Create a square canvas
        const canvas = document.createElement('canvas');
        canvas.width = squareSize;
        canvas.height = squareSize;
        console.log("Created square canvas with dimensions:", { width: squareSize, height: squareSize });
        
        // Get the canvas context
        const ctx = canvas.getContext('2d');
        
        // Fill with black background
        ctx.fillStyle = 'rgb(0, 0, 0)';
        ctx.fillRect(0, 0, squareSize, squareSize);
        
        // Draw the image in the center with padding
        ctx.drawImage(
          img, 
          0, 0, originalWidth, originalHeight,
          paddingLeft, paddingTop, originalWidth, originalHeight
        );
        console.log("Image drawn to square canvas with padding");
        
        // Convert back to data URL
        const paddedImageDataUrl = canvas.toDataURL('image/png');
        console.log("Padded image data URL generated");
        
        // Save padded image for debug display
        if (imageDataUrl === originalImage) {
          setPaddedDebugImage(paddedImageDataUrl);
        }
        
        resolve(paddedImageDataUrl);
      };
      
      img.onerror = (error) => {
        console.error("Error loading image for padding:", error);
        reject(new Error('Failed to load image for padding'));
      };
      img.src = imageDataUrl;
    });
  };

  // Function to pad mask to square with same dimensions
  const padMaskToSquare = async (metadata) => {
    console.log("Starting to pad mask to square");
    if (!maskCanvasRef.current) {
      console.error("Mask canvas ref is null");
      return null;
    }
    
    // Check if mask has any content
    const maskCtx = maskCanvasRef.current.getContext('2d');
    const imageData = maskCtx.getImageData(
      0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height
    );
    
    // Check if there are any non-transparent pixels
    let hasContent = false;
    for (let i = 3; i < imageData.data.length; i += 4) {
      if (imageData.data[i] > 0) {
        hasContent = true;
        break;
      }
    }
    
    if (!hasContent) {
      console.warn("Mask is empty - no content to pad");
      return null; // Return null if mask is empty
    }
    
    // Get the mask from canvas - make sure we're at original scale
    const maskImage = maskCanvasRef.current.toDataURL('image/png');
    console.log("Original mask image data URL generated");
    
    // Create a square canvas with transparent background for the mask
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const { originalWidth, originalHeight, paddingLeft, paddingTop, squareSize } = metadata;
        
        // Create a square canvas
        const canvas = document.createElement('canvas');
        canvas.width = squareSize;
        canvas.height = squareSize;
        
        // Get the canvas context and ensure transparency
        const ctx = canvas.getContext('2d', { alpha: true });
        ctx.clearRect(0, 0, squareSize, squareSize); // This creates a transparent background
        
        // Draw the mask in the center with padding
        ctx.drawImage(
          img, 
          0, 0, originalWidth * (maskCanvasRef.current.width / originalDimensions.width), 
          originalHeight * (maskCanvasRef.current.height / originalDimensions.height),
          paddingLeft, paddingTop, originalWidth, originalHeight
        );
        console.log("Mask drawn to square canvas with padding");
        
        // Convert back to data URL with transparency
        const paddedMaskDataUrl = canvas.toDataURL('image/png');
        console.log("Padded mask data URL generated");
        
        // Save padded mask for debug display
        setPaddedDebugMask(paddedMaskDataUrl);
        
        resolve(paddedMaskDataUrl);
      };
      
      img.onerror = (error) => {
        console.error("Error loading mask for padding:", error);
        resolve(null);
      };
      
      img.src = maskImage;
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadLoading(true);
    try {
      const dataUrl = await readFileAsDataURL(file);
      setOriginalImage(dataUrl);
      setResultImage(null);
      setResultDimensions(null);
      setPaddedDebugImage(null);
      setPaddedDebugMask(null);
      
      if (maskCanvasRef.current) {
        const maskCtx = maskCanvasRef.current.getContext('2d');
        maskCtx.clearRect(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);
      }
    } catch (error) {
      console.error('Error reading file:', error);
      alert('Failed to read image file');
    } finally {
      setUploadLoading(false);
    }
  };

  const readFileAsDataURL = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  // Drawing functions 
  const startDrawing = ({nativeEvent}) => {
    if (!contextRef.current) return;
    
    const {offsetX, offsetY} = nativeEvent;
    
    // Set composite operation based on mode
    contextRef.current.globalCompositeOperation = isEraser ? 'destination-out' : 'source-over';
    
    contextRef.current.beginPath();
    contextRef.current.lineWidth = brushSize;
    
    // Draw a dot at the starting point
    contextRef.current.beginPath();
    contextRef.current.arc(offsetX, offsetY, brushSize/2, 0, Math.PI * 2);
    contextRef.current.fill();
    
    setIsDrawing(true);
    
    // Make sure cursor remains visible during drawing operation
    document.body.style.cursor = 'none';
    
    // Add mouse event listeners to the window to track cursor outside canvas
    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
  };

  const draw = ({nativeEvent}) => {
    if (!isDrawing || !contextRef.current) return;
    
    const {offsetX, offsetY} = nativeEvent;
    
    contextRef.current.beginPath();
    contextRef.current.arc(offsetX, offsetY, brushSize/2, 0, Math.PI * 2);
    contextRef.current.fill();
    
    contextRef.current.beginPath();
    contextRef.current.moveTo(offsetX - 1, offsetY - 1);
    contextRef.current.lineTo(offsetX, offsetY);
    contextRef.current.lineWidth = brushSize;
    contextRef.current.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    
    // Restore default cursor
    document.body.style.cursor = '';
    
    // Remove global event listeners
    window.removeEventListener('mousemove', handleGlobalMouseMove);
    window.removeEventListener('mouseup', handleGlobalMouseUp);
  };

  const updateCursorPosition = ({nativeEvent}) => {
    if (isDrawing) return;
    
    const {offsetX, offsetY} = nativeEvent;
    setCursorPosition({ x: offsetX, y: offsetY });
  };

  // Clear mask
  const clearMask = () => {
    if (maskCanvasRef.current) {
      const maskCtx = maskCanvasRef.current.getContext('2d');
      maskCtx.clearRect(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);
    }
  };

  const handleRemoveObject = async () => {
    if (!originalImage) {
      alert('Please upload an image first');
      return;
    }
    
    if (!paddingMetadata) {
      alert('Image metadata not ready. Please try again.');
      return;
    }
    
    console.log("Starting remove object process");
    console.log("Current padding metadata:", paddingMetadata);
    
    // Get padded mask with transparency
    const paddedMask = await padMaskToSquare(paddingMetadata);
    if (!paddedMask) {
      alert('Please draw the areas you want to remove');
      return;
    }

    setProcessing(true);
    try {
      console.log("Preparing to send request to API");
      
      // Step 1: Pad the original image to square
      const paddedImageDataUrl = await padImageToSquare(originalImage, paddingMetadata);
      console.log("Original image padded to square");
      
      // Step 2: Send padded images to API
      const imageData = {
        background: paddedImageDataUrl,
        layers: [paddedMask],
        composite: paddedImageDataUrl,
      };
      
      console.log("Prepared image data for API");

      // Always use random seed
      const randomSeed = Math.floor(Math.random() * 1000000);
      console.log("Generated random seed:", randomSeed);
      
      // Fixed parameters with random seed
      const settings = {
        rm_guidance_scale: 9,
        num_inference_steps: 50,
        seed: randomSeed,
        strength: 0.8,
        similarity_suppression_steps: 9,
        similarity_suppression_scale: 0.3,
      };
      console.log("Using settings:", settings);

      console.log("Sending request to API");
      const result = await removeObjectFromImage(imageData, settings);
      console.log("Received result from API");
      
      if (result) {
        // Create an image element to load the result
        const img = new Image();
        img.onload = () => {
          console.log("Result image loaded with dimensions:", { width: img.width, height: img.height });
          
          // Get the original dimensions and padding information
          const { originalWidth, originalHeight, paddingLeft, paddingTop, squareSize } = paddingMetadata;
          console.log("Using padding metadata for cropping:", { originalWidth, originalHeight, paddingLeft, paddingTop, squareSize });
          
          // Create a canvas with the original dimensions
          const canvas = document.createElement('canvas');
          canvas.width = originalWidth;
          canvas.height = originalHeight;
          const ctx = canvas.getContext('2d');
          
          // Calculate scaling factor if the returned image size differs from our padded size
          const scale = img.width / squareSize;
          console.log("Scale factor for cropping:", scale);
          
          // Adjust padding based on scale
          const scaledPaddingLeft = paddingLeft * scale;
          const scaledPaddingTop = paddingTop * scale;
          const scaledOriginalWidth = originalWidth * scale;
          const scaledOriginalHeight = originalHeight * scale;
          
          // Draw the image onto the canvas, cropping the padding
          ctx.drawImage(
            img,
            scaledPaddingLeft, scaledPaddingTop, scaledOriginalWidth, scaledOriginalHeight,
            0, 0, originalWidth, originalHeight
          );
          
          // Convert the cropped image back to a data URL
          const croppedDataUrl = canvas.toDataURL('image/png');
          setResultImage(croppedDataUrl);
          setResultDimensions({ width: originalWidth, height: originalHeight });
          console.log("Cropped result image dimensions:", { width: originalWidth, height: originalHeight });
        };
        img.onerror = (err) => {
          console.error("Error loading result image:", err);
          alert("Failed to load result image from the API");
        };
        img.src = result;
      } else {
        console.error("No result data received from API");
        alert("No result data received from the API");
      }
    } catch (error) {
      console.error('Error removing object:', error);
      alert('Failed to remove object: ' + (error.message || 'Unknown error'));
    } finally {
      setProcessing(false);
      console.log("Process completed");
    }
  };

  // Function to download the result image
  const downloadResult = () => {
    if (!resultImage) return;
    
    const link = document.createElement('a');
    link.href = resultImage;
    link.download = `object-removed-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Function to view image in fullscreen
  const viewFullscreen = (imgSrc) => {
    if (!imgSrc) return;
    
    const win = window.open();
    win.document.write(`
      <html>
        <head>
          <title>Full Image</title>
          <style>
            body { margin: 0; background: #000; height: 100vh; display: flex; align-items: center; justify-content: center; }
            img { max-width: 100%; max-height: 100%; object-fit: contain; }
          </style>
        </head>
        <body>
          <img src="${imgSrc}" alt="Full size image" />
        </body>
      </html>
    `);
  };

  // Add these new handler functions
  const handleGlobalMouseMove = (e) => {
    if (!isDrawing || !maskCanvasRef.current) return;
    
    // Get canvas position
    const rect = maskCanvasRef.current.getBoundingClientRect();
    
    // Calculate position relative to canvas
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Update cursor position for display
    setCursorPosition({ x, y });
    
    // Only draw if within canvas bounds
    if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
      draw({
        nativeEvent: {
          offsetX: x,
          offsetY: y
        }
      });
    }
  };

  const handleGlobalMouseUp = () => {
    stopDrawing();
  };

  // Add cleanup on component unmount
  useEffect(() => {
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      document.body.style.cursor = '';
    };
  }, []);

  return (
    <div className="w-full p-6 bg-gradient-to-br from-gray-900 to-black text-white min-h-screen">
      <h1 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-500">
        AI Object Remover
      </h1>
      
      <div className="mb-6 flex items-center flex-wrap gap-3">
        <div className="flex items-center gap-3">
          {/* Drawing mode selector */}
          <div className="flex border border-gray-700 rounded-lg overflow-hidden">
            <button
              onClick={() => setIsEraser(false)}
              className={`px-3 py-2 flex items-center gap-1.5 ${!isEraser ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 19l7-7 3 3-7 7-3-3z"></path>
                <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path>
                <path d="M2 2l7.586 7.586"></path>
                <circle cx="11" cy="11" r="2"></circle>
              </svg>
              Brush
            </button>
            <button
              onClick={() => setIsEraser(true)}
              className={`px-3 py-2 flex items-center gap-1.5 ${isEraser ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 20H7L3 16a1 1 0 0 1 0-1.41l9.59-9.59a2 2 0 0 1 2.82 0L21 10.59a2 2 0 0 1 0 2.82L16 18"></path>
              </svg>
              Eraser
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-white/80">Size:</span>
            <input 
              type="range" 
              min="5" 
              max="50" 
              value={brushSize}
              onChange={(e) => setBrushSize(parseInt(e.target.value))}
              className="w-32 accent-purple-500" 
            />
            <span className="text-sm bg-gray-800 px-2 py-0.5 rounded">{brushSize}px</span>
          </div>
        </div>
        
        <div className="flex gap-3 ml-auto">
          <button 
            onClick={clearMask}
            disabled={!originalImage}
            className={`px-3 py-2 rounded-lg text-sm ${originalImage ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-800 opacity-50 cursor-not-allowed'} transition-all duration-300`}
          >
            Clear Mask
          </button>
          <button 
            onClick={handleRemoveObject}
            disabled={processing || !originalImage || uploadLoading}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300
              ${processing || !originalImage || uploadLoading
                ? 'bg-gray-800 opacity-50 cursor-not-allowed' 
                : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500'
              }`}
          >
            {processing ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : "Remove Object"}
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="bg-gray-800/30 rounded-2xl overflow-hidden shadow-xl relative">
          {/* Action Buttons - positioned at the top-right corner OUTSIDE the image area */}
          {originalImage && (
            <div className="absolute top-2 right-2 flex gap-2 z-40">
              <button
                onClick={() => viewFullscreen(originalImage)}
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
          
          <div className="w-full h-[500px] flex items-center justify-center p-4" ref={imageContainerRef}>
            {originalImage ? (
              <div className="relative max-w-full max-h-full">
                <div className="relative">
                  <canvas 
                    ref={canvasRef}
                    className="z-0"
                    style={{ display: 'block' }}
                  />
                  
                  {/* Drawing canvas */}
                  <canvas 
                    ref={maskCanvasRef}
                    className="absolute top-0 left-0 z-10"
                    style={{ 
                      cursor: 'none',
                      pointerEvents: 'auto'
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
                      const rect = e.target.getBoundingClientRect();
                      const x = e.clientX - rect.left;
                      const y = e.clientY - rect.top;
                      
                      startDrawing({
                        nativeEvent: {
                          offsetX: x,
                          offsetY: y
                        }
                      });
                    }}
                    onMouseMove={(e) => {
                      const rect = e.target.getBoundingClientRect();
                      const x = e.clientX - rect.left;
                      const y = e.clientY - rect.top;
                      
                      // Update cursor position regardless of whether we're drawing
                      setCursorPosition({ x, y });
                      
                      // Only draw if actively drawing
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
                      className={`absolute pointer-events-none z-20 rounded-full border-2 ${isEraser ? 'border-red-400' : 'border-white'}`}
                      style={{
                        width: `${brushSize}px`,
                        height: `${brushSize}px`,
                        left: `${cursorPosition.x - brushSize/2}px`,
                        top: `${cursorPosition.y - brushSize/2}px`,
                        backgroundColor: isEraser ? 'rgba(255, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.3)',
                        boxShadow: isEraser ? '0 0 0 1px rgba(255, 0, 0, 0.5)' : '0 0 0 1px rgba(0, 0, 0, 0.5)'
                      }}
                    />
                  )}
                </div>
              </div>
            ) : (
              <label className="w-full h-full flex items-center justify-center cursor-pointer rounded-xl border-2 border-dashed border-gray-600 hover:border-purple-500 transition-all duration-300">
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
                        className="w-16 h-16 text-white/70 transition-transform duration-300" 
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
          </div>
        </div>

        {/* Output Section - Also need to adjust the result section to match */}
        <div className="bg-gray-800/30 rounded-2xl overflow-hidden shadow-xl relative">
          {/* Result Action Buttons - positioned at the top-right corner OUTSIDE the image area */}
          {resultImage && (
            <div className="absolute top-2 right-2 flex gap-2 z-40">
              <button
                onClick={() => viewFullscreen(resultImage)}
                className="p-2 bg-gray-900/80 hover:bg-gray-700/90 rounded-lg backdrop-blur-sm border border-gray-600/50 shadow-md transition-all"
                title="View fullscreen"
              >
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              </button>
              
              <button
                onClick={downloadResult}
                className="p-2 bg-gray-900/80 hover:bg-blue-500/90 rounded-lg backdrop-blur-sm border border-gray-600/50 shadow-md transition-all"
                title="Download image"
              >
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>
            </div>
          )}
          
          <div className="w-full h-[500px] flex items-center justify-center p-4">
            {resultImage ? (
              <div className="relative max-w-full max-h-full" style={{
                width: originalDimensions ? `${originalDimensions.width}px` : 'auto',
                height: originalDimensions ? `${originalDimensions.height}px` : 'auto'
              }}>
                <img 
                  ref={resultImageRef}
                  src={resultImage} 
                  alt="Generated result" 
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain'
                  }}
                  onLoad={(e) => {
                    console.log("Result image loaded, dimensions:", {
                      width: e.target.naturalWidth,
                      height: e.target.naturalHeight
                    });
                  }}
                  onError={(e) => {
                    console.error("Error loading result image:", e);
                    alert("Failed to load result image. The URL might be invalid.");
                  }}
                />
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center rounded-xl border-2 border-dashed border-gray-600">
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
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Tips Section */}
      <div className="mt-6 p-4 rounded-xl backdrop-blur-sm bg-gray-800/50 border border-gray-700">
        <h3 className="text-sm font-semibold mb-2 text-purple-400">Tips for best results:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
          <div className="flex items-start gap-2">
            <span className="bg-purple-500/20 p-1 rounded-full">
              <svg className="w-4 h-4 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </span>
            <p>Paint carefully around the edges of objects you want to remove</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="bg-purple-500/20 p-1 rounded-full">
              <svg className="w-4 h-4 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </span>
            <p>Images are automatically padded to square format for the AI model</p>
          </div>
          {/* <div className="flex items-start gap-2">
            <span className="bg-purple-500/20 p-1 rounded-full">
              <svg className="w-4 h-4 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </span>
            <p>Use the eraser to fix mistakes or refine your mask</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="bg-purple-500/20 p-1 rounded-full">
              <svg className="w-4 h-4 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </span>
            <p>Each generation uses a random seed for variety in results</p>
          </div> */}
        </div>
      </div>
      
      {/* Debug Section*/}
      {showDebug && (
        <div className="mt-6 p-4 rounded-xl backdrop-blur-sm bg-gray-800/50 border border-red-700">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-semibold text-red-400">Debug: Square Padding Visualization</h3>
            <button 
              onClick={() => setShowDebug(false)}
              className="text-xs bg-red-900/50 hover:bg-red-900 px-2 py-1 rounded"
            >
              Hide Debug Panel
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <div className="bg-gray-800/50 p-3 rounded-lg">
              <p className="text-xs font-medium mb-2 text-gray-400">Original Image</p>
              <div className="h-60 flex items-center justify-center border border-gray-700 rounded overflow-hidden">
                {originalImage ? (
                  <img 
                    src={originalImage} 
                    alt="Original" 
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <span className="text-xs text-gray-500">No image uploaded</span>
                )}
              </div>
              {paddingMetadata && (
                <p className="text-xs text-gray-500 mt-2">
                  Dimensions: {paddingMetadata.originalWidth}x{paddingMetadata.originalHeight}
                </p>
              )}
            </div>
            
          
            <div className="bg-gray-800/50 p-3 rounded-lg">
              <p className="text-xs font-medium mb-2 text-gray-400">Padded Square Image (1:1)</p>
              <div className="h-60 flex items-center justify-center border border-gray-700 rounded overflow-hidden bg-black/50">
                {paddedDebugImage ? (
                  <img 
                    src={paddedDebugImage} 
                    alt="Padded Image" 
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <span className="text-xs text-gray-500">Process an image to see padding</span>
                )}
              </div>
              {paddingMetadata && (
                <p className="text-xs text-gray-500 mt-2">
                  Square Size: {paddingMetadata.squareSize}x{paddingMetadata.squareSize}
                </p>
              )}
            </div>
            
        
            <div className="bg-gray-800/50 p-3 rounded-lg">
              <p className="text-xs font-medium mb-2 text-gray-400">Padded Square Mask (1:1)</p>
              <div className="h-60 flex items-center justify-center border border-gray-700 rounded overflow-hidden bg-gray-700" style={{background: 'repeating-conic-gradient(#808080 0% 25%, #606060 0% 50%) 50% / 20px 20px'}}>
                {paddedDebugMask ? (
                  <img 
                    src={paddedDebugMask} 
                    alt="Padded Mask" 
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <span className="text-xs text-gray-500">Draw a mask and process to see</span>
                )}
              </div>
              {paddingMetadata && paddedDebugMask && (
                <p className="text-xs text-gray-500 mt-2">
                  Padding: L{paddingMetadata.paddingLeft} T{paddingMetadata.paddingTop} R{paddingMetadata.paddingRight} B{paddingMetadata.paddingBottom}
                </p>
              )}
            </div>
     
            <div className="bg-gray-800/50 p-3 rounded-lg md:col-span-3">
              <p className="text-xs font-medium mb-2 text-gray-400">API Result (Square Format)</p>
              <div className="h-60 flex items-center justify-center border border-gray-700 rounded overflow-hidden">
                {resultImage ? (
                  <img 
                    src={resultImage} 
                    alt="API Result" 
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <span className="text-xs text-gray-500">Process an image to see result</span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                This is the full square result from the API before CSS cropping is applied.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 