import { useState, useEffect } from 'react';

/**
 * Custom hook for managing theme (light/dark mode) with localStorage persistence
 * @param {string} defaultTheme - The default theme to use if no theme is saved in localStorage
 * @returns {Object} - Theme state and toggle function
 */
export const useTheme = (defaultTheme = 'dark') => {
  const [theme, setTheme] = useState(defaultTheme);

  // Initialize theme from localStorage on component mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    } else {
      // If no saved theme, apply the default
      applyTheme(defaultTheme);
    }
  }, [defaultTheme]);

  // Function to toggle between light and dark themes
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  };

  // Function to apply a specific theme
  const applyTheme = (themeName) => {
    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.classList.add(themeName);
  };

  // Function to set a specific theme directly
  const setThemeDirectly = (themeName) => {
    if (themeName === 'dark' || themeName === 'light') {
      setTheme(themeName);
      localStorage.setItem('theme', themeName);
      applyTheme(themeName);
    }
  };

  return { theme, toggleTheme, setTheme: setThemeDirectly };
}; 