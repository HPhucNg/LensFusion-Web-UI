"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaGoogle, FaGithub } from 'react-icons/fa';
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { auth } from '@/firebase/FirebaseConfig';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  GithubAuthProvider 
} from "firebase/auth";
import { setAuthCookie } from '@/utils/authCookies';
import { useAuth } from '@/context/AuthContext';
import Turnstile from 'react-turnstile';

export default function LoginPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [turnstileVerified, setTurnstileVerified] = useState(false);
  const turnstileRef = useRef(null);

  // Redirect to profile if already logged in
  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

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

  // Handle Google login
  const handleGoogleLogin = async () => {
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
      router.push('/dashboard');
      
    } catch (error) {
      console.error("Google login error:", error);
      setError('Error signing in with Google. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle GitHub login
  const handleGithubLogin = async () => {
    if (!turnstileVerified) {
      setError('Please complete the CAPTCHA verification first');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const provider = new GithubAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Set auth cookie
      await setAuthCookie(user);
      
      // Redirect to profile page
      router.push('/dashboard');
    } catch (error) {
      console.error("GitHub login error:", error);
      setError('Error signing in with GitHub. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Don't render the login form if the user is already logged in
  if (loading) {
  return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <div className="flex flex-1 items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar /> 
      
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-bold tracking-tight text-white">
              Sign in to your account
              </h2>
            <p className="mt-2 text-sm text-gray-400">
              Choose your preferred login method
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          <div className="flex justify-center mb-4">
            <Turnstile
              ref={turnstileRef}
              sitekey={process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY || "YOUR_CLOUDFLARE_TURNSTILE_SITE_KEY"}
              onVerify={onTurnstileVerify}
              onExpire={onTurnstileExpire}
              theme="dark"
            />
          </div>

          <div className="space-y-6">
            <Button
              onClick={handleGoogleLogin}
              disabled={isLoading || !turnstileVerified}
              className="w-full py-6 bg-transparent border border-gray-700 hover:bg-gray-800 text-white flex items-center justify-center"
            >
              <FaGoogle className="mr-3 h-5 w-5" />
              <span className="text-lg">Continue with Google</span>
            </Button>
            
                  <Button
              onClick={handleGithubLogin}
              disabled={isLoading || !turnstileVerified}
              className="w-full py-6 bg-transparent border border-gray-700 hover:bg-gray-800 text-white flex items-center justify-center"
            >
              <FaGithub className="mr-3 h-5 w-5" />
              <span className="text-lg">Continue with GitHub</span>
                  </Button>
              </div>
          
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-400">
              Don't have an account?{' '}
              <Link href="/register" className="font-medium text-purple-600 hover:text-purple-500">
                Register now
              </Link>
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}