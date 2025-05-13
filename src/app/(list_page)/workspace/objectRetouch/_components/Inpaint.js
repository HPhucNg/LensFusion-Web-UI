"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { processImage } from '@/lib/huggingfaceInpaint/client';
import { defaultParams } from '@/lib/huggingfaceInpaint/clientConfig';
import { saveAs } from 'file-saver';

import { ImageContainer } from './ImageContainer';
import { PromptField } from './PromptField';
import { FullscreenModal } from './FullscreenModal'
import BrushTool from './BrushTool';
import DrawingTools from './DrawingTools';

import { auth, db, storage } from '@/firebase/FirebaseConfig';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { updateUserTokens } from "@/firebase/firebaseUtils";

const saveToUserGallery = async (imageUrl, userId) => {
  try {
    const timestamp = Date.now();
    const filename = `object-retouched-${timestamp}.png`;
    
    const storageRef = ref(storage, `user_images/${userId}/${filename}`);
    
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    
    await uploadBytes(storageRef, blob);
    const downloadURL = await getDownloadURL(storageRef);
    
    const userImageRef = collection(db, 'user_images');
    await addDoc(userImageRef, {
      userID: userId,
      img_data: downloadURL,
      createdAt: serverTimestamp(),
      type: 'object-retouched'
    });

    return true;
  } catch (error) {
    console.error('Error saving to gallery:', error);
    return false;
  }
};

