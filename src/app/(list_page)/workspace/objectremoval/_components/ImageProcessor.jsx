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
  
  const originalFileInputRef = useRef(null);
  const imageContainerRef = useRef(null);
  const canvasRef = useRef(null);
  const maskCanvasRef = useRef(null);
  const contextRef = useRef(null);
  const imageRef = useRef(null);

  // Set up the canvas when original image is loaded
  useEffect(() => {
    if (originalImage && canvasRef.current && maskCanvasRef.current && imageContainerRef.current) {
      const img = new Image();
      
      img.onload = () => {
        imageRef.current = img; // Store the image reference
        
        // Get container dimensions
        const container = imageContainerRef.current;
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        // Calculate scale to fit image within container while preserving aspect ratio
        const scaleWidth = containerWidth / img.width;
        const scaleHeight = containerHeight / img.height;
        const scale = Math.min(scaleWidth, scaleHeight, 1); // Don't scale up, only down
        
        // Calculate new dimensions
        const width = Math.floor(img.width * scale);
        const height = Math.floor(img.height * scale);
        
        // Set canvas dimensions
        const canvas = canvasRef.current;
        const maskCanvas = maskCanvasRef.current;
        canvas.width = width;
        canvas.height = height;
        maskCanvas.width = width;
        maskCanvas.height = height;
        
        // Draw the image
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Set up mask canvas
        const maskCtx = maskCanvas.getContext('2d');
        maskCtx.clearRect(0, 0, width, height);
        maskCtx.lineJoin = 'round';
        maskCtx.lineCap = 'round';
        maskCtx.strokeStyle = 'black';
        maskCtx.fillStyle = 'black';
        contextRef.current = maskCtx;
      };
      
      img.src = originalImage;
    }
  }, [originalImage]);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadLoading(true);
    try {
      const dataUrl = await readFileAsDataURL(file);
      setOriginalImage(dataUrl);
      setResultImage(null);
      
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

  // Generate mask image with transparency
  const getMaskImage = () => {
    if (!maskCanvasRef.current) return null;
    
    // Check if mask has any content
    const maskCtx = maskCanvasRef.current.getContext('2d');
    const imageData = maskCtx.getImageData(
      0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height
    );
    
    // Check if there are any non-transparent pixels by looking at the alpha channel
    let hasContent = false;
    for (let i = 3; i < imageData.data.length; i += 4) {
      if (imageData.data[i] > 0) {
        hasContent = true;
        break;
      }
    }
    
    if (!hasContent) {
      return null; // Return null if mask is empty
    }
    
    // Return as data URL with transparency
    return maskCanvasRef.current.toDataURL('image/png');
  };

  const handleRemoveObject = async () => {
    if (!originalImage) {
      alert('Please upload an image first');
      return;
    }
    
    // Get mask image from canvas
    const maskImage = getMaskImage();
    if (!maskImage) {
      alert('Please draw the areas you want to remove');
      return;
    }

    setProcessing(true);
    try {
      const imageData = {
        background: originalImage,
        layers: [maskImage],
        composite: originalImage,
      };

      // Always use random seed
      const randomSeed = Math.floor(Math.random() * 1000000);
      
      // Fixed parameters with random seed
      const settings = {
        rm_guidance_scale: 9,
        num_inference_steps: 50,
        seed: randomSeed,
        strength: 0.8,
        similarity_suppression_steps: 9,
        similarity_suppression_scale: 0.3,
      };

      console.log("Submitting request to remove object with seed:", randomSeed);
      const result = await removeObjectFromImage(imageData, settings);
      console.log("Result received in UI:", result);
      
      if (result) {
        setResultImage(result);
      } else {
        console.error("No result data received");
        alert("No result data received from the API");
      }
    } catch (error) {
      console.error('Error removing object:', error);
      alert('Failed to remove object: ' + (error.message || 'Unknown error'));
    } finally {
      setProcessing(false);
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
        <div className="bg-gray-800/30 rounded-2xl overflow-hidden shadow-xl">
          <div className="w-full h-[500px] flex items-center justify-center p-4" ref={imageContainerRef}>
            {originalImage ? (
              <div className="relative max-w-full max-h-full">
                <div className="relative">
                  <canvas 
                    ref={canvasRef}
                    className="z-0"
                    style={{ display: 'block' }}
                  />
                  <canvas 
                    ref={maskCanvasRef}
                    className="absolute top-0 left-0 z-10"
                    style={{ cursor: 'none' }}
                    onMouseDown={startDrawing}
                    onMouseMove={(e) => {
                      updateCursorPosition(e);
                      if (isDrawing) draw(e);
                    }}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                  />
                  
                  {/* Custom cursor overlay */}
                  {originalImage && !isDrawing && (
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
                
                {/* Action Buttons */}
                <div className="absolute top-3 right-3 flex gap-2">
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

        {/* Output Section */}
        <div className="bg-gray-800/30 rounded-2xl overflow-hidden shadow-xl">
          <div className="w-full h-[500px] flex items-center justify-center p-4">
            {resultImage ? (
              <div className="relative max-w-full max-h-full">
                <img 
                  src={resultImage} 
                  alt="Generated result" 
                  className="max-w-full max-h-full object-contain"
                  style={{
                    maxWidth: canvasRef.current ? canvasRef.current.width + 'px' : '100%',
                    maxHeight: canvasRef.current ? canvasRef.current.height + 'px' : '100%'
                  }}
                  onError={(e) => {
                    console.error("Error loading result image:", e);
                    alert("Failed to load result image. The URL might be invalid.");
                  }}
                />
                
                {/* Action Buttons */}
                <div className="absolute top-3 right-3 flex gap-2">
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
            <p>Use the eraser to fix mistakes or refine your mask</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="bg-purple-500/20 p-1 rounded-full">
              <svg className="w-4 h-4 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </span>
            <p>Make multiple attempts with different masks if needed</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="bg-purple-500/20 p-1 rounded-full">
              <svg className="w-4 h-4 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </span>
            <p>Each generation uses a random seed for variety in results</p>
          </div>
        </div>
      </div>
    </div>
  );
} 