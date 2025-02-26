import React from 'react';
import Image from 'next/image';

export const TemplateGrid = ({ 
  loadedTemplates, 
  selectedTemplateId, 
  handleTemplateSelect 
}) => (
  <div className="grid grid-cols-2 gap-3 p-1 overflow-y-auto h-[calc(100vh-200px)] pr-2 scrollbar-thin scrollbar-track-gray-900/50 scrollbar-thumb-gray-700/50">
    {loadedTemplates.map((template, index) => (
      <div
        key={template.id}
        className={`group relative aspect-square cursor-pointer rounded-xl transition-all ${
          selectedTemplateId === template.id
            ? 'ring-2 ring-purple-500/80 scale-[0.98] bg-gradient-to-br from-purple-900/20 to-blue-900/10'
            : 'hover:scale-95'
        }`}
        onClick={() => handleTemplateSelect(template)}
      >
        <div className="relative h-full w-full overflow-hidden rounded-xl border border-gray-700/50 bg-gray-900/20">
          <Image
            src={template.image}
            alt={`Template ${index + 1}`}
            fill
            className={`object-cover transition-opacity ${
              selectedTemplateId === template.id ? 'opacity-80' : 'group-hover:opacity-50'
            }`}
            unoptimized={true}
          />
          <div className="absolute bottom-2 right-2 rounded-md bg-gray-900/80 px-2 py-1 text-xs font-medium text-gray-300 backdrop-blur-sm">
            #{index + 1}
          </div>
        </div>
        {/* Selection glow effect */}
        {selectedTemplateId === template.id && (
          <div className="absolute inset-0 rounded-xl pointer-events-none border border-purple-500/30 shadow-[0_0_25px_rgba(168,85,247,0.3)]" />
        )}
      </div>
    ))}
  </div>
);