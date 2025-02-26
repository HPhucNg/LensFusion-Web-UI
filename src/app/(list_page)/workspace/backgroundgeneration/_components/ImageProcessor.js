"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { processImage } from '@/lib/huggingface/client';
import { defaultParams, parameterDefinitions } from '@/lib/huggingface/clientConfig';
import { saveAs } from 'file-saver';
import Image from 'next/image';
import { templates, getTemplateById } from '@/lib/templates';
import { CloudUpload, Wand2 } from 'lucide-react';
import { useClickAway } from 'react-use';

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

  // Add state for mobile sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const sidebarRef = useRef();

  useClickAway(sidebarRef, () => {
    if (window.innerWidth < 1024 && isSidebarOpen) {
      setIsSidebarOpen(false);
    }
  });

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
      {/* Mobile menu button at bottom right */}
      {!isSidebarOpen && (
        <div className="lg:hidden fixed bottom-6 right-6 z-50">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-3 bg-gray-900 border border-gray-700 rounded-lg shadow-xl hover:bg-gray-800 transition-all"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      )}

      {/* Modified sidebar container (solid black background) */}
      <div
        ref={sidebarRef}
        className={`fixed lg:relative inset-y-0 left-0 z-40 w-80 transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 transition-transform duration-300 ease-in-out bg-gray-900 border-r border-gray-700/50`}
      >
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
                      className="w-full p-3 text-sm bg-gray-800/20 rounded-md focus:ring-0 focus:outline-none resize-y min-h-[120px] border border-gray-700"
                      rows={10}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-300">Negative Prompt</label>
                    <textarea
                      value={params.negativePrompt}
                      onChange={(e) => handleParamChange('negativePrompt', e.target.value)}
                      placeholder="Describe what you want to avoid..."
                      className="w-full p-3 text-sm bg-gray-800/20 rounded-md focus:ring-0 focus:outline-none resize-y min-h-[50px] border border-gray-700"
                      rows={4}
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
            <div className="grid grid-cols-2 gap-3 p-1 overflow-y-auto h-[calc(100vh-200px)] pr-2 scrollbar-thin scrollbar-track-gray-900/50 scrollbar-thumb-gray-700/50">
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
            className="w-full py-1.5 text-sm bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 disabled:bg-gradient-to-r disabled:from-gray-700 disabled:to-gray-600 rounded-md transition-all disabled:cursor-not-allowed relative overflow-hidden"
          >
            {isProcessing ? (
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-5 h-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Processing...</span>
              </div>
            ) : (
              'Generate'
            )}
          </button>
        </div>
      </div>

      {/* Image Processing Area */}
      <div className="flex-1 p-4">
        <div className="max-w-4xl mx-auto flex flex-col lg:flex-row gap-8 h-full">
          {/* Input Container */}
          <div className="group relative flex-1 rounded-2xl p-1 shadow-xl hover:shadow-2xl transition-all duration-300">
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
                ) : (
                  <label className="w-full h-full flex items-center justify-center cursor-pointer rounded-xl border-2 border-dashed border-gray-600 hover:border-purple-900 transition-all duration-300">
                    <div className="text-center p-6 space-y-4">
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                        />
                        <div className="flex flex-col items-center justify-center space-y-3">
                          <svg 
                            className="w-16 h-16 text-white/70 group-hover:scale-110 transition-transform duration-300" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                          >
                            <path d="M12 13v8" />
                            <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
                            <path d="m8 17 4-4 4 4" />
                          </svg>
                          <p className="text-sm text-gray-400 font-medium">Drag & drop image<br/>or click to upload</p>
                        </div>
                      </div>
                    </div>
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Output Container */}
          <div className="group relative flex-1 rounded-2xl p-1 shadow-xl hover:shadow-2xl transition-all duration-300">
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
                        <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                        </svg>
                      </button>
                      
                      <button
                        onClick={() => handleDownload(outputImage)}
                        className="p-2 bg-gray-900/80 hover:bg-blue-500/90 rounded-lg backdrop-blur-sm border border-gray-600/50 shadow-md transition-all hover:scale-110"
                        title="Download image"
                      >
                        <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="w-full h-full flex items-center justify-center cursor-pointer rounded-xl border-2 border-dashed border-gray-600 hover:border-purple-900 transition-all duration-300">
                    <div className="flex flex-col items-center justify-center space-y-4 text-white">
                      <svg 
                        className="w-16 h-16 text-white/70" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      >
                        <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                        <circle cx="9" cy="9" r="2" />
                        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                      </svg>
                      <p className="text-sm text-gray-400 font-medium">Generated Image</p>
                    </div>
                  </label>
                )}
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
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
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