export default function Inpaint() {
  const [user, setUser] = useState(null);
  const [tokens, setTokens] = useState(0);
  const [freeTrialTokens, setFreeTrialTokens] = useState(0);
  const [success, setSuccess] = useState(null);

  //inpainting states
  const [params, setParams] = useState(defaultParams);
  const [selectedFile, setSelectedFile] = useState(null);
  const [inputPreview, setInputPreview] = useState(null);
  const [outputImage, setOutputImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState(null);

  //brush Tool states
  const [brushSize, setBrushSize] = useState(20); 
  const [isEraser, setIsEraser] = useState(false);

  //mask states
  const [maskData, setMaskData] = useState(null);
  const [processableImageData, setProcessableImageData] = useState(null);

  const useBrushTool = useRef(null);

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

  // Canvas Drawing functionality
  const handleUseBrushTool = useCallback((methods) => {
    useBrushTool.current = methods;
  }, []);

  //get mask data
  const handleMaskCreated = ({ imageData, maskData }) => {    
    setProcessableImageData(imageData);
    setMaskData(maskData);
  };

  // Handle Mask reset
  const clearMask = () => {
    setMaskData(null);
    setProcessableImageData(null);
    setError(null);
    
    if (useBrushTool.current && typeof useBrushTool.current.resetCanvas === 'function') {
      const success = useBrushTool.current.resetCanvas();
      if (!success) {
        setError('Reset mask failed.');
      }
    } else {
      setError('Reset mask failed: Brush tool not available.');
    }
  };

  //preview uploaded input image
  const createInputPreview = useCallback((file) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setInputPreview(reader.result);
    };
    reader.readAsDataURL(file); //base64
  }, []);
  
  // Generates a random seed between 1 and 100000
  const generateRandomSeed = () => {
    const randomSeed = Math.floor(Math.random() * 100000) + 1;
    handleParamChange('seed', randomSeed.toString());
  };

  // Handles changes to any parameter
  const handleParamChange = (id, value) => {
    setParams(prev => ({
      ...prev,
      [id]: value
    }));
  };

  //image uploaded
  const handleImageUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      createInputPreview(file); //base64

      //reset when new images uploaded
      setMaskData(null);
      setProcessableImageData(null);
    }
  }, [createInputPreview]);

  // extract image URL
  const extractImageUrl = (result) => {
    if (!result || typeof result !== 'object') return null;
    
    if (Array.isArray(result) && result.length >= 1) {
      const [imageArray] = result;
      
      if (Array.isArray(imageArray) && imageArray.length > 0) {
        const firstImage = imageArray[0];
        return firstImage?.image?.originalUrl || null;
      }
    }
    
    return result?.image?.originalUrl || result?.originalUrl || null;
  };

  //convert data URL to File
  const dataURLtoFile = (dataURL, filename) => {    
    try {
      const arr = dataURL.split(',');      
      if (arr.length < 2) {
        return null;
      }
      
      const mimeMatch = arr[0].match(/:(.*?);/);
      if (!mimeMatch) {
        return null;
      }
      
      const mime = mimeMatch[1];
      const bstr = atob(arr[1]);
      
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const file = new File([u8arr], filename, { type: mime });
      return file;
    } catch (error) {
      setError("File URL conversion error.");
      return null;
    }
  };

  //handle generate image
  const handleGenerate = async () => {
    const requiredTokens = 3;

    // Error handling for tokens
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();
      
      if (userData.subscriptionStatus === 'inactive' && userData.tokens < requiredTokens) {
        setError("You don't have enough credits. Please subscribe to continue.");
        setIsProcessing(false);
        return;
      }
      
      if (userData.subscriptionStatus === 'inactive' && userData.lockedTokens > 0) {
        setError("Your credits are currently locked. Please subscribe to a plan to keep using this feature.");
        setIsProcessing(false);
        return;
      }
    }

    // Update tokens
    const updatedTokens = await updateUserTokens(user.uid, requiredTokens);
    if (updatedTokens) {
      setTokens(updatedTokens.newTotalTokens);
      setFreeTrialTokens(updatedTokens.newFreeTrialTokens);
    }
    
    // Reset states
    setIsProcessing(true);
    setError(null);
    setOutputImage(null);
  
    try {
      const processParams = { ...params, responseType: 'base64' };

      // create URL for both mask and image
      if (maskData && processableImageData) {
        const backgroundImage = dataURLtoFile(processableImageData, 'background.png');
        const maskImage = dataURLtoFile(maskData, 'mask.png');
        
        processParams.imageMask = {
          background: backgroundImage,
          layers: [maskImage],
          composite: backgroundImage
        };
      }
      const fileToProcess = selectedFile || (inputPreview ? dataURLtoFile(inputPreview, 'input.png') : null);
      
      const result = await processImage(fileToProcess, processParams);
    
      const imageUrl = extractImageUrl(result);

      if (imageUrl) {
        setOutputImage(imageUrl);
        setStatus("Image generated successfully");
      } else {
        setError("Could not extract image URL from response");
      }
      
      const saved = await saveToUserGallery(imageUrl, user.uid);
      if (saved) {
        setSuccess('Image processed and saved to your gallery successfully!');
      }
    } catch (error) {
      setError(error.message || "Failed to process image");
      setStatus("Processing failed");
    } finally {
      setIsProcessing(false);
    }
  };

  // clear image
  const clearImage = () => {
    setSelectedFile(null);
    setInputPreview(null);
    setOutputImage(null);
    setMaskData(null);
    setProcessableImageData(null);
    setError(null);
    setStatus("");
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) {
      fileInput.value = '';
    }
  };
  
  //handle download of generated image
  const handleDownload = () => {
    if (outputImage) {
      if (outputImage.startsWith('data:')) {
        // It's a data URL, can download directly
        const link = document.createElement('a');
        link.href = outputImage;
        link.download = `object-retouched-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        console.log('Downloaded image from data URL');
      } else if (outputImage.startsWith('http')) {
        // It's a remote URL, need to fetch it first
        fetch(outputImage)
          .then(response => response.blob())
          .then(blob => {
            saveAs(blob, `object-retouched-${Date.now()}.png`);
            console.log('Downloaded image from remote URL');
          })
          .catch(err => {
            console.error('Failed to download image:', err);
            setError('Failed to download image');
          });
      } else {
        console.error("Unknown image URL format:", outputImage.substring(0, 30) + "...");
        setError("Cannot download image: unknown format");
      }
    } else {
      console.error("No image available to download");
      setError("No image available to download");
    }
  };

  //fullscreen when open image
  const openFullscreen = (imageUrl) => {
    //imageURL -> data:image/webp;base64 format
    setFullscreenImage(imageUrl);
    setIsFullscreen(true);
  };

  //close full screen
  const closeFullscreen = () => {
    setIsFullscreen(false);
    setFullscreenImage(null);
  };

  return (
    <div className="w-full p-4 sm:p-6 lg:p-8 bg-[var(--card-background)] dark:bg-gradient-to-br from-gray-900 to-black text-white">
      <h1 className="text-3xl font-bold mb-4 bg-clip-text" style={{
        background: 'linear-gradient(to right,#a78bfa, #3b82f6)', // purple-400 to blue-500
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }}>
        AI Object Retouch
      </h1>

      <div className="pt-4 px-4 pb-2 rounded-xl backdrop-blur-sm bg-gradient-to-r from-gray-900 via-gray-900 to-gray-900  dark:bg-gray-800/50 border border-[var(--border-gray)]">
      {/* Prompt field */}
        <PromptField
          params={params}
          handleParamChange={handleParamChange}
          generateRandomSeed={generateRandomSeed}
          status={status}
          error={error}
        />
      </div>

      {/* Drawing tools */}
      <div className="mt-4 mb-4">
        <DrawingTools 
          isEraser={isEraser}
          setIsEraser={setIsEraser}
          brushSize={brushSize}
          setBrushSize={setBrushSize}
          clearMask={clearMask}
          handleGenerate={handleGenerate}
          isProcessing={isProcessing}
          selectedFile={selectedFile}
          maskData={maskData}
        />
      </div>
      

      {/* Image Processing Area */}
      <div className="flex-1">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {inputPreview ? (
      <div className="group relative flex-1 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300">
        <div className="h-full w-full flex flex-col items-center justify-center rounded-xl backdrop-blur-sm">
          <div className="relative w-full h-[500px] flex items-center justify-center rounded-lg overflow-hidden bg-gray-800/40 px-4 py-4">
            {/* BrushTool */}
            <BrushTool 
              inputImage={inputPreview} 
              onMaskCreated={handleMaskCreated}
              initialSize={brushSize}
              initialColor="#ffffff"
              isEraser={isEraser}
              maxWidth={800}  
              maxHeight={500} 
              onReady={handleUseBrushTool} 
            />
            
            <div className="absolute top-4 right-4 flex gap-2 z-50">
              <button
                onClick={() => openFullscreen(inputPreview)}
                className="p-2 bg-gray-900/80 hover:bg-gray-700/90 rounded-lg backdrop-blur-sm border border-gray-600/50 shadow-md transition-all hover:scale-110"
                title="View fullscreen"
              >
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              </button>
              <button
                onClick={clearImage}
                className="p-2 bg-gray-900/80 hover:bg-red-500/90 rounded-lg backdrop-blur-sm border border-gray-600/50 shadow-md transition-all hover:scale-110"
                title="Remove image"
              >
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          <div className="h-[72px] w-full mt-4"></div>
        </div>
      </div>
      ) : (
        <ImageContainer
          imageSrc={inputPreview}
          altText="Input preview"
          onClear={clearImage}
          onFullscreen={() => openFullscreen(inputPreview)}
          uploadHandler={handleImageUpload}
          isInput={true}
          isBrushMode={true}
          maskData={maskData}
        />
      )}
      <ImageContainer
        imageSrc={outputImage}
        altText="Generated output"
        onDownload={handleDownload}
        onFullscreen={() => openFullscreen(outputImage)}
        isInput={false}
      />
      </div>
      </div>
      
      {/* Fullscreen Modal */}
      <FullscreenModal
        isFullscreen={isFullscreen}
        fullscreenImage={fullscreenImage}
        closeFullscreen={closeFullscreen}
      />
    </div>
  );
}