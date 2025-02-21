"use client";

import { useState, useCallback, useEffect } from "react";
import { processImage } from '@/lib/huggingface/client';
import { defaultParams, parameterDefinitions } from '@/lib/huggingface/clientConfig';
import { saveAs } from 'file-saver';
import Image from 'next/image';
import { templates, getTemplateById } from '@/lib/templates';

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
  const [loadedTemplates, setLoadedTemplates] = useState([]); // Renamed state variable

  // Add state for active tab
  const [activeSidebar, setActiveSidebar] = useState('settings');

  // Add new state for selected template
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);

  // Add new state for tracking the file
  const [selectedFile, setSelectedFile] = useState(null);

  // Add state for fullscreen
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState(null);

  // Fetch templates on component mount
  useEffect(() => {
    setLoadedTemplates(templates); // Use the imported templates directly
    console.log("Loaded templates:", templates); // Verify template loading
  }, []);

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

  // Modified handleImageUpload
  const handleImageUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      createInputPreview(file);
    }
  }, [createInputPreview]);

  // Modified handleGenerate
  const handleGenerate = async () => {
    if (!selectedFile) {
      setError("Please upload an image first");
      return;
    }

    // Reset states
    setIsProcessing(true);
    setError(null);
    setOutputImage(null);
    setPreprocessedImage(null);
    setWebpImage(null);
    setStatus("Starting processing...");

    try {
      setStatus("Processing with Hugging Face...");
      const result = await processImage(selectedFile, params);
      
      // Handle the response
      if (Array.isArray(result) && result.length >= 2) {
        const [imageArray, webpResult] = result;
        
        if (Array.isArray(imageArray) && imageArray.length >= 2) {
          setOutputImage(imageArray[0]?.image?.url || null);
          setPreprocessedImage(imageArray[1]?.image?.url || null);
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

  // Template generate handler
  const handleTemplateGenerate = (template) => {
    handleTemplateSelect(template);
    handleGenerate();
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
                      focus:ring-0 focus:outline-none resize-y"
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
                      focus:ring-0 focus:outline-none"
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
    <div className="h-screen flex bg-gray-900 text-white">
      {/* Combined Sidebar */}
      <div className="w-80 bg-gray-800/50 p-3 border-r border-gray-700 flex flex-col">
        {/* Tab Navigation */}
        <div className="flex mb-3">
          <button
            onClick={() => setActiveSidebar('settings')}
            className={`flex-1 py-1.5 text-sm ${
              activeSidebar === 'settings' 
                ? 'bg-gray-700/50 text-white' 
                : 'bg-gray-800/20 text-gray-400 hover:bg-gray-700/30'
            } rounded-l-md transition-colors`}
          >
            Settings
          </button>
          <button
            onClick={() => setActiveSidebar('templates')}
            className={`flex-1 py-1.5 text-sm ${
              activeSidebar === 'templates' 
                ? 'bg-gray-700/50 text-white' 
                : 'bg-gray-800/20 text-gray-400 hover:bg-gray-700/30'
            } rounded-r-md transition-colors`}
          >
            Templates
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto pb-4 scrollbar">
          {activeSidebar === 'settings' ? (
            <>
              {/* Settings Content */}
              <div className="space-y-3">
                {/* Prompts Section */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-300">Positive Prompt</label>
                    <textarea
                      value={params.prompt}
                      onChange={(e) => handleParamChange('prompt', e.target.value)}
                      placeholder="Describe what you want to generate..."
                      className="w-full p-2 text-sm bg-gray-700/10 rounded-md focus:ring-0 focus:outline-none resize-y min-h-[80px]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-300">Negative Prompt</label>
                    <textarea
                      value={params.negativePrompt}
                      onChange={(e) => handleParamChange('negativePrompt', e.target.value)}
                      placeholder="Describe what you want to avoid..."
                      className="w-full p-2 text-sm bg-gray-700/10 rounded-md focus:ring-0 focus:outline-none resize-y min-h-[60px]"
                    />
                  </div>
                </div>

                {/* Advanced Settings */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-300">Advanced Settings</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {parameterDefinitions.slice(2, 4).map(param => (
                      param.type === 'select' && (
                        <div key={param.id} className="space-y-1">
                          <label className="block text-xs font-medium text-gray-300">{param.label}</label>
                          {renderParameter(param)}
                        </div>
                      )
                    ))}
                  </div>

                  {/* Seed Input */}
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-300">Seed</label>
                    {renderParameter(parameterDefinitions.find(p => p.id === 'seed'))}
                  </div>
                </div>
              </div>

              {/* Status and Error Messages */}
              {status && (
                <div className="text-xs text-gray-300 mt-3">
                  Status: {status}
                </div>
              )}

              {error && (
                <div className="text-xs text-red-300 bg-red-900/50 p-2 rounded-md mt-3">
                  {error}
                </div>
              )}
            </>
          ) : (
            <div className="grid grid-cols-2 gap-3 p-1">
              {loadedTemplates.map((template, index) => (
                <div
                  key={template.id}
                  className={`group relative aspect-square cursor-pointer rounded-xl transition-all ${
                    selectedTemplateId === template.id
                      ? 'ring-2 ring-purple-500/80 scale-[0.98] bg-gradient-to-br from-purple-900/20 to-blue-900/10'
                      : 'hover:scale-95'
                  }`}
                  onClick={() => handleTemplateSelect(template)}
                >
                  <div className="relative h-full w-full overflow-hidden rounded-xl border border-gray-700/50 bg-gray-900/20">
                    <Image
                      src={template.image}
                      alt={`Template ${index + 1}`}
                      fill
                      className={`object-cover transition-opacity ${
                        selectedTemplateId === template.id ? 'opacity-80' : 'group-hover:opacity-50'
                      }`}
                      unoptimized={true}
                    />
                    <div className="absolute bottom-2 right-2 rounded-md bg-gray-900/80 px-2 py-1 text-xs font-medium text-gray-300 backdrop-blur-sm">
                      #{index + 1}
                    </div>
                  </div>
                  {/* Selection glow effect */}
                  {selectedTemplateId === template.id && (
                    <div className="absolute inset-0 rounded-xl pointer-events-none border border-purple-500/30 shadow-[0_0_25px_rgba(168,85,247,0.3)]" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Fixed Generate Button Container */}
        <div className="sticky bottom-0 pt-4 bg-gradient-to-t from-gray-800/90 to-transparent">
          <button
            onClick={handleGenerate}
            disabled={isProcessing || !selectedFile}
            className="w-full py-1.5 text-sm bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 disabled:bg-gray-600 rounded-md transition-all"
          >
            {isProcessing ? 'Generating...' : 'Generate'}
          </button>
        </div>
      </div>

      {/* Image Processing Area */}
      <div className="flex-1 p-4">
        <div className="max-w-4xl mx-auto flex flex-col lg:flex-row gap-8 h-full">
          {/* Input Container */}
          <div className="group relative flex-1 bg-gradient-to-br from-gray-900/30 to-gray-800/20 rounded-2xl p-1 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="h-full w-full flex flex-col items-center justify-center rounded-xl backdrop-blur-sm">
              <div className="w-full h-[500px] flex items-center justify-center relative">
                {inputPreview ? (
                  <div className="relative w-full h-full rounded-lg overflow-hidden">
                    <Image
                      src={inputPreview}
                      alt="Input preview"
                      fill
                      className="object-contain p-4 transform transition-transform duration-300 group-hover:scale-105"
                      style={{ imageRendering: 'auto' }}
                    />
                    
                    {/* Action Buttons */}
                    <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <button
                        onClick={() => openFullscreen(inputPreview)}
                        className="p-2 bg-gray-900/80 hover:bg-gray-700/90 rounded-lg backdrop-blur-sm border border-gray-600/50 shadow-md transition-all hover:scale-110"
                        title="View fullscreen"
                      >
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                        </svg>
                      </button>
                      
                      <button
                        onClick={clearImage}
                        className="p-2 bg-gray-900/80 hover:bg-red-500/90 rounded-lg backdrop-blur-sm border border-gray-600/50 shadow-md transition-all hover:scale-110"
                        title="Remove image"
                      >
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
                        />
                        <div className="flex flex-col items-center justify-center space-y-3">
                          <svg className="w-16 h-16 text-purple-500 group-hover:scale-110 transition-transform duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M7.5 17.5h9M12 6v10m0 0l3.5-3.5M12 13l-3.5-3.5" />
                            <path d="M20 16.5V19a2 2 0 01-2 2H6a2 2 0 01-2-2v-2.5M12 3.5L8 7.5H5v3h6v-3H8l4-4z" />
                          </svg>
                          <p className="text-sm text-gray-400 font-medium">Drag & drop image<br/>or click to upload</p>
                          <span className="text-xs text-gray-500">Max size: 5MB</span>
                        </div>
                      </div>
                    </div>
                  </label>
                )}
              </div>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-gray-900/80 px-4 py-1 rounded-full text-sm text-white font-medium backdrop-blur-sm">
                Original Image
              </div>
            </div>
          </div>

          {/* Output Container */}
          <div className="group relative flex-1 bg-gradient-to-br from-gray-900/30 to-gray-800/20 rounded-2xl p-1 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="h-full w-full flex flex-col items-center justify-center rounded-xl backdrop-blur-sm">
              <div className="w-full h-[500px] flex items-center justify-center relative">
                {outputImage ? (
                  <div className="relative w-full h-full rounded-lg overflow-hidden">
                    <Image
                      src={outputImage}
                      alt="Generated output"
                      fill
                      className="object-contain p-4 transform transition-transform duration-300 group-hover:scale-105"
                      style={{ imageRendering: 'auto' }}
                    />
                    
                    {/* Output Action Buttons */}
                    <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <button
                        onClick={() => openFullscreen(outputImage)}
                        className="p-2 bg-gray-900/80 hover:bg-gray-700/90 rounded-lg backdrop-blur-sm border border-gray-600/50 shadow-md transition-all hover:scale-110"
                        title="View fullscreen"
                      >
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                        </svg>
                      </button>
                      
                      <button
                        onClick={() => handleDownload(outputImage)}
                        className="p-2 bg-gray-900/80 hover:bg-blue-500/90 rounded-lg backdrop-blur-sm border border-gray-600/50 shadow-md transition-all hover:scale-110"
                        title="Download image"
                      >
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center space-y-4 text-gray-500">
                    <svg className="w-16 h-16 text-purple-500 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                    <p className="text-sm font-medium">Processing your masterpiece...</p>
                  </div>
                )}
              </div>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-gray-900/80 px-4 py-1 rounded-full text-sm text-white font-medium backdrop-blur-sm">
                Generated Result
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add this fullscreen modal at the bottom of your component */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
          <button
            onClick={closeFullscreen}
            className="absolute top-4 right-4 p-3 bg-gray-900/80 hover:bg-gray-700/90 rounded-lg backdrop-blur-sm border border-gray-600/50 shadow-md transition-all hover:scale-110"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div className="relative w-full h-full max-w-6xl flex items-center justify-center">
            <Image
              src={fullscreenImage}
              alt="Fullscreen view"
              fill
              className="object-contain"
              style={{ imageRendering: 'auto' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}