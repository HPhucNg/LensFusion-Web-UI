"use client";

import { useState, useCallback } from "react";
import { processImage } from '@/lib/huggingface/client';
import { defaultParams, parameterDefinitions } from '@/lib/huggingface/clientConfig';
import { saveAs } from 'file-saver';
import Image from 'next/image';

export default function ImageProcessor() {
  // State management for the component
  const [isProcessing, setIsProcessing] = useState(false);        // Controls loading state
  const [inputPreview, setInputPreview] = useState(null);         // Stores the preview of uploaded image
  const [outputImage, setOutputImage] = useState(null);           // Stores the generated image URL
  const [preprocessedImage, setPreprocessedImage] = useState(null); // Stores the preprocessed image URL
  const [webpImage, setWebpImage] = useState(null);               // Stores the WebP version URL
  const [error, setError] = useState(null);                       // Stores error messages
  const [status, setStatus] = useState("");                       // Stores status messages
  const [params, setParams] = useState(defaultParams);            // Stores all generation parameters

  // Creates a preview of the uploaded image
  const createInputPreview = useCallback((file) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setInputPreview(reader.result);
    };
    reader.readAsDataURL(file);
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

  // Handles file upload
  const handleImageUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) {
      createInputPreview(file);
    }
  }, [createInputPreview]);

  // Handles the generate button click
  const handleGenerate = async () => {
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput?.files?.[0]) {
      await processImageWithParams(fileInput.files[0]);
    } else {
      setError("Please upload an image first");
    }
  };

  // Add this new function to clear the image
  const clearImage = () => {
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

  // Renders different types of parameter inputs
  const renderParameter = (param) => {
    switch (param.type) {
      case 'text':
        // Special handling for seed input
        if (param.id === 'seed') {
          return (
            <div className="flex gap-2">
              <input
                type="text"
                id={param.id}
                placeholder="12345"
                className="flex-1 p-3 bg-gray-900/50 border border-gray-700 rounded-lg 
                          focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={params[param.id]}
                onChange={(e) => handleParamChange(param.id, e.target.value)}
              />
              <button
                onClick={generateRandomSeed}
                type="button"
                className="p-3 bg-gray-900/50 border border-gray-700 rounded-lg hover:bg-gray-800
                          focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                title="Generate Random Seed"
              >
                <svg 
                  className="w-5 h-5" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                  />
                </svg>
              </button>
            </div>
          );
        }
        // Changed regular text input to textarea
        return (
          <textarea
            id={param.id}
            placeholder={param.placeholder}
            className="w-full p-3 bg-gray-900/50 border border-gray-700 rounded-lg 
                      focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
            value={params[param.id]}
            onChange={(e) => handleParamChange(param.id, e.target.value)}
            rows={3}
          />
        );
      // Dropdown select input
      case 'select':
        return (
          <select
            id={param.id}
            className="w-full p-3 bg-gray-900/50 border border-gray-700 rounded-lg 
                      focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={params[param.id]}
            onChange={(e) => handleParamChange(param.id, e.target.value)}
          >
            {param.options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      default:
        return null;
    }
  };

  // Component UI
  return (
    <div className="max-w-7xl mx-auto p-6 text-white">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Column - Input Section */}
        <div className="lg:w-1/3 space-y-6">
          <div className="bg-gray-800/50 rounded-xl p-6 space-y-6">
            <h2 className="text-2xl font-bold mb-4">Image Settings</h2>

            {/* Prompts Section */}
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium">Positive Prompt</label>
                <textarea
                  value={params.prompt}
                  onChange={(e) => handleParamChange('prompt', e.target.value)}
                  placeholder="Describe what you want to generate..."
                  className="w-full p-3 bg-gray-900/50 border border-gray-700 rounded-lg 
                            focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
                  rows={5}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium">Negative Prompt</label>
                <textarea
                  value={params.negativePrompt}
                  onChange={(e) => handleParamChange('negativePrompt', e.target.value)}
                  placeholder="Describe what you want to avoid..."
                  className="w-full p-3 bg-gray-900/50 border border-gray-700 rounded-lg 
                            focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
                  rows={2}
                />
              </div>
            </div>

            {/* Advanced Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Advanced Settings</h3>
              <div className="grid grid-cols-2 gap-4">
                {parameterDefinitions.slice(2, 4).map(param => (
                  param.type === 'select' && (
                    <div key={param.id} className="space-y-2">
                      <label htmlFor={param.id} className="block text-sm font-medium">
                        {param.label}
                      </label>
                      {renderParameter(param)}
                    </div>
                  )
                ))}
              </div>

              {/* Seed Input */}
              <div className="space-y-2">
                <label htmlFor="seed" className="block text-sm font-medium">
                  Seed
                </label>
                {renderParameter(parameterDefinitions.find(p => p.id === 'seed'))}
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={isProcessing || !inputPreview}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600
                        text-white font-semibold rounded-lg shadow-lg
                        disabled:cursor-not-allowed transition-colors mt-4"
            >
              {isProcessing ? 'Generating...' : 'Generate Image'}
            </button>

            {/* Status and Error Messages */}
            {status && (
              <div className="text-sm text-gray-300 mt-4">
                Status: {status}
              </div>
            )}

            {error && (
              <div className="text-red-300 bg-red-900/50 p-4 rounded-lg mt-4">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Output Section */}
        <div className="lg:w-2/3 space-y-6">
          <div className="bg-gray-800/50 rounded-xl p-6 space-y-6">
            <h2 className="text-2xl font-bold mb-4">Image Processing</h2>

            {/* Combined Upload and Comparison Section */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-6">
                {/* Input Section */}
                <div className="relative rounded-lg overflow-hidden bg-gray-900/20">
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={isProcessing}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    {!inputPreview && (
                      <>
                        <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="mt-2 text-sm text-gray-400 text-center">
                          Drag & drop or click to upload
                        </p>
                      </>
                    )}
                  </div>
                  {inputPreview && (
                    <>
                      <div className="w-full h-[500px] flex items-center justify-center">
                        <Image
                          src={inputPreview}
                          alt="Input preview"
                          width={500}
                          height={500}
                          className="max-w-full max-h-full object-contain p-4"
                          unoptimized={true}
                        />
                      </div>
                      <button
                        onClick={clearImage}
                        className="absolute top-3 right-3 p-2 bg-gray-800/80 hover:bg-gray-700/80 rounded-full backdrop-blur-sm border border-gray-600/50 shadow-lg transition-all hover:scale-105"
                        title="Remove image"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>

                {/* Output Section */}
                <div className="rounded-lg overflow-hidden bg-gray-900/20">
                  {outputImage ? (
                    <>
                      <div className="w-full h-[500px] flex items-center justify-center">
                        <Image
                          src={outputImage}
                          alt="Generated output"
                          width={500}
                          height={500}
                          className="max-w-full max-h-full object-contain p-4"
                          unoptimized={true}
                        />
                      </div>
                      <div className="p-4 bg-gray-900/30 flex justify-end">
                        <button
                          onClick={() => saveAs(outputImage, 'generated-image.png')}
                          className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 
                                    text-white rounded-lg transition-colors"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Download Image
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="h-[500px] flex items-center justify-center">
                      <span className="text-gray-400">Generated image will appear here</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Labels */}
              <div className="grid grid-cols-2 gap-6 text-sm text-gray-400">
                <div>Input Image</div>
                <div>Generated Image</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}