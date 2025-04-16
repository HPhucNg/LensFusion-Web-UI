export const startDrawing = ({nativeEvent}, contextRef, brushSize, isEraser, setIsDrawing, handleGlobalMouseMove, handleGlobalMouseUp) => {
  if (!contextRef.current) return;
  const {offsetX, offsetY} = nativeEvent;
  contextRef.current.globalCompositeOperation = isEraser ? 'destination-out' : 'source-over';
  contextRef.current.beginPath();
  contextRef.current.lineWidth = brushSize;
  contextRef.current.beginPath();
  contextRef.current.arc(offsetX, offsetY, brushSize/2, 0, Math.PI * 2);
  contextRef.current.fill();
  setIsDrawing(true);
  document.body.style.cursor = 'none';
  window.addEventListener('mousemove', handleGlobalMouseMove);
  window.addEventListener('mouseup', handleGlobalMouseUp);
};

export const draw = ({nativeEvent}, isDrawing, contextRef, brushSize) => {
  if (!isDrawing || !contextRef.current) return;
  const {offsetX, offsetY} = nativeEvent;
  contextRef.current.beginPath();
  contextRef.current.arc(offsetX, offsetY, brushSize/2, 0, Math.PI * 2);
  contextRef.current.fill();
  contextRef.current.beginPath();
  contextRef.current.moveTo(offsetX - 1, offsetY - 1);
  contextRef.current.lineTo(offsetX, offsetY);
  contextRef.current.lineWidth = brushSize;
  contextRef.current.stroke();
};

export const stopDrawing = (setIsDrawing) => {
  setIsDrawing(false);
  document.body.style.cursor = '';
  window.removeEventListener('mousemove', handleGlobalMouseMove);
  window.removeEventListener('mouseup', handleGlobalMouseUp);
}; 