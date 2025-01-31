"use client";

import "./globals.css";
import { Auth0Provider } from "@auth0/auth0-react";

export default function RootLayout({ children }) {
  return (
    <Auth0Provider
      domain={process.env.NEXT_PUBLIC_AUTH0_DOMAIN}
      clientId={process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID}
      authorizationParams={{
        redirect_uri: "http://localhost:3000/profile"
      }}
    >
      <html lang="en" suppressHydrationWarning>
        <body suppressHydrationWarning className="h-screen overflow-y-auto bg-gradient-to-r from-gray-900 via-gray-800 to-black text-white font-sans">
          <div className="flex flex-col min-h-screen">
            {children}
          </div>
        </body>
      </html>
    </Auth0Provider>
  );
}