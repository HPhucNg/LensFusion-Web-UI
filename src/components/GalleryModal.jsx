'use client'
import React, { useState } from 'react';
import '../styles/modal_styles.css';
import Image from 'next/image';  // Import Image component from next/image
import { getFirestore, collection, doc, deleteDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/FirebaseConfig';


function GalleryModal({ closeModal, image, openCommunityModal }) {  // Accept the 'image' prop
    /*const [showModalPin, setShowModalPin] = useState(false);*/

    // Trigger Post Modal when "Post to Community" is clicked
    const handleCommunityClick = () => {
        openCommunityModal();  // This will open the CommunityModal in UserProfile
        closeModal();     // Close the Gallery Modal
    };

    const deleteSubcollections = async (communityDocId) => {
        // Delete likes subcollection
        const likesRef = collection(db, 'community', communityDocId, 'likes');
        const likesSnapshot = await getDocs(likesRef);
        likesSnapshot.forEach(async (doc) => {
            await deleteDoc(doc.ref);
        });

        // Delete comments subcollection
        const commentsRef = collection(db, 'community', communityDocId, 'comments');
        const commentsSnapshot = await getDocs(commentsRef);
        commentsSnapshot.forEach(async (doc) => {
            await deleteDoc(doc.ref);
        });
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
    
    const deleteImageFromUserImages = async (imageId) => {
        const userImagesRef = doc(db, 'user_images', imageId);
        await deleteDoc(userImagesRef); // Delete the image from user_images collection
    };
    
    

    const handleDeleteClick = () => {
        if (image.communityPost) {
            // If the image is posted in the community, ask for confirmation
            const userConfirmed = window.confirm(
                "This image is posted in the community. Are you sure you want to delete it?"
            );
            if (userConfirmed) {
                // Delete from the community collection first (if necessary) and then user_images.
                console.log("Deleting image from user_images and community...");
                deleteImageFromCommunity(image.uid);
                deleteImageFromUserImages(image.uid);
                alert("Image deleted.");
            } else {
                console.log("Deletion canceled.");
            }
        } else {
            // If the image is not posted in the community, ask for a different confirmation
            const userConfirmed = window.confirm(
                "Once you delete this image, it cannot be recovered. Are you sure you want to delete it?"
            );
            if (userConfirmed) {
                console.log("Deleting image from user_images...");
                deleteImageFromUserImages(image.id);
                alert("Image deleted.");
                closeModal();
            } else {
                console.log("Deletion canceled.");
            }
        }
    };
    
    const postButtonText = image.communityPost ? "Manage Post to Community" : "Post to Community";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 text-white flex justify-center items-center">
            <div className="border-2 border-transparent rounded-[50px] w-full max-w-3xl h-auto sm:h-[500px] p-6 md:p-8" style={{ background: 'var(--modal-background)', backdropFilter: 'var(--modal-backdrop)'}}> {/* Card */}
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-extrabold">Manage Image</h1>
                    <button onClick={closeModal} className="w-8 h-8 transform hover:scale-90">
                        <img src="/Vector.png" alt="close icon" />
                    </button>
                </div>

                <div className="flex flex-col md:flex-row justify-between pt-20 items-center">
                    {/* Left side - image */}
                    <div className="mb-4 md:mb-0">
                        {image ? (
                            <Image 
                                src={image.img_data} 
                                alt="Selected" 
                                width={300} 
                                height={300} 
                                className="object-cover rounded-xl"
                            />
                        ) : (
                            <p>No image selected</p>
                        )}
                    </div>

                    {/* Right side - menu */}
                    <div className="flex flex-col gap-4">
                        <button className="w-full p-3 rounded-[22px] bg-[hsl(261,80%,64%)] hover:bg-[hsl(260,72.6%,77.1%)] text-white transition-all duration-100">
                            Open Workflow
                        </button>
                        <button
                            onClick={handleCommunityClick}
                            className="w-full p-3 rounded-[22px] bg-[hsl(261,80%,64%)] hover:bg-[hsl(260,72.6%,77.1%)] text-white transition-all duration-100"
                        >
                            {image?.communityPost ? "Manage Post to Community" : "Post to Community"}
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
        </div>
    );
}

export default GalleryModal;
