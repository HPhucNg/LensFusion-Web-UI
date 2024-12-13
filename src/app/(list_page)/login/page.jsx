"use client";

import { OktaAuth, toRelativeUrl } from "@okta/okta-auth-js";
import { Security, useOktaAuth } from "@okta/okta-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

// Configure OktaAuth instance using environment variables
const oktaAuth = new OktaAuth({
  issuer: process.env.NEXT_PUBLIC_OKTA_ISSUER, // Example: "https://dev-123456.okta.com/oauth2/default"
  clientId: process.env.NEXT_PUBLIC_OKTA_CLIENT_ID, // Example: "aBcc....t"
  redirectUri: `${window.location.origin}/login/callback`,
});

function LoginPage() {
  const { oktaAuth, authState } = useOktaAuth();

  const handleSignIn = async () => {
    try {
      await oktaAuth.signInWithRedirect();
    } catch (error) {
      console.error("Error during login:", error);
    }
  };

  if (!authState) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (authState.isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-gray-900 via-gray-800 to-black text-white font-sans">
        <Navbar />
        <div className="flex flex-col justify-center items-center py-20">
          <h1 className="text-4xl font-bold mb-6">Welcome Back!</h1>
          <p className="mb-4 text-lg">You are already signed in.</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-gray-900 via-gray-800 to-black text-white font-sans">
      <Navbar />
      <div className="flex flex-col justify-center items-center py-20">
        <h1 className="text-4xl font-bold mb-6">Welcome to LensFusion</h1>
        <p className="mb-4 text-lg">
          Sign in to continue and explore AI-powered solutions.
        </p>
        <Button
          onClick={handleSignIn}
          className="px-8 py-4 text-lg font-semibold bg-purple-600 hover:bg-purple-700 transition rounded-full"
        >
          Sign In
        </Button>
      </div>
      <Footer />
    </div>
  );
}

export default function Root() {
  return (
    <Security
      oktaAuth={oktaAuth}
      restoreOriginalUri={(oktaAuth, originalUri) =>
        oktaAuth.setOriginalUri(toRelativeUrl(originalUri, window.location.origin))
      }
    >
      <LoginPage />
    </Security>
  );
}
