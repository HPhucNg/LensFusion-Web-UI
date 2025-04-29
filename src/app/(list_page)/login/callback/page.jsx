"use client";

import React, { useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useRouter } from "next/navigation";

export default function CallbackPage() {
  const { handleRedirectCallback } = useAuth0();
  const router = useRouter();

  useEffect(() => {
    const processCallback = async () => {
      try {
        await handleRedirectCallback();
        router.push("/dashboard"); // Redirect to the profile page after login
      } catch (error) {
        console.error("Error during callback processing:", error);
        router.push("/"); // Redirect to home in case of error
      }
    };

    processCallback();
  }, [handleRedirectCallback, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-gray-900 via-gray-800 to-black text-white font-sans">
      <p>Loading...</p>
    </div>
  );
}
