export const calculatePaddingMetadata = (width, height) => {
  const maxDimension = Math.max(width, height);
  let paddingLeft = 0;
  let paddingTop = 0;
  let paddingRight = 0;
  let paddingBottom = 0;
  if (width < height) {
    const totalWidthPadding = height - width;
    paddingLeft = Math.floor(totalWidthPadding / 2);
    paddingRight = totalWidthPadding - paddingLeft;
  } else if (width > height) {
    const totalHeightPadding = width - height;
    paddingTop = Math.floor(totalHeightPadding / 2);
    paddingBottom = totalHeightPadding - paddingTop;
  }
  return {
    originalWidth: width,
    originalHeight: height,
    paddingLeft,
    paddingTop,
    paddingRight,
    paddingBottom,
    paddingLeftPercent: (paddingLeft / maxDimension) * 100,
    paddingTopPercent: (paddingTop / maxDimension) * 100,
    paddingRightPercent: (paddingRight / maxDimension) * 100,
    paddingBottomPercent: (paddingBottom / maxDimension) * 100,
    squareSize: maxDimension
  };
};

export const padImageToSquare = (imageDataUrl, metadata) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const { originalWidth, originalHeight, paddingLeft, paddingTop, squareSize } = metadata;
      const canvas = document.createElement('canvas');
      canvas.width = squareSize;
      canvas.height = squareSize;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = 'rgb(0, 0, 0)';
      ctx.fillRect(0, 0, squareSize, squareSize);
      ctx.drawImage(img, 0, 0, originalWidth, originalHeight, paddingLeft, paddingTop, originalWidth, originalHeight);
      const paddedImageDataUrl = canvas.toDataURL('image/png');
      resolve(paddedImageDataUrl);
    };
    img.onerror = (error) => reject(new Error('Failed to load image for padding'));
    img.src = imageDataUrl;
  });
};

export const padMaskToSquare = async (metadata, maskCanvasRef, originalDimensions) => {
  if (!maskCanvasRef.current) return null;
  const maskCtx = maskCanvasRef.current.getContext('2d');
  const imageData = maskCtx.getImageData(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);
  let hasContent = false;
  for (let i = 3; i < imageData.data.length; i += 4) {
    if (imageData.data[i] > 0) {
      hasContent = true;
      break;
    }
  }
  if (!hasContent) return null;
  const maskImage = maskCanvasRef.current.toDataURL('image/png');
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const { originalWidth, originalHeight, paddingLeft, paddingTop, squareSize } = metadata;
      const canvas = document.createElement('canvas');
      canvas.width = squareSize;
      canvas.height = squareSize;
      const ctx = canvas.getContext('2d', { alpha: true });
      ctx.clearRect(0, 0, squareSize, squareSize);
      ctx.drawImage(img, 0, 0, originalWidth * (maskCanvasRef.current.width / originalDimensions.width), originalHeight * (maskCanvasRef.current.height / originalDimensions.height), paddingLeft, paddingTop, originalWidth, originalHeight);
      const paddedMaskDataUrl = canvas.toDataURL('image/png');
      resolve(paddedMaskDataUrl);
    };
    img.onerror = () => resolve(null);
    img.src = maskImage;
  });
};

export const readFileAsDataURL = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}; 