import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Minus, Plus, Brush, Eraser } from "lucide-react";
import { processImage } from '@/lib/huggingfaceInpaint/client';
import { defaultParams } from '@/lib/huggingfaceInpaint/clientConfig';
import { auth, db, storage } from '@/firebase/FirebaseConfig';
import { doc, updateDoc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Client-side fallback for processing images if the server function fails
async function processImageClientSide(imageFile, params = {}) {
  try {
    // First try to use the imported server function
    return await processImage(imageFile, params);
  } catch (error) {
    console.warn('Server-side processing failed, attempting client-side fallback:', error);
    
    // Create a canvas to draw the mask on top of the image
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw the original image
        ctx.drawImage(img, 0, 0);
        
        // Draw a simulated effect over the masked areas
        const maskImg = new Image();
        maskImg.onload = () => {
          // Use the mask as an overlay
          ctx.globalCompositeOperation = 'source-atop';
          // Apply a color tint to show something happened
          ctx.fillStyle = params.prompt ? 'rgba(100, 100, 255, 0.3)' : 'rgba(255, 255, 255, 0.2)';
          ctx.drawImage(maskImg, 0, 0, canvas.width, canvas.height);
          
          // Get the result as data URL
          const dataUrl = canvas.toDataURL('image/png');
          
          // Return in the same format as the API would
          resolve([
            [{
              image: {
                url: dataUrl,
                originalUrl: dataUrl
              }
            }],
            { message: "Client-side fallback was used. This is a simulated result." }
          ]);
        };
        maskImg.onerror = () => {
          // If mask fails, just return original image
          const dataUrl = canvas.toDataURL('image/png');
          resolve([
            [{
              image: {
                url: dataUrl,
                originalUrl: dataUrl 
              }
            }],
            { message: "Client-side fallback was used with original image." }
          ]);
        };
        maskImg.src = params.imageMask;
      };
      
      img.onerror = () => {
        throw new Error('Failed to load image for client-side processing');
      };
      
      // Create a blob URL from the file
      const blobUrl = URL.createObjectURL(imageFile);
      img.src = blobUrl;
    });
  }
}

// Save the image to user gallery
const saveToUserGallery = async (imageUrl, userId) => {
  try {
    const timestamp = Date.now();
    const filename = `background-retouched-${timestamp}.png`;
    
    // Create storage reference
    const storageRef = ref(storage, `user_images/${userId}/${filename}`);
    
    // Fetch the image and convert to blob
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    
    // Upload to Firebase storage
    await uploadBytes(storageRef, blob);
    const downloadURL = await getDownloadURL(storageRef);
    
    // Save record to Firestore
    const userImageRef = collection(db, 'user_images');
    await addDoc(userImageRef, {
      userID: userId,
      img_data: downloadURL,
      createdAt: serverTimestamp(),
      type: 'background-generation'  // Use the same type as normal background generation
    });

    // Update localStorage to store this retouched image
    try {
      // Only store if not too large (< 2MB)
      if (imageUrl.length < 2000000) {
        localStorage.setItem('bggen_outputImage', imageUrl);
      }
    } catch (err) {
      console.warn('Failed to update localStorage with retouched image:', err);
    }

    return downloadURL;
  } catch (error) {
    console.error('Error saving to gallery:', error);
    return null;
  }
};

