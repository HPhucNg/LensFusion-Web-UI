"use client";

import React, { useState, useEffect } from 'react';
import { Upload, X, ArrowLeft, ImageIcon } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { auth, db, storage } from '@/firebase/FirebaseConfig';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useRouter } from 'next/navigation';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import DownloadOptions from '@/components/DownloadOptions';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

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
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Back Button */}
        <Button
          onClick={() => router.back()}
          variant="ghost"
          className="text-gray-300 hover:text-white hover:bg-gray-800 transition-colors mb-6 flex items-center space-x-2"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Dashboard</span>
        </Button>

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-purple-600">Background Remover</h1>
          <p className="text-gray-300 mt-3 text-lg max-w-2xl mx-auto">Remove backgrounds from your images instantly using advanced AI technology</p>
        </div>

        {/* Token Card */}
        <div className="mb-8 flex justify-center">
          <Card className="w-full max-w-md bg-gray-800/40 border border-gray-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-200">Available Tokens</h3>
                  <p className="text-sm text-gray-400">Each background removal uses 1 token</p>
                </div>
                <Badge variant="outline" className="text-xl py-2 px-3 bg-purple-500/20 text-purple-300 border-purple-500">
                  {tokens}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notification Messages */}
        {success && (
          <Alert className="mb-6 bg-green-900/30 border border-green-500 text-green-300">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert className="mb-6 bg-red-900/30 border border-red-500 text-red-300">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Main Content */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Upload Section */}
          <Card className="bg-gray-800/40 border border-gray-700 overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl font-semibold text-white">Input Image</CardTitle>
                {inputImage && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearImages}
                    className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Clear
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>              
              {!inputImage ? (
                <div className="border-2 border-dashed border-gray-700 rounded-lg p-8 bg-gray-900/50 transition-all hover:border-purple-500/50 hover:bg-gray-900/70">
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
                      className="flex flex-col items-center cursor-pointer w-full"
                    >
                      <div className="p-4 rounded-full bg-purple-500/20 mb-4">
                        <ImageIcon className="w-10 h-10 text-purple-400" />
                      </div>
                      <span className="text-white font-medium">Click to upload or drag and drop</span>
                      <span className="text-sm text-gray-400 mt-2">PNG, JPG up to 10MB</span>
                    </label>
                  </div>
                </div>
              ) : (
                <div className="relative rounded-lg overflow-hidden border border-gray-700 aspect-square">
                  <img
                    src={inputImage}
                    alt="Input"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <Button
                onClick={handleRemoveBackground}
                disabled={!inputImage || isProcessing || tokens < 1}
                className="w-full mt-4 py-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 border-0 font-medium text-white"
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
            </CardContent>
          </Card>

          {/* Result Section */}
          <Card className="bg-gray-800/40 border border-gray-700">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-white">Result</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative aspect-square rounded-lg overflow-hidden border border-gray-700 bg-[#161616]">
                {outputImage ? (
                  <img
                    src={outputImage}
                    alt="Output"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 p-4 text-center">
                    <p className="text-lg font-medium mb-2">Your processed image will appear here</p>
                    <p className="text-sm text-gray-600">Upload an image and click "Remove Background" to get started</p>
                  </div>
                )}
              </div>
              {outputImage && (
                <div className="pt-2">
                  <DownloadOptions imageUrl={outputImage} filename="background-removed" />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Feature Benefits */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <Card className="bg-gray-800/20 border border-gray-700">
            <CardContent className="pt-6">
              <h3 className="text-xl font-medium text-white mb-2">Fast Processing</h3>
              <p className="text-gray-400">Get your images processed in seconds with our advanced AI technology</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800/20 border border-gray-700">
            <CardContent className="pt-6">
              <h3 className="text-xl font-medium text-white mb-2">High Quality</h3>
              <p className="text-gray-400">Professional-grade background removal for perfect results every time</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800/20 border border-gray-700">
            <CardContent className="pt-6">
              <h3 className="text-xl font-medium text-white mb-2">Auto-Saved</h3>
              <p className="text-gray-400">All your processed images are automatically saved to your gallery</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}