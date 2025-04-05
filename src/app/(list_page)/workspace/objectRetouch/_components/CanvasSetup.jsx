export const setupCanvas = (img, container, options) => {
    const { maxWidth, maxHeight } = options;
    
    //get dimensions
    const parentElement = container?.parentElement;
    const availableWidth = parentElement 
      ? parentElement.clientWidth 
      : Math.min(maxWidth, window.innerWidth * 0.9);
      
    const availableHeight = parentElement 
      ? parentElement.clientHeight 
      : Math.min(maxHeight, window.innerHeight * 0.7);
    
    //calculate dimensions
    let newWidth, newHeight;
    if (img.width <= availableWidth && img.height <= availableHeight) {
      newWidth = img.width;
      newHeight = img.height;
    } else {
      const ratio = Math.min(availableWidth / img.width, availableHeight / img.height);
      newWidth = Math.round(img.width * ratio);
      newHeight = Math.round(img.height * ratio);
    }
    
    //set min size
    newWidth = Math.max(newWidth, 300);
    newHeight = Math.max(newHeight, 200);
    
    return { width: newWidth, height: newHeight };
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
    
    //draw image on canvas
    const ctx = imageCanvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    
    //clear mask canvas
    const maskCtx = maskCanvasRef.current.getContext('2d');
    maskCtx.clearRect(0, 0, width, height);
    
    return true;
  };