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
        <div className='fixed inset-0 bg-black bg-opacity-50 z-50 text-white'> {/* Backdrop */} 
            <div className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col border-2 border-transparent rounded-[50px] w-[880px] h-[550px]' style={{ background: 'var(--modal-background)', backdropFilter: 'var(--modal-backdrop)'}}> {/* Card */}
                <div className='flex justify-between p-6'> {/* Top section - Header and close modal icon */}
                    <h1 className='font-extrabold text-2xl'>Manage Image</h1>
                    <div onClick={closeModal} className="w-8 transform hover:scale-90">
                        <img src="/Vector.png" alt="close icon" />
                    </div>
                </div>
                <div className='flex flex-grow items-center justify-around'> {/* Main section - left and right side */}
                     {/* Left side - image */}
                    {image ? (
                        <Image 
                            src={image.img_data}  // Image URL
                            alt="Selected"  // Image alt text
                            width={300}  // Specify the width
                            height={300}  // Specify the height
                            className="object-cover rounded-xl"  // Optional class for styling
                        />
                    
                ) : (
                    <p>No image selected</p>
                )}
                    
                    {/*<div className="modals_pin" style={{ display: showModalPin ? 'block' : 'none' }}>
                    </div>*/}

                    <div className='flex flex-col'> {/* Right side - menu */}
                        <button className="w-[240px] h-[40px] mb-4 rounded-[22px] bg-[hsl(261,80%,64%)] hover:bg-[hsl(260,72.6%,77.1%)] text-white transition-all duration-100">Open Workflow</button>
                        <button className="w-[240px] h-[40px] mb-4 rounded-[22px] bg-[hsl(261,80%,64%)] hover:bg-[hsl(260,72.6%,77.1%)] text-white transition-all duration-100" onClick={handleCommunityClick} >{postButtonText}</button>
                        <button className="w-[240px] h-[40px] mb-4 rounded-[22px] bg-[hsl(261,80%,64%)] hover:bg-[hsl(260,72.6%,77.1%)] text-white transition-all duration-100" onClick={handleDeleteClick}>Delete</button> 
                    </div>

                </div>

            </div>

        </div>
    );
}

export default GalleryModal;
