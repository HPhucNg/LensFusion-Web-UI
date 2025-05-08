import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Minus, Plus, Expand, Save } from "lucide-react";
import { auth, db, storage } from '@/firebase/FirebaseConfig';
import { doc, updateDoc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import NextImage from 'next/image';
import { generateImage } from '@/app/(list_page)/workspace/backgroundexpansion/apiHelper';
import { defaultParams, ratioSettings } from '@/app/(list_page)/workspace/backgroundexpansion/config';

// API call function for image expansion
const expandImage = async (imageData, params) => {
  try {
    console.log("Calling image expansion API with params:", params);
    
    // Call the actual server-side function to expand the image
    const resultImageData = await expandImageApi(imageData, params);
    
    if (!resultImageData) {
      throw new Error("No result received from expansion API");
    }
    
    return resultImageData;
  } catch (error) {
    console.error("Image expansion error:", error);
    throw error;
  }
};

// Save the image to user gallery
const saveToUserGallery = async (imageUrl, userId) => {
  try {
    const timestamp = Date.now();
    const filename = `background-expanded-${timestamp}.png`;
    
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
      type: 'background-expansion'
    });

    // Update localStorage to store this expanded image
    try {
      // Only store if not too large (< 2MB)
      if (imageUrl.length < 2000000) {
        localStorage.setItem('bggen_outputImage', imageUrl);
      }
    } catch (err) {
      console.warn('Failed to update localStorage with expanded image:', err);
    }

    return downloadURL;
  } catch (error) {
    console.error('Error saving to gallery:', error);
    return null;
  }
};

