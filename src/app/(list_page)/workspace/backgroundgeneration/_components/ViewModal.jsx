import React, { useState, useEffect } from 'react';
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
  RefreshCw,
  Move
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
  const [showDetails, setShowDetails] = useState(true);
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  // Add keyboard shortcuts (keep some basic functionality)
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e) => {
      // Escape to close
      if (e.key === 'Escape') {
        onClose();
      }
      // Toggle sidebar with S
      if (e.key === 's' || e.key === 'S') {
        setShowDetails(prev => !prev);
      }
      // D to download
      if ((e.key === 'd' || e.key === 'D') && onDownload) {
        onDownload();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onDownload]);

  // Add fade-in effect and prevent body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'auto';
      };
    }
  }, [isOpen]);

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

  // Toggle details panel on mobile
  const toggleDetails = () => {
    setShowDetails(!showDetails);
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
        className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center overflow-hidden backdrop-blur-md animate-in fade-in duration-300"
        onClick={handleBackdropClick}
      >
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-4 left-4 z-10 p-2 rounded-full bg-gray-800/80 hover:bg-gray-700/90 hover:scale-105 transition-all duration-200 text-gray-300 hover:text-white shadow-lg"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Toggle details button (mobile only) */}
        <button 
          onClick={toggleDetails}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-gray-800/80 hover:bg-gray-700/90 hover:scale-105 transition-all duration-200 text-gray-300 hover:text-white shadow-lg md:hidden"
          title="Toggle details"
        >
          {showDetails ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeft className="w-5 h-5" />}
        </button>

        <div className="flex flex-col md:flex-row w-full h-full md:w-[90%] md:h-[85%] lg:w-[85%] lg:h-[85%] max-w-6xl bg-gray-900/60 rounded-xl border border-gray-800/40 backdrop-blur-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
          {/* Main image container */}
          <div className={`relative flex-1 bg-gray-900/30 flex items-center justify-center ${showDetails ? 'h-[50%]' : 'h-full'} md:h-full bg-grid-pattern transition-all duration-300 ease-in-out`}>
            {/* Loading state */}
            {!isImageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 z-5">
                <Loader className="w-10 h-10 text-purple-400 animate-spin" />
              </div>
            )}
            
            {/* Loading overlay while upscaling */}
            {isUpscaling && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-10 backdrop-blur-sm">
                <div className="text-center space-y-4 px-6 py-8 rounded-xl bg-gray-900/80 backdrop-blur-md max-w-xs">
                  <Loader className="w-12 h-12 text-purple-400 animate-spin mx-auto" />
                  <p className="text-white font-medium">Upscaling Image...</p>
                  <p className="text-gray-400 text-sm">This may take a moment</p>
                </div>
              </div>
            )}
            
            {/* Loading overlay while regenerating */}
            {isRegenerating && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-10 backdrop-blur-sm">
                <div className="text-center space-y-4 px-6 py-8 rounded-xl bg-gray-900/80 backdrop-blur-md max-w-xs">
                  <RefreshCw className="w-12 h-12 text-purple-400 animate-spin mx-auto" />
                  <p className="text-white font-medium">Regenerating Image...</p>
                  <p className="text-gray-400 text-sm">Creating a new variation</p>
                </div>
              </div>
            )}
            
            {/* Error message */}
            {(upscaleError || regenerateError) && (
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-500/90 text-white px-4 py-2 rounded-lg z-10 max-w-[90%] text-center shadow-lg backdrop-blur-sm">
                {upscaleError || regenerateError}
              </div>
            )}
            
            {/* Image container */}
            <div className="w-full h-full overflow-hidden relative flex items-center justify-center p-4">
              <img 
                src={imageSrc} 
                alt="Image preview" 
                className="max-w-full max-h-full object-contain rounded-lg shadow-md transition-opacity duration-300 max-h-[85vh] md:max-h-[75vh]"
                style={{ opacity: isImageLoaded ? 1 : 0 }}
                onLoad={() => setIsImageLoaded(true)}
              />
            </div>
          </div>
          
          {/* Info sidebar - conditionally shown on mobile */}
          {showDetails && (
            <div className="w-full md:w-72 lg:w-80 border-t-0 md:border-t-0 md:border-l border-gray-800/50 flex flex-col md:h-full bg-gray-950/80 h-[50%] md:h-full overflow-y-auto transition-all duration-300 ease-in-out">
              {/* Header */}
              <div className="p-4 border-b border-gray-800/50 bg-gray-900/30">
                <h2 className="text-lg md:text-xl font-semibold text-white">Image Details</h2>
                <p className="text-xs md:text-sm text-gray-400 mt-1">View and edit your image</p>
              </div>
              
              {/* Content scroll area */}
              <div className="flex-1 overflow-y-auto p-4">
                {/* Prompt section */}
                {prompt && (
                  <div className="mb-4">
                    <h3 className="text-md md:text-lg font-medium text-gray-300 mb-2">Prompt</h3>
                    <div className="bg-gray-800/50 border border-gray-700/30 rounded-lg p-3 backdrop-blur-sm">
                      <p className="text-xs md:text-sm text-gray-300">{prompt}</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Actions footer */}
              <div className="p-4 pt-0 border-t border-gray-800/30 mt-auto">
                {/* Edit options section */}
                <div className="space-y-3 mb-4">
                  <h3 className="text-gray-300 font-medium text-xs md:text-sm">Edit</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={handleUpscaleClick} 
                      disabled={isUpscaling}
                      className={`flex items-center justify-center space-x-1 py-2 px-2 ${
                        isUpscaling 
                          ? 'bg-purple-900/50 cursor-wait' 
                          : 'bg-gray-800/90 hover:bg-gray-700/90 hover:scale-[1.02]'
                      } rounded-lg transition-all duration-200 shadow-sm`}
                    >
                      {isUpscaling ? (
                        <Loader className="w-3 h-3 md:w-4 md:h-4 animate-spin" />
                      ) : (
                        <Stars className="w-3 h-3 md:w-4 md:h-4" />
                      )}
                      <span className="text-[10px] md:text-xs font-medium">{isUpscaling ? 'Upscaling...' : 'Upscale'}</span>
                    </button>
                    
                    <button 
                      onClick={handleRetouchClick} 
                      className="flex items-center justify-center space-x-1 py-2 px-2 bg-gray-800/90 hover:bg-gray-700/90 hover:scale-[1.02] rounded-lg transition-all duration-200 shadow-sm"
                    >
                      <Brush className="w-3 h-3 md:w-4 md:h-4" />
                      <span className="text-[10px] md:text-xs font-medium">Retouch</span>
                    </button>
                    
                    <button 
                      onClick={handleExpandClick} 
                      className="flex items-center justify-center space-x-1 py-2 px-2 bg-gray-800/90 hover:bg-gray-700/90 hover:scale-[1.02] rounded-lg transition-all duration-200 shadow-sm"
                    >
                      <Expand className="w-3 h-3 md:w-4 md:h-4" />
                      <span className="text-[10px] md:text-xs font-medium">Expand</span>
                    </button>
                    
                    <button 
                      onClick={handleRemoveClick} 
                      className="flex items-center justify-center space-x-1 py-2 px-2 bg-gray-800/90 hover:bg-gray-700/90 hover:scale-[1.02] rounded-lg transition-all duration-200 shadow-sm"
                    >
                      <Eraser className="w-3 h-3 md:w-4 md:h-4" />
                      <span className="text-[10px] md:text-xs font-medium">Remove</span>
                    </button>
                  </div>
                </div>
                
                {/* Action buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={handleRegenerateClick}
                    disabled={isRegenerating} 
                    className={`flex items-center justify-center space-x-1 py-2 px-2 ${
                      isRegenerating 
                        ? 'bg-purple-900/50 cursor-wait' 
                        : 'bg-gray-800/90 hover:bg-gray-700/90 hover:scale-[1.02]'
                    } rounded-lg transition-all duration-200 shadow-sm`}
                  >
                    {isRegenerating ? (
                      <Loader className="w-3 h-3 md:w-4 md:h-4 animate-spin" />
                    ) : (
                      <History className="w-3 h-3 md:w-4 md:h-4" />
                    )}
                    <span className="text-[10px] md:text-xs font-medium">{isRegenerating ? 'Regenerating...' : 'Regenerate'}</span>
                  </button>
                  
                  <button 
                    onClick={onDownload} 
                    className="flex items-center justify-center space-x-1 py-2 px-2 bg-gray-800/90 hover:bg-gray-700/90 hover:scale-[1.02] rounded-lg transition-all duration-200 shadow-sm"
                  >
                    <Download className="w-3 h-3 md:w-4 md:h-4" />
                    <span className="text-[10px] md:text-xs font-medium">Download</span>
                  </button>
                </div>
              </div>
            </div>
          )}
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

// CSS class to be added to global.css
// .bg-grid-pattern {
//   background-image: 
//     linear-gradient(to right, rgba(55, 65, 81, 0.1) 1px, transparent 1px),
//     linear-gradient(to bottom, rgba(55, 65, 81, 0.1) 1px, transparent 1px);
//   background-size: 20px 20px;
// }

export default ViewModal; 