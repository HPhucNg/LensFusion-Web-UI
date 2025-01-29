"use client";

import React, { useState, useEffect } from "react";
import { Auth0Provider } from "@auth0/auth0-react";
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
    <Auth0Provider
      domain={process.env.NEXT_PUBLIC_AUTH0_DOMAIN}
      clientId={process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID}
      authorizationParams={{
        redirect_uri: "http://localhost:3000/profile",
      }}
    >
      <html lang="en">
        <body className="h-screen overflow-y-auto font-sans">
          <div className="flex flex-col min-h-screen">
            {children}
          </div>
        </body>
      </html>
    </Auth0Provider>
  );
}
