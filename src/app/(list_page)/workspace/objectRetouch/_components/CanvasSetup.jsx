export const setupCanvas = (img, container, options) => {
    const { maxWidth, maxHeight } = options;
    
    const containerWidth = Math.min(container?.clientWidth || maxWidth, maxWidth);
    const containerHeight = Math.min(container?.clientHeight || maxHeight, maxHeight);
    
    const imageRatio = img.width / img.height;
    let newWidth, newHeight;

    if (imageRatio > 1) {
      newWidth = Math.min(containerWidth, maxWidth);
      newHeight = newWidth / imageRatio;
      
      if (newHeight > containerHeight) {
        newHeight = Math.min(containerHeight, maxHeight);
        newWidth = newHeight * imageRatio;
      }
    } else {
      newHeight = Math.min(containerHeight, maxHeight);
      newWidth = newHeight * imageRatio;
      
      if (newWidth > containerWidth) {
        newWidth = Math.min(containerWidth, maxWidth);
        newHeight = newWidth / imageRatio;
      }
    }
    newWidth = Math.round(newWidth);
    newHeight = Math.round(newHeight);
    
    return { 
      width: Math.min(newWidth, containerWidth), 
      height: Math.min(newHeight, containerHeight) 
    };
  };
  
  export const renderImage = (img, dimensions, canvasRefs) => {
    const { width, height } = dimensions;
    const { imageCanvasRef, maskCanvasRef } = canvasRefs;
    
    if (!imageCanvasRef.current || !maskCanvasRef.current) return false;
    
    //canvas dimensions
    imageCanvasRef.current.width = width;
    imageCanvasRef.current.height = height;
    maskCanvasRef.current.width = width;
    maskCanvasRef.current.height = height;
    
    imageCanvasRef.current.style.width = `${width}px`;
    imageCanvasRef.current.style.height = `${height}px`;
    maskCanvasRef.current.style.width = `${width}px`;
    maskCanvasRef.current.style.height = `${height}px`;

    const ctx = imageCanvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    
    //clear mask canvas
    const maskCtx = maskCanvasRef.current.getContext('2d');
    maskCtx.clearRect(0, 0, width, height);
    
    return true;
  };