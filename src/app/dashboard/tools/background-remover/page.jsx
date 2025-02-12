"use client";

import React, { useState, useEffect } from 'react';
import Image from "next/image";
import { Upload, X, Download, Image as ImageIcon } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { auth, db, storage } from '@/firebase/FirebaseConfig';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { saveAs } from 'file-saver';

// Background removal API function
const removeBackground = async (imageFile) => {
  const formData = new FormData();
  formData.append('image_file', imageFile);

  const response = await fetch('https://api.remove.bg/v1.0/removebg', {
    method: 'POST',
    headers: {
      'X-Api-Key': process.env.NEXT_PUBLIC_REMOVE_BG_API_KEY,
    },
    body: formData
  });

  if (!response.ok) {
    throw new Error('Background removal failed');
  }

  const blob = await response.blob();
  return URL.createObjectURL(blob);
};

export default function BackgroundRemover() {
  const [user, setUser] = useState(null);
  const [tokens, setTokens] = useState(0);
  const [inputImage, setInputImage] = useState(null);
  const [outputImage, setOutputImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);

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

  // Cleanup function for object URLs
  useEffect(() => {
    return () => {
      if (inputImage) {
        URL.revokeObjectURL(inputImage);
      }
      if (outputImage) {
        URL.revokeObjectURL(outputImage);
      }
    };
  }, [inputImage, outputImage]);

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    try {
      const objectUrl = URL.createObjectURL(file);
      setInputImage(objectUrl);
      setUploadedFile(file);
      setOutputImage(null);
      setError('');
    } catch (error) {
      setError('Error uploading image: ' + error.message);
    }
  };

  const handleRemoveBackground = async () => {
    if (!inputImage || tokens < 1) {
      setError(tokens < 1 ? 'Not enough tokens' : 'Please upload an image first');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      // Process the image
      const processedImageUrl = await removeBackground(uploadedFile);
      
      // Update tokens
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        tokens: tokens - 1
      });
      setTokens(prev => prev - 1);
      
      // Set output image
      setOutputImage(processedImageUrl);

      // Log usage
      const timestamp = new Date().toISOString();
      await updateDoc(userRef, {
        usage: {
          backgroundRemoval: {
            lastUsed: timestamp,
            count: tokens
          }
        }
      });
    } catch (error) {
      setError('Error processing image: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async () => {
    if (!outputImage) return;
    
    try {
      const response = await fetch(outputImage);
      const blob = await response.blob();
      const timestamp = new Date().toISOString().split('T')[0];
      saveAs(blob, `background-removed-${timestamp}.png`);
    } catch (error) {
      setError('Error downloading image: ' + error.message);
    }
  };

  const clearImages = () => {
    if (inputImage) {
      URL.revokeObjectURL(inputImage);
    }
    if (outputImage) {
      URL.revokeObjectURL(outputImage);
    }
    setInputImage(null);
    setOutputImage(null);
    setUploadedFile(null);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-gray-900 via-gray-800 to-black text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Background Remover</h1>
          <p className="text-gray-400 mt-2">Remove backgrounds from your images instantly using AI</p>
          <div className="mt-4 p-4 bg-[#1E1E1E] rounded-lg">
            <p className="text-sm">Available tokens: <span className="font-bold">{tokens}</span></p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div className="space-y-4">
            <div className="bg-[#1E1E1E] rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Input Image</h2>
                {inputImage && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearImages}
                    className="text-red-500 hover:text-red-400"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Clear
                  </Button>
                )}
              </div>
              
              {!inputImage ? (
                <div className="border-2 border-dashed border-gray-700 rounded-lg p-8">
                  <div className="flex flex-col items-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <label
                      htmlFor="image-upload"
                      className="flex flex-col items-center cursor-pointer"
                    >
                      <ImageIcon className="w-12 h-12 text-gray-500 mb-4" />
                      <span className="text-gray-400">Click to upload or drag and drop</span>
                      <span className="text-sm text-gray-500 mt-1">PNG, JPG up to 10MB</span>
                    </label>
                  </div>
                </div>
              ) : (
                <div className="relative aspect-square rounded-lg overflow-hidden">
                  <img
                    src={inputImage}
                    alt="Input"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-500">
                {error}
              </div>
            )}

            <Button
              onClick={handleRemoveBackground}
              disabled={!inputImage || isProcessing || tokens < 1}
              className="w-full py-6 bg-purple-600 hover:bg-purple-700"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 mr-2" />
                  Remove Background (1 Token)
                </>
              )}
            </Button>
          </div>

          {/* Result Section */}
          <div className="bg-[#1E1E1E] rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Result</h2>
            <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-900">
              {outputImage ? (
                <>
                  <img
                    src={outputImage}
                    alt="Output"
                    className="w-full h-full object-cover"
                  />
                  <Button
                    className="absolute bottom-4 right-4"
                    onClick={handleDownload}
                  >
                    <Download className="w-5 h-5 mr-2" />
                    Download
                  </Button>
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                  Processed image will appear here
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}