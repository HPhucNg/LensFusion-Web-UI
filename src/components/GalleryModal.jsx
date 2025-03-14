'use client'
import React, { useState } from 'react';
import '../styles/modal_styles.css';
import { getFirestore, collection, doc, deleteDoc, query, where, getDocs } from 'firebase/firestore';
import { db, storage } from '@/firebase/FirebaseConfig';
import { ref, deleteObject, getDownloadURL } from 'firebase/storage';
import { saveAs } from 'file-saver';

function GalleryModal({ closeModal, image, openCommunityModal, onImageDeleted }) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [selectedFormat, setSelectedFormat] = useState('png');
    const [selectedQuality, setSelectedQuality] = useState('high');
    const [isDownloading, setIsDownloading] = useState(false);
    const [conversionProgress, setConversionProgress] = useState(0);

    // Handle download with format and quality
    const handleDownload = async () => {
        if (isDownloading) return;
        setIsDownloading(true);
        setConversionProgress(10);

        try {
            // If the image is from Firebase Storage, get a fresh download URL
            let imageUrl = image.img_data;
            if (imageUrl.includes('firebase') || imageUrl.includes('googleapis')) {
                const storageRef = ref(storage, imageUrl);
                imageUrl = await getDownloadURL(storageRef);
            }
            setConversionProgress(30);

            // Call our conversion API
            const response = await fetch('/api/convert-image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    imageUrl,
                    format: selectedFormat,
                    quality: selectedQuality,
                }),
            });

            setConversionProgress(70);

            const result = await response.json();
            if (!result.success) {
                throw new Error(result.error || 'Failed to convert image');
            }

            // Convert base64 to blob
            const base64Response = await fetch(result.data);
            const blob = await base64Response.blob();
            
            setConversionProgress(90);

            // Generate filename with timestamp and format
            const timestamp = new Date().toISOString().split('T')[0];
            const filename = `image-${timestamp}.${selectedFormat}`;
            
            // Download the image using file-saver
            saveAs(blob, filename);
            setConversionProgress(100);
        } catch (error) {
            console.error('Error downloading image:', error);
            alert('Failed to download image. Please try again.');
        } finally {
            setIsDownloading(false);
            setTimeout(() => setConversionProgress(0), 1000); // Reset progress after 1 second
        }
    };

    // Trigger Post Modal when "Post to Community" is clicked
    const handleCommunityClick = () => {
        openCommunityModal();  // This will open the CommunityModal in UserProfile
        closeModal();     // Close the Gallery Modal
    };

    const deleteImageFromCommunity = async (imageId) => {
        try {
            const communityRef = collection(db, 'community');
            const q = query(communityRef, where('userImageId', '==', imageId));
            const querySnapshot = await getDocs(q);
        
            const deletePromises = querySnapshot.docs.map(doc => 
                deleteDoc(doc.ref)
            );
            
            await Promise.all(deletePromises);
            return true;
        } catch (error) {
            console.error('Error deleting from community:', error);
            return false;
        }
    };
    
    const deleteImageFromStorage = async (imageUrl) => {
        try {
            // Create a reference to the file to delete
            const storageRef = ref(storage, imageUrl);
            await deleteObject(storageRef);
            return true;
        } catch (error) {
            console.error('Error deleting from storage:', error);
            return false;
        }
    };
    
    const deleteImageFromUserImages = async (imageId) => {
        try {
            const userImagesRef = doc(db, 'user_images', imageId);
            await deleteDoc(userImagesRef);
            return true;
        } catch (error) {
            console.error('Error deleting from user_images:', error);
            return false;
        }
    };

    const handleDeleteClick = async () => {
        if (isDeleting) return; // Prevent multiple clicks

        const confirmMessage = image.communityPost
            ? "This image is posted in the community. Are you sure you want to delete it?"
            : "Once you delete this image, it cannot be recovered. Are you sure you want to delete it?";

        const userConfirmed = window.confirm(confirmMessage);
        if (!userConfirmed) {
            console.log("Deletion canceled.");
            return;
        }

        setIsDeleting(true);
        try {
            const imageId = image.uid || image.id; // Handle both ID formats
            let success = true;

            // Delete from community if posted there
            if (image.communityPost) {
                success = await deleteImageFromCommunity(imageId);
            }

            // Delete from user_images collection
            if (success) {
                success = await deleteImageFromUserImages(imageId);
            }

            // Delete the actual image file from storage if URL exists
            if (success && image.img_data) {
                success = await deleteImageFromStorage(image.img_data);
            }

            if (success) {
                // Notify parent component about the deletion
                if (onImageDeleted) {
                    onImageDeleted(imageId);
                }
                alert("Image successfully deleted.");
                closeModal();
            } else {
                alert("There was an error deleting the image. Please try again.");
            }
        } catch (error) {
            console.error('Error during deletion:', error);
            alert("There was an error deleting the image. Please try again.");
        } finally {
            setIsDeleting(false);
        }
    };
    
    const postButtonText = image.communityPost ? "Manage Post to Community" : "Post to Community";

    return (
        <div className='add_pin_modal'>
            <div className='add_pin_container'>
                <div className="side" id="left_side">
                    <div className="topsection">
                        <div className="post_to">Manage Image</div>
                    </div>
                
                    <div className="midsection">
                        <div>
                            {/* Render the selected image */}
                            {image ? (
                                <img src={image.img_data} alt="Selected" className="object-cover w-full max-h-[calc(100%-50px) rounded-xl" />
                            ) : (
                                <p>No image selected</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="side" id="right_side">
                    <div className="topsection">
                        <div onClick={closeModal} className="w-10">
                            <img src="/Vector.png" alt="close_pin" />
                        </div>
                    </div>

                    <div className="midsection items-center">
                        {/* Download options */}
                        <div className="w-full mb-4 space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm text-gray-400">Format</label>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => setSelectedFormat('jpg')}
                                        className={`px-3 py-1 rounded-lg ${
                                            selectedFormat === 'jpg' 
                                                ? 'bg-purple-600 text-white' 
                                                : 'bg-gray-800 text-gray-400'
                                        }`}
                                    >
                                        JPG
                                    </button>
                                    <button 
                                        onClick={() => setSelectedFormat('png')}
                                        className={`px-3 py-1 rounded-lg ${
                                            selectedFormat === 'png' 
                                                ? 'bg-purple-600 text-white' 
                                                : 'bg-gray-800 text-gray-400'
                                        }`}
                                    >
                                        PNG
                                    </button>
                                    <button 
                                        onClick={() => setSelectedFormat('webp')}
                                        className={`px-3 py-1 rounded-lg ${
                                            selectedFormat === 'webp' 
                                                ? 'bg-purple-600 text-white' 
                                                : 'bg-gray-800 text-gray-400'
                                        }`}
                                    >
                                        WebP
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm text-gray-400">Quality</label>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => setSelectedQuality('low')}
                                        className={`px-3 py-1 rounded-lg ${
                                            selectedQuality === 'low' 
                                                ? 'bg-purple-600 text-white' 
                                                : 'bg-gray-800 text-gray-400'
                                        }`}
                                    >
                                        Low
                                    </button>
                                    <button 
                                        onClick={() => setSelectedQuality('medium')}
                                        className={`px-3 py-1 rounded-lg ${
                                            selectedQuality === 'medium' 
                                                ? 'bg-purple-600 text-white' 
                                                : 'bg-gray-800 text-gray-400'
                                        }`}
                                    >
                                        Medium
                                    </button>
                                    <button 
                                        onClick={() => setSelectedQuality('high')}
                                        className={`px-3 py-1 rounded-lg ${
                                            selectedQuality === 'high' 
                                                ? 'bg-purple-600 text-white' 
                                                : 'bg-gray-800 text-gray-400'
                                        }`}
                                    >
                                        High
                                    </button>
                                </div>
                            </div>

                            {/* Add progress bar */}
                            {conversionProgress > 0 && (
                                <div className="w-full bg-gray-800 rounded-full h-2.5 mb-4">
                                    <div 
                                        className="bg-purple-600 h-2.5 rounded-full transition-all duration-300"
                                        style={{ width: `${conversionProgress}%` }}
                                    />
                                </div>
                            )}

                            <button 
                                className="w-[240px] h-[40px] mb-4 rounded-[22px] flex justify-center items-center text-[#1a202c] bg-[hsl(261,80%,64%)] hover:bg-[hsl(260,72.6%,77.1%)] text-white transition-all duration-100"
                                onClick={handleDownload}
                                disabled={isDownloading}
                            >
                                {isDownloading ? 'Converting...' : 'Download Image'}
                            </button>

                            <button 
                                className="w-[240px] h-[40px] mb-4 rounded-[22px] flex justify-center items-center text-[#1a202c] bg-[hsl(261,80%,64%)] hover:bg-[hsl(260,72.6%,77.1%)] text-white transition-all duration-100" 
                                onClick={handleCommunityClick}
                            >
                                {postButtonText}
                            </button>
                            <button 
                                className="w-[240px] h-[40px] mb-4 rounded-[22px] flex justify-center items-center bg-red-600 hover:bg-red-700 text-white transition-all duration-100"
                                onClick={handleDeleteClick}
                                disabled={isDeleting}
                            >
                                {isDeleting ? 'Deleting...' : 'Delete Image'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default GalleryModal;
