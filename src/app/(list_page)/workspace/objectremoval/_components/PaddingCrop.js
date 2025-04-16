import { padImageToSquare, padMaskToSquare } from './utils';

export const handlePaddingAndCropping = async (originalImage, paddingMetadata, maskCanvasRef, originalDimensions, setResultImage, setResultDimensions) => {
  const paddedMask = await padMaskToSquare(paddingMetadata, maskCanvasRef, originalDimensions);
  if (!paddedMask) {
    alert('Please draw the areas you want to remove');
    return;
  }
  const paddedImageDataUrl = await padImageToSquare(originalImage, paddingMetadata);
  const imageData = {
    background: paddedImageDataUrl,
    layers: [paddedMask],
    composite: paddedImageDataUrl,
  };
  return imageData;
};

export const cropResultImage = (result, paddingMetadata, setResultImage, setResultDimensions) => {
  const img = new Image();
  img.onload = () => {
    const { originalWidth, originalHeight, paddingLeft, paddingTop, squareSize } = paddingMetadata;
    const canvas = document.createElement('canvas');
    canvas.width = originalWidth;
    canvas.height = originalHeight;
    const ctx = canvas.getContext('2d');
    const scale = img.width / squareSize;
    const scaledPaddingLeft = paddingLeft * scale;
    const scaledPaddingTop = paddingTop * scale;
    const scaledOriginalWidth = originalWidth * scale;
    const scaledOriginalHeight = originalHeight * scale;
    ctx.drawImage(
      img,
      scaledPaddingLeft, scaledPaddingTop, scaledOriginalWidth, scaledOriginalHeight,
      0, 0, originalWidth, originalHeight
    );
    const croppedDataUrl = canvas.toDataURL('image/png');
    setResultImage(croppedDataUrl);
    setResultDimensions({ width: originalWidth, height: originalHeight });
  };
  img.onerror = (err) => {
    console.error("Error loading result image:", err);
    alert("Failed to load result image from the API");
  };
  img.src = result;
}; 