import React, { useState } from 'react';
import { storage } from '@/firebase/FirebaseConfig';  // Firebase storage import
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';  // Firebase Storage methods
import { v4 as uuidv4 } from 'uuid';  // To generate a unique filename

function UploadImage({ onUploadComplete }) {
    const [image, setImage] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
        }
    };

    const uploadImage = async () => {
        if (!image) return;  // Ensure there's an image

        setLoading(true);
        const storageRef = ref(storage, `images/${uuidv4()}_${image.name}`);
        try {
            // Upload file
            await uploadBytes(storageRef, image);
            const downloadURL = await getDownloadURL(storageRef);

            // Once the upload is complete, pass the download URL back to the parent component
            onUploadComplete(downloadURL);
        } catch (error) {
            console.error("Error uploading image:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <input type="file" onChange={handleFileChange} />
            <button onClick={uploadImage} disabled={loading}>Upload</button>
            {loading && <p>Uploading...</p>}
        </div>
    );
}

export default UploadImage;
