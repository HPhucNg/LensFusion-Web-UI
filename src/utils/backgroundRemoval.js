"use client";

import { removeBackground } from '@imgly/background-removal';

/**
 * A utility function that processes an image and removes its background
 * 
 * @param {File} imageFile - The image file to process
 * @param {Function} onProgress - Optional callback for tracking progress
 * @returns {Promise<File>} - A new File object with the background removed
 */
export const removeImageBackground = async (imageFile, onProgress = null) => {
  try {
    // Configure background removal
    const config = {
      progress: (key, current, total) => {
        if (onProgress) {
          const percentage = Math.round((current / total) * 100);
          onProgress(percentage, key);
        }
      }
    };
    
    // Process the image using imgly's client-side background removal
    const blob = await removeBackground(imageFile, config);
    
    // Convert blob to File with same name but -no-bg suffix
    const filename = imageFile.name.replace(/\.[^/.]+$/, '') + '-no-bg.png';
    const processedFile = new File([blob], filename, { type: 'image/png' });
    
    return processedFile;
  } catch (error) {
    console.error("Error removing background:", error);
    throw error;
  }
}; 