"use client";

import "./globals.css";
import { Auth0Provider } from "@auth0/auth0-react";

const domain = process.env.NEXT_PUBLIC_AUTH0_DOMAIN;
const clientId = process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID;
const redirectUri =
  typeof window !== "undefined"
    ? `${window.location.origin}/login/callback`
    : "http://localhost:3000/login/callback"; // Default fallback for SSR

export default function RootLayout({ children }) {
  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: redirectUri,
      }}
    >
      <html lang="en">
        <head>
          <title>LensFusion</title>
          <meta name="description" content="LensFusion AI Marketing Platform" />
          <link rel="icon" href="/icon.ico" />
        </head>
        <body className="min-h-screen bg-gradient-to-r from-gray-900 via-gray-800 to-black text-white font-sans relative overflow-hidden">
          {children}
        </body>
      </html>
    </Auth0Provider>
  );
}
