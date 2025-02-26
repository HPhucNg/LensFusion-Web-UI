import React from 'react';

export const TabNavigation = ({ activeSidebar, setActiveSidebar }) => {
  return (
    <div className="flex mb-3">
      <button
        onClick={() => setActiveSidebar('settings')}
        className={`flex-1 py-1.5 text-sm ${
          activeSidebar === 'settings' 
            ? 'bg-gray-700/50 text-white' 
            : 'bg-gray-800/20 text-gray-400 hover:bg-gray-700/30'
        } rounded-l-md transition-colors`}
      >
        Settings
      </button>
      <button
        onClick={() => setActiveSidebar('templates')}
        className={`flex-1 py-1.5 text-sm ${
          activeSidebar === 'templates' 
            ? 'bg-gray-700/50 text-white' 
            : 'bg-gray-800/20 text-gray-400 hover:bg-gray-700/30'
        } rounded-r-md transition-colors`}
      >
        Templates
      </button>
    </div>
  );
};