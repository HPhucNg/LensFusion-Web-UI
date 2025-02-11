"use client";

import { useState, useCallback } from "react";
import { processImage } from '@/lib/huggingface/client';
import { defaultParams, parameterDefinitions } from '@/lib/huggingface/clientConfig';

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
        // Regular text input
        return (
          <input
            type="text"
            id={param.id}
            placeholder={param.placeholder}
            className="w-full p-3 bg-gray-900/50 border border-gray-700 rounded-lg 
                      focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={params[param.id]}
            onChange={(e) => handleParamChange(param.id, e.target.value)}
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
      <div className="flex flex-col md:flex-row gap-8">
        {/* Left Column - Input Section */}
        <div className="md:w-1/2 space-y-6">
          <div className="bg-gray-800/50 rounded-xl p-6 space-y-6">
            <h2 className="text-2xl font-bold">Image Generation</h2>

            {/* File Upload Section */}
            <div className="space-y-2">
              <label className="block text-sm font-medium">
                Reference Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={isProcessing}
                className="block w-full text-sm text-white
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-full file:border-0
                          file:text-sm file:font-semibold
                          file:bg-blue-600 file:text-white
                          hover:file:bg-blue-700
                          cursor-pointer"
              />
            </div>

            {/* Parameters Section */}
            <div className="space-y-4">
              {/* Positive Prompt */}
              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  Positive Prompt
                </label>
                <textarea
                  value={params.prompt}
                  onChange={(e) => handleParamChange('prompt', e.target.value)}
                  placeholder="Describe what you want to generate..."
                  className="w-full h-48 p-3 bg-gray-900/50 border border-gray-700 rounded-lg 
                            focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Negative Prompt */}
              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  Negative Prompt
                </label>
                <textarea
                  value={params.negativePrompt}
                  onChange={(e) => handleParamChange('negativePrompt', e.target.value)}
                  placeholder="Describe what you want to avoid..."
                  className="w-full h-24 p-3 bg-gray-900/50 border border-gray-700 rounded-lg 
                            focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Image Size and Steps */}
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
                <p className="text-xs text-gray-400">
                  Enter a number for consistent results or click the refresh icon for a random seed
                </p>
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={isProcessing || !inputPreview}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600
                        text-white font-semibold rounded-lg shadow-lg
                        disabled:cursor-not-allowed transition-colors"
            >
              {isProcessing ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                'Generate Image'
              )}
            </button>

            {/* Status and Error Messages */}
            {status && (
              <div className="text-sm text-gray-300">
                Status: {status}
              </div>
            )}

            {error && (
              <div className="text-red-300 bg-red-900/50 p-4 rounded-lg">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Output Section */}
        <div className="md:w-1/2 space-y-6">
          <div className="bg-gray-800/50 rounded-xl p-6 space-y-6">
            <h2 className="text-2xl font-bold">Results</h2>

            {/* Image Display Section */}
            <div className="space-y-6">
              {/* Input Preview */}
              {inputPreview && (
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Reference Image</h3>
                  <div className="border border-gray-700 rounded-lg overflow-hidden">
                    <img
                      src={inputPreview}
                      alt="Input preview"
                      className="w-full h-auto"
                    />
                  </div>
                </div>
              )}

              {/* Generated Image */}
              {outputImage && (
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Generated Image</h3>
                  <div className="border border-gray-700 rounded-lg overflow-hidden">
                    <img
                      src={outputImage}
                      alt="Generated output"
                      className="w-full h-auto"
                    />
                    <div className="p-4 bg-gray-900/30">
                      <button
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = outputImage; // URL of the image
                          link.download = 'generated-image.png'; // Default filename
                          document.body.appendChild(link); // Append to body
                          link.click(); // Trigger the download
                          document.body.removeChild(link); // Clean up
                        }}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 
                                  text-white rounded-lg transition-colors"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download Image
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}