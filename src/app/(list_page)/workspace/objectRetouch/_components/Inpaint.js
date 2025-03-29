"use client";

import { useState, useRef } from 'react';
import { processImage } from '@/lib/huggingfaceInpaint/client';
import { defaultParams, parameterDefinitions } from '@/lib/huggingfaceInpaint/clientConfig';
import { useClickAway } from 'react-use';


import { GenerateButton } from '../../backgroundgeneration/_components/GenerateButton';
import { ImageContainer } from './ImageContainer';
import { SettingSidebar } from './SettingSidebar';
import { FullscreenModal } from '../../backgroundgeneration/_components/FullscreenModal';
import { MobileMenuButton } from '../../backgroundgeneration/_components/MobileMenuButton';
import BrushTool from './BrushTool';

export default function Inpaint() {
  //inpainting states
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [params, setParams] = useState(defaultParams);
  const [selectedFile, setSelectedFile] = useState(null);
  const [inputPreview, setInputPreview] = useState(null);
  const [outputImage, setOutputImage] = useState(null);
  const [outputBlob, setOutputBlob] = useState(null); 
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const sidebarRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [webpImage, setWebpImage] = useState(null);

  //brush Tool states
  const [isBrushMode, setIsBrushMode] = useState(false);
  const [maskData, setMaskData] = useState(null);
  const [processableImageData, setProcessableImageData] = useState(null);

  //get mask data
  const handleMaskCreated = ({ imageData, maskData }) => {    
    setProcessableImageData(imageData);
    setMaskData(maskData);
  };

  //click anywhere on screen to go out of sidebar when minimized window
  useClickAway(sidebarRef, () => {
    if (window.innerWidth < 1024 && isSidebarOpen) {
      setIsSidebarOpen(false);
    }
  });

  //preview uploaded input image
  const createInputPreview = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      const reader = new FileReader();

      img.src = objectUrl;
      
      reader.onload = () => {
        setInputPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

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

  //modify the url to fit 
  const blobToDataURL = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  //handle generate image
  const handleGenerate = async () => {
    if (!selectedFile && !inputPreview) {
      setError("Please upload an image first");
      return;
    }
    
    // Reset states
    setIsProcessing(true);
    setError(null);
    setOutputImage(null);
    setOutputBlob(null);
    setWebpImage(null);
    setStatus('Processing your image...');
  
    try {
      setStatus("Processing with Hugging Face...");
      const processParams = { ...params };
      //if the image is masked then create URL for both image and mask file
      if (isBrushMode && maskData && processableImageData) {
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
    
      if (result && typeof result === 'object') {

        //if no base64 data, handle the response
        if (Array.isArray(result) && result.length >= 2) {
          const [imageArray] = result;
          
          if (Array.isArray(imageArray) && imageArray.length > 0) {
            const firstImage = imageArray[0];
            
            if (firstImage && firstImage.image && firstImage.image.base64) {
              const base64Data = firstImage.image.base64;
              // Convert base64 to blob for download - fixes the error (no image data)
              const byteString = atob(base64Data.split(',')[1]);
              const mimeType = base64Data.split(',')[0].split(':')[1].split(';')[0];
              const ab = new ArrayBuffer(byteString.length);
              const ia = new Uint8Array(ab);
              for (let i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i);
              }
              const blob = new Blob([ab], { type: mimeType });
              setOutputBlob(blob);
              setOutputImage(base64Data);
              setStatus("Processing complete!");
              return;
            }
            //if the first one dont work, that means URL is temporary - retreieve image from temporary URL
            if (firstImage && firstImage.image && firstImage.image.url) {
              try {
                let imageUrl = firstImage.image.url;
                if (imageUrl.startsWith('/')) {
                  const baseUrl = new URL(window.location.href);
                  imageUrl = `${baseUrl.origin}${imageUrl}`;
                }
                //added to avoid caching issues
                const cacheBuster = `?t=${Date.now()}`;
                const urlWithCacheBuster = `${imageUrl}${imageUrl.includes('?') ? '&' : ''}${cacheBuster}`;
                
                const response = await fetch(urlWithCacheBuster, {
                  credentials: 'include',
                  mode: 'cors',
                  headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                  }
                });
                
                const imageBlob = await response.blob();
                const dataUrl = await blobToDataURL(imageBlob);
                
                setOutputBlob(imageBlob);
                setOutputImage(dataUrl);
                setStatus("Processing complete!");
              } catch (fetchError) {
                console.error("Error fetching result image:", fetchError);
              }
            } else {
              setError("Unable to extract usable image data from the API response");
            }
          } else {
            setError("No image data in response");
          }
        } else {
          setError("Unexpected response format from API");
        }
      } else {
        setError("Invalid response from API");
      }
    } catch (error) {
      setError(error.message || "Failed to process image");
      setStatus("Processing failed");
    } finally {
      setIsProcessing(false);
    }
  };

  //convert data URL to File
  const dataURLtoFile = (dataURL, filename) => {    
    if (!dataURL) {
      console.log("No dataURL");
      return null;
    }
    try {
      //seporates metadata part from encoded data in 2 parts
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
      console.log(`Created File object: size=${file.size}, type=${file.type}, name=${file.name}`);
      return file;
    } catch (error) {
      console.error("Error in dataURLtoFile:", error);
      return null;
    }
  };
  
  //clear image from input
  const clearImage = () => {
    setSelectedFile(null);
    setInputPreview(null);
    setOutputImage(null);
    setOutputBlob(null);
    setMaskData(null);
    setProcessableImageData(null);
    setWebpImage(null);
    setError(null);
    setStatus("");
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) {
      fileInput.value = '';
    }
  };
  
  //handle download of generated image
  const handleDownload = () => {
    const url = URL.createObjectURL(outputBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'generated-image.png'; 
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  //fullscreen when open image
  const openFullscreen = (imageUrl) => {
    setFullscreenImage(imageUrl);
    setIsFullscreen(true);
  };

  //close full screen
  const closeFullscreen = () => {
    setIsFullscreen(false);
    setFullscreenImage(null);
  };

  //brush mode
  const toggleBrushMode = () => {
    if (!isBrushMode && inputPreview) {
      setIsBrushMode(true);
    } else {
      setIsBrushMode(false);
    }
  };


  return (
    <div className="h-screen flex bg-gray-900 text-white">
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
        } lg:translate-x-0 transition-transform duration-300 ease-in-out bg-gray-900 border-r border-gray-700/50 shadow-xl`}
      >

        <div className="flex flex-col">
          {/* Sidebar Header */}
          <div className="px-6 py-4">
            <h1 className="text-2xl font-bold text-white flex items-center">
              Inpainting Tool
            </h1>
          </div>

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto pb-4 scrollbar">
            <SettingSidebar
              params={params}
              handleParamChange={handleParamChange}
              generateRandomSeed={generateRandomSeed}
              parameterDefinitions={parameterDefinitions}
              status={status}
              error={error}
            />
          </div>

          {/* Generate Button */}
          <GenerateButton
            handleGenerate={handleGenerate}
            isProcessing={isProcessing}
            selectedFile={selectedFile || inputPreview}
          />
        </div>
      </div>

      {/* Image Processing Area */}
      <div className="flex-1 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
            {isBrushMode && inputPreview ? (
              <div className="bg-gray-900 rounded-xl overflow-hidden shadow-xl border border-gray-700/50 transition-all duration-300 hover:shadow-indigo-900/20 hover:shadow-2xl">
                <div className="p-6">
                  <BrushTool 
                    inputImage={inputPreview} 
                    onMaskCreated={handleMaskCreated} 
                  />
                  {/* will add eraser mode here later*/}
                  <div className="mt-4 flex justify-center">
                    <button
                      onClick={toggleBrushMode}
                      className="px-4 py-2 bg-purple-700 hover:bg-purple-600 rounded-lg shadow-md transition-all"
                    >
                      Exit
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <ImageContainer
                imageSrc={inputPreview}
                altText="Input preview"
                onClear={clearImage}
                onFullscreen={() => openFullscreen(inputPreview)}
                uploadHandler={createInputPreview}
                isInput={true}
                toggleBrushMode={toggleBrushMode}
                isBrushMode={isBrushMode}
                showBrushToggle={!!inputPreview}
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