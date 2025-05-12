"use client";

import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';
import { auth } from '@/firebase/FirebaseConfig';
import { signInWithPopup, GoogleAuthProvider, GithubAuthProvider } from "firebase/auth";
import { FaGoogle, FaGithub } from 'react-icons/fa';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { setAuthCookie } from '@/utils/authCookies';
import Turnstile from 'react-turnstile';

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [turnstileVerified, setTurnstileVerified] = useState(false);
  const turnstileRef = useRef(null);

  // Function to handle when Turnstile is verified
  const onTurnstileVerify = async (token) => {
    try {
      const response = await fetch('/api/verify-turnstile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();
      
      if (data.success) {
        setTurnstileVerified(true);
        setError('');
      } else {
        setTurnstileVerified(false);
        setError(data.error || 'CAPTCHA verification failed');
        // Reset Turnstile if verification fails
        if (turnstileRef.current) {
          turnstileRef.current.reset();
        }
      }
    } catch (error) {
      console.error('Error verifying Turnstile token:', error);
      setTurnstileVerified(false);
      setError('CAPTCHA verification failed. Please try again.');
      // Reset Turnstile on error
      if (turnstileRef.current) {
        turnstileRef.current.reset();
      }
    }
  };

  // Function to handle when Turnstile verification expires
  const onTurnstileExpire = () => {
    setTurnstileVerified(false);
  };

  // Handles Google sign-up process
  const handleGoogleSignUp = async () => {
    if (!turnstileVerified) {
      setError('Please complete the CAPTCHA verification first');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      const provider = new GoogleAuthProvider();

      // Request access to users email and profile info
      provider.addScope('email');
      provider.addScope('profile');

      const result = await signInWithPopup(auth, provider);
        await setAuthCookie(result.user);
        
        // Redirect to profile page
        router.push('/dashboard/profile');
    } catch (error) {
      console.error("Google signup error:", error);
      setError(error.message || 'An error occurred during signup with Google');
    } finally {
      setIsLoading(false);
    }
  };

  // Handles GitHub sign-up process
  const handleGithubSignUp = async () => {
    if (!turnstileVerified) {
      setError('Please complete the CAPTCHA verification first');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      const provider = new GithubAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      if (result.user) {
        // Set auth cookie
        await setAuthCookie(result.user);
        
        // Redirect to profile page
        router.push('/dashboard/profile');
      }
    } catch (error) {
      console.error("GitHub signup error:", error);
      setError(error.message || 'An error occurred during signup with GitHub');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8 bg-[#0D161F] p-8 rounded-2xl shadow-2xl border border-gray-800">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-2">Create an Account</h2>
            <p className="text-gray-400">Join us today and get started</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          <div className="flex justify-center mb-4">
            <Turnstile
              ref={turnstileRef}
              sitekey={process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY}
              onVerify={onTurnstileVerify}
              onExpire={onTurnstileExpire}
              theme="dark"
            />
          </div>

          <div className="space-y-4">
            <Button
              variant="outline"
              onClick={handleGoogleSignUp}
              disabled={isLoading || !turnstileVerified}
              className="w-full py-6 bg-white hover:bg-gray-100 text-black transition-all duration-300 flex items-center justify-center space-x-3"
            >
              <FaGoogle className="w-5 h-5" />
              <span className="text-lg">{isLoading ? 'Signing up...' : 'Sign up with Google'}</span>
            </Button>
            
            <Button
              variant="outline"
              onClick={handleGithubSignUp}
              disabled={isLoading || !turnstileVerified}
              className="w-full py-6 bg-[#24292e] hover:bg-[#1b1f23] text-white transition-all duration-300 flex items-center justify-center space-x-3"
            >
              <FaGithub className="w-5 h-5" />
              <span className="text-lg">{isLoading ? 'Signing up...' : 'Sign up with GitHub'}</span>
            </Button>
            
            <div className="text-center mt-4">
              <p className="text-sm text-gray-400">
                Already have an account?{' '}
                <a href="/login" className="font-medium text-purple-600 hover:text-purple-500">
                  Sign in
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
