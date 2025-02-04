"use client";

import { useState, useCallback } from "react";

export default function ImageProcessor() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [inputPreview, setInputPreview] = useState(null);
  const [outputImage, setOutputImage] = useState(null);
  const [preprocessedImage, setPreprocessedImage] = useState(null);
  const [webpImage, setWebpImage] = useState(null);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState("");

  const createInputPreview = useCallback((file) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setInputPreview(reader.result);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleImageUpload = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setError(null);
    setOutputImage(null);
    setPreprocessedImage(null);
    setWebpImage(null);
    setStatus("Starting processing...");

    createInputPreview(file);

    try {
      if (!file.type.startsWith('image/')) {
        throw new Error('Please upload an image file');
      }

      setStatus("Processing with Hugging Face...");
      
      const { processImage } = await import('@/lib/huggingface/client');
      const result = await processImage(file);
      
      console.log("Processing result:", JSON.stringify(result, null, 2));

      // Handle the nested array structure
      if (Array.isArray(result) && result.length >= 2) {
        const [imageArray, webpResult] = result;
        
        // Handle the first array of images
        if (Array.isArray(imageArray) && imageArray.length >= 2) {
          if (imageArray[0]?.image?.url) {
            setOutputImage(imageArray[0].image.url);
          }
          if (imageArray[1]?.image?.url) {
            setPreprocessedImage(imageArray[1].image.url);
          }
        }
        
        // Handle the webp image
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
  }, [createInputPreview]);

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-6">
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          disabled={isProcessing}
          className="mb-4 block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
        />
        
        {status && (
          <div className="text-sm text-gray-600 mb-4">
            Status: {status}
            {isProcessing && (
              <div className="mt-2 h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 animate-pulse rounded-full"></div>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="text-red-500 bg-red-50 p-3 rounded mb-4">
            {error}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          {inputPreview && (
            <div className="space-y-2">
              <h3 className="font-semibold">Input Image</h3>
              <div className="border rounded-lg overflow-hidden shadow-sm">
                <img
                  src={inputPreview}
                  alt="Input preview"
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
          )}

          {preprocessedImage && (
            <div className="space-y-2">
              <h3 className="font-semibold">Preprocessed Image</h3>
              <div className="border rounded-lg overflow-hidden shadow-sm">
                <img
                  src={preprocessedImage}
                  alt="Preprocessed image"
                  className="w-full h-auto object-cover"
                />
                <div className="p-2 text-sm text-gray-600">
                  <a 
                    href={preprocessedImage} 
                    download="preprocessed-image.png"
                    className="text-blue-500 hover:text-blue-700"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Download Image
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {outputImage && (
            <div className="space-y-2">
              <h3 className="font-semibold">Processed Result</h3>
              <div className="border rounded-lg overflow-hidden shadow-sm">
                <img
                  src={outputImage}
                  alt="Processed output"
                  className="w-full h-auto object-cover"
                />
                <div className="p-2 text-sm text-gray-600">
                  <a 
                    href={outputImage} 
                    download="processed-image.png"
                    className="text-blue-500 hover:text-blue-700"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Download Image
                  </a>
                </div>
              </div>
            </div>
          )}

          {webpImage && (
            <div className="space-y-2">
              <h3 className="font-semibold">WebP Version</h3>
              <div className="border rounded-lg overflow-hidden shadow-sm">
                <img
                  src={webpImage}
                  alt="WebP version"
                  className="w-full h-auto object-cover"
                />
                <div className="p-2 text-sm text-gray-600">
                  <a 
                    href={webpImage} 
                    download="image.webp"
                    className="text-blue-500 hover:text-blue-700"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Download WebP
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}