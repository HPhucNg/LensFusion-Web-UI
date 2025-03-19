/**
 * Interface settings utility functions
 */

/**
 * Apply interface settings from user preferences
 * @param {Object} interfaceSettings - The user's interface settings
 */
export const applyInterfaceSettings = (interfaceSettings) => {
  if (!interfaceSettings) return;
  
  // Apply theme
  if (interfaceSettings.colorScheme && interfaceSettings.colorScheme !== 'system') {
    document.documentElement.classList.remove("dark", "light");
    document.documentElement.classList.add(interfaceSettings.colorScheme);
    localStorage.setItem("theme", interfaceSettings.colorScheme);
  }
  
  // Apply accent color
  if (interfaceSettings.accentColor) {
    document.documentElement.style.setProperty('--accent-color', getAccentColorValue(interfaceSettings.accentColor));
  }
  
  // Apply reduced animations
  if (interfaceSettings.reducedAnimations !== undefined) {
    if (interfaceSettings.reducedAnimations) {
      document.documentElement.classList.add('reduce-motion');
    } else {
      document.documentElement.classList.remove('reduce-motion');
    }
  }
  
  // Apply font size
  if (interfaceSettings.fontSize) {
    document.documentElement.style.fontSize = getFontSizeValue(interfaceSettings.fontSize);
  }
  
  // Apply high contrast if enabled
  if (interfaceSettings.highContrastMode !== undefined) {
    if (interfaceSettings.highContrastMode) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  }
};

/**
 * Get accent color value
 * @param {string} color - The accent color name
 * @returns {string} CSS color value
 */
export const getAccentColorValue = (color) => {
  switch (color) {
    case 'purple': return 'hsl(261, 80%, 64%)';
    case 'blue': return 'hsl(210, 100%, 50%)';
    case 'teal': return 'hsl(180, 100%, 45%)';
    case 'amber': return 'hsl(45, 100%, 50%)';
    case 'pink': return 'hsl(330, 100%, 60%)';
    default: return 'hsl(261, 80%, 64%)';
  }
};

/**
 * Get font size value
 * @param {string} size - The font size name
 * @returns {string} CSS font size value
 */
export const getFontSizeValue = (size) => {
  switch (size) {
    case 'small': return '14px';
    case 'medium': return '16px';
    case 'large': return '18px';
    default: return '16px';
  }
};

/**
 * Get grid view classes for gallery
 * @param {string} type - The grid view type
 * @returns {string} Tailwind CSS classes for grid
 */
export const getGridViewClasses = (type) => {
  switch (type) {
    case 'compact': return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4';
    case 'comfortable': return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-6';
    case 'spacious': return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-8';
    default: return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4';
  }
}; 