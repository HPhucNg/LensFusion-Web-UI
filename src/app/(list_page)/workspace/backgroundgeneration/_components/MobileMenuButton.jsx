import React from 'react';

export const MobileMenuButton = ({ setIsSidebarOpen, isSidebarOpen }) => {
  if (isSidebarOpen) return null;
  
  return (
    <div className="lg:hidden fixed bottom-6 right-6 z-50">
      <button
        onClick={() => setIsSidebarOpen(true)}
        className="p-3 bg-gray-900 border border-gray-700 rounded-lg shadow-xl hover:bg-gray-800 transition-all"
      >
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    </div>
  );
};