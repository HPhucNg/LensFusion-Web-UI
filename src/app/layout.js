"use client";
import React, { useState, useEffect } from "react";
import "./globals.css";

export default function RootLayout({ children }) {
  // Initialize state for theme (default to 'dark')
  const [theme, setTheme] = useState("dark");

  // Check for saved theme preference in localStorage on page load
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  // Change theme and save to localStorage
  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  // Apply theme to the HTML element
  useEffect(() => {
    document.documentElement.classList.remove("dark", "light");
    document.documentElement.classList.add(theme);
  }, [theme]);

  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className="h-screen overflow-y-auto bg-gradient-to-r from-gray-900 via-gray-800 to-black text-white font-sans">
        <div className="flex flex-col min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
