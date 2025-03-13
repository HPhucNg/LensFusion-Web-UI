'use client';

import React, { useState, useEffect } from 'react';
import '../styles/modal_styles.css';
import Image from 'next/image';  // Import Image component from next/image
import { auth, db } from '@/firebase/FirebaseConfig'; // Firebase config import
import { collection, addDoc, doc, updateDoc, getDoc, getDocs, deleteDoc } from 'firebase/firestore';

function Modal({ closeModal, add_community, selectedImage, createdBy, updateImageStatus, imageStatus }) {
    const [pinDetails, setPinDetails] = useState({
        created_by: createdBy,
        title: '',
        prompt: selectedImage.prompt,
        img_data: selectedImage.img_data,
        category: '',  // New category field in pin details state
    });
    
    const [isEditing, setIsEditing] = useState(false); // Track if user is editing an existing post

    // Check if the post is being managed or new (based on communityPost flag)
    const headingText = imageStatus ? "Manage Post to Community" : "Post to Community";

    // Fetch post data if communityPost is true
    useEffect(() => {
        const fetchCommunityPost = async () => {
            if (imageStatus) {
                const communityPostRef = doc(db, 'community', selectedImage.communityPostId);
                const communityPostDoc = await getDoc(communityPostRef);
                
                
                if (communityPostDoc.exists()) {
                    const communityPostData = communityPostDoc.data();
                    setPinDetails({
                        created_by: createdBy,
                        title: communityPostData.title || '',
                        prompt: communityPostData.prompt || '',
                        img_data: selectedImage.img_data, // Keep the selected image data
                        category: communityPostData.category || '',  // Keep the category data
                    });
                    setIsEditing(true); // Set to editing mode
                }
            }
        };

        fetchCommunityPost();
    }, [selectedImage, createdBy]);

    const save_community = async () => {
        const users_data = {
            ...pinDetails,
            title: document.querySelector('#community_title').value,
        };

        try {
            // If communityPost is false, save as a new post
            if (!imageStatus) {
                const communityRef = await addDoc(collection(db, 'community'), {
                    created_by: users_data.created_by,
                    title: users_data.title || 'Untitled',
                    prompt: users_data.prompt,
                    img_data: users_data.img_data,
                    userImageId: selectedImage.uid,
                    createdAt: new Date(), // Timestamp
                    userId: auth.currentUser?.uid,  // Add the user ID here
                    category: users_data.category, // Save the category when posting
                });

                console.log('Community Post saved with ID: ', communityRef.id);

                // Update the user's image document to set communityPost to true
                const userImageRef = doc(db, 'user_images', selectedImage.uid);
                await updateDoc(userImageRef, {
                    communityPost: true,  // Set communityPost to true
                    communityPostId: communityRef.id, // Store the community post ID for reference
                });
                // Update the image status in the parent component
                updateImageStatus(true);  // Set the image status to posted
                add_community(users_data); // Pass the final pin data to the parent component
                closeModal(); // Close the modal after saving the pin
            } else {
                // If communityPost is true, update the existing post
                const communityPostRef = doc(db, 'community', selectedImage.communityPostId); // Reference to the post
                await updateDoc(communityPostRef, {
                    title: users_data.title,
                    category: users_data.category,  // Update the category when editing the post
                });
                console.log('Community Post updated with ID: ', selectedImage.communityPostId);
                add_community(users_data); // Pass the updated pin data to the parent component
                closeModal(); // Close the modal after updating the pin
            }
        } catch (e) {
            console.error('Error adding/updating document: ', e);
        }
    };

    const removeFromCommunity = async () => {
        try {
            // Reference to the community post in the 'community' collection
            const communityPostRef = doc(db, 'community', selectedImage.communityPostId);
    
            // Remove likes subcollection (if it exists)
            const likesRef = collection(communityPostRef, 'likes');
            const likesSnapshot = await getDocs(likesRef);
            likesSnapshot.forEach(async (likeDoc) => {
                await deleteDoc(doc(likesRef, likeDoc.id));  // Deleting each like document
            });
    
            // Remove comments subcollection (if it exists)
            const commentsRef = collection(communityPostRef, 'comments');
            const commentsSnapshot = await getDocs(commentsRef);
            commentsSnapshot.forEach(async (commentDoc) => {
                await deleteDoc(doc(commentsRef, commentDoc.id));  // Deleting each comment document
            });
    
            // Now remove the community post itself
            await deleteDoc(communityPostRef);
    
            // Update the user's image document to remove the community post reference
            const userImageRef = doc(db, 'user_images', selectedImage.uid);
            await updateDoc(userImageRef, {
                communityPost: false,
                communityPostId: null, // Clear the reference to the community post
            });
            // Update the parent component's state
            updateImageStatus(false); // Update status to "not posted"
            alert("Image removed from community successfully!");
            closeModal(); // Close the modal after removal
        } catch (error) {
            console.error("Error removing image from community: ", error);
        }
    };

    const handleRemoveClick = () => {
        // Ask the user for confirmation
        const userConfirmed = window.confirm("Are you sure you want to remove this image from the community?");
        
        if (userConfirmed) {
            // If the user confirms, proceed with removing the image from the community
            removeFromCommunity();
            console.log("Image removed from community.");
        } else {
            console.log("Image removal canceled.");
        }
    };
    

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 text-white flex justify-center items-center">
            <div className="border-2 border-transparent rounded-[50px] w-full max-w-3xl h-auto sm:h-[500px] p-6 md:p-8" style={{ background: 'var(--modal-background)', backdropFilter: 'var(--modal-backdrop)'}}> {/* Card */}
                <div className="flex items-center mb-4 justify-between w-full">
                    <div onClick={closeModal} className="w-4 transform hover:scale-90">
                        <img src="/back-arrow.png" alt="close icon" />
                    </div>
                    <h1 className="text-2xl font-extrabold flex-grow text-center">{headingText}</h1>
                    {/* Show the Remove from Community button only if the image is in the community */}
                    {imageStatus && (
                        <button
                            onClick={handleRemoveClick}
                            className="w-8 transform hover:scale-90"
                        >
                            <img src="/ellipsis.png" alt="remove icon" />
                        </button>
                    )}
                </div>
                <div className='flex flex-col sm:flex-row items-center justify-evenly sm:space-x-6 p-4'> {/* Main section - left and right side */}
                    {/* Left side - image */}
                    <div className="mb-4 md:mb-0 w-full md:w-[300px] h-[300px] mt-4 overflow-hidden rounded-xl">
                        {pinDetails.img_data && (
                            <Image 
                                src={pinDetails.img_data}  // Image URL
                                alt="Selected"  // Image alt text
                                width={300}  // Specify the width
                                height={300}  // Specify the height
                                className="object-contain rounded-xl w-full h-full"  // Optional class for styling
                            />       
                        )}
                    </div>
                    <div className='flex flex-col space-y-4 w-full sm:w-1/2'>
                        <div>
                            <h2 className='text-gray-400'>Title</h2>
                            <input
                                placeholder="Add your Title Here"
                                type="text"
                                className=" bg-transparent placeholder-gray-500 text-2xl border-b-2 border-gray-700 focus:outline-none w-full"
                                id="community_title"
                                value={pinDetails.title}
                                onChange={(e) => setPinDetails({ ...pinDetails, title: e.target.value })}
                            />
                        </div>
                        <div className='h-auto mr-3 mb-4 bg-[var(--card-background)] p-3 rounded-xl'>
                            <div className='text-gray-400 text-sm pb-2'>
                                Prompt Description <p className='text-gray-500 text-base pt-2'>{pinDetails.prompt}</p>
                            </div>
                        </div>
                        <div> {/* Category Dropdown */}
                            <select className='focus:outline-none bg-transparent border-2 border-gray-500 rounded-xl w-full sm:w-1/2 mb-2 text-[14px] text-[#727682b1]'
                                value={pinDetails.category}
                                onChange={(e) => setPinDetails({ ...pinDetails, category: e.target.value })}
                            >
                                <option value="">Select Category</option>
                                <option value="skincare">Skincare</option>
                                <option value="candles">Candles</option>
                                <option value="furniture">Furniture</option>
                                <option value="jewellery">Jewellery</option>
                                <option value="bags">Bags</option>
                                <option value="other">Other</option>
                            </select> 
                        </div>

                        <div className='text-sm'>
                            Created By: {pinDetails.created_by}
                        </div>
                        <div>
                            <button
                                onClick={save_community}  // Calls the save_community function
                                className="bg-[#8d5aed] w-full sm:w-[200px] h-[40px] rounded-[22px] hover:bg-[#b69aef] transition-colors duration-300"
                            >
                                {imageStatus ? 'Update' : 'Publish'}
                            </button>

                        </div>

                    </div>

                </div>

            </div>

        </div>
    );
}

export default Modal;