const ExpansionModal = ({ isOpen, onClose, imageSrc, onImageUpdate }) => {
  // State hooks
  const [params, setParams] = useState(defaultParams);
  const [ratio, setRatio] = useState('9:16');
  const [isLoading, setIsLoading] = useState(false);
  const [resultImage, setResultImage] = useState(null);
  const [prevImage, setPrevImage] = useState(null);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [tokens, setTokens] = useState(0);
  const [convertedImageSrc, setConvertedImageSrc] = useState(null);
  const [sliderPosition, setSliderPosition] = useState(50); // For before/after comparison

  // Ref hooks
  const containerRef = useRef(null);
  const imageObjRef = useRef(null);

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
      console.log('Image source URL (first 100 chars):', src.substring(0, 100) + (src.length > 100 ? '...' : ''));
      
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
      const img = new window.Image();
      
      // Create a promise that resolves when the image loads
      const imageLoaded = new Promise((resolve, reject) => {
        let timeoutId;
        
        img.onload = () => {
          if (timeoutId) clearTimeout(timeoutId);
          console.log('Image loaded successfully, dimensions:', img.width, 'x', img.height);
          resolve(img);
        };
        
        img.onerror = (err) => {
          if (timeoutId) clearTimeout(timeoutId);
          console.error('Image load error:', err);
          
          // Additional debugging info
          if (src.includes('firebasestorage')) {
            console.error('Firebase URL failed to load in Image element. Try fetch API instead.');
          } else if (src.startsWith('data:')) {
            console.error('Data URL failed to load. Possibly malformed or too large.');
          } else {
            console.error('Regular URL failed to load. Possibly CORS or network issue.');
          }
          
          reject(new Error('Failed to load image: ' + (err?.message || 'Unknown error')));
        };
        
        // Add a timeout to avoid hanging indefinitely
        timeoutId = setTimeout(() => {
          console.error('Image load timed out after 10 seconds');
          reject(new Error('Image load timed out'));
        }, 10000); // 10 second timeout
        
        // For data URLs, no need for crossOrigin
        if (!src.startsWith('data:')) {
          img.crossOrigin = 'Anonymous';
        }
        
        // Set image source and catch any immediate errors
        try {
          img.src = src;
          console.log('Set image src successfully');
        } catch (imgSrcError) {
          console.error('Error setting img.src:', imgSrcError);
          reject(imgSrcError);
        }
      });
      
      try {
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
      } catch (loadError) {
        console.error('Error in image loading process:', loadError);
        
        // Create a fallback image if the original fails to load
        try {
          console.log('Generating fallback placeholder image');
          const canvas = document.createElement('canvas');
          canvas.width = 800;
          canvas.height = 600;
          const ctx = canvas.getContext('2d');
          
          // Create a gradient background
          const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
          gradient.addColorStop(0, '#333');
          gradient.addColorStop(1, '#111');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Add text explaining the error
          ctx.font = '20px Arial';
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.fillText('Unable to load image', canvas.width/2, canvas.height/2 - 20);
          ctx.fillStyle = '#aaaaaa';
          ctx.font = '16px Arial';
          ctx.fillText('Please try again with a different image', canvas.width/2, canvas.height/2 + 20);
          
          // Create blob URL from canvas
          const fallbackBlob = await new Promise(resolve => {
            canvas.toBlob(resolve, 'image/png');
          });
          
          const fallbackUrl = URL.createObjectURL(fallbackBlob);
          console.log('Created fallback image');
          
          setError('Failed to load image. Using placeholder image instead.');
          return fallbackUrl;
        } catch (fallbackError) {
          console.error('Error creating fallback image:', fallbackError);
          throw loadError; // Re-throw the original error
        }
      }
    } catch (error) {
      console.error('Error converting to blob URL:', error);
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
      setParams(defaultParams);
      setRatio('9:16');
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
            
            // Get image dimensions and set appropriate ratio
            const img = new window.Image();
            img.onload = () => {
              const aspectRatio = img.width / img.height;
              
              // Set closest ratio based on aspect ratio
              if (Math.abs(aspectRatio - 9/16) < 0.1) {
                setRatio('9:16');
                setParams(prev => ({...prev, width: 720, height: 1280}));
              } else if (Math.abs(aspectRatio - 16/9) < 0.1) {
                setRatio('16:9');
                setParams(prev => ({...prev, width: 1280, height: 720}));
              } else if (Math.abs(aspectRatio - 1) < 0.1) {
                setRatio('1:1');
                setParams(prev => ({...prev, width: 1024, height: 1024}));
              } else {
                setRatio('custom');
                setParams(prev => ({
                  ...prev, 
                  width: Math.round(img.width / 64) * 64, // Round to multiple of 64
                  height: Math.round(img.height / 64) * 64
                }));
              }
            };
            img.src = blobUrl;
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

  // Handle ratio change
  const handleRatioChange = (e) => {
    const newRatio = e.target.value;
    setRatio(newRatio);
    
    if (newRatio === "custom") {
      // Keep current values
      setParams(prev => ({
        ...prev,
        width: prev.width,
        height: prev.height
      }));
    } else {
      // Set to predefined values
      setParams(prev => ({
        ...prev,
        width: ratioSettings[newRatio].width,
        height: ratioSettings[newRatio].height
      }));
    }
  };

  // Handle dimension changes
  const handleWidthChange = (e) => {
    const newWidth = Math.round(Number(e.target.value) / 64) * 64; // Round to nearest multiple of 64
    
    setParams(prev => ({
      ...prev,
      width: newWidth
    }));
    
    // Check if we need to switch to custom ratio
    if (newWidth !== ratioSettings[ratio]?.width) {
      setRatio('custom');
    }
  };
  
  const handleHeightChange = (e) => {
    const newHeight = Math.round(Number(e.target.value) / 64) * 64; // Round to nearest multiple of 64
    
    setParams(prev => ({
      ...prev,
      height: newHeight
    }));
    
    // Check if we need to switch to custom ratio
    if (newHeight !== ratioSettings[ratio]?.height) {
      setRatio('custom');
    }
  };

  // Handle other parameter changes
  const handleParamChange = (key, value) => {
    setParams(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Handle slider for before/after comparison
  const handleSliderMouseDown = (e) => {
    e.preventDefault();

    const onMouseMove = (moveEvent) => {
      const container = e.target.closest('.relative');
      const containerWidth = container.offsetWidth;
      const offsetX = moveEvent.clientX - container.getBoundingClientRect().left;
      const newPosition = Math.max(0, Math.min(100, (offsetX / containerWidth) * 100));
      setSliderPosition(newPosition);
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Generate styles for the before/after slider
  const generateImageStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    clipPath: `inset(0 0 0 ${sliderPosition}%)`,
    transition: 'clip-path 0.1s ease-out',
  };

  // Handle generate button click
  const handleGenerate = async () => {
    if (!convertedImageSrc) {
      setError("No image available for expansion");
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
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
        
        // Check if user has enough tokens (expansion costs 10 tokens)
        if (tokens < 10 && userData.subscriptionStatus !== 'active') {
          setError("You don't have enough credits. Please purchase more credits or subscribe.");
          setIsLoading(false);
          return;
        }
      } else {
        setError("Please log in to use this feature.");
        setIsLoading(false);
        return;
      }
      
      // Create a File object from the blob URL
      let imageFile;
      try {
        const response = await fetch(convertedImageSrc);
        const blob = await response.blob();
        imageFile = new File([blob], "source-image.png", { type: blob.type });
      } catch (fileError) {
        console.error("Failed to convert image URL to File:", fileError);
        setError("Failed to prepare image for expansion. Please try again.");
        setIsLoading(false);
        return;
      }
      
      // Prepare parameters for the API call
      const apiParams = {
        ...params,
        image: imageFile
      };
      
    //   setError("Expanding image - this may take a moment...");
      console.log("Calling generateImage with params:", apiParams);
      
      // Call the API
      const result = await generateImage(apiParams);
      
      if (result) {
        setError(null);
        
        // Update user tokens
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          tokens: tokens - 10
        });
        setTokens(prev => prev - 10);
        
        // Set both images from the result
        const { image1_base64, image2_base64 } = result;
        
        if (image1_base64) {
          setPrevImage(image1_base64);
        }
        
        if (image2_base64) {
          setResultImage(image2_base64);
          
          // Auto-save to gallery
          try {
            console.log("Auto-saving expanded image to gallery");
            const savedUrl = await saveToUserGallery(image2_base64, user.uid);
            if (!savedUrl) {
              console.warn("Auto-save to gallery failed, but expansion completed");
            } else {
              console.log("Successfully saved to gallery:", savedUrl);
            }
          } catch (saveError) {
            console.error("Error auto-saving to gallery:", saveError);
            // Don't show error to user since expansion was successful
          }
          
          // Update the parent component with the result
          if (onImageUpdate) {
            console.log('ExpansionModal calling onImageUpdate with generated image');
            
            // Create a File object from the result
            const recreateFileFromUrl = async (url) => {
              try {
                const res = await fetch(url);
                const blob = await res.blob();
                const fileName = 'expanded-image.png';
                const file = new File([blob], fileName, { type: blob.type });
                
                // Pass both the URL and File object to the parent
                onImageUpdate(image2_base64, file);
                
                // Close the modal after successful expansion and update
                onClose();
              } catch (err) {
                console.warn('Failed to recreate file from expanded image:', err);
                // Still update the image URL even if file creation fails
                onImageUpdate(image2_base64);
                
                // Close the modal after successful expansion and update
                onClose();
              }
            };
            
            recreateFileFromUrl(image2_base64);
            
            // Update localStorage with the expanded image URL for persistence
            try {
              if (image2_base64.length < 2000000) {
                localStorage.setItem('bggen_outputImage', image2_base64);
              }
            } catch (err) {
              console.warn('Failed to update localStorage in onImageUpdate:', err);
            }
          }
        } else {
          setError("Expansion completed, but no result image was returned");
        }
      } else {
        setError("Failed to expand image. No result received from the API.");
      }
    } catch (error) {
      console.error('Error in handleGenerate:', error);
      setError('Error expanding image: ' + (error.message || 'Unknown error'));
      
      // Create a simple fallback when the API fails
      if (convertedImageSrc) {
        const showFailedMessage = () => {
          try {
            const canvas = document.createElement('canvas');
            const img = new window.Image();
            
            img.onload = () => {
              canvas.width = img.width;
              canvas.height = img.height;
              const ctx = canvas.getContext('2d');
              
              // Draw the original image
              ctx.drawImage(img, 0, 0);
              
              // Add a semi-transparent overlay
              ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
              ctx.fillRect(0, img.height - 40, img.width, 40);
              
              // Add text
              ctx.fillStyle = 'white';
              ctx.font = '16px Arial';
              ctx.textAlign = 'center';
              ctx.fillText('Expansion failed - using original image', img.width / 2, img.height - 15);
              
              setPrevImage(convertedImageSrc);
              setResultImage(canvas.toDataURL('image/png'));
            };
            
            img.src = convertedImageSrc;
          } catch (fallbackError) {
            console.error('Error creating fallback image:', fallbackError);
          }
        };
        
        showFailedMessage();
      }
    } finally {
      setIsLoading(false);
    }
  };

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
      {/* Close button in absolute position */}
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
            <h2 className="text-xl font-semibold text-white">Expand Image</h2>
            <p className="text-xs text-gray-400 mt-1">
              Configure the expansion settings and generate an expanded version of your image
            </p>
          </div>
          
          {/* Add close button in header */}
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Main content */}
        <div className="flex-grow flex flex-col md:flex-row gap-6 p-6 overflow-auto">
          {/* Left side - Image preview */}
          <div className="md:w-2/3 flex flex-col h-full">
            <div ref={containerRef} className="relative flex-grow border border-gray-800 rounded-xl mb-4 overflow-hidden flex items-center justify-center bg-gray-950">
              {resultImage ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  {/* Before image */}
                  {prevImage && (
                    <img 
                      src={prevImage}
                      alt="Before expansion"
                      className="absolute w-full h-full object-contain"
                    />
                  )}
                  
                  {/* After image with clip path for slider effect */}
                  <img 
                    src={resultImage}
                    alt="Expanded image"
                    className="absolute w-full h-full object-contain"
                    style={generateImageStyle}
                  />
                  
                  {/* Slider control */}
                  <div
                    className="w-1 h-full bg-blue-400 absolute top-0 left-0 z-10 cursor-ew-resize"
                    style={{ left: `${sliderPosition}%` }}
                    onMouseDown={handleSliderMouseDown}
                  />
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center p-6">
                  <img
                    src={convertedImageSrc || '/placeholder-image.png'}
                    alt="Preview image"
                    className="max-w-full max-h-full object-contain rounded-md"
                  />
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
            </div>
          </div>
          
          {/* Right side - Settings */}
          <div className="md:w-1/3 flex flex-col space-y-6">
            {/* Aspect Ratio */}
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-white">Aspect Ratio</h3>
              <select
                value={ratio}
                onChange={handleRatioChange}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
              >
                <option value="9:16">9:16 (Portrait)</option>
                <option value="16:9">16:9 (Landscape)</option>
                <option value="1:1">1:1 (Square)</option>
                <option value="custom">Custom</option>
              </select>
              
              {/* Custom dimensions input */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Width</label>
                  <input
                    type="number"
                    value={params.width}
                    onChange={handleWidthChange}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                    min="512"
                    max="2048"
                    step="64"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Height</label>
                  <input
                    type="number"
                    value={params.height}
                    onChange={handleHeightChange}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                    min="512"
                    max="2048"
                    step="64"
                  />
                </div>
              </div>
            </div>
            
            {/* Expansion Settings */}
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-white">Expansion Settings</h3>
              
              {/* Overlap percentage */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Overlap (%)</label>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={params.overlap_percentage}
                  onChange={(e) => handleParamChange('overlap_percentage', Number(e.target.value))}
                  className="w-full accent-purple-500"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>0%</span>
                  <span>{params.overlap_percentage}%</span>
                  <span>50%</span>
                </div>
              </div>
              
              {/* Inference steps */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Inference Steps</label>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={params.num_inference_steps}
                  onChange={(e) => handleParamChange('num_inference_steps', Number(e.target.value))}
                  className="w-full accent-purple-500"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>1</span>
                  <span>{params.num_inference_steps}</span>
                  <span>20</span>
                </div>
              </div>
              
              {/* Resize Option */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Resize Option</label>
                <select
                  value={params.resize_option}
                  onChange={(e) => handleParamChange('resize_option', e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                >
                  <option value="Full">Full</option>
                  <option value="Crop">Crop</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>
              
              {/* Alignment */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Alignment</label>
                <select
                  value={params.alignment}
                  onChange={(e) => handleParamChange('alignment', e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                >
                  <option value="Middle">Middle</option>
                  <option value="Top">Top</option>
                  <option value="Bottom">Bottom</option>
                  <option value="Left">Left</option>
                  <option value="Right">Right</option>
                </select>
              </div>
              
              {/* Overlap toggles */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-400 mb-1">Overlap Edges</label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center space-x-2 text-sm text-gray-300">
                    <input
                      type="checkbox"
                      checked={params.overlap_left}
                      onChange={(e) => handleParamChange('overlap_left', e.target.checked)}
                      className="rounded text-purple-500 focus:ring-purple-500"
                    />
                    <span>Left</span>
                  </label>
                  <label className="flex items-center space-x-2 text-sm text-gray-300">
                    <input
                      type="checkbox"
                      checked={params.overlap_right}
                      onChange={(e) => handleParamChange('overlap_right', e.target.checked)}
                      className="rounded text-purple-500 focus:ring-purple-500"
                    />
                    <span>Right</span>
                  </label>
                  <label className="flex items-center space-x-2 text-sm text-gray-300">
                    <input
                      type="checkbox"
                      checked={params.overlap_top}
                      onChange={(e) => handleParamChange('overlap_top', e.target.checked)}
                      className="rounded text-purple-500 focus:ring-purple-500"
                    />
                    <span>Top</span>
                  </label>
                  <label className="flex items-center space-x-2 text-sm text-gray-300">
                    <input
                      type="checkbox"
                      checked={params.overlap_bottom}
                      onChange={(e) => handleParamChange('overlap_bottom', e.target.checked)}
                      className="rounded text-purple-500 focus:ring-purple-500"
                    />
                    <span>Bottom</span>
                  </label>
                </div>
              </div>
            </div>
            
            {/* Generate button */}
            <button 
              onClick={handleGenerate}
              disabled={isLoading}
              className={`px-6 py-3 ${
                isLoading 
                  ? 'bg-gray-700 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600'
              } text-white font-medium rounded-lg flex items-center justify-center gap-2 transition-colors mt-auto`}
            >
              {isLoading ? 'Processing...' : 'Expand Image'}
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
  );
};

export default ExpansionModal; 