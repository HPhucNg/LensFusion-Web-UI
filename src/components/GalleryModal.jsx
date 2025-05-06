'use client'
import React, { useState, useEffect } from 'react';
import Image from 'next/image';  
import { getFirestore, collection, doc, deleteDoc, query, where, getDocs, getDoc} from 'firebase/firestore';
import { getStorage, ref, deleteObject, getDownloadURL } from 'firebase/storage';
import Modal from '@/components/Modal';
import { db, storage } from '@/firebase/FirebaseConfig';
import { saveAs } from 'file-saver';


function GalleryModal({ closeModal, image, onDelete}) {  // accept the 'image' prop
    const [isCommunityModalOpen, setIsCommunityModalOpen] = useState(false); // control the community modal visibility
    const [selectedFormat, setSelectedFormat] = useState('png');
    const [selectedQuality, setSelectedQuality] = useState('high');
    const [isDownloading, setIsDownloading] = useState(false);
    const [conversionProgress, setConversionProgress] = useState(0);
    const [imageStatus, setImageStatus] = useState(null);

     useEffect(() => {
            const fetchUserImageData = async () => {
                if (image) {
                    try {
                        const userImageRef = doc(db, 'user_images', image.uid);  // fetch user by ID from 'users' collection
                        const userDoc = await getDoc(userImageRef);
    
                        if (userDoc.exists()) {
                            const userImageData = userDoc.data();
                            // if image has communityPost field = image can be posted to community - imageStatus gets set, else remains null
                            if (userImageData.type === 'background-generated'){
                                    if (userImageData.hasOwnProperty('communityPostId')){
                                        setImageStatus(userImageData.communityPostId)}
                                    else { setImageStatus(false)}
                                } 
                        } else {
                            console.log("User Image not found.");
                        }
                    } catch (error) {
                        console.error("Error fetching user data: ", error);
                    }
                }
            };
    
            fetchUserImageData();
        }, [image]);

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

    // trigger Post Modal when "Post to Community" is clicked
    const handleCommunityClick = async () => {
       //updateImageStatus(true); 
        setIsCommunityModalOpen(true);  
    };

    const closeCommunityModal = () => {
        setIsCommunityModalOpen(false); 
        
        //updateImageStatus(true); // Ensure the status is updated to reflect the community post
    };

    const deleteSubcollections = async (communityDocId) => {
        const likesRef = collection(db, 'community', communityDocId, 'likes');
        const likesSnapshot = await getDocs(likesRef);
        for (const doc of likesSnapshot.docs) {
            await deleteDoc(doc.ref);
        }
    
        const commentsRef = collection(db, 'community', communityDocId, 'comments');
        const commentsSnapshot = await getDocs(commentsRef);
        for (const doc of commentsSnapshot.docs) {
            await deleteDoc(doc.ref);
        }
    };
    

    const deleteImageFromCommunity = async (imageId) => {
        const communityRef = collection(db, 'community');
        const q = query(communityRef, where('userImageId', '==', imageId));
        const querySnapshot = await getDocs(q);
    
        querySnapshot.forEach(async (docSnap) => {
            const communityDocId = docSnap.id;
            await deleteSubcollections(communityDocId); // delete subcollections (likes, comments)
            await deleteDoc(doc(db, 'community', communityDocId)); // delete the community post
        });
    };
    
    const deleteImageFromStorage = async (imageUrl) => {
        if (!imageUrl || typeof imageUrl !== 'string') {
            console.error('Error: Invalid image URL');
            return;
        }
    
        //for debugging
        console.log('Image URL:', imageUrl);
    
        // ensure the URL contains '/o/', which indicates the storage path
        if (!imageUrl.includes('/o/')) {
            console.error('Error: URL does not contain the expected "/o/" path:', imageUrl);
            return;
        }
    
        try {
            // extract the file path from the URL after '/o/'
            const storagePath = imageUrl.split('/o/')[1]?.split('?')[0];
    
            // if the storagePath is undefined or empty, log an error
            if (!storagePath) {
                console.error('Error: Unable to extract storage path from URL');
                return;
            }
    
            console.log('Extracted storage path:', storagePath);
    
            // Ddecode the URL-encoded path (replaces %2F with / and other encoded characters)
            const decodedPath = decodeURIComponent(storagePath);
    
            console.log('Decoded path:', decodedPath);
    
            // Firebase Storage reference for the image
            const storage = getStorage();
            const imageRef = ref(storage, decodedPath);  // the decoded path
    
            // delete the image from Firebase Storage
            await deleteObject(imageRef);
            console.log('Image deleted from Firebase Storage.');
        } catch (error) {
            console.error('Error deleting image from Firebase Storage:', error);
        }
    };

    const deleteImageFromUserImages = async (imageId) => {
        const userImagesRef = doc(db, 'user_images', imageId);
        try {
            await deleteDoc(userImagesRef); // delete the image from user_images collection
            console.log('Image deleted from Firestore.');
        } catch (error) {
            console.error('Error deleting image from Firestore:', error);
        }
    };
    

    const handleDeleteClick = () => {
        if (!image || !image.img_data) {
            console.error('Error: Image data is missing.');
            alert('Error: Image data is missing.');
            return;
        }
    
        // check if the image has the required properties for deletion
        console.log('Image to delete:', image);
        // check if it has communityPost field and if so, is it true? then delete from community
        if (image?.hasOwnProperty('communityPostID')){
            const userConfirmed = window.confirm(
                "This image is posted in the community. Are you sure you want to delete it?"
            );
            if (userConfirmed) {
                console.log("Deleting image from user_images, community, and storage...");
                deleteImageFromCommunity(image.uid);  // remove from the community collection
                deleteImageFromStorage(image.img_data);  // remove from Firebase Storage
                deleteImageFromUserImages(image.uid);  // remove from the user's images collection
                alert("Image deleted.");
                // update the parent state (UserProfile)
                if (onDelete) {
                    onDelete(image.uid);
                }
                closeModal();

            }
        } else {
            const userConfirmed = window.confirm(
                "Once you delete this image, it cannot be recovered. Are you sure you want to delete it?"
            );
            if (userConfirmed) {
                console.log("Deleting image from user_images and storage...");
                deleteImageFromStorage(image.img_data);  // remove from Firebase Storage
                deleteImageFromUserImages(image.uid);  // remove from the user's images collection
                alert("Image deleted.");
                //  update the parent state (UserProfile)
                if (onDelete) {
                    onDelete(image.uid);
                }
                closeModal();
            }
        }
    };
    
    

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 text-white flex justify-center items-center">
            {!isCommunityModalOpen && ( <>  <div className="border-2 border-transparent rounded-[50px] w-full max-w-3xl h-auto min-h-[550px] max-h-[90vh] overflow-y-auto p-6 md:p-8" style={{ background: 'var(--modal-background)', backdropFilter: 'var(--modal-backdrop)'}}>
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-extrabold">Manage Image</h1>
                    <button onClick={closeModal} className="w-6 h-7 transform hover:scale-90 cursor-pointer bg-[var(--border-gray)] rounded-lg backdrop-blur-sm border">
                        <svg className="w-6 h-6 " viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-center">
                    {/* Left side - image */}
                    <div className="mb-4 md:mb-0 w-full md:w-[300px] h-[300px] mt-4 overflow-hidden rounded-xl">
                        {image ? (
                            <Image 
                                src={image.img_data} 
                                alt="Selected" 
                                width={320}  
                                height={320}  
                                className="object-contain w-full h-full rounded-xl"  // image fills the container
                            />
                        ) : (
                            <p>No image selected</p>
                        )}
                    </div>

                    {/* Right side - menu */}
                  <div className="flex flex-col gap-4">
                        <div>
                                                    {/* Download options */}
                        <div className="w-full mb-4 space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm">Format</label>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => setSelectedFormat('jpg')}
                                        className={`px-3 py-1 rounded-lg ${
                                            selectedFormat === 'jpg' 
                                                ? 'bg-purple-600 text-white' 
                                                : 'bg-[var(--border-gray)] text-gray-400'
                                        }`}
                                    >
                                        JPG
                                    </button>
                                    <button 
                                        onClick={() => setSelectedFormat('png')}
                                        className={`px-3 py-1 rounded-lg ${
                                            selectedFormat === 'png' 
                                                ? 'bg-purple-600 text-white' 
                                                : 'bg-[var(--border-gray)] text-gray-400'
                                        }`}
                                    >
                                        PNG
                                    </button>
                                    <button 
                                        onClick={() => setSelectedFormat('webp')}
                                        className={`px-3 py-1 rounded-lg ${
                                            selectedFormat === 'webp' 
                                                ? 'bg-purple-600 text-white' 
                                                : 'bg-[var(--border-gray)] text-gray-400'
                                        }`}
                                    >
                                        WebP
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm">Quality</label>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => setSelectedQuality('low')}
                                        className={`px-3 py-1 rounded-lg ${
                                            selectedQuality === 'low' 
                                                ? 'bg-purple-600 text-white' 
                                                : 'bg-[var(--border-gray)] text-gray-400'
                                        }`}
                                    >
                                        Low
                                    </button>
                                    <button 
                                        onClick={() => setSelectedQuality('medium')}
                                        className={`px-3 py-1 rounded-lg ${
                                            selectedQuality === 'medium' 
                                                ? 'bg-purple-600 text-white' 
                                                : 'bg-[var(--border-gray)] text-gray-400'
                                        }`}
                                    >
                                        Medium
                                    </button>
                                    <button 
                                        onClick={() => setSelectedQuality('high')}
                                        className={`px-3 py-1 rounded-lg ${
                                            selectedQuality === 'high' 
                                                ? 'bg-purple-600 text-white' 
                                                : 'bg-[var(--border-gray)] text-gray-400'
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
                        </div>
                        </div>
                        {/*<button className="w-full p-3 rounded-[22px] bg-[hsl(261,80%,64%)] hover:bg-[hsl(260,72.6%,77.1%)] w-[300px] text-white transition-all duration-100">
                            Open Workflow
                        </button>*/}
                        {imageStatus !== null && (
                        <button
                            onClick={handleCommunityClick}
                            className="w-[240px] h-[40px] mb-4 rounded-[22px] bg-[hsl(261,80%,64%)] hover:bg-[hsl(260,72.6%,77.1%)] text-white transition-all duration-100"
                        >
                            {imageStatus ? "Manage Post to Community" : "Post to Community"}
                        </button> )}
                        <button
                            onClick={handleDeleteClick}
                            className="w-[240px] h-[40px] mb-4 rounded-[22px] bg-red-500 hover:bg-red-300 text-white transition-all duration-100"
                        >
                            Delete
                        </button>
                    </div>
                   
                </div>
                
            </div>  </>)}
            {isCommunityModalOpen && (
            <Modal 
                closeModal={closeCommunityModal} 
                add_community={() => {}}
                selectedImage={image}
                initialStatus={imageStatus} 
                setImageStatus={setImageStatus}
            />)}
        </div>
    );
}

export default GalleryModal;
