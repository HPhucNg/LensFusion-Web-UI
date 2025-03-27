export const handleImageUpload = async (e, setUploadLoading, setOriginalImage, setResultImage, setResultDimensions, setPaddedDebugImage, setPaddedDebugMask, maskCanvasRef) => {
  const file = e.target.files?.[0];
  if (!file) return;
  setUploadLoading(true);
  try {
    const dataUrl = await readFileAsDataURL(file);
    setOriginalImage(dataUrl);
    setResultImage(null);
    setResultDimensions(null);
    setPaddedDebugImage(null);
    setPaddedDebugMask(null);
    if (maskCanvasRef.current) {
      const maskCtx = maskCanvasRef.current.getContext('2d');
      maskCtx.clearRect(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);
    }
  } catch (error) {
    console.error('Error reading file:', error);
    alert('Failed to read image file');
  } finally {
    setUploadLoading(false);
  }
};

export const handleRemoveObject = async (originalImage, paddingMetadata, maskCanvasRef, originalDimensions, setProcessing, setResultImage, setResultDimensions) => {
  if (!originalImage) {
    alert('Please upload an image first');
    return;
  }
  if (!paddingMetadata) {
    alert('Image metadata not ready. Please try again.');
    return;
  }
  setProcessing(true);
  try {
    const imageData = await handlePaddingAndCropping(originalImage, paddingMetadata, maskCanvasRef, originalDimensions, setResultImage, setResultDimensions);
    const randomSeed = Math.floor(Math.random() * 1000000);
    const settings = {
      rm_guidance_scale: 9,
      num_inference_steps: 50,
      seed: randomSeed,
      strength: 0.8,
      similarity_suppression_steps: 9,
      similarity_suppression_scale: 0.3,
    };
    const result = await removeObjectFromImage(imageData, settings);
    if (result) {
      cropResultImage(result, paddingMetadata, setResultImage, setResultDimensions);
    } else {
      alert("No result data received from the API");
    }
  } catch (error) {
    console.error('Error removing object:', error);
    alert('Failed to remove object: ' + (error.message || 'Unknown error'));
  } finally {
    setProcessing(false);
  }
};

export const downloadResult = (resultImage) => {
  if (!resultImage) return;
  const link = document.createElement('a');
  link.href = resultImage;
  link.download = `object-removed-${Date.now()}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const viewFullscreen = (imgSrc) => {
  if (!imgSrc) return;
  const win = window.open();
  win.document.write(`
    <html>
      <head>
        <title>Full Image</title>
        <style>
          body { margin: 0; background: #000; height: 100vh; display: flex; align-items: center; justify-content: center; }
          img { max-width: 100%; max-height: 100%; object-fit: contain; }
        </style>
      </head>
      <body>
        <img src="${imgSrc}" alt="Full size image" />
      </body>
    </html>
  `);
}; 