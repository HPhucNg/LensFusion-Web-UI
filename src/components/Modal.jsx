'use client';

import React, { useState, useEffect } from 'react';
import '../styles/modal_styles.css';
import Image from 'next/image';  // Import Image component from next/image
import { auth, db } from '@/firebase/FirebaseConfig'; // Firebase config import
import { collection, addDoc, doc, updateDoc, getDoc, getDocs, deleteDoc } from 'firebase/firestore';

function Modal({ closeModal, add_community, selectedImage, createdBy }) {
    const [pinDetails, setPinDetails] = useState({
        created_by: createdBy,
        title: '',
        prompt: selectedImage.prompt,
        img_data: selectedImage.img_data,
        category: '',  // New category field in pin details state
    });
    
    const [isEditing, setIsEditing] = useState(false); // Track if user is editing an existing post

    // Check if the post is being managed or new (based on communityPost flag)
    const headingText = selectedImage.communityPost ? "Manage Post to Community" : "Post to Community";

    // Fetch post data if communityPost is true
    useEffect(() => {
        const fetchCommunityPost = async () => {
            if (selectedImage.communityPost) {
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
            if (!selectedImage.communityPost) {
                const communityRef = await addDoc(collection(db, 'community'), {
                    created_by: users_data.created_by,
                    title: users_data.title,
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
    
            alert("Image removed from community successfully!");
            closeModal(); // Close the modal after removal
        } catch (error) {
            console.error("Error removing image from community: ", error);
        }
    };
    

    return (
        <div className="add_pin_modal">
            <div className="add_pin_container">
                <div className="side" id="left_side">
                    <div className="topsection">
                        <div className="post_to">{headingText}</div>
                    </div>

                    <div className="midsection">
                        {/* Display the image passed from the GalleryModal */}
                        {pinDetails.img_data && (
                            <div className="upload_img_container">
                                <div className='image-container'>  
                                    <Image 
                                        src={pinDetails.img_data}  // Image URL
                                        alt="Selected"  // Image alt text
                                        width={800}  // Specify the width
                                        height={800}  // Specify the height
                                        className="object-cover w-full h-full rounded-xl"  // Optional class for styling
                                        />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="side" id="right_side">
                    <div className="topsection">
                        <div onClick={closeModal} className="w-10 transform hover:scale-90">
                            <img src="/Vector.png" alt="close_pin" />
                        </div>
                    </div>

                    <div className="midsection">
                        <div className='text-xl'>Title</div>
                        <input
                            placeholder="Add your Title Here"
                            type="text"
                            className="new_pin_input placeholder-gray-500"
                            id="community_title"
                            value={pinDetails.title}
                            onChange={(e) => setPinDetails({ ...pinDetails, title: e.target.value })}
                        />
                        
                        <div className='h-32 mr-3 mb-4 bg-[var(--card-background)] p-3 rounded-xl'>
                            <div className='text-gray-400 text-sm pb-2'>
                                Prompt Description <p className='text-gray-500 text-base pt-2'>{pinDetails.prompt}</p>
                            </div>
                        </div>

                        {/* Category Dropdown */}
                        
                        <div>
                            {/* Category dropdown */}
                            <select className='appearance-none w-full mb-2 text-[14px] text-[#727682b1]'
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
                          
                        <div className='text-sm overflow-hidden'>Created By: {pinDetails.created_by}</div>
                    </div>

                    <div className="bottomsection">
                        <button
                            onClick={save_community}  // Calls the save_pin function
                            className="publish_pin"
                        >
                            {isEditing ? 'Update' : 'Publish'}
                        </button>
                        {/* Show the Remove from Community button only if the image is in the community */}
                        {selectedImage.communityPost && (
                        <button
                            onClick={removeFromCommunity}
                            className="text-gray-400 hover:text-red-500 transition-all text-sm duration-300"
                        >
                            Remove from Community?
                        </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Modal;



