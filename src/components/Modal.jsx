'use client';

import React, { useState } from 'react';
import '../styles/modal_styles.css';
import { auth, db } from '@/firebase/FirebaseConfig'; // Firebase config import
import { collection, addDoc } from 'firebase/firestore';


function Modal({ closeModal, add_pin, selectedImage, createdBy }) {
    const [pinDetails, setPinDetails] = useState({
        created_by: createdBy,
        title: '',
        description: '',
        img_data: selectedImage,
    });

    const save_pin = async () => {
        const users_data = {
            ...pinDetails,
            title: document.querySelector('#pin_title').value,
            description: document.querySelector('#pin_description').value,
        };
    
        try {
            // Add the pin data to Firestore
            const pinRef = await addDoc(collection(db, 'pins'), {
                created_by: users_data.created_by,
                title: users_data.title,
                description: users_data.description,
                img_data: users_data.img_data,
                createdAt: new Date(), // Timestamp
                userId: auth.currentUser?.uid  // Add the user ID here
            });
    
            console.log('Pin saved with ID: ', pinRef.id);
            add_pin(users_data); // Pass the final pin data to the parent component
            closeModal(); // Close the modal after saving the pin
        } catch (e) {
            console.error('Error adding document: ', e);
        }
    };
    
    

    return (
        <div className="add_pin_modal">
            <div className="add_pin_container">
                <div className="side" id="left_side">
                    <div className="topsection">
                        <div className="post_to">Post to Community</div>
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
                        <div onClick={closeModal} className="icon_close">
                            <img src="/Vector.png" alt="close_pin" />
                        </div>
                    </div>

                    <div className="midsection">
                        <div className='text-2xl'>Title</div>
                        <input
                            placeholder="Add your Title"
                            type="text"
                            className="new_pin_input"
                            id="pin_title"
                        />
                        <div className='text-2xl'>Description</div>
                        <input
                            placeholder="Caption your image"
                            type="text"
                            className="new_pin_input"
                            id="pin_description"
                        />

                        Created By: {pinDetails.created_by}
                    </div>

                    <div className="bottomsection">
                        <div
                            onClick={save_pin}  // Calls the save_pin function
                            className="publish_pin"
                        >
                            Publish
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Modal;
