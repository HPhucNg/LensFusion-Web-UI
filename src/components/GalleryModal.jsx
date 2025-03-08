'use client'
import React, { useState, useEffect } from 'react';
import '../styles/modal_styles.css';
import Image from 'next/image';  // Import Image component from next/image
import { getFirestore, collection, doc, deleteDoc, query, where, getDocs } from 'firebase/firestore';
import { getStorage, ref, deleteObject } from 'firebase/storage';
import { db } from '@/firebase/FirebaseConfig';
import Modal from '@/components/Modal';



function GalleryModal({ closeModal, image, createdBy, imageStatus, updateImageStatus, onDelete}) {  // Accept the 'image' prop
    /*const [showModalPin, setShowModalPin] = useState(false);*/
    const [isCommunityModalOpen, setIsCommunityModalOpen] = useState(false); // State to control the community modal visibility


    // Trigger Post Modal when "Post to Community" is clicked
    const handleCommunityClick = () => {
       //updateImageStatus(true); 
        setIsCommunityModalOpen(true);  // Open the Community Modal

    };

    // Function to close the Community Modal
    const closeCommunityModal = () => {
        setIsCommunityModalOpen(false); // Close the Community Modal
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
            await deleteSubcollections(communityDocId); // Delete subcollections (likes, comments)
            await deleteDoc(doc(db, 'community', communityDocId)); // Delete the community post
        });
    };
    
    const deleteImageFromStorage = async (imageUrl) => {
        if (!imageUrl || typeof imageUrl !== 'string') {
            console.error('Error: Invalid image URL');
            return;
        }
    
        // Log the image URL for debugging
        console.log('Image URL:', imageUrl);
    
        // Ensure the URL contains '/o/', which indicates the storage path
        if (!imageUrl.includes('/o/')) {
            console.error('Error: URL does not contain the expected "/o/" path:', imageUrl);
            return;
        }
    
        try {
            // Extract the file path from the URL after '/o/'
            const storagePath = imageUrl.split('/o/')[1]?.split('?')[0];
    
            // If the storagePath is undefined or empty, log an error
            if (!storagePath) {
                console.error('Error: Unable to extract storage path from URL');
                return;
            }
    
            console.log('Extracted storage path:', storagePath);
    
            // Decode the URL-encoded path (replaces %2F with / and other encoded characters)
            const decodedPath = decodeURIComponent(storagePath);
    
            console.log('Decoded path:', decodedPath);
    
            // Get the Firebase Storage reference for the image
            const storage = getStorage();
            const imageRef = ref(storage, decodedPath);  // Use the decoded path
    
            // Delete the image from Firebase Storage
            await deleteObject(imageRef);
            console.log('Image deleted from Firebase Storage.');
        } catch (error) {
            console.error('Error deleting image from Firebase Storage:', error);
        }
    };
    


    const deleteImageFromUserImages = async (imageId) => {
        const userImagesRef = doc(db, 'user_images', imageId);
        try {
            await deleteDoc(userImagesRef); // Delete the image from user_images collection
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
    
        // Check if the image has the required properties for deletion
        console.log('Image to delete:', image);
        if (image.communityPost) {
            const userConfirmed = window.confirm(
                "This image is posted in the community. Are you sure you want to delete it?"
            );
            if (userConfirmed) {
                console.log("Deleting image from user_images, community, and storage...");
                deleteImageFromCommunity(image.uid);  // Remove from the community collection
                deleteImageFromStorage(image.img_data);  // Remove from Firebase Storage
                deleteImageFromUserImages(image.uid);  // Remove from the user's images collection
                alert("Image deleted.");
                // Call onDelete to update the parent state (UserProfile)
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
                deleteImageFromStorage(image.img_data);  // Remove from Firebase Storage
                deleteImageFromUserImages(image.uid);  // Remove from the user's images collection
                alert("Image deleted.");
                // Call onDelete to update the parent state (UserProfile)
                if (onDelete) {
                    onDelete(image.uid);
                }
                closeModal();
            }
        }
    };
    
    const postButtonText = imageStatus ? "Manage Post to Community" : "Post to Community";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 text-white flex justify-center items-center">
            <div className="border-2 border-transparent rounded-[50px] w-full max-w-3xl h-auto sm:h-[500px] p-6 md:p-8" style={{ background: 'var(--modal-background)', backdropFilter: 'var(--modal-backdrop)'}}> {/* Card */}
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-extrabold">Manage Image</h1>
                    <button onClick={closeModal} className="w-8 h-8 transform hover:scale-90">
                        <img src="/Vector.png" alt="close icon" />
                    </button>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-center">
                    {/* Left side - image */}
                    <div className="mb-4 md:mb-0 w-full md:w-[300px] h-[300px] mt-4 overflow-hidden rounded-xl">
                        {image ? (
                            <Image 
                                src={image.img_data} 
                                alt="Selected" 
                                width={300} 
                                height={300} 
                                className="object-cover w-full h-full" // Make sure the image fills the container
                            />
                        ) : (
                            <p>No image selected</p>
                        )}
                    </div>

                    {/* Right side - menu */}
                    <div className="flex flex-col gap-4">
                        <button className="w-full p-3 rounded-[22px] bg-[hsl(261,80%,64%)] hover:bg-[hsl(260,72.6%,77.1%)] w-[300px] text-white transition-all duration-100">
                            Open Workflow
                        </button>
                        <button
                            onClick={handleCommunityClick}
                            className="w-full p-3 rounded-[22px] bg-[hsl(261,80%,64%)] hover:bg-[hsl(260,72.6%,77.1%)] text-white transition-all duration-100"
                        >
                            {imageStatus ? "Manage Post to Community" : "Post to Community"}
                        </button>
                        <button
                            onClick={handleDeleteClick}
                            className="w-full p-3 rounded-[22px] bg-[hsl(261,80%,64%)] hover:bg-[hsl(260,72.6%,77.1%)] text-white transition-all duration-100"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </div>
            {isCommunityModalOpen && (
            <Modal 
                closeModal={closeCommunityModal} 
                add_community={() => {}}
                selectedImage={image} 
                createdBy={createdBy}
                imageStatus={imageStatus}
                updateImageStatus={updateImageStatus} // Pass this function to update image status
            />)}
        </div>
    );
}

export default GalleryModal;
