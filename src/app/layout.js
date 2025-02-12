"use client";
import { SubscriptionProvider } from "@/context/subscriptionContext";

import "./globals.css";

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className="h-screen overflow-y-auto bg-gradient-to-r from-gray-900 via-gray-800 to-black text-white font-sans">
        <SubscriptionProvider>
          <div className="flex flex-col min-h-screen">
            {children}
          </div>
        </SubscriptionProvider>
      </body>
    </html>
  );
}