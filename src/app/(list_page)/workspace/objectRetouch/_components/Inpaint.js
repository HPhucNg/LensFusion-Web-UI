"use client";

import { useState, useCallback, useRef } from "react";
import { processImage } from '@/lib/huggingfaceInpaint/client';
import { defaultParams, parameterDefinitions } from '@/lib/huggingfaceInpaint/clientConfig';
import { useClickAway } from 'react-use';
import { saveAs } from 'file-saver';

import { ImageContainer } from './ImageContainer';
import { PromptField } from './PromptField';
import { FullscreenModal } from '../../backgroundgeneration/_components/FullscreenModal';
import BrushTool from './BrushTool';
import DrawingTools from './DrawingTools';

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
  const [preprocessedImage, setPreprocessedImage] = useState(null);

  //brush Tool states
  const [isBrushMode, setIsBrushMode] = useState(true);
  const [isEraser, setIsEraser] = useState(false);
  const [brushSize, setBrushSize] = useState(20); 
  const [maskData, setMaskData] = useState(null);
  const [processableImageData, setProcessableImageData] = useState(null);

  const brushToolRef = useRef(null);

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
  const createInputPreview = useCallback((file) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setInputPreview(reader.result);
    };
    reader.readAsDataURL(file);
  }, []);


  const clearMask = () => {
    setMaskData(null);
    setProcessableImageData(null);
    setError(null);
    
    if (brushToolRef.current && typeof brushToolRef.current.resetCanvas === 'function') {
      brushToolRef.current.resetCanvas();
    }
    
    setStatus("Mask cleared. Draw a new mask to continue.");
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

  //image uploaded
  const handleImageUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      createInputPreview(file);

      //reset when new images uploaded
      setMaskData(null);
      setProcessableImageData(null);
    }
  }, [createInputPreview]);

  
  //handle generate image
  const handleGenerate = async () => {
    if (!selectedFile) {
      setError("Please upload an image first");
      return;
    }

    if (!maskData) {
      setError("Please create a mask");
      return;
    }

    // Reset states
    setIsProcessing(true);
    setError(null);
    setOutputImage(null);
    setPreprocessedImage(null);
    setWebpImage(null);
    setStatus('Processing your image...');

    try {
      setStatus("Processing with Hugging Face...");
      const processParams = { ...params };
      //if the image is masked then create URL for both image and mask file
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

      processParams.responseType = 'base64';
      
      const result = await processImage(fileToProcess, processParams);
    
      if (result && typeof result === 'object') {

        //if no base64 data, handle the response
        if (Array.isArray(result) && result.length >= 1) {
          const [imageArray] = result;
          
          if (Array.isArray(imageArray) && imageArray.length > 0) {
            const firstImage = imageArray[0];

            if (firstImage && firstImage.image && firstImage.image.base64) {
              const base64Data = firstImage.image.base64;
              // Convert base64 to blob for download - fixes the error (no image data)
              try {
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
              } catch (e) {
                console.error("Error processing base64:", e);
              }
            }
            //if the first one dont work, that means URL is temporary - retreieve image from temporary URL
            if (firstImage && firstImage.image && firstImage.image.url) {
              setOutputImage(firstImage.image.url);
              setStatus("Processing complete! (URL mode)");
              return;
            }
            
            if (firstImage && firstImage.image) {
              console.log("Using direct image data");
              setOutputImage(firstImage.image);
              setStatus("Processing complete! (Direct mode)");
              return;
            }
            
            setError("Unable to extract usable image data from the API response");
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
      console.error("Generate error:", error);
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
    //setOutputBlob(null);
    setPreprocessedImage(null);
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
    if (outputBlob) {
      const url = URL.createObjectURL(outputBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'generated-image.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
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

  return (
    <div className="w-full p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-gray-900 to-black text-white">
      <h1 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-500">
        AI Object Retouch
      </h1>

      {/* Sidebar */}
      <div className="pt-4 px-4 pb-2 rounded-xl backdrop-blur-sm bg-gray-800/50 border border-gray-700"
      ref={sidebarRef}
      >
      {/* Prompt field */}
        <PromptField
          params={params}
          handleParamChange={handleParamChange}
          generateRandomSeed={generateRandomSeed}
          parameterDefinitions={parameterDefinitions}
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
      <div className="flex-1 p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
          {inputPreview ? (
            <div className="relative flex-1 rounded-2xl p-1 shadow-xl hover:shadow-2xl transition-all duration-300">
              <div className="h-full w-full rounded-xl backdrop-blur-sm">
                <div className="absolute top-4 right-4 flex gap-2 z-10">
                  <button
                    onClick={() => openFullscreen(inputPreview)}
                    className="p-2 bg-gray-900/80 hover:bg-blue-500/90 rounded-lg backdrop-blur-sm border border-gray-600/50 shadow-md transition-all hover:scale-110"
                    title="View fullscreen"
                  >
                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
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
                
                {/* BrushTool */}
                <div className="w-full h-full">
                  <BrushTool 
                    ref={brushToolRef}
                    inputImage={inputPreview} 
                    onMaskCreated={handleMaskCreated}
                    initialSize={brushSize}
                    initialColor="#ffffff"
                    isEraser={isEraser}
                    maxWidth={1000}  
                    maxHeight={700} 
                  />
                </div>
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
              isBrushMode={isBrushMode}
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