"use client";

import React, { useState, useEffect } from 'react';
import Image from "next/image";
import { Upload, X, Download, Image as ImageIcon, ArrowLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { auth, db, storage } from '@/firebase/FirebaseConfig';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useRouter } from 'next/navigation';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import DownloadOptions from '@/components/DownloadOptions';

// ImgGen AI API function for image upscaling and restoration
const upscaleImage = async (imageFile) => {
  try {
    const formData = new FormData();
    formData.append('image', imageFile);

    const response = await fetch('https://app.imggen.ai/v1/image-restoration', {
      method: 'POST',
      headers: {
        'X-IMGGEN-KEY': '75f2321b-6ae4-4733-962d-e14f4fb95261',
      },
      body: formData
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('ImgGen API Error:', data);
      throw new Error(data.message || 'Unable to restore image');
    }

    if (!data.success || !data.image) {
      throw new Error(data.message || 'Image restoration failed');
    }

    // Convert base64 to blob URL
    const base64Data = data.image;
    const byteCharacters = atob(base64Data);
    const byteArrays = [];
    
    for (let offset = 0; offset < byteCharacters.length; offset += 1024) {
      const slice = byteCharacters.slice(offset, offset + 1024);
      const byteNumbers = new Array(slice.length);
      
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
    
    const blob = new Blob(byteArrays, { type: 'image/png' });
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('Upscale Error:', error);
    throw new Error(error.message || 'Failed to upscale image');
  }
};

// Add function to save image to user gallery
const saveToUserGallery = async (imageUrl, userId) => {
  try {
    const timestamp = Date.now();
    const filename = `upscaled-${timestamp}.png`;
    
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
      type: 'upscaled'
    });

    return true;
  } catch (error) {
    console.error('Error saving to gallery:', error);
    return false;
  }
};

export default function ImageUpscaler() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [tokens, setTokens] = useState(0);
  const [inputImage, setInputImage] = useState(null);
  const [outputImage, setOutputImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
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

    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

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

  const handleUpscaleImage = async () => {
    if (!inputImage || isProcessing || tokens < 1) return;
    
    setIsProcessing(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await fetch(inputImage);
      const blob = await response.blob();
      const file = new File([blob], 'input-image.jpg', { type: 'image/jpeg' });
      
      const resultUrl = await upscaleImage(file);
      setOutputImage(resultUrl);
      
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        tokens: tokens - 1
      });
      setTokens(prev => prev - 1);
      
      const saved = await saveToUserGallery(resultUrl, user.uid);
      if (saved) {
        setSuccess('Image upscaled and saved to your gallery successfully!');
      }
      
    } catch (error) {
      console.error('Error:', error);
      setError(error.message || 'Failed to upscale image');
    } finally {
      setIsProcessing(false);
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
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold app-accent-color">
            Image Upscaler & Restorer
          </h1>
          <p className="text-gray-400 mt-2">Enhance and restore your images using AI</p>
          <div className="mt-4 p-4 bg-gray-800/30 rounded-lg border border-gray-700/50">
            <p className="text-sm">Available tokens: <span className="font-bold">{tokens}</span></p>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-4 p-4 bg-green-500/10 border border-green-500 rounded-lg">
            <p className="text-green-500">{success}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500 rounded-lg">
            <p className="text-red-500">{error}</p>
          </div>
        )}

        {/* Main Content */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-4">
            <div className="group relative flex-1 rounded-2xl p-1 shadow-xl hover:shadow-2xl transition-all duration-300">
              <div className="h-full w-full flex flex-col items-center justify-center rounded-xl backdrop-blur-sm">
                <div className="w-full h-[500px] flex items-center justify-center relative">
                  {inputImage ? (
                    <div className="relative w-full h-full rounded-lg overflow-hidden">
                      <Image
                        src={inputImage}
                        alt="Input"
                        fill
                        className="object-contain p-4 transform transition-transform duration-300 group-hover:scale-105"
                        style={{ imageRendering: 'auto' }}
                      />
                      <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <button
                          onClick={() => window.open(inputImage, '_blank')}
                          className="p-2 bg-gray-900/80 hover:bg-gray-700/90 rounded-lg backdrop-blur-sm border border-gray-600/50 shadow-md transition-all hover:scale-110"
                          title="View fullscreen"
                        >
                          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                          </svg>
                        </button>
                        <button
                          onClick={clearImages}
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
                    <label className="w-full h-full flex items-center justify-center cursor-pointer rounded-xl border-2 border-dashed border-gray-600 hover:border-accent transition-all duration-300">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <div className="text-center p-6 space-y-4">
                        <div className="relative">
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

            <Button
              onClick={handleUpscaleImage}
              disabled={!inputImage || isProcessing || tokens < 1}
              className="w-full h-12 app-accent-bg hover:opacity-90 text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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
                <>
                  <Upload className="w-5 h-5 mr-2" />
                  Upscale & Restore (1 Token)
                </>
              )}
            </Button>
          </div>

          {/* Output Section */}
          <div className="group relative flex-1 rounded-2xl p-1 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="h-full w-full flex flex-col items-center justify-center rounded-xl backdrop-blur-sm">
              <div className="w-full h-[500px] flex items-center justify-center relative">
                {outputImage ? (
                  <div className="relative w-full h-full rounded-lg overflow-hidden">
                    <Image
                      src={outputImage}
                      alt="Output"
                      fill
                      className="object-contain p-4 transform transition-transform duration-300 group-hover:scale-105"
                      style={{ imageRendering: 'auto' }}
                    />
                    <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <button
                        onClick={() => window.open(outputImage, '_blank')}
                        className="p-2 bg-gray-900/80 hover:bg-gray-700/90 rounded-lg backdrop-blur-sm border border-gray-600/50 shadow-md transition-all hover:scale-110"
                        title="View fullscreen"
                      >
                        <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ) : (
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
                    <p className="text-sm text-gray-400 font-medium">Upscaled Image</p>
                  </div>
                )}
              </div>
              {outputImage && (
                <div className="w-full mt-3">
                  <DownloadOptions imageUrl={outputImage} filename="upscaled-image" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 