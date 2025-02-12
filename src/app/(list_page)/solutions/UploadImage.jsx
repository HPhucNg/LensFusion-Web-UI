import React, { useState, useEffect} from 'react';
import { auth, storage, db } from '@/firebase/FirebaseConfig'  // Import Firebase config
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'; // Firebase Storage methods
import { collection, addDoc } from 'firebase/firestore'; // Firestore methods
import { v4 as uuidv4 } from 'uuid';  // For generating unique filenames

function UploadImage() {
    const [image, setImage] = useState(null);
    const [loading, setLoading] = useState(false);

    // Handle file input change
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
        }
    };

    // Upload image to Firebase Storage and save URL to Firestore
    const uploadImage = async () => {
        const user = auth.currentUser;  // Access the current authenticated user directly
        
        if (!user) {
            alert("No user is authenticated.");
            return;
        }

        const userID = user.uid;
        
        if (!image) return;  // If no image is selected, return
    
        setLoading(true);
        
        // Create a unique reference for the file in Firebase Storage
        const storageRef = ref(storage, `user_images/${uuidv4()}_${image.name}`);
    
        try {
            // Upload image to Firebase Storage
            await uploadBytes(storageRef, image);
    
            // Get the download URL of the uploaded image
            const downloadURL = await getDownloadURL(storageRef);
    
            // Save image URL to Firestore (in user_images collection)
            const imageRef = await addDoc(collection(db, 'user_images'), {
                userID: userID,  // Reference to the user who uploaded the image
                img_data: downloadURL,  // Image URL
                createdAt: new Date(),  // Timestamp
            });
    
            console.log('Image uploaded successfully, document created with ID:', imageRef.id);
            alert('Image uploaded successfully!');
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Error uploading image.');
        } finally {
            setLoading(false);
        }
    };
    

    return (
        <div>
            <input type="file" onChange={handleFileChange} />
            <button onClick={uploadImage} disabled={loading}>
                {loading ? 'Uploading...' : 'Upload Image'}
            </button>
        </div>
    );
}

export default UploadImage;

