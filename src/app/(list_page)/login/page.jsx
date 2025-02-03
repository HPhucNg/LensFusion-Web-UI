"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';
import { auth } from '@/firebase/FirebaseConfig';
import { signInWithPopup, GoogleAuthProvider, GithubAuthProvider } from "firebase/auth";
import { FaGoogle, FaGithub } from 'react-icons/fa'; // Install react-icons if not already installed
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function LoginPage() {
  const router = useRouter();

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error("Error signing in with Google:", error);
    }
  };

  const handleGithubLogin = async () => {
    try {
      const provider = new GithubAuthProvider();
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error("Error signing in with GitHub:", error);
    }
  };

  return (
    <>
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#0D161F] p-8 rounded-2xl shadow-2xl border border-gray-800">
          <h2 className="text-3xl font-bold text-center mb-8">Welcome Back</h2>
          <div className="space-y-4">
            <Button
              variant="outline"
              onClick={handleGoogleLogin}
              className="w-full py-6 bg-white hover:bg-gray-100 text-black transition-all duration-300 flex items-center justify-center space-x-3"
            >
              <FaGoogle className="w-5 h-5" />
              <span className="text-lg">Continue with Google</span>
            </Button>
            
            <Button
              variant="outline"
              onClick={handleGithubLogin}
              className="w-full py-6 bg-[#24292e] hover:bg-[#1b1f23] text-white transition-all duration-300 flex items-center justify-center space-x-3"
            >
              <FaGithub className="w-5 h-5" />
              <span className="text-lg">Continue with GitHub</span>
            </Button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-[#0D161F] text-gray-400">Or</span>
              </div>
            </div>

            <p className="text-center text-gray-400">
              Don't have an account?{" "}
              <button onClick={() => router.push('/register')} className="text-blue-500 hover:text-blue-400">
                Sign up
              </button>
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}