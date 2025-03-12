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

// Add function to save image to user gallery
const saveToUserGallery = async (imageUrl, userId) => {
  try {
    // Create a unique filename
    const timestamp = Date.now();
    const filename = `background-removed-${timestamp}.png`;
    
    // Create a reference to the storage location
    const storageRef = ref(storage, `user_images/${userId}/${filename}`);
    
    // Fetch the image and convert to blob
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    
    // Upload to Firebase Storage
    await uploadBytes(storageRef, blob);
    const downloadURL = await getDownloadURL(storageRef);
    
    // Add to Firestore user_images collection
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
    if (!inputImage || isProcessing || tokens < 1) return;
    
    setIsProcessing(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Get the file from the data URL
      const response = await fetch(inputImage);
      const blob = await response.blob();
      const file = new File([blob], 'input-image.jpg', { type: 'image/jpeg' });
      
      // Remove background
      const resultUrl = await removeBackground(file);
      setOutputImage(resultUrl);
      
      // Update tokens
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        tokens: tokens - 1
      });
      setTokens(prev => prev - 1);
      
      // Save to user's gallery
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
          <h1 className="text-3xl font-bold">Background Remover</h1>
          <p className="text-gray-400 mt-2">Remove backgrounds from your images instantly using AI</p>
          <div className="mt-4 p-4 bg-[#1E1E1E] rounded-lg">
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
            <div className="space-y-4">
              <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-900">
                {outputImage ? (
                  <img
                    src={outputImage}
                    alt="Output"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                    Processed image will appear here
                  </div>
                )}
              </div>
              {outputImage && (
                <DownloadOptions imageUrl={outputImage} filename="background-removed" />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}