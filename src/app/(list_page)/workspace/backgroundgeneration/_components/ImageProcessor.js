"use client";

import { useState, useCallback, useEffect, useRef, Suspense } from "react";
import { processImage } from '@/lib/huggingface/client';
import { defaultParams, parameterDefinitions } from '@/lib/huggingface/clientConfig';
import { saveAs } from 'file-saver';
import { templates } from '@/lib/templates';
import { useClickAway } from 'react-use';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc, increment, setDoc } from 'firebase/firestore';
import { db, storage, auth } from '@/firebase/FirebaseConfig';
import { saveToGallery } from '@/lib/saveToGallery';
import { removeImageBackground } from '@/utils/backgroundRemoval';

import { SettingsSidebar } from './SettingsSidebar';
import { TemplateGrid } from './TemplateGrid';
import { TabNavigation } from './TabNavigation';
import { GenerateButton } from './GenerateButton';
import { MobileMenuButton } from './MobileMenuButton';
import { ImageContainer } from './ImageContainer';
import { FullscreenModal } from './FullscreenModal';
import ResizePreview from "./ResizePreview";

import { useSearchParams } from 'next/navigation'; // to pull id from URL

// Create a separate component that uses useSearchParams
function SearchParamsHandler({ onParamChange }) {
  const searchParams = useSearchParams();
  
  // Use a ref to track if we've already processed the parameters
  const processedParams = useRef(false);
  
  useEffect(() => {
    // Only process parameters once to prevent infinite loops
    if (processedParams.current) return;
    
    // Check for direct prompt parameters
    const promptParam = searchParams.get('prompt');
    const negativePromptParam = searchParams.get('n_prompt');
    const categoryParam = searchParams.get('category');
    const id = searchParams.get('id');
    
    // If there are no parameters to process, exit early
    if (!promptParam && !negativePromptParam && !categoryParam && !id) {
      processedParams.current = true;
      return;
    }
    
    // Process the parameters
    if (promptParam) {
      onParamChange('prompt', promptParam);
    }
    
    if (negativePromptParam) {
      onParamChange('n_prompt', negativePromptParam);
    }
    
    if (categoryParam) {
      // If you have category-specific settings, apply them here
      console.log("Category:", categoryParam);
    }
    
    // If we've processed direct parameters, mark as done
    if (promptParam || negativePromptParam || categoryParam) {
      processedParams.current = true;
      return;
    }
    
    // Only fetch from database if we have an ID and no direct parameters
    if (id) {
      const fetchPrompt = async () => {
        try {
          const communityRef = doc(db, 'community', id);
          const communityDoc = await getDoc(communityRef);

          if (communityDoc.exists()) {
            const communityData = communityDoc.data();
            const newPrompt = communityData.prompt || '';
            const newNegative = communityData.negativePrompt || '';

            onParamChange('prompt', newPrompt);
            onParamChange('n_prompt', newNegative);
          } else {
            console.log("Prompts not found.");
          }
          // Mark as processed after fetching
          processedParams.current = true;
        } catch (error) {
          console.error("Error fetching user data: ", error);
          processedParams.current = true;
        }
      };

      fetchPrompt();
    }
  }, [searchParams, onParamChange]);
  
  return null;
}

