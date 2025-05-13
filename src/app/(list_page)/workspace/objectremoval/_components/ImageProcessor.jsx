'use client';

import { useState, useRef, useEffect } from 'react';
import { removeObjectFromImage } from '@/lib/huggingface/objectRemovalClient';
import { FiEdit2, FiX } from 'react-icons/fi';
import { calculatePaddingMetadata, padImageToSquare, padMaskToSquare, readFileAsDataURL } from './utils';
import { startDrawing, draw, stopDrawing } from './BrushEraser';
import { handlePaddingAndCropping, cropResultImage } from './PaddingCrop';
import { handleImageUpload, handleRemoveObject, downloadResult, viewFullscreen } from './EventHandlers';
import CanvasSetup from './CanvasSetup';
import ImageUploader from './ImageUploader';
import DrawingTools from './DrawingTools';
import ResultViewer from './ResultViewer';
import ActionButtons from './ActionButtons';
import { auth, db } from '@/firebase/FirebaseConfig';
import { saveToGallery } from '@/lib/saveToGallery';
import { updateUserTokens } from "@/firebase/firebaseUtils";
import { doc, getDoc } from 'firebase/firestore';

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
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [notification, setNotification] = useState(null);
  
  const [paddedDebugImage, setPaddedDebugImage] = useState(null);
  const [paddedDebugMask, setPaddedDebugMask] = useState(null);
  const [showDebug, setShowDebug] = useState(true);
  
  const [isCanvasHovered, setIsCanvasHovered] = useState(false);
  
  // Token management
  const [tokens, setTokens] = useState(0);
  const [freeTrialTokens, setFreeTrialTokens] = useState(0);
  const [error, setError] = useState('');

  const originalFileInputRef = useRef(null);
  const imageContainerRef = useRef(null);
  const canvasRef = useRef(null);
  const maskCanvasRef = useRef(null);
  const contextRef = useRef(null);
  const imageRef = useRef(null);
  const resultImageRef = useRef(null);

  const requiredTokens = 3;

  // get user tokens count
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          setTokens(userDoc.data().tokens || 0);
          setFreeTrialTokens(userDoc.data().freeTrialTokens || 0);
        }
      }
    });

    return () => unsubscribe();
  }, []);
  
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

  // Add a check and log to ensure maskCanvasRef is initialized
  useEffect(() => {
    if (!maskCanvasRef.current) {
      console.warn('maskCanvasRef is not initialized');
    }
  }, [maskCanvasRef]);

  // Check for user authentication
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Clear notification after 3 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Auto-save whenever a new result is available
  useEffect(() => {
    if (resultImage && user && !saving) {
      handleSaveToGallery();
    }
  }, [resultImage]);

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

  // Drawing functions 
  const startDrawing = ({nativeEvent}) => {
    if (!contextRef.current) return;
    
    const {offsetX, offsetY} = nativeEvent;
    
    // Set composite operation based on mode
    contextRef.current.globalCompositeOperation = isEraser ? 'destination-out' : 'source-over';
    
    // Set line properties
    contextRef.current.lineWidth = brushSize;
    contextRef.current.lineCap = 'round';
    contextRef.current.lineJoin = 'round';
    
    // Draw the initial dot at exact cursor position
    contextRef.current.beginPath();
    contextRef.current.arc(offsetX, offsetY, brushSize/2, 0, Math.PI * 2);
    contextRef.current.fill();
    
    // Store position for continuous drawing
    contextRef.current.lastX = offsetX;
    contextRef.current.lastY = offsetY;
    
    setIsDrawing(true);
    
    // Hide default cursor during drawing
    document.body.style.cursor = 'none';
    
    // Add listeners for drawing outside canvas
    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
  };

  const draw = ({nativeEvent}) => {
    if (!isDrawing || !contextRef.current) return;
    
    const {offsetX, offsetY} = nativeEvent;
    
    // Get the last position
    const lastX = contextRef.current.lastX || offsetX;
    const lastY = contextRef.current.lastY || offsetY;
    
    // Calculate distance moved
    const distance = Math.sqrt(
      Math.pow(offsetX - lastX, 2) + 
      Math.pow(offsetY - lastY, 2)
    );
    
    // Draw dots along the path for smooth results
    if (distance > 0) {
      // More points for smoother lines (10× density)
      const steps = Math.max(Math.round(distance * 10), 1);
      const deltaX = (offsetX - lastX) / steps;
      const deltaY = (offsetY - lastY) / steps;
      
      for (let i = 0; i <= steps; i++) {
        const pointX = lastX + deltaX * i;
        const pointY = lastY + deltaY * i;
        
        contextRef.current.beginPath();
        contextRef.current.arc(pointX, pointY, brushSize/2, 0, Math.PI * 2);
        contextRef.current.fill();
      }
    } else {
      // For small movements, just draw a single dot
      contextRef.current.beginPath();
      contextRef.current.arc(offsetX, offsetY, brushSize/2, 0, Math.PI * 2);
      contextRef.current.fill();
    }
    
    // Update for next segment
    contextRef.current.lastX = offsetX;
    contextRef.current.lastY = offsetY;
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
    // Error handling for tokens
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();
      
      if (userData.subscriptionStatus === 'inactive' && userData.tokens < requiredTokens) {
        setError("You don't have enough credits. Please subscribe to continue.");
        setProcessing(false);
        return;
      }
      
      if (userData.subscriptionStatus === 'inactive' && userData.lockedTokens > 0) {
        setError("Your credits are currently locked. Please subscribe to a plan to keep using this feature.");
        setProcessing(false);
        return;
      }
    }
    // Get padded mask with transparency
    const paddedMask = await padMaskToSquare(paddingMetadata, maskCanvasRef, originalDimensions);
    if (!paddedMask) {
      alert('Please draw the areas you want to remove');
      return;
    }

    // Update user token
    const updatedTokens = await updateUserTokens(user.uid, requiredTokens);
    if (updatedTokens) {
      setTokens(updatedTokens.newTotalTokens);
      setFreeTrialTokens(updatedTokens.newFreeTrialTokens);
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

  // Global mouse move handler
  const handleGlobalMouseMove = (e) => {
    if (!isDrawing || !maskCanvasRef.current) return;
    
    // Get canvas position
    const rect = maskCanvasRef.current.getBoundingClientRect();
    
    // Calculate exact pixel position
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);
    
    // Always update cursor position
    setCursorPosition({ x, y });
    
    // Only draw if within canvas boundaries
    if (x >= 0 && x < rect.width && y >= 0 && y < rect.height) {
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

  // Function to convert image to WebP format
  const convertToWebP = (dataUrl, quality = 0.85) => {
    return new Promise((resolve, reject) => {
      try {
        const img = new Image();
        img.onload = () => {
          // Create canvas with original dimensions
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          
          // Draw image to canvas
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          
          // Convert to WebP
          const webpDataUrl = canvas.toDataURL('image/webp', quality);
          
          resolve(webpDataUrl);
        };
        img.onerror = (err) => {
          console.error('Error loading image for WebP conversion:', err);
          reject(err);
        };
        img.src = dataUrl;
      } catch (error) {
        console.error('Error converting to WebP:', error);
        reject(error);
      }
    });
  };

  // Helper function to save to gallery using the utility
  const handleSaveToGallery = async () => {
    if (!resultImage || !user) {
      setNotification({
        type: 'error',
        message: user ? 'No result to save' : 'Please sign in to save to gallery'
      });
      return;
    }

    setSaving(true);
    try {
      await saveToGallery(resultImage, user.uid, 'objectremoval');
      // Success notification removed - silent success
    } catch (error) {
      console.error('Error saving to gallery:', error);
      setNotification({
        type: 'error',
        message: 'Failed to save to gallery'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full p-4 sm:p-6 lg:p-8 bg-[var(--card-background)] dark:bg-gradient-to-br from-gray-900 to-black text-white">
      <h1 className="text-3xl font-bold mb-4 bg-clip-text" style={{
        background: 'linear-gradient(to right,#a78bfa, #3b82f6)', // purple-400 to blue-500
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }}>
        AI Object Remover
      </h1>
      
      {/* Notification banner */}
      {notification && (
        <div className={`mb-4 p-3 rounded-lg text-white flex items-center justify-between ${
          notification.type === 'success' ? 'bg-green-500/20 border border-green-500/30' : 
          'bg-red-500/20 border border-red-500/30'
        }`}>
          <p>{notification.message}</p>
          <button onClick={() => setNotification(null)} className="text-white/80 hover:text-white">
            <FiX size={18} />
          </button>
        </div>
      )}
      
      <div className="mb-6 flex items-center flex-wrap gap-3">
        <DrawingTools isEraser={isEraser} setIsEraser={setIsEraser} brushSize={brushSize} setBrushSize={setBrushSize} />
        <ActionButtons clearMask={clearMask} handleRemoveObject={handleRemoveObject} originalImage={originalImage} processing={processing} uploadLoading={uploadLoading} />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 lg:gap-8">
        {/* Input Section */}
        <div className=" bg-gradient-to-r from-gray-900 via-gray-900 to-gray-900 dark:bg-gray-800/30 rounded-2xl overflow-hidden shadow-xl relative p-0 m-0" ref={imageContainerRef}>
          <ImageUploader 
            handleImageUpload={handleImageUpload} 
            originalImage={originalImage} 
            clearMask={clearMask} 
            setOriginalImage={setOriginalImage} 
            canvasRef={canvasRef} 
            maskCanvasRef={maskCanvasRef} 
            setIsCanvasHovered={setIsCanvasHovered} 
            isCanvasHovered={isCanvasHovered} 
            isDrawing={isDrawing} 
            startDrawing={startDrawing} 
            draw={draw} 
            stopDrawing={stopDrawing} 
            cursorPosition={cursorPosition} 
            brushSize={brushSize} 
            isEraser={isEraser}
            setCursorPosition={setCursorPosition}
          />
          <CanvasSetup originalImage={originalImage} setOriginalDimensions={setOriginalDimensions} canvasRef={canvasRef} maskCanvasRef={maskCanvasRef} imageContainerRef={imageContainerRef} setPaddingMetadata={setPaddingMetadata} />
        </div>

        {/* Output Section - Restore ResultViewer component */}
        <ResultViewer 
          resultImage={resultImage} 
          isProcessing={processing}
          onDownload={downloadResult}
          onRegenerate={handleRemoveObject}
          isSaving={saving}
        />
      </div>
      {error && (
        <div className="text-xs text-red-400 border border-gray-600 p-2 rounded-md mt-3 inline-block ">
          {error}
        </div>
      )}
      {/* Tips Section */}
      <div className="mt-10 pt-4 px-4 pb-2 rounded-xl backdrop-blur-sm bg-gradient-to-r dark:bg-gray-800/50 border border-[var(--border-gray)]">
        <h3 className="text-sm font-semibold mb-2 text-purple-400">Tips for best results:</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm text-gray-300">
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
        </div>
      </div>
      
      {/* Debug Section*/}
      {/* {showDebug && (
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
            </div>
          </div>
        </div>
      )} */}
    </div>
  );
} 