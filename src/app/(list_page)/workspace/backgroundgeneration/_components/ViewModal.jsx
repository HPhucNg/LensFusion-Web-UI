import React, { useState } from 'react';
import Image from 'next/image';
import {
  BookOpen,
  Bot,
  Command,
  Frame,
  LifeBuoy,
  Map,
  PieChart,
  Send,
  Settings2,
  SquareTerminal,
  Image as ImageIcon,
  Eraser,
  Scissors,
  Expand,
  Trash2,
  ZoomIn,
  History,
  Clock,
  ChevronRight,
  Brush,
  Stars,
  PanelLeftClose,
  PanelLeft,
  MoreHorizontal,
  X,
  Loader,
  Download,
  RefreshCw
} from "lucide-react"
import RetouchModal from './RetouchModal';
import ObjectRemovalModal from './ObjectRemovalModal';
import ExpansionModal from './ExpansionModal';
import { upscaleImageClient } from '@/lib/upscaleImage';
import { auth, db, storage } from '@/firebase/FirebaseConfig';
import { doc, getDoc, updateDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateUserTokens } from "@/firebase/firebaseUtils";

const ViewModal = ({ 
  isOpen, 
  onClose, 
  imageSrc, 
  prompt,
  onUpscale,
  onRetouch,
  onInpaint,
  onExpand,
  onRemove,
  onRegenerate,
  onReprompt,
  onDownload
}) => {
  const [showRetouchModal, setShowRetouchModal] = useState(false);
  const [showObjectRemovalModal, setShowObjectRemovalModal] = useState(false);
  const [showExpansionModal, setShowExpansionModal] = useState(false);
  const [isUpscaling, setIsUpscaling] = useState(false);
  const [upscaleError, setUpscaleError] = useState(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regenerateError, setRegenerateError] = useState(null);

  if (!isOpen) return null;

  // Handle backdrop click to close modal
  const handleBackdropClick = (e) => {
    // Close only if clicking directly on the backdrop, not on the modal content
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleRetouchClick = () => {
    setShowRetouchModal(true);
  };

  const handleRemoveClick = () => {
    setShowObjectRemovalModal(true);
  };

  const handleExpandClick = () => {
    setShowExpansionModal(true);
  };

  // Handler for regenerate with new seed
  const handleRegenerateClick = async () => {
    if (isRegenerating) return;
    
    setIsRegenerating(true);
    setRegenerateError(null);
    
    try {
      // Check if user is logged in
      const user = auth.currentUser;
      if (!user) {
        setRegenerateError("Please log in to use this feature");
        setIsRegenerating(false);
        return;
      }
      
      // Check for tokens
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();
      
      // Check for locked tokens
      if (userData.subscriptionStatus === 'inactive' && userData.lockedTokens > 0) {
        setRegenerateError("Your credits are currently locked. Please subscribe to a plan.");
        setIsRegenerating(false);
        return;
      }
      
      // Check if user has enough tokens (regeneration costs 10 tokens)
      if (userData.tokens < 10 && userData.subscriptionStatus !== 'active') {
        setRegenerateError("Not enough credits. Please purchase more credits or subscribe.");
        setIsRegenerating(false);
        return;
      }
      
      // Call the regenerate function with a new seed
      if (onRegenerate) {
        // Close this modal first
        onClose();
        
        // Generate a new random seed and call the original regenerate function
        onRegenerate();
      }
    } catch (error) {
      console.error('Regeneration error:', error);
      setRegenerateError(error.message || 'Failed to regenerate image');
    } finally {
      setIsRegenerating(false);
    }
  };

  // New handler for upscale action
  const handleUpscaleClick = async () => {
    if (!imageSrc || isUpscaling) return;
    
    setIsUpscaling(true);
    setUpscaleError(null);
    
    try {
      // Get current user
      const user = auth.currentUser;
      if (!user) {
        setUpscaleError("Please log in to use this feature");
        setIsUpscaling(false);
        return;
      }
      
      // Check tokens
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();
      
      // Check for locked tokens
      if (userData.subscriptionStatus === 'inactive' && userData.lockedTokens > 0) {
        setUpscaleError("Your credits are currently locked. Please subscribe to a plan.");
        setIsUpscaling(false);
        return;
      }
      
      // Check if user has enough tokens (upscale costs 1 token)
      if (userData.tokens < 1 && userData.subscriptionStatus !== 'active') {
        setUpscaleError("Not enough credits. Please purchase more credits or subscribe.");
        setIsUpscaling(false);
        return;
      }
      
      // Create a file from the image URL
      const response = await fetch(imageSrc);
      const blob = await response.blob();
      const file = new File([blob], 'input-image.jpg', { type: 'image/jpeg' });
      
      // Call the upscale function
      const resultUrl = await upscaleImageClient(file);
      
      // Deduct token
      await updateUserTokens(user.uid, 1);
      
      // Save to gallery
      const timestamp = Date.now();
      const filename = `upscaled-${timestamp}.png`;
      
      const storageRef = ref(storage, `user_images/${user.uid}/${filename}`);
      
      const uploadResponse = await fetch(resultUrl);
      const uploadBlob = await uploadResponse.blob();
      
      await uploadBytes(storageRef, uploadBlob);
      const downloadURL = await getDownloadURL(storageRef);
      
      const userImageRef = collection(db, 'user_images');
      await addDoc(userImageRef, {
        userID: user.uid,
        img_data: downloadURL,
        createdAt: serverTimestamp(),
        type: 'upscaled'
      });
      
      // Create a File object for return
      const fileObject = new File([uploadBlob], 'upscaled-image.png', { type: uploadBlob.type });
      
      // Pass the result back to parent component
      if (onUpscale) {
        onUpscale(resultUrl, fileObject);
      }
      
      // Close the fullscreen view after upscaling is complete
      onClose();
      
    } catch (error) {
      console.error('Upscale error:', error);
      setUpscaleError(error.message || 'Failed to upscale image');
    } finally {
      setIsUpscaling(false);
    }
  };

  // Handler for retouched image update
  const handleRetouchedImage = (newImageUrl, fileObject) => {
    console.log('ViewModal.handleRetouchedImage called with URL:', newImageUrl);
    
    // Update the image in the parent component
    if (onRetouch) {
      console.log('ViewModal calling onRetouch with:', newImageUrl);
      onRetouch(newImageUrl, fileObject);
    }
  };

  // Handler for object removed image update
  const handleObjectRemovedImage = (newImageUrl, fileObject) => {
    console.log('ViewModal.handleObjectRemovedImage called with URL:', newImageUrl);
    
    // Update the image in the parent component
    if (onRemove) {
      console.log('ViewModal calling onRemove with:', newImageUrl);
      onRemove(newImageUrl, fileObject);
    }
  };

  // Handler for expanded image update
  const handleExpandedImage = (newImageUrl, fileObject) => {
    console.log('ViewModal.handleExpandedImage called with URL:', newImageUrl);
    
    // Update the image in the parent component
    if (onExpand) {
      console.log('ViewModal calling onExpand with:', newImageUrl);
      onExpand(newImageUrl, fileObject);
    }
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center overflow-hidden backdrop-blur-sm"
        onClick={handleBackdropClick}
      >
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-6 left-6 z-10 p-2 rounded-full bg-gray-800/80 hover:bg-gray-700 transition-colors"
        >
          <X className="w-6 h-6 text-white" />
        </button>

        <div className="flex w-4/5 h-4/5 bg-gray-900/70 rounded-xl border border-gray-800/40 backdrop-blur-md overflow-hidden max-w-6xl">
          <div className="flex-1 bg-gray-900/50 flex items-center justify-center relative p-4">
            {/* Loading overlay while upscaling */}
            {isUpscaling && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-10">
                <div className="text-center space-y-4">
                  <Loader className="w-10 h-10 text-purple-500 animate-spin mx-auto" />
                  <p className="text-white font-medium">Upscaling Image...</p>
                </div>
              </div>
            )}
            
            {/* Loading overlay while regenerating */}
            {isRegenerating && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-10">
                <div className="text-center space-y-4">
                  <RefreshCw className="w-10 h-10 text-purple-500 animate-spin mx-auto" />
                  <p className="text-white font-medium">Regenerating Image...</p>
                </div>
              </div>
            )}
            
            {/* Error message */}
            {(upscaleError || regenerateError) && (
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-500/80 text-white px-4 py-2 rounded-lg z-10">
                {upscaleError || regenerateError}
              </div>
            )}
            
            <img 
              src={imageSrc} 
              alt="Image preview" 
              className="max-w-full max-h-full object-contain"
            />
          </div>
          
          <div className="w-80 border-l border-gray-800/50 p-4 flex flex-col h-full bg-black/20">
            <div className="pb-4 border-b border-gray-800/50">
              <h2 className="text-xl font-semibold text-white">Image Details</h2>
              <p className="text-sm text-gray-400 mt-1">View and edit your image</p>
            </div>
            
            {prompt && (
              <div className="my-4">
                <h3 className="text-lg font-medium text-gray-300">Prompt</h3>
                <div className="bg-gray-800/50 border border-gray-700/30 rounded-lg p-3 mt-2">
                  <p className="text-sm text-gray-300">{prompt}</p>
                </div>
              </div>
            )}
            
            <div className="mt-auto pt-6">
              {/* Divider */}
              <div className="border-t border-gray-800 pt-4 mb-6"></div>
              
              {/* Edit options section */}
              <div className="space-y-3 mb-6">
                <h3 className="text-gray-300 font-medium text-sm">Edit</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={handleUpscaleClick} 
                    disabled={isUpscaling}
                    className={`flex items-center justify-center space-x-2 p-2 ${
                      isUpscaling 
                        ? 'bg-purple-800/50 cursor-wait' 
                        : 'bg-gray-800 hover:bg-gray-700'
                    } rounded-lg transition-colors`}
                  >
                    {isUpscaling ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <Stars className="w-4 h-4" />
                    )}
                    <span className="text-xs">{isUpscaling ? 'Upscaling...' : 'Upscale'}</span>
                  </button>
                  
                  <button 
                    onClick={handleRetouchClick} 
                    className="flex items-center justify-center space-x-2 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <Brush className="w-4 h-4" />
                    <span className="text-xs">Retouch</span>
                  </button>
                  
                  <button 
                    onClick={handleExpandClick} 
                    className="flex items-center justify-center space-x-2 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <Expand className="w-4 h-4" />
                    <span className="text-xs">Expand</span>
                  </button>
                  
                  <button 
                    onClick={handleRemoveClick} 
                    className="flex items-center justify-center space-x-2 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <Eraser className="w-4 h-4" />
                    <span className="text-xs">Remove</span>
                  </button>
                </div>
              </div>
              
              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={handleRegenerateClick}
                  disabled={isRegenerating} 
                  className={`flex items-center justify-center space-x-2 p-2 ${
                    isRegenerating 
                      ? 'bg-purple-800/50 cursor-wait' 
                      : 'bg-gray-800 hover:bg-gray-700'
                  } rounded-lg transition-colors`}
                >
                  {isRegenerating ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <History className="w-4 h-4" />
                  )}
                  <span className="text-xs">{isRegenerating ? 'Regenerating...' : 'Regenerate'}</span>
                </button>
                
                <button 
                  onClick={onDownload} 
                  className="flex items-center justify-center space-x-2 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span className="text-xs">Download</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Retouch Modal */}
      <RetouchModal 
        isOpen={showRetouchModal} 
        onClose={() => setShowRetouchModal(false)} 
        imageSrc={imageSrc}
        onImageUpdate={handleRetouchedImage}
      />

      {/* Object Removal Modal */}
      <ObjectRemovalModal 
        isOpen={showObjectRemovalModal} 
        onClose={() => setShowObjectRemovalModal(false)} 
        imageSrc={imageSrc}
        onImageUpdate={handleObjectRemovedImage}
      />

      {/* Expansion Modal */}
      <ExpansionModal 
        isOpen={showExpansionModal} 
        onClose={() => setShowExpansionModal(false)} 
        imageSrc={imageSrc}
        onImageUpdate={handleExpandedImage}
      />
    </>
  );
};

export default ViewModal; 