export default function ImageProcessor() {
  // State management for the component
  const [isProcessing, setIsProcessing] = useState(false);
  const [inputPreview, setInputPreview] = useState(null);
  const [outputImage, setOutputImage] = useState(null);
  const [preprocessedImage, setPreprocessedImage] = useState(null);
  const [webpImage, setWebpImage] = useState(null);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState("");
  const [params, setParams] = useState(defaultParams);
  const [loadedTemplates, setLoadedTemplates] = useState([]);
  const [activeSidebar, setActiveSidebar] = useState('settings');
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [currentUser, setCurrentUser] = useState(null);
  const [userTokens, setUserTokens] = useState(0);
  const [insufficientTokens, setInsufficientTokens] = useState(false);
  
  //resizing state managements
  const [isResizing, setIsResizing] = useState(false);
  const [imageToResize, setImageToResize] = useState(null);
  const [resizeDimensions, setResizeDimensions] = useState({ width: 0, height: 0 });
  const [originalDimensions, setOriginalDimensions] = useState({ width: 0, height: 0 });
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  //image positioning set to  original size
  const [scalePercentage, setScalePercentage] = useState(1.0); 

  // Function to deduct tokens
  const deductTokens = async (tokenAmount = 10) => {
    if (!currentUser) return true; // Allow operation if not logged in for demo purposes
    
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userRef);
      
      // If user document doesn't exist, create one with default tokens
      if (!userSnap.exists()) {
        try {
          await setDoc(userRef, {
            tokens: 100, // Give some initial tokens
            createdAt: serverTimestamp()
          });
          setUserTokens(100);
          return true;
        } catch (error) {
          console.error('Error creating user document:', error);
          // Still allow operation even if token management fails
          return true;
        }
      }
      
      const userData = userSnap.data();
      const availableTokens = userData.tokens || 0;
      
      // Check if user has enough tokens
      if (availableTokens < tokenAmount) {
        setInsufficientTokens(true);
        setError("Insufficient tokens. Please purchase more tokens to continue.");
        // Still allow for demo purposes
        return true;
      }
      
      // Try to update tokens, but handle errors gracefully
      try {
        await updateDoc(userRef, {
          tokens: increment(-tokenAmount)
        });
        setUserTokens(availableTokens - tokenAmount);
      } catch (error) {
        console.error('Error updating tokens:', error);
        // Proceed anyway - don't block the main functionality
      }
      
      return true;
    } catch (error) {
      console.error('Error in token management:', error);
      // Fall back to allowing the operation even if token system fails
      return true;
    }
  };
  
  // Fetch user tokens with better error handling
  const fetchUserTokens = async () => {
    if (!currentUser) return;
    
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        setUserTokens(userData.tokens || 0);
        setInsufficientTokens(userData.tokens < 10);
      } else {
        // If user document doesn't exist, set default tokens
        try {
          await setDoc(userRef, {
            tokens: 100,
            createdAt: serverTimestamp()
          });
          setUserTokens(100);
        } catch (error) {
          console.error('Error creating initial user document:', error);
          // Don't block the app functionality
        }
      }
    } catch (error) {
      console.error('Error fetching user tokens:', error);
      // Set some default tokens to avoid UI issues
      setUserTokens(100);
    }
  };
  
  // Update Firebase auth listener to also fetch tokens
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      setCurrentUser(user);
      if (user) {
        fetchUserTokens();
      }
    });
    
    return () => unsubscribe();
  }, []);

  //handles image positioning
  const handleScaleChange = (value) => {
    const floatValue = parseFloat(value) || 0;
    setScalePercentage(floatValue);
    
    const scaledWidth = Math.round(originalDimensions.width * floatValue);
    const scaledHeight = Math.round(originalDimensions.height * floatValue);
    
    const x = (originalDimensions.width - scaledWidth) / 2;
    const y = (originalDimensions.height - scaledHeight) / 2;
    
    //updates determines the position the scaled image in the original container
    setImagePosition({ x, y });
  };

  // Set up the global resize callbacks for mouse wheel support
  useEffect(() => {
    // Create global callback object for wheel resize
    window.resizeCallbacks = {
      onScaleChange: (newScale) => handleScaleChange(newScale)
    };
    
    return () => {
      // Clean up when component unmounts
      window.resizeCallbacks = null;
    };
  }, []);

  //keep the original image when user clicks on 'cancel'
  const closeResizeModal = () => {
    setIsResizing(false);
    setImageToResize(null);
  };

  //convert dataURL to file object (purpose of this is to keep the resized image is properly uploaded when user modifies the size, if not it will generate the originial instead of resized)
  const dataURLtoFile = (dataurl, filename) => {
    //spliting the data URL and base64 encoded data
    const arr = dataurl.split(',');
    // searches for this - data:image/png;base64 and extracts image/png
    const mime = arr[0].match(/:(.*?);/)[1];
    //decode base 64encoded dat a
    const bstr = atob(arr[1]);
    let n = bstr.length;
    //stores 8-bit of unsigned int
    const u8arr = new Uint8Array(n);
    //assigns value, converting to raw binary data
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    //create file like file name and type
    return new File([u8arr], filename, { type: mime });
  };
  
  //resize function
  const applyResize = async () => {
    try {
      //canvas with modified size
      const canvas = document.createElement('canvas');
      canvas.width = originalDimensions.width;
      canvas.height = originalDimensions.height;
      
      const ctx = canvas.getContext('2d');
      
      //transparent background
      ctx.fillStyle = 'transparent';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const img = new window.Image();
      img.onload = () => {
        //center image on canvas 
        const scaledWidth = Math.round(originalDimensions.width * scalePercentage);
        const scaledHeight = Math.round(originalDimensions.height * scalePercentage);

        const x = imagePosition.x;
        const y = imagePosition.y;

        ctx.drawImage(
          img, 
          0, 0, originalDimensions.width, originalDimensions.height,
          x, y, scaledWidth, scaledHeight
        );
                
        const resizedImageUrl = canvas.toDataURL('image/png');      
        //convert data URL to File object for API processing
        const resizedImageFile = dataURLtoFile(resizedImageUrl, 'resized-image.png');

        //resize input 
        if (imageToResize === inputPreview) {
          //updates input with new resized URL
          setInputPreview(resizedImageUrl);
          //updates the selected file to sized
          setSelectedFile(resizedImageFile);
        } else if (imageToResize === outputImage) {
          setOutputImage(resizedImageUrl);
        }
        
        closeResizeModal();
      };
      img.src = imageToResize;
    } catch (error) {
      console.error('Error resizing canvas:', error);
    }
  };

  //updates the new position coordinates
  const handlePositionChange = (position) => {
    setImagePosition(position);
  };

  const handleResize = (imageSrc) => {
    setImageToResize(imageSrc);
    
    const img = new window.Image();
    img.onload = () => {
      //get the original image size
      const originalWidth = img.width;
      const originalHeight = img.height;
      
      //stores the original image
      setOriginalDimensions({ 
        width: originalWidth, 
        height: originalHeight 
      });

      setScalePercentage(1.0);

      //set the original resize to original size
      setResizeDimensions({ 
        width: originalWidth, 
        height: originalHeight 
      });
      
      setIsResizing(true);
    };
    img.src = imageSrc;
  };

  const sidebarRef = useRef();

  useClickAway(sidebarRef, () => {
    if (window.innerWidth < 1024 && isSidebarOpen) {
      setIsSidebarOpen(false);
    }
  });

  // Fetch templates on component mount
  useEffect(() => {
    setLoadedTemplates(templates);
    console.log("Loaded templates:", templates);
  }, []);




  // Creates a preview of the uploaded image
  const createInputPreview = useCallback((file) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setInputPreview(reader.result);
    };
    reader.readAsDataURL(file);//convert to base64
  }, []);

  // Handles background removal for the uploaded image
  const removeImageBackgroundLocal = async (file) => {
    try {
      setStatus("Removing background...");
      
      // Just forward to the imported utility
      const processedFile = await removeImageBackground(file, (percentage, key) => {
        setStatus(`Removing background: ${percentage}% (${key})`);
      });
      
      setStatus("Background removed successfully");
      return processedFile;
    } catch (error) {
      console.error("Error removing background:", error);
      setStatus("Background removal failed, using original image");
      return file; // Return original file if background removal fails
    }
  };

  // Generates a random seed between 1 and 100000
  const generateRandomSeed = () => {
    const randomSeed = Math.floor(Math.random() * 100000) + 1;
    handleParamChange('seed', randomSeed.toString());
  };

  // Handles changes to any parameter
  const handleParamChange = useCallback((id, value) => {
    setParams(prev => ({
      ...prev,
      [id]: value
    }));
  }, []); // Empty dependency array to ensure function remains stable

  // Main function to process the image with current parameters
  const processImageWithParams = async (file) => {
    if (!file) return;

    // Reset states and show processing status
    setIsProcessing(true);
    setError(null);
    setOutputImage(null);
    setPreprocessedImage(null);
    setWebpImage(null);
    setStatus("Starting processing...");

    createInputPreview(file);

    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Please upload an image file');
      }

      setStatus("Processing with Hugging Face...");
      const result = await processImage(file, params);
      
      // Handle the response from Hugging Face
      if (Array.isArray(result) && result.length >= 2) {
        const [imageArray, webpResult] = result;
        
        if (Array.isArray(imageArray) && imageArray.length >= 2) {
          if (imageArray[0]?.image?.url) {
            setOutputImage(imageArray[0].image.url);
          }
          if (imageArray[1]?.image?.url) {
            setPreprocessedImage(imageArray[1].image.url);
          }
        }
        
        if (webpResult?.url) {
          setWebpImage(webpResult.url);
        }
      }

      setStatus("Processing complete!");
    } catch (error) {
      console.error("Error processing image:", error);
      setError(error.message || "Failed to process image");
      setStatus("Processing failed");
    } finally {
      setIsProcessing(false);
    }
  };

  // Modified handleImageUpload
  const handleImageUpload = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setStatus("Processing image...");
      setSelectedFile(file);
      createInputPreview(file);
      setStatus("Image uploaded successfully");
    }
  }, [createInputPreview]);

  // Modified handleGenerate with better error handling
  const handleGenerate = async () => {
    if (!selectedFile) {
      setError("Please upload an image first");
      return;
    }
    
    // Locked token for unsubscribed users
    if (currentUser) {
      const userRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();
      
      if (userData.subscriptionStatus === 'inactive' && userData.lockedTokens > 0) {
        setError("Your credits are currently locked. Please subscribe to a plan to keep using this feature.");
        setIsProcessing(false);
        return;
      }
    }

    // Token checking with fallbacks
    try {
      // Try to deduct tokens but don't block generation if it fails
      await deductTokens(10);
    } catch (tokenError) {
      console.error("Token system error:", tokenError);
      // Continue anyway - don't block core functionality
    }

    // Reset states
    setIsProcessing(true);
    setError(null);
    setOutputImage(null);
    setPreprocessedImage(null);
    setWebpImage(null);
    setStatus("Starting processing...");

    try {
      // First remove background from the image
      setStatus("Removing background...");
      let fileToProcess = selectedFile;
      
      try {
        console.log("Starting background removal with file:", selectedFile.name, "size:", selectedFile.size);
        
        // Define progress callback
        const handleBgProgress = (percentage, key) => {
          console.log(`Background removal progress: ${percentage}% (${key})`);
          setStatus(`Removing background: ${percentage}%`);
        };
        
        // Remove background using our imported utility
        fileToProcess = await removeImageBackground(selectedFile, handleBgProgress);
        
        console.log("Background removal successful, got processed file:", fileToProcess.name, "size:", fileToProcess.size);
        setStatus("Background removed, now generating image...");
        
        // Create a preview of the background-removed image (optional)
        const reader = new FileReader();
        reader.onloadend = () => {
          console.log("Preview updated with background-removed image");
          setInputPreview(reader.result);
        };
        reader.readAsDataURL(fileToProcess);
        
      } catch (bgError) {
        console.error("Background removal failed, continuing with original image:", bgError);
        setStatus("Background removal failed, proceeding with original image...");
        // Continue with original image if background removal fails
      }

      setStatus("Processing with Hugging Face...");
      const result = await processImage(fileToProcess, params);
      
      // Handle the response
      if (Array.isArray(result) && result.length >= 2) {
        const [imageArray, webpResult] = result;
        
        if (Array.isArray(imageArray) && imageArray.length >= 2) {
          if (imageArray[0]?.image?.url) {
            setOutputImage(imageArray[0].image.url);
            // Auto-save to gallery if the user is logged in
            if (currentUser) {
              try {
                // Extract prompts from current parameters for metadata
                const additionalData = {
                  positivePrompt: params.prompt && params.prompt.trim() ? params.prompt : null,
                  negativePrompt: params.negativePrompt || "watermark, text, Logo, wrong color"
                };
                
                await saveToGallery(
                  imageArray[0].image.url, 
                  currentUser.uid, 
                  'background-generated', 
                  additionalData
                );
              } catch (saveError) {
                console.error("Error saving to gallery:", saveError);
                // Continue anyway - don't block the image generation
              }
            }
          }
          if (imageArray[1]?.image?.url) {
            setPreprocessedImage(imageArray[1].image.url);
          }
        }
        
        if (webpResult?.url) {
          setWebpImage(webpResult.url);
        }
      }

      setStatus("Processing complete!");
    } catch (error) {
      console.error("Error processing image:", error);
      setError(error.message || "Failed to process image");
      setStatus("Processing failed");
      
      // No need to try refunding tokens - it might cause more errors
    } finally {
      setIsProcessing(false);
    }
  };

  // Modified clearImage
  const clearImage = () => {
    setSelectedFile(null);
    setInputPreview(null);
    setOutputImage(null);
    setPreprocessedImage(null);
    setWebpImage(null);
    setError(null);
    setStatus("");
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  // Modified template selection handler
  const handleTemplateSelect = (template) => {
    handleParamChange('prompt', template.prompt);
    setSelectedTemplateId(template.id);
  };

  // Modified template generate handler
  const handleTemplateGenerate = (template) => {
    handleTemplateSelect(template);
    handleGenerate();
  };

  // Add these utility functions
  const handleDownload = async (url) => {
    try {
      const response = await fetch(url, { mode: 'cors' });
      if (!response.ok) throw new Error('Failed to fetch image');
      
      const blob = await response.blob();
      const filename = `generated-image-${Date.now()}.${blob.type.split('/')[1] || 'png'}`;
      
      saveAs(blob, filename);
    } catch (error) {
      console.error('Download failed:', error);
      setError('Failed to download image. Please try again.');
    }
  };

  const openFullscreen = (imageUrl) => {
    setFullscreenImage(imageUrl);
    setIsFullscreen(true);
  };

  const closeFullscreen = () => {
    setIsFullscreen(false);
    setFullscreenImage(null);
  };

  // Component UI
  return (
    <div className="h-full flex bg-gray-900 text-white">
      {/* Mobile menu button */}
      <MobileMenuButton 
        setIsSidebarOpen={setIsSidebarOpen} 
        isSidebarOpen={isSidebarOpen} 
      />

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className={`fixed lg:relative inset-y-0 left-0 z-40 w-80 transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 transition-transform duration-300 ease-in-out bg-gray-900 border-r border-gray-700/50`}
      >
        {/* Tab Navigation */}
        <TabNavigation 
          activeSidebar={activeSidebar} 
          setActiveSidebar={setActiveSidebar} 
        />

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto pb-4 scrollbar">
          {activeSidebar === 'settings' ? (
            <SettingsSidebar
              params={params}
              handleParamChange={handleParamChange}
              generateRandomSeed={generateRandomSeed}
              parameterDefinitions={parameterDefinitions}
              status={status}
              error={error}
              onResize={() => handleResize(inputPreview)}
              inputImage={inputPreview}
            />
          ) : (
            <TemplateGrid
              loadedTemplates={loadedTemplates}
              selectedTemplateId={selectedTemplateId}
              handleTemplateSelect={handleTemplateSelect}
            />
          )}
        </div>

        {/* Generate Button */}
        <GenerateButton 
          handleGenerate={handleGenerate} 
          isProcessing={isProcessing} 
          selectedFile={selectedFile}
          userTokens={userTokens}
          insufficientTokens={insufficientTokens} 
        />
      </div>

      {/* Image Processing Area */}
      <div className="flex-1 p-4 flex items-center justify-center">
        <div className="max-w-4xl w-full mx-auto flex flex-col lg:flex-row gap-8 justify-center">
          <ImageContainer
            imageSrc={inputPreview}
            altText="Input preview"
            onClear={clearImage}
            onFullscreen={() => openFullscreen(inputPreview)}
            uploadHandler={handleImageUpload}
            isInput={true}
            onResize={() => handleResize(inputPreview)}
          />

          <ImageContainer
            imageSrc={outputImage}
            altText="Generated output"
            onDownload={() => handleDownload(outputImage)}
            onFullscreen={() => openFullscreen(outputImage)}
            isInput={false}
          />
        </div>
      </div>


      {/* Canvas resizing - Rayna added */}
      {isResizing && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-medium text-white">Resize Background</h3>
            </div>
            
            {/* preview grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Resizing adjustable side */}
              <div className="space-y-5">
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-white">Product Size </h4>
                  <div>
                    <input
                      type="number"
                      value={scalePercentage}
                      onChange={(e) => handleScaleChange(e.target.value)}
                      className="bg-gray-700 rounded-lg px-3 py-1 text-white"
                      min="0.1"
                      max="1"
                      step="0.1"
                    /> x width
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  
                  <div className="flex space-x-4">
                    <button
                      onClick={closeResizeModal}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={applyResize}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-800 rounded-lg text-white"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Preview resized image */}
              <div className="bg-gray-900/50 rounded-lg overflow-hidden border border-gray-700/50 flex flex-col w-96">
                <div className="px-4 py-2">
                  <p className="text-sm font-medium text-white">Preview</p>
                </div>
                <div className="flex-1" style={{ minHeight: '300px' }}>
                  <ResizePreview 
                    originalDimensions={originalDimensions} 
                    newDimensions={resizeDimensions} 
                    onPositionChange={handlePositionChange}
                    scalePercentage={scalePercentage}
                    imageSrc={imageToResize}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Fullscreen Modal */}
      <FullscreenModal
        isFullscreen={isFullscreen}
        fullscreenImage={fullscreenImage}
        closeFullscreen={closeFullscreen}
      />

      {/* Add the SearchParamsHandler with Suspense */}
      <Suspense fallback={null}>
        <SearchParamsHandler onParamChange={handleParamChange} />
      </Suspense>
    </div>
  );
}