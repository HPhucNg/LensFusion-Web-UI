"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';
import { auth } from '@/firebase/FirebaseConfig';
import { signInWithPopup, GoogleAuthProvider, GithubAuthProvider } from "firebase/auth";
import { FaGoogle, FaGithub } from 'react-icons/fa';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = React.useState('');

  const handleGoogleSignUp = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        router.push('/profile');
      }
    } catch (error) {
      setError(error.message);
    }
  };

  const handleGithubSignUp = async () => {
    try {
      const provider = new GithubAuthProvider();
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        router.push('/profile');
      }
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <>
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8 bg-[#0D161F] p-8 rounded-2xl shadow-2xl border border-gray-800">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-2">Create an Account</h2>
            <p className="text-gray-400">Join us today and get started</p>
          </div>

          <div className="space-y-4">
            <Button
              variant="outline"
              onClick={handleGoogleSignUp}
              className="w-full py-6 bg-white hover:bg-gray-100 text-black transition-all duration-300 flex items-center justify-center space-x-3"
            >
              <FaGoogle className="w-5 h-5" />
              <span className="text-lg">Sign up with Google</span>
            </Button>
            
            <Button
              variant="outline"
              onClick={handleGithubSignUp}
              className="w-full py-6 bg-[#24292e] hover:bg-[#1b1f23] text-white transition-all duration-300 flex items-center justify-center space-x-3"
            >
              <FaGithub className="w-5 h-5" />
              <span className="text-lg">Sign up with GitHub</span>
            </Button>

            {error && (
              <p className="text-red-500 text-sm mt-2">{error}</p>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
