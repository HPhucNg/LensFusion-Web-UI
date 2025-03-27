import { useEffect, useRef } from 'react';
import { calculatePaddingMetadata } from './utils';

export default function CanvasSetup({ originalImage, setOriginalDimensions, canvasRef, maskCanvasRef, imageContainerRef, setPaddingMetadata }) {
  const imageRef = useRef(null);
  const contextRef = useRef(null);

  // Add check for canvas refs on mount
  useEffect(() => {
    console.log('CanvasSetup mounted');
    console.log('Canvas ref exists:', !!canvasRef.current);
    console.log('Mask canvas ref exists:', !!maskCanvasRef.current);
    console.log('Image container ref exists:', !!imageContainerRef.current);
    console.log('Original image exists:', !!originalImage);
  }, []);

  useEffect(() => {
    console.log('Original image changed:', !!originalImage);
    
    if (originalImage && canvasRef.current && maskCanvasRef.current && imageContainerRef.current) {
      // Make sure both canvases are in exactly the same position
      if (canvasRef.current.parentElement && maskCanvasRef.current.parentElement) {
        const originalRect = canvasRef.current.getBoundingClientRect();
        const maskRect = maskCanvasRef.current.getBoundingClientRect();
        
        console.log('Canvas position:', { 
          original: { left: originalRect.left, top: originalRect.top }, 
          mask: { left: maskRect.left, top: maskRect.top }
        });
        
        // If there's any misalignment, log it as a warning
        if (Math.abs(originalRect.left - maskRect.left) > 1 || 
            Math.abs(originalRect.top - maskRect.top) > 1) {
          console.warn('Canvas misalignment detected!');
        }
      }
      
      console.log("Original image changed, setting up canvas");
      const img = new Image();
      
      img.onload = async () => {
        console.log("Image loaded successfully"); // Log when image is loaded
        imageRef.current = img; // Store the image reference
        const originalWidth = img.width;
        const originalHeight = img.height;
        console.log("Original image dimensions:", { width: originalWidth, height: originalHeight });
        setOriginalDimensions({ width: originalWidth, height: originalHeight });
        
        // Get container dimensions
        const container = imageContainerRef.current;
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        console.log("Container dimensions:", { width: containerWidth, height: containerHeight });
        
        // Calculate scale to fit image within container while preserving aspect ratio
        const scaleWidth = containerWidth / img.width;
        const scaleHeight = containerHeight / img.height;
        const scale = Math.min(scaleWidth, scaleHeight, 1); // Don't scale up, only down
        console.log("Calculated scale factor:", scale);
        
        // Calculate new dimensions
        const width = Math.floor(img.width * scale);
        const height = Math.floor(img.height * scale);
        console.log("Scaled image dimensions:", { width, height });
        
        // Set exact same dimensions on both canvases
        const canvas = canvasRef.current;
        const maskCanvas = maskCanvasRef.current;
        canvas.width = width;
        canvas.height = height;
        maskCanvas.width = width;
        maskCanvas.height = height;
        
        // Style main canvas first
        canvas.style.display = 'block';
        canvas.style.margin = '0';
        canvas.style.padding = '0';
        
        // Position mask canvas exactly over main canvas
        maskCanvas.style.position = 'absolute';
        maskCanvas.style.left = '0';
        maskCanvas.style.top = '0';
        maskCanvas.style.width = `${width}px`;
        maskCanvas.style.height = `${height}px`;
        maskCanvas.style.margin = '0';
        maskCanvas.style.padding = '0';
        maskCanvas.style.pointerEvents = 'auto';
        maskCanvas.style.display = 'block';
        maskCanvas.style.zIndex = '10';
        
        // Draw the image on main canvas
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        console.log("Image drawn to canvas");
        
        // Set up mask canvas
        const maskCtx = maskCanvas.getContext('2d', { alpha: true });
        maskCtx.clearRect(0, 0, width, height);
        maskCtx.lineJoin = 'round';
        maskCtx.lineCap = 'round';
        maskCtx.strokeStyle = 'black';
        maskCtx.fillStyle = 'black';
        maskCtx.globalCompositeOperation = 'source-over'; // Default to drawing mode
        contextRef.current = maskCtx;
        
        // Calculate padding metadata for 1:1 ratio
        const metadata = calculatePaddingMetadata(originalWidth, originalHeight);
        setPaddingMetadata(metadata);
        console.log("Calculated padding metadata:", metadata);
      };
      
      img.onerror = (error) => {
        console.error("Error loading image:", error);
      };
      
      img.src = originalImage;
    }
  }, [originalImage, canvasRef, maskCanvasRef, imageContainerRef, setOriginalDimensions, setPaddingMetadata]);

  return null;
} 