export default function ActionButtons({ clearMask, handleRemoveObject, originalImage, processing, uploadLoading }) {
  return (
    <div className="flex gap-3 ml-auto">
      <button 
        onClick={clearMask}
        disabled={!originalImage}
        className={`px-3 py-2 rounded-lg text-sm ${originalImage ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-800 opacity-50 cursor-not-allowed'} transition-all duration-300`}
      >
        Clear Mask
      </button>
      <button 
        onClick={handleRemoveObject}
        disabled={processing || !originalImage || uploadLoading}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300
          ${processing || !originalImage || uploadLoading
            ? 'bg-gray-800 opacity-50 cursor-not-allowed' 
            : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500'
          }`}
      >
        {processing ? (
          <span className="flex items-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </span>
        ) : "Remove Object"}
      </button>
    </div>
  );
} 