'use client'
import React, { useState } from 'react';
import UploadImage from './UploadImage';  // Importing the UploadImage component
import { db } from '@/firebase/FirebaseConfig';  // Firebase config import
import { collection, addDoc } from 'firebase/firestore';  // Firestore methods

function PostToCommunity() {
    const [imageURL, setImageURL] = useState(null);

    const handleImageUploadComplete = async (url) => {
        setImageURL(url);

        try {
            // Save the image URL to Firestore
            const docRef = await addDoc(collection(db, 'pins_test'), {
                img_data: url,  // The URL of the uploaded image
                title: "Image Title",  // Optionally include more data (like a title)
                createdAt: new Date()
            });
            console.log("Document written with ID: ", docRef.id);
        } catch (error) {
            console.error("Error adding document: ", error);
        }
    };

    return (
        <div>
            <UploadImage onUploadComplete={handleImageUploadComplete} />
            {imageURL && <p>Image uploaded successfully! URL: {imageURL}</p>}
        </div>
    );
}

export default PostToCommunity;
