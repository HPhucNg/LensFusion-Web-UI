import React from 'react';

export const SettingsSidebar = ({ 
  params, 
  handleParamChange, 
  generateRandomSeed, 
  parameterDefinitions,
  status,
  error
}) => {
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
                      focus:ring-0 focus:outline-none resize-y"
            value={params[param.id]}
            onChange={(e) => handleParamChange(param.id, e.target.value)}
            rows={3}
          />
        );
      // Dropdown select input
      case 'select':
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
              className="w-full p-3 text-sm bg-gray-800/20 rounded-md focus:ring-0 focus:outline-none resize-y min-h-[120px] border border-gray-700"
              rows={10}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1 text-gray-300">Negative Prompt</label>
            <textarea
              value={params.negativePrompt}
              onChange={(e) => handleParamChange('negativePrompt', e.target.value)}
              placeholder="Describe what you want to avoid..."
              className="w-full p-3 text-sm bg-gray-800/20 rounded-md focus:ring-0 focus:outline-none resize-y min-h-[50px] border border-gray-700"
              rows={4}
            />
          </div>
        </div>

        {/* Advanced Settings */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-300">Advanced Settings</h3>
          <div className="grid grid-cols-2 gap-3">
            {parameterDefinitions.slice(2, 4).map(param => (
              param.type === 'select' && (
                <div key={param.id} className="space-y-1">
                  <label className="block text-xs font-medium text-gray-300">{param.label}</label>
                  {renderParameter(param)}
                </div>
              )
            ))}
          </div>

          {/* Seed Input */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-300">Seed</label>
            {renderParameter(parameterDefinitions.find(p => p.id === 'seed'))}
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