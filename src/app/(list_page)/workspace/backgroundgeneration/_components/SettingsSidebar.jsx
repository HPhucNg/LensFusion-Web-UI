import React, { useEffect } from 'react';

export const SettingsSidebar = ({ 
  params, 
  handleParamChange, 
  generateRandomSeed, 
  parameterDefinitions,
  status,
  error,
  onResize,
  inputImage
}) => {
  // Debug log to check if removeBackground is being passed correctly
  useEffect(() => {
    console.log('SettingsSidebar received params:', params);
    console.log('removeBackground value:', params.removeBackground);
  }, [params]);

  // Renders different types of parameter inputs
  const renderParameter = (param) => {
    switch (param.type) {
      case 'text':
        // Special handling for seed input
        if (param.id === 'seed') {
          return (
            <div className="flex gap-2">
              <input
                type="text"
                id={param.id}
                placeholder="12345"
                className="flex-1 p-3 bg-gray-900/50 border border-gray-700 rounded-lg 
                          focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={params[param.id]}
                onChange={(e) => handleParamChange(param.id, e.target.value)}
              />
              <button
                onClick={generateRandomSeed}
                type="button"
                className="p-3 bg-gray-900/50 border border-gray-700 rounded-lg hover:bg-gray-800
                          focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                title="Generate Random Seed"
              >
                <svg 
                  className="w-5 h-5" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                  />
                </svg>
              </button>
            </div>
          );
        }
        // Changed regular text input to textarea
        return (
          <textarea
            id={param.id}
            placeholder={param.placeholder}
            className="w-full p-3 bg-gray-900/50 border border-gray-700 rounded-lg 
                      focus:ring-0 focus:outline-none resize-y scrollbar scrollbar-thin scrollbar-track-gray-900/50 scrollbar-thumb-gray-700/50"
            value={params[param.id]}
            onChange={(e) => handleParamChange(param.id, e.target.value)}
            rows={3}
          />
        );
      // Dropdown select input
      case 'select':
        // Special handling for Image Size parameter to add the Resize button
        if (param.id === 'imageHeight') {
          return (
            <div>
              <div className="grid grid-cols-2 mb-1">
                <span className="text-xs font-medium text-gray-300">Image Size</span>
                <span className="text-xs font-medium text-gray-300">Image Resize</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select
                  id={param.id}
                  className="w-full p-3 bg-gray-900/50 border border-gray-700 rounded-lg 
                            focus:ring-0 focus:outline-none"
                  value={params[param.id]}
                  onChange={(e) => handleParamChange(param.id, e.target.value)}
                >
                  {param.options.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={onResize}
                  className={`w-full px-3 py-3 border rounded-lg text-center ${
                    inputImage 
                      ? "bg-gray-900/50 border-gray-700 hover:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      : "bg-gray-900/30 border-gray-700/50 text-gray-500 cursor-not-allowed"
                  }`}
                  title={inputImage ? "Resize image" : "Upload an image first"}
                  disabled={!inputImage}
                >
                  <span className="text-sm">Resize Image</span>
                </button>
              </div>
            </div>
          );
        }
        return (
          <select
            id={param.id}
            className="w-full p-3 bg-gray-900/50 border border-gray-700 rounded-lg 
                      focus:ring-0 focus:outline-none"
            value={params[param.id]}
            onChange={(e) => handleParamChange(param.id, e.target.value)}
          >
            {param.options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      default:
        return null;
    }
  };

  return (
    <>
      {/* Settings Content */}
      <div className="space-y-3">
        {/* Prompts Section */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium mb-1 text-gray-300">Positive Prompt</label>
            <textarea
              value={params.prompt}
              onChange={(e) => handleParamChange('prompt', e.target.value)}
              placeholder="Describe what you want to generate..."
              className="w-full p-3 text-sm bg-gray-800/20 rounded-md focus:ring-0 focus:outline-none resize-y min-h-[120px] border border-gray-700 scrollbar scrollbar-thin scrollbar-track-gray-900/50 scrollbar-thumb-gray-700/50"
              rows={10}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1 text-gray-300">Negative Prompt</label>
            <textarea
              value={params.negativePrompt}
              onChange={(e) => handleParamChange('negativePrompt', e.target.value)}
              placeholder="Describe what you want to avoid..."
              className="w-full p-3 text-sm bg-gray-800/20 rounded-md focus:ring-0 focus:outline-none resize-y min-h-[50px] border border-gray-700 scrollbar scrollbar-thin scrollbar-track-gray-900/50 scrollbar-thumb-gray-700/50"
              rows={4}
            />
          </div>
        </div>

        {/* Advanced Settings */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-300">Advanced Settings</h3>
          
          <div className="grid grid-cols-1 gap-3">
            {parameterDefinitions.slice(2, 4).map(param => (
              param.type === 'select' && (
                <div key={param.id}>
                  {renderParameter(param)}
                </div>
              )
            ))}
          </div>

          {/* Seed Input */}
          <div className="space-y-1">
            <label className="block text-xs font-medium mb-1 text-gray-300">Seed</label>
            {renderParameter(parameterDefinitions.find(p => p.id === 'seed'))}
          </div>
          
          {/* Background Removal Toggle - Moved to after seed input */}
          <div className="flex items-center justify-between p-3 bg-gray-900/50 border border-gray-700 rounded-lg group relative mt-3">
            <label htmlFor="bg-removal-toggle" className="text-sm font-medium text-gray-300 flex items-center cursor-pointer">
              Auto-Remove Background
            </label>
            
            {/* Replaced toggle implementation with a more direct approach */}
            <button
              onClick={() => {
                const newValue = !(typeof params.removeBackground === 'boolean' ? params.removeBackground : true);
                console.log('Toggle clicked, new value:', newValue);
                handleParamChange('removeBackground', newValue);
              }}
              className={`relative w-12 h-6 rounded-full flex items-center p-0.5 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-colors duration-200 ${params.removeBackground ? 'bg-purple-600' : 'bg-gray-700'}`}
              aria-pressed={params.removeBackground}
              role="switch"
            >
              <span className={`absolute h-5 w-5 rounded-full bg-white shadow transform transition-transform duration-200 ease-in-out ${params.removeBackground ? 'translate-x-6' : 'translate-x-0'}`} />
              <span className="sr-only">Toggle background removal</span>
            </button>
          </div>
        </div>
      </div>

      {/* Status and Error Messages */}
      {status && (
        <div className="text-xs text-gray-300 mt-3">
          Status: {status}
        </div>
      )}

      {error && (
        <div className="text-xs text-red-300 bg-red-900/50 p-2 rounded-md mt-3">
          {error}
        </div>
      )}
    </>
  );
};