'use client';

import React, { useState, useEffect } from 'react';
import '../styles/modal_styles.css';
import { auth, db } from '@/firebase/FirebaseConfig'; // Firebase config import
import { collection, addDoc, doc, updateDoc, getDoc, deleteDoc } from 'firebase/firestore';

function Modal({ closeModal, add_community, selectedImage, createdBy }) {
    const [pinDetails, setPinDetails] = useState({
        created_by: createdBy,
        title: '',
        prompt: selectedImage?.prompt || 'No prompt available',
        img_data: selectedImage?.img_data,
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
                    title: users_data.title || 'Untitled',
                    prompt: users_data.prompt || 'No prompt available',
                    img_data: users_data.img_data,
                    userImageId: selectedImage.uid,
                    createdAt: new Date(),
                    userId: auth.currentUser?.uid,
                });

                console.log('Community Post saved with ID: ', communityRef.id);

                // Update the user's image document to set communityPost to true
                const userImageRef = doc(db, 'user_images', selectedImage.uid);
                await updateDoc(userImageRef, {
                    communityPost: true,
                    communityPostId: communityRef.id,
                });

                add_community(users_data);
                closeModal();
            } else {
                // If communityPost is true, update the existing post
                const communityPostRef = doc(db, 'community', selectedImage.communityPostId);
                await updateDoc(communityPostRef, {
                    title: users_data.title || 'Untitled',
                });

                console.log('Community Post updated with ID: ', selectedImage.communityPostId);
                add_community(users_data);
                closeModal();
            }
        } catch (e) {
            console.error('Error adding/updating document: ', e);
        }
    };

    const handleDeletePost = async () => {
        if (!selectedImage.communityPost || !selectedImage.communityPostId) {
            return;
        }

        const confirmDelete = window.confirm('Are you sure you want to delete this post from the community? This action cannot be undone.');
        if (!confirmDelete) {
            return;
        }

        try {
            // Delete the community post
            await deleteDoc(doc(db, 'community', selectedImage.communityPostId));

            // Update the user's image document to remove community post status
            const userImageRef = doc(db, 'user_images', selectedImage.uid);
            await updateDoc(userImageRef, {
                communityPost: false,
                communityPostId: null
            });

            console.log('Community post deleted successfully');
            closeModal();
        } catch (error) {
            console.error('Error deleting community post:', error);
            alert('Failed to delete the post. Please try again.');
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
                                <div>
                                    <img
                                        src={pinDetails.img_data}
                                        alt="Selected"
                                        className="object-cover w-full h-full rounded-xl"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="side" id="right_side">
                    <div className="topsection">
                        <div onClick={closeModal} className="w-10">
                            <img src="/Vector.png" alt="close_pin" />
                        </div>
                    </div>

                    <div className="midsection">
                        <div className='text-3xl'>Title</div>
                        <input
                            placeholder="Add your Title Here"
                            type="text"
                            className="new_pin_input placeholder-gray-500"
                            id="community_title"
                            value={pinDetails.title}
                            onChange={(e) => setPinDetails({ ...pinDetails, title: e.target.value })}
                        />
                        <div className='text-3xl mb-2'>Prompt</div>
                        <div className='mb-4'>{pinDetails.prompt}</div>
                          
                        <div className='text-xl mb-4'>Created By: {pinDetails.created_by}</div>

                        <div className="bottomsection">
                            <button
                                type="button"
                                onClick={() => window.open(`/workspace/backgroundgeneration?id=${selectedImage.uid}`, '_blank')}
                                className="publish_pin"
                                style={{ backgroundColor: '#4B5563' }}
                            >
                                Open Workflow
                            </button>
                            <button
                                type="button"
                                onClick={save_community}
                                className="publish_pin"
                                style={{ backgroundColor: isEditing ? '#9333EA' : '#6D28D9' }}
                            >
                                {isEditing ? 'Update' : 'Publish'}
                            </button>
                            {isEditing && (
                                <button
                                    type="button"
                                    onClick={handleDeletePost}
                                    className="publish_pin"
                                    style={{ backgroundColor: '#DC2626' }}
                                >
                                    Delete Post
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Modal;