const RetouchModal = ({ isOpen, onClose, imageSrc, onImageUpdate }) => {
  // All state hooks
  const [prompt, setPrompt] = useState('');
  const [zoom, setZoom] = useState(100);
  const [activeTool, setActiveTool] = useState('brush');
  const [brushSize, setBrushSize] = useState(20);
  const [isDrawing, setIsDrawing] = useState(false);
  const [maskData, setMaskData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [resultImage, setResultImage] = useState(null);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [isCanvasHovered, setIsCanvasHovered] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [tokens, setTokens] = useState(0);
  const [convertedImageSrc, setConvertedImageSrc] = useState(null);

  // All ref hooks
  const containerRef = useRef(null);
  const imageCanvasRef = useRef(null);
  const maskCanvasRef = useRef(null);
  const imageObjRef = useRef(null);
  const lastPositionRef = useRef({ x: 0, y: 0 });

  // Firebase auth listener - get user and tokens
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          setTokens(userDoc.data().tokens || 0);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Convert any image URL to a blob URL to avoid CORS issues
  const convertToBlobUrl = useCallback(async (src) => {
    if (!src) return null;
    
    try {
      console.log('Converting image to blob URL, source type:', 
                  src.startsWith('data:') ? 'data URL' : 
                  src.includes('firebasestorage') ? 'Firebase URL' : 'regular URL');
      
      // Special handling for Firebase storage URLs
      if (src.includes('firebasestorage')) {
        console.log('Using special Firebase URL handling');
        try {
          // For Firebase storage URLs, we need to use fetch with proper error handling
          const response = await fetch(src);
          if (!response.ok) {
            throw new Error(`Failed to fetch Firebase image: ${response.status}`);
          }
          
          const blob = await response.blob();
          const blobUrl = URL.createObjectURL(blob);
          console.log('Created blob URL from Firebase URL');
          return blobUrl;
        } catch (firebaseError) {
          console.error('Firebase URL fetch failed:', firebaseError);
          // Fall back to the canvas method if fetch fails
        }
      }
      
      // Standard approach using Image and canvas
      const img = new Image();
      
      // Create a promise that resolves when the image loads
      const imageLoaded = new Promise((resolve, reject) => {
        let timeoutId;
        
        img.onload = () => {
          if (timeoutId) clearTimeout(timeoutId);
          resolve(img);
        };
        
        img.onerror = (err) => {
          if (timeoutId) clearTimeout(timeoutId);
          console.error('Image load error:', err);
          reject(new Error('Failed to load image'));
        };
        
        // Add a timeout to avoid hanging indefinitely
        timeoutId = setTimeout(() => {
          reject(new Error('Image load timed out'));
        }, 10000); // 10 second timeout
        
        // For data URLs, no need for crossOrigin
        if (!src.startsWith('data:')) {
          img.crossOrigin = 'Anonymous';
        }
        
        img.src = src;
      });
      
      // Wait for the image to load
      const loadedImg = await imageLoaded;
      
      // Create a canvas to draw the image
      const canvas = document.createElement('canvas');
      canvas.width = loadedImg.width;
      canvas.height = loadedImg.height;
      
      // Draw the image to the canvas
      const ctx = canvas.getContext('2d');
      ctx.drawImage(loadedImg, 0, 0);
      
      // Convert to a blob
      const blob = await new Promise(resolve => {
        canvas.toBlob(resolve, 'image/png');
      });
      
      // Create a blob URL
      const blobUrl = URL.createObjectURL(blob);
      console.log('Created blob URL:', blobUrl);
      
      return blobUrl;
    } catch (error) {
      console.error('Error converting to blob URL:', error);
      
      // As a last resort for Firebase URLs, try a direct proxy approach
      if (src.includes('firebasestorage')) {
        try {
          console.log('Attempting last-resort Firebase URL handling');
          // Create a placeholder canvas with a message
          const canvas = document.createElement('canvas');
          canvas.width = 800;
          canvas.height = 600;
          const ctx = canvas.getContext('2d');
          
          // Fill with a gradient background
          const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
          gradient.addColorStop(0, '#f0f0f0');
          gradient.addColorStop(1, '#e0e0e0');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Add a notice message
          ctx.fillStyle = '#666';
          ctx.font = '20px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('Image could not be loaded. Please draw your mask anyway.', canvas.width/2, canvas.height/2);
          ctx.fillText('Your edits will still be applied.', canvas.width/2, canvas.height/2 + 30);
          
          // Convert to blob URL
          const blob = await new Promise(resolve => {
            canvas.toBlob(resolve, 'image/png');
          });
          
          const blobUrl = URL.createObjectURL(blob);
          console.log('Created placeholder image blob URL');
          setError('Image preview unavailable, but retouching will still work. Please draw your mask.');
          return blobUrl;
        } catch (placeholderError) {
          console.error('Failed to create placeholder:', placeholderError);
        }
      }
      
      setError('Error preparing image. Please try a different image.');
      return null;
    }
  }, []);

  // Handle image URL conversion when modal opens
  useEffect(() => {
    // Clean up any previous blob URLs
    if (convertedImageSrc) {
      URL.revokeObjectURL(convertedImageSrc);
      setConvertedImageSrc(null);
    }
    
    // Reset states when opening/closing modal
    if (!isOpen) {
      setError(null);
      setResultImage(null);
      setMaskData(null);
      return;
    }

    // Convert the image to a blob URL when modal opens
    if (isOpen && imageSrc) {
      setIsLoading(true);
      convertToBlobUrl(imageSrc)
        .then(blobUrl => {
          if (blobUrl) {
            setConvertedImageSrc(blobUrl);
            setError(null);
          }
        })
        .catch(err => {
          console.error('Failed to convert image:', err);
          setError('Failed to prepare image for editing. Please try again.');
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isOpen, imageSrc, convertToBlobUrl]);

  // Canvas setup functions
  const setupCanvas = useCallback((img, container) => {
    if (!container) return { width: 0, height: 0 };
    
    const containerWidth = container.clientWidth - 40; // Add padding for container
    const containerHeight = container.clientHeight - 40;
    
    const imageRatio = img.width / img.height;
    let newWidth, newHeight;

    if (imageRatio > 1) {
      // Landscape image
      newWidth = Math.min(containerWidth, img.width);
      newHeight = newWidth / imageRatio;
      
      if (newHeight > containerHeight) {
        newHeight = containerHeight;
        newWidth = newHeight * imageRatio;
      }
    } else {
      // Portrait image
      newHeight = Math.min(containerHeight, img.height);
      newWidth = newHeight * imageRatio;
      
      if (newWidth > containerWidth) {
        newWidth = containerWidth;
        newHeight = newWidth / imageRatio;
      }
    }
    
    // Ensure minimum size for usability
    newWidth = Math.max(newWidth, 300);
    newHeight = Math.max(newHeight, 300);
    
    return { 
      width: Math.round(newWidth), 
      height: Math.round(newHeight)
    };
  }, []);
  
  const renderImage = useCallback((img, dimensions) => {
    const { width, height } = dimensions;
    
    if (!imageCanvasRef.current || !maskCanvasRef.current) return false;
    
    // Canvas dimensions
    imageCanvasRef.current.width = width;
    imageCanvasRef.current.height = height;
    maskCanvasRef.current.width = width;
    maskCanvasRef.current.height = height;
    
    imageCanvasRef.current.style.width = `${width}px`;
    imageCanvasRef.current.style.height = `${height}px`;
    maskCanvasRef.current.style.width = `${width}px`;
    maskCanvasRef.current.style.height = `${height}px`;

    const ctx = imageCanvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    
    // Clear mask canvas
    const maskCtx = maskCanvasRef.current.getContext('2d');
    maskCtx.clearRect(0, 0, width, height);
    
    return true;
  }, []);

  const decreaseZoom = useCallback(() => {
    if (zoom > 50) setZoom(zoom - 10);
  }, [zoom]);

  const increaseZoom = useCallback(() => {
    if (zoom < 200) setZoom(zoom + 10);
  }, [zoom]);

  // Drawing functions
  const getCanvasCoordinates = useCallback((e, canvas) => {
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
  }, []);

  const draw = useCallback((e) => {
    if (!isDrawing || !maskCanvasRef.current) return;
    
    const canvas = maskCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const coords = getCanvasCoordinates(e, canvas);

    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (activeTool === 'eraser') {
      // Eraser mode
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
    } else {
      // Brush mode
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = 'white';
    }
    
    ctx.beginPath();
    ctx.moveTo(lastPositionRef.current.x, lastPositionRef.current.y);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
    lastPositionRef.current = coords;
  }, [isDrawing, brushSize, getCanvasCoordinates, activeTool]);

  const startDrawing = useCallback((e) => {
    if (!maskCanvasRef.current) return;
    
    setIsDrawing(true);
    const canvas = maskCanvasRef.current;
    const coords = getCanvasCoordinates(e, canvas);
    lastPositionRef.current = coords;
  
    const ctx = canvas.getContext('2d');
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  
    if (activeTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
    } else {
      ctx.globalCompositeOperation = 'source-over';
    }
  
    ctx.beginPath();
    ctx.arc(coords.x, coords.y, brushSize / 2, 0, 2 * Math.PI);
  
    ctx.fillStyle = 'white';
    ctx.fill();
  
    draw(e);
  }, [brushSize, getCanvasCoordinates, activeTool, draw]);
  
  const stopDrawing = useCallback(() => {
    if (!isDrawing) return;
    
    setIsDrawing(false);
    
    // Create mask data
    if (maskCanvasRef.current) {
      try {
        console.log('Creating mask data from canvas');
        // Only need the mask data, not the image data
        const maskData = maskCanvasRef.current.toDataURL('image/png');
        console.log('Mask data created successfully');
        setMaskData(maskData);
      } catch (error) {
        console.error('Error creating mask data:', error);
        setError('Unable to create mask data. The image might be from a different origin.');
      }
    }
  }, [isDrawing]);

  const clearCanvas = useCallback(() => {
    if (maskCanvasRef.current) {
      const ctx = maskCanvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);
      setMaskData(null);
    }
  }, [canvasSize.width, canvasSize.height]);
  
  // Handle generate
  const handleGenerate = useCallback(async () => {
    if (!imageCanvasRef.current || !maskData) return;
    
    try {
      setIsLoading(true);
      setError(null); // Clear any previous errors
      
      // Check if user has required tokens or subscription
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        const userData = userDoc.data();
        
        if (userData.subscriptionStatus === 'inactive' && userData.lockedTokens > 0) {
          setError("Your credits are currently locked. Please subscribe to a plan to keep using this feature.");
          setIsLoading(false);
          return;
        }
        
        // Check if user has enough tokens (assuming retouch costs 15 tokens like objectRetouch)
        if (tokens < 15 && userData.subscriptionStatus !== 'active') {
          setError("You don't have enough credits. Please purchase more credits or subscribe.");
          setIsLoading(false);
          return;
        }
      } else {
        setError("Please log in to use this feature.");
        setIsLoading(false);
        return;
      }
      
      // Get image data from canvas directly to avoid CORS issues
      const imageData = imageCanvasRef.current.toDataURL('image/png');
      
      // Convert data URL to File
      const imageBlob = await fetch(imageData).then(res => res.blob());
      const imageFile = new File([imageBlob], 'image.png', { type: 'image/png' });
      
      console.log('Processing image with params:', {
        prompt: prompt || '(empty prompt)',
        hasMask: !!maskData,
        imageFileSize: imageFile.size,
        fileType: imageFile.type
      });
      
      // Convert maskData to a File object
      const maskBlob = await fetch(maskData).then(res => res.blob());
      const maskFile = new File([maskBlob], 'mask.png', { type: 'image/png' });
      
      // Set up the parameters correctly like in ObjectRetouch
      const processParams = {
        ...defaultParams,
        prompt: prompt || '',
        imageMask: {
          background: imageFile,
          layers: [maskFile],
          composite: imageFile
        },
        use_rasg: true,
        use_painta: true
      };
      
      try {
        const result = await processImage(imageFile, processParams);
        
        if (result && result[0] && result[0][0] && result[0][0].image) {
          const resultImageUrl = result[0][0].image.url;
          
          // Convert the result to a blob URL to avoid CORS issues
          const resultBlobUrl = await convertToBlobUrl(resultImageUrl);
          setResultImage(resultBlobUrl || resultImageUrl);
          
          // Save to user gallery
          const savedImageUrl = await saveToUserGallery(resultImageUrl, user.uid);
          
          // Update user tokens
          const userRef = doc(db, 'users', user.uid);
          await updateDoc(userRef, {
            tokens: tokens - 15
          });
          setTokens(prev => prev - 15);
          
          // Choose the best URL to use for updating the parent component
          const imageUrlToUse = savedImageUrl || resultImageUrl;
          
          // Immediately update the parent image without closing modal
          if (onImageUpdate) {
            console.log('RetouchModal calling onImageUpdate with:', imageUrlToUse);
            
            // Create a File object from the retouched image to support generate after refresh
            const recreateFileFromUrl = async (url) => {
              try {
                const res = await fetch(url);
                const blob = await res.blob();
                const fileName = 'retouched-image.png';
                const file = new File([blob], fileName, { type: blob.type });
                
                // Pass both the URL and File object to the parent
                onImageUpdate(imageUrlToUse, file);
              } catch (err) {
                console.warn('Failed to recreate file from retouched image:', err);
                // Still update the image URL even if file creation fails
                onImageUpdate(imageUrlToUse);
              }
            };
            
            recreateFileFromUrl(imageUrlToUse);
            
            // Update localStorage with the retouched image URL for persistence
            try {
              localStorage.setItem('bggen_outputImage', imageUrlToUse);
            } catch (err) {
              console.warn('Failed to update localStorage in onImageUpdate:', err);
            }
          }
        } else {
          throw new Error('Unexpected result format from processImage');
        }
      } catch (apiError) {
        console.error('Process image error:', apiError);
        
        // Try fallback if direct processing fails
        try {
          console.warn('Direct processing failed, using client-side fallback');
          const fallbackResult = await processImageClientSide(imageFile, {
            ...defaultParams,
            prompt,
            imageMask: maskData,
          });
          
          if (fallbackResult && fallbackResult[0] && fallbackResult[0][0] && fallbackResult[0][0].image) {
            // Convert fallback result to blob URL
            const fallbackBlobUrl = await convertToBlobUrl(fallbackResult[0][0].image.url);
            setResultImage(fallbackBlobUrl || fallbackResult[0][0].image.url);
            
            setError('Error: ' + (apiError.message || 'Unknown error') + 
                     ' - Using client-side fallback mode with simulated results.');
          } else {
            setError('Error: ' + (apiError.message || 'Unknown error'));
          }
        } catch (fallbackError) {
          setError('Failed on both direct processing and fallback: ' + (apiError.message || 'Unknown error'));
        }
      }
    } catch (error) {
      setError('Error processing image: ' + (error.message || 'Unknown error'));
      console.error('Error in handleGenerate:', error);
    } finally {
      setIsLoading(false);
    }
  }, [convertToBlobUrl, imageSrc, maskData, prompt, tokens, user, onImageUpdate]);
  
  // Handle image loading
  useEffect(() => {
    if (!isOpen || !convertedImageSrc || !containerRef.current) return;
    
    const loadImage = () => {
      console.log('Loading image from blob URL:', convertedImageSrc);
      
      const img = new Image();
      
      img.onload = () => {
        console.log('Image loaded successfully from blob URL');
        imageObjRef.current = img;
        
        // Wait for next frame to ensure container is properly sized
        requestAnimationFrame(() => {
          const dimensions = setupCanvas(img, containerRef.current);
          
          if (renderImage(img, dimensions)) {
            setCanvasSize(dimensions);
          }
        });
      };
      
      img.onerror = (err) => {
        console.error("Failed to load image from blob URL", err);
        setError("Failed to load image. Please try again with a different image.");
      };
      
      img.src = convertedImageSrc;
    };
    
    loadImage();
  }, [isOpen, convertedImageSrc, setupCanvas, renderImage]);
  
  // Handle mouse move and up events
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDrawing && maskCanvasRef.current) {
        const coords = getCanvasCoordinates(e, maskCanvasRef.current);
        
        const boundedCoords = {
          x: Math.min(Math.max(0, coords.x), canvasSize.width),
          y: Math.min(Math.max(0, coords.y), canvasSize.height)
        };
        
        setCursorPosition(boundedCoords);
        draw(e);
      }
    };

    const handleMouseUp = () => {
      if (isDrawing) {
        stopDrawing();
      }
    };

    if (isDrawing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDrawing, canvasSize.width, canvasSize.height, getCanvasCoordinates, draw, stopDrawing]);
  
  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (imageObjRef.current && containerRef.current) {
        const dimensions = setupCanvas(imageObjRef.current, containerRef.current);
        
        if (renderImage(imageObjRef.current, dimensions)) {
          setCanvasSize(dimensions);
        }
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [setupCanvas, renderImage]);
  
  // Clean up blob URLs on unmount or when modal closes
  useEffect(() => {
    return () => {
      if (convertedImageSrc) {
        URL.revokeObjectURL(convertedImageSrc);
      }
      if (resultImage && resultImage.startsWith('blob:')) {
        URL.revokeObjectURL(resultImage);
      }
    };
  }, [convertedImageSrc, resultImage]);

  // Early return if modal is not open
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center overflow-hidden backdrop-blur-sm">
      {/* Close button */}
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 z-10 p-2 rounded-full bg-gray-800/80 hover:bg-gray-700 transition-colors"
      >
        <X className="w-6 h-6 text-white" />
      </button>

      <div className="flex flex-col w-[90%] max-w-5xl h-[90%] bg-gray-900/70 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div>
            <h2 className="text-xl font-semibold text-white">Retouch</h2>
            <p className="text-xs text-gray-400 mt-1">
              Select areas to retouch using brush & eraser tools, then add a descriptive prompt
            </p>
          </div>
          
          {/* Clear button */}
          <button
            onClick={clearCanvas}
            className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white text-sm rounded-md transition-colors"
          >
            Clear Canvas
          </button>
        </div>

        {/* Main content */}
        <div className="flex-grow flex flex-col p-4 overflow-hidden">
          {/* Image editor area */}
          <div ref={containerRef} className="relative flex-grow border border-gray-800 rounded-xl mb-4 overflow-hidden flex items-center justify-center bg-gray-950">
            {resultImage ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <img 
                  src={resultImage} 
                  alt="Retouched image" 
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            ) : (
              <div 
                className="relative flex items-center justify-center" 
                style={{ 
                  transform: `scale(${zoom / 100})`,
                  transformOrigin: 'center',
                  width: canvasSize.width > 0 ? `${canvasSize.width}px` : 'auto',
                  height: canvasSize.height > 0 ? `${canvasSize.height}px` : 'auto',
                  transition: 'transform 0.2s ease-out'
                }}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <canvas
                    ref={imageCanvasRef}
                    className="absolute top-0 left-0"
                    style={{
                      boxShadow: '0 0 10px rgba(0, 0, 0, 0.3)'
                    }}
                  />
                  <canvas
                    ref={maskCanvasRef}
                    className="absolute top-0 left-0"
                    onMouseDown={startDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onMouseUp={stopDrawing}
                    onTouchEnd={stopDrawing}
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
                  />
                </div>
                
                {/* Custom cursor */}
                {(isCanvasHovered || isDrawing) && (
                  <div
                    className="absolute pointer-events-none"
                    style={{
                      width: brushSize,
                      height: brushSize,
                      borderRadius: '50%',
                      left: cursorPosition.x - brushSize/2,
                      top: cursorPosition.y - brushSize/2,
                      border: `2px solid ${activeTool === 'eraser' ? '#ff6666' : '#ffffff'}`,
                      backgroundColor: activeTool === 'eraser' ? 'rgba(255, 102, 102, 0.15)' : 'rgba(255, 255, 255, 0.15)', 
                      boxShadow: activeTool === 'eraser' ? '0 0 1px 1px rgba(0, 0, 0, 0.2)' : '0 0 1px 1px rgba(0, 0, 0, 0.7)',
                      zIndex: 100
                    }}
                  />
                )}
              </div>
            )}

            {/* Loading overlay */}
            {isLoading && (
              <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
                  <p className="text-white">Processing...</p>
                </div>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-red-500/80 text-white px-4 py-2 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Tools overlay */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-gray-900/80 p-2 rounded-lg backdrop-blur-sm border border-gray-800">
              <button 
                onClick={() => setActiveTool('brush')}
                className={`p-2 rounded-md ${activeTool === 'brush' ? 'bg-purple-600' : 'bg-gray-800 hover:bg-gray-700'}`}
              >
                <Brush className="w-5 h-5 text-white" />
              </button>
              <button 
                onClick={() => setActiveTool('eraser')}
                className={`p-2 rounded-md ${activeTool === 'eraser' ? 'bg-red-600' : 'bg-gray-800 hover:bg-gray-700'}`}
              >
                <Eraser className="w-5 h-5 text-white" />
              </button>
              
              {/* Brush size control */}
              <div className="h-6 border-l border-gray-700 mx-1"></div>
              <input 
                type="range" 
                min="5" 
                max="50" 
                value={brushSize}
                onChange={(e) => setBrushSize(parseInt(e.target.value))}
                className="w-24 accent-purple-500"
              />
              <span className="text-white text-xs">{brushSize}px</span>
              
              {/* Zoom controls */}
              <div className="h-6 border-l border-gray-700 mx-1"></div>
              <button 
                onClick={decreaseZoom}
                className="p-2 rounded-md bg-gray-800 hover:bg-gray-700"
              >
                <Minus className="w-5 h-5 text-white" />
              </button>
              <span className="text-white text-sm min-w-[48px] text-center">{zoom}%</span>
              <button 
                onClick={increaseZoom}
                className="p-2 rounded-md bg-gray-800 hover:bg-gray-700"
              >
                <Plus className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Prompt input and generate button */}
          <div className="flex flex-col gap-4">
            <div className="flex gap-4">
              <div className="flex-grow relative">
                <input
                  type="text"
                  placeholder="Describe what you want to retouch"
                  className="w-full px-4 py-3 bg-gray-800/70 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
              </div>
              <button 
                onClick={handleGenerate}
                disabled={isLoading || !maskData}
                className={`px-6 py-3 ${
                  isLoading || !maskData 
                    ? 'bg-gray-700 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600'
                } text-white font-medium rounded-lg flex items-center gap-2 transition-colors`}
              >
                Generate
                {isLoading && (
                  <span className="flex h-4 w-4 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-white opacity-90"></span>
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RetouchModal;