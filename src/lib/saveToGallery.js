import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/firebase/FirebaseConfig';

/**
 * Converts an image to WebP format for better compression
 * @param {string} dataUrl - The data URL of the image to convert
 * @param {number} quality - The quality of the resulting WebP image (0-1)
 * @returns {Promise<string>} - A promise that resolves to the WebP data URL
 */
export const convertToWebP = (dataUrl, quality = 0.85) => {
  return new Promise((resolve, reject) => {
    try {
      if (dataUrl.startsWith('http')) {
        fetch(dataUrl)
          .then(response => response.blob())
          .then(blob => {
            resolve(URL.createObjectURL(blob));
          })
          .catch(err => {
            console.error('Error fetching external image:', err);
            // Return the original URL if conversion fails
            resolve(dataUrl);
          });
      } else {
        // For data URLs, use canvas conversion
        const img = new Image();
        img.onload = () => {
          // Create canvas with original dimensions
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          
          // Draw image to canvas
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          
          try {
            // Try to convert to WebP
            const webpDataUrl = canvas.toDataURL('image/webp', quality);
            resolve(webpDataUrl);
          } catch (canvasError) {
            console.error('Canvas tainted error:', canvasError);
            
            resolve(dataUrl);
          }
        };
        img.onerror = (err) => {
          console.error('Error loading image for WebP conversion:', err);
          // Return original data URL if conversion fails
          resolve(dataUrl);
        };
        img.src = dataUrl;
      }
    } catch (error) {
      console.error('Error converting to WebP:', error);
      // Return original data URL if conversion fails
      resolve(dataUrl);
    }
  });
};

/**
 * Saves an image to the user's gallery in Firebase
 * @param {string} imageDataUrl - The data URL of the image to save
 * @param {string} userId - The user's ID
 * @param {string} type - The type of image (e.g., 'objectremoval', 'upscaled', etc.)
 * @param {Object} additionalData - Any additional data to store with the image
 * @returns {Promise<boolean>} - A promise that resolves to true if successful
 */
export const saveToGallery = async (imageDataUrl, userId, type, additionalData = {}) => {
  if (!imageDataUrl || !userId) {
    console.error('Missing required parameters for saveToGallery');
    return false;
  }

  try {
    const timestamp = Date.now();
    const filename = `${type}-${timestamp}.webp`;
    
    // Convert image to WebP format
    const webpImage = await convertToWebP(imageDataUrl, 0.85);
    
    // Upload image to Storage
    const storageRef = ref(storage, `user_images/${userId}/${filename}`);
    
    // Handle both data URLs and blob URLs
    let blob;
    
    if (webpImage.startsWith('blob:')) {
      // For blob URLs (created by URL.createObjectURL)
      const response = await fetch(webpImage);
      blob = await response.blob();
      // Clean up the blob URL to prevent memory leaks
      URL.revokeObjectURL(webpImage);
    } else if (webpImage.startsWith('http')) {
      // For HTTP URLs that couldn't be converted
      const response = await fetch(webpImage);
      blob = await response.blob();
    } else {
      // For data URLs
      const response = await fetch(webpImage);
      blob = await response.blob();
    }
    
    // Upload blob to Firebase Storage
    await uploadBytes(storageRef, blob);
    const downloadURL = await getDownloadURL(storageRef);
    
    // Save reference to Firestore
    const userImageRef = collection(db, 'user_images');
    await addDoc(userImageRef, {
      userID: userId,
      img_data: downloadURL,
      createdAt: serverTimestamp(),
      type,
      ...additionalData
    });

    return true;
  } catch (error) {
    console.error('Error saving to gallery:', error);
    return false;
  }
}; 