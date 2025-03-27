import { useState } from 'react';

export default function DrawingTools({ isEraser, setIsEraser, brushSize, setBrushSize }) {
  return (
    <div className="flex items-center gap-3">
      {/* Drawing mode selector */}
      <div className="flex border border-gray-700 rounded-lg overflow-hidden">
        <button
          onClick={() => setIsEraser(false)}
          className={`px-3 py-2 flex items-center gap-1.5 ${!isEraser ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 19l7-7 3 3-7 7-3-3z"></path>
            <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path>
            <path d="M2 2l7.586 7.586"></path>
            <circle cx="11" cy="11" r="2"></circle>
          </svg>
          Brush
        </button>
        <button
          onClick={() => setIsEraser(true)}
          className={`px-3 py-2 flex items-center gap-1.5 ${isEraser ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 20H7L3 16a1 1 0 0 1 0-1.41l9.59-9.59a2 2 0 0 1 2.82 0L21 10.59a2 2 0 0 1 0 2.82L16 18"></path>
          </svg>
          Eraser
        </button>
      </div>
      
      <div className="flex items-center gap-2">
        <span className="text-sm text-white/80">Size:</span>
        <input 
          type="range" 
          min="5" 
          max="50" 
          value={brushSize}
          onChange={(e) => setBrushSize(parseInt(e.target.value))}
          className="w-32 accent-purple-500" 
        />
        <span className="text-sm bg-gray-800 px-2 py-0.5 rounded">{brushSize}px</span>
      </div>
    </div>
  );
} 