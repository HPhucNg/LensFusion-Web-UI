import React from 'react';
import { Gem } from 'lucide-react';

export const GenerateButton = ({ 
  handleGenerate, 
  isProcessing, 
  selectedFile, 
  userTokens,
  insufficientTokens 
}) => {
  return (
    <div className="sticky bottom-0 pt-4 bg-gradient-to-t dark:from-gray-800/90 from-gray-300/90 to-transparent">
      <button
        onClick={handleGenerate}
        disabled={isProcessing || !selectedFile || insufficientTokens}
        className="w-full py-2 text-white font-medium text-base bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 disabled:bg-gradient-to-r disabled:from-gray-700 disabled:to-gray-600 rounded-md transition-all disabled:cursor-not-allowed relative overflow-hidden flex items-center justify-center"
      >
        {isProcessing ? (
          <div className="flex items-center justify-center space-x-2">
            <svg className="w-5 h-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Processing...</span>
          </div>
        ) : insufficientTokens ? (
          'Insufficient Tokens'
        ) : (
          <div className="flex items-center justify-center">
            <span>Generate Image</span>
            <Gem className="w-4 h-4 mx-1.5 text-white" />
            <span>10</span>
          </div>
        )}
      </button>
    </div>
  );
};