"use client";

export default function DrawingTools({ 
  isEraser, 
  setIsEraser, 
  brushSize, 
  setBrushSize,
  clearMask,
  handleGenerate,
  isProcessing,
  selectedFile,
  maskData,
}) {
    return (
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap items-center gap-3">
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
              
              {/* Brush size control */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-white/80">Size:</span>
                <input 
                  type="range"
                  min="5"
                  max="50"
                  value={brushSize}
                  onChange={(e) => setBrushSize(parseInt(e.target.value))}
                  className="w-24 sm:w-32 accent-purple-500"
                />
                <span className="text-sm bg-gray-800 px-2 py-0.5 rounded">{brushSize}px</span>
              </div>
            </div>
            
            {/* Right side */}
            <div className="flex items-center gap-3 ml-auto">
              <button
                onClick={clearMask}
                disabled={!selectedFile}
                className={`px-4 py-2 rounded-lg text-sm flex items-center gap-1.5 ${
                  selectedFile 
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                    : 'bg-gray-800 opacity-50 cursor-not-allowed'
                } transition-all duration-300`}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18"></path>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
                Clear Mask
              </button>
              
              <button
                onClick={handleGenerate}
                disabled={isProcessing || !selectedFile || !maskData}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300
                  ${isProcessing || !selectedFile || !maskData
                    ? 'bg-gray-800 opacity-50 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500'
                  }`}
              >
                {isProcessing ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : "Replace object"}
              </button>
            </div>
          </div>
      );
}