'use client'
import React, { useState } from 'react';
import '../styles/modal_styles.css';
import { getFirestore, collection, doc, deleteDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/FirebaseConfig';


function GalleryModal({ closeModal, image, openCommunityModal }) {  // Accept the 'image' prop
    const [showModalPin, setShowModalPin] = useState(false);

    // Trigger Post Modal when "Post to Community" is clicked
    const handleCommunityClick = () => {
        openCommunityModal();  // This will open the CommunityModal in UserProfile
        closeModal();     // Close the Gallery Modal
    };

    const deleteImageFromCommunity = async (imageId) => {
        const communityRef = collection(db, 'community');
        const q = query(communityRef, where('userImageId', '==', imageId));
        const querySnapshot = await getDocs(q);
    
        querySnapshot.forEach(async (docSnap) => {
            await deleteDoc(doc(db, 'community', docSnap.id)); // Delete the community post
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

                        <div className="modals_pin" style={{ display: showModalPin ? 'block' : 'none' }}>
                            {/* Optionally add pin image or other functionality */}
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
                        <button className="w-[240px] h-[40px] mb-4 rounded-[22px] flex justify-center items-center text-[#1a202c] bg-[hsl(261,80%,64%)] hover:bg-[hsl(260,72.6%,77.1%)] text-white transition-all duration-100">Open Workflow</button>
                        <button className="w-[240px] h-[40px] mb-4 rounded-[22px] flex justify-center items-center text-[#1a202c] bg-[hsl(261,80%,64%)] hover:bg-[hsl(260,72.6%,77.1%)] text-white transition-all duration-100" onClick={handleCommunityClick} >{postButtonText}</button>
                        <button className="w-[240px] h-[40px] mb-4 rounded-[22px] flex justify-center items-center text-[#1a202c] bg-[hsl(261,80%,64%)] hover:bg-[hsl(260,72.6%,77.1%)] text-white transition-all duration-100" onClick={handleDeleteClick}>Delete</button> 
                    </div>
                </div>
            </div>
        </div>
    );
}

export default GalleryModal;
