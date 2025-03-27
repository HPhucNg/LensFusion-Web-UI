import React from 'react';

export const DebugPanel = ({ showDebug, setShowDebug, originalImage, paddingMetadata, paddedDebugImage, paddedDebugMask, resultImage }) => {
  if (!showDebug) return null;
  return (
    <div className="mt-6 p-4 rounded-xl backdrop-blur-sm bg-gray-800/50 border border-red-700">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-semibold text-red-400">Debug: Square Padding Visualization</h3>
        <button 
          onClick={() => setShowDebug(false)}
          className="text-xs bg-red-900/50 hover:bg-red-900 px-2 py-1 rounded"
        >
          Hide Debug Panel
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DebugImage title="Original Image" image={originalImage} dimensions={paddingMetadata} />
        <DebugImage title="Padded Square Image (1:1)" image={paddedDebugImage} dimensions={paddingMetadata} />
        <DebugImage title="Padded Square Mask (1:1)" image={paddedDebugMask} dimensions={paddingMetadata} />
        <DebugImage title="API Result (Square Format)" image={resultImage} />
      </div>
    </div>
  );
};

const DebugImage = ({ title, image, dimensions }) => (
  <div className="bg-gray-800/50 p-3 rounded-lg">
    <p className="text-xs font-medium mb-2 text-gray-400">{title}</p>
    <div className="h-60 flex items-center justify-center border border-gray-700 rounded overflow-hidden">
      {image ? (
        <img 
          src={image} 
          alt={title} 
          className="max-w-full max-h-full object-contain"
        />
      ) : (
        <span className="text-xs text-gray-500">No image available</span>
      )}
    </div>
    {dimensions && (
      <p className="text-xs text-gray-500 mt-2">
        Dimensions: {dimensions.originalWidth}x{dimensions.originalHeight}
      </p>
    )}
  </div>
); 