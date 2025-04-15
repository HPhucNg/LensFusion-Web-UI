"use client";

import React, { useState, useEffect } from 'react';
import Image from "next/image";
import { Upload, X, Download, Image as ImageIcon, ArrowLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { auth, db, storage } from '@/firebase/FirebaseConfig';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { saveAs } from 'file-saver';
import { useRouter } from 'next/navigation';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import DownloadOptions from '@/components/DownloadOptions';
import { removeBackgroundClient } from '@/lib/removeBackground';

// Add function to save image to user gallery
const saveToUserGallery = async (imageUrl, userId) => {
  try {
    const timestamp = Date.now();
    const filename = `background-removed-${timestamp}.png`;
    
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
      type: 'background-removed'
    });

    return true;
  } catch (error) {
    console.error('Error saving to gallery:', error);
    return false;
  }
};

export default function BackgroundRemover() {
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

  const handleRemoveBackground = async () => {
    if (!inputImage || isProcessing || tokens < 1) return;
    
    setIsProcessing(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await fetch(inputImage);
      const blob = await response.blob();
      const file = new File([blob], 'input-image.jpg', { type: 'image/jpeg' });
      
      const resultUrl = await removeBackgroundClient(file);
      setOutputImage(resultUrl);
      
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        tokens: tokens - 1
      });
      setTokens(prev => prev - 1);
      
      const saved = await saveToUserGallery(resultUrl, user.uid);
      if (saved) {
        setSuccess('Image processed and saved to your gallery successfully!');
      }
      
    } catch (error) {
      console.error('Error:', error);
      setError(error.message || 'Failed to remove background');
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors mb-6 backdrop-blur-sm bg-white/5 rounded-lg px-4 py-2 border border-white/10 hover:bg-white/10 hover:border-white/20"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            Background Remover
          </h1>
          <p className="text-lg text-white/80">Remove backgrounds from your images instantly using AI</p>
          <div className="mt-4 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:border-white/20 transition-colors">
            <p className="text-sm text-white/90">Available tokens: <span className="font-bold text-white">{tokens}</span></p>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-4 p-4 bg-green-500/10 backdrop-blur-sm rounded-xl border border-green-500/20 animate-fade-in">
            <p className="text-white">{success}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-500/10 backdrop-blur-sm rounded-xl border border-red-500/20 animate-fade-in">
            <p className="text-white">{error}</p>
          </div>
        )}

        {/* Main Content */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-4">
            <div className="group relative flex-1 rounded-2xl p-1 bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm border border-white/10 shadow-2xl hover:shadow-purple-500/10 transition-all duration-300">
              <div className="h-full w-full flex flex-col items-center justify-center rounded-xl">
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
                          className="p-2 bg-black/50 hover:bg-black/70 rounded-lg backdrop-blur-sm border border-white/10 shadow-md transition-all hover:scale-110"
                          title="View fullscreen"
                        >
                          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                          </svg>
                        </button>
                        <button
                          onClick={clearImages}
                          className="p-2 bg-black/50 hover:bg-red-500/70 rounded-lg backdrop-blur-sm border border-white/10 shadow-md transition-all hover:scale-110"
                          title="Remove image"
                        >
                          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="w-full h-full flex items-center justify-center cursor-pointer rounded-xl border-2 border-dashed border-white/20 hover:border-white/40 transition-all duration-300 group">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <div className="text-center p-6 space-y-4">
                        <div className="relative">
                          <div className="flex flex-col items-center justify-center space-y-3">
                            <div className="relative w-16 h-16">
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
                            </div>
                            <p className="text-sm text-white font-medium">Drag & drop image<br/>or click to upload</p>
                          </div>
                        </div>
                      </div>
                    </label>
                  )}
                </div>
              </div>
            </div>

            <Button
              onClick={handleRemoveBackground}
              disabled={!inputImage || isProcessing || tokens < 1}
              className="w-full h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-base font-medium rounded-xl shadow-lg hover:shadow-purple-500/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
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
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600/0 via-purple-600/20 to-purple-600/0 group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                  <Upload className="w-5 h-5 mr-2 relative z-10" />
                  <span className="relative z-10">Remove Background (1 Token)</span>
                </>
              )}
            </Button>
          </div>

          {/* Output Section */}
          <div className="group relative flex-1 rounded-2xl p-1 bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm border border-white/10 shadow-2xl hover:shadow-purple-500/10 transition-all duration-300">
            <div className="h-full w-full flex flex-col items-center justify-center rounded-xl">
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
                        className="p-2 bg-black/50 hover:bg-black/70 rounded-lg backdrop-blur-sm border border-white/10 shadow-md transition-all hover:scale-110"
                        title="View fullscreen"
                      >
                        <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center space-y-4">
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
                    <p className="text-sm text-white/70 font-medium">Processed Image</p>
                  </div>
                )}
              </div>
              {outputImage && (
                <div className="w-full mt-3">
                  <DownloadOptions imageUrl={outputImage} filename="background-removed" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}