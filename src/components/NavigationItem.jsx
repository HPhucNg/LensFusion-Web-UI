import React from 'react';

function NavigationItem({ label, isActive }) {
  const baseClasses = "gap-2 self-stretch p-2 rounded-lg text-black"; 
  const activeClasses = isActive
    ? "bg-gray-300 font-bold"
    : "bg-transparent text-black"; 
  
  return (
    <div className={`${baseClasses} ${activeClasses}`}>
      {label}
    </div>
  );
}

export default NavigationItem;
