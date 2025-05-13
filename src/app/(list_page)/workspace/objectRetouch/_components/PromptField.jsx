/* 
  reused code from /backgroundgeneration/_components/SettingsSidebar 
  prompt section
*/ 

import React from 'react';

export const PromptField = ({ 
  params, 
  handleParamChange,
  status, 
  error 
}) => {
  

  return (
    <>
    <div>
    <h3 className="text-sm font-semibold mb-2 text-purple-400">Inpainting Prompt</h3>
      <textarea
        value={params.prompt}
        onChange={(e) => handleParamChange('prompt', e.target.value)}
        placeholder="Enter what you would like to replace the object with"
        className="w-full p-3 text-sm bg-gray-100 dark:bg-gray-800/20 rounded-md focus:ring-0 focus:outline-none resize-y min-h-[60px] max-h-[200px] border border-[var(--border-gray)]"
        rows={1}
      />
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