"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CircleUser, Gem } from "lucide-react";
import { useRouter } from 'next/navigation';
import { auth } from '@/firebase/FirebaseConfig';
import { signOut } from "firebase/auth";
import { clearAuthCookie } from '@/utils/authCookies';
import { useSubscription } from '@/context/subscriptionContext';
import BackButton from '@/components/BackButton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function WorkspaceNavbar() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const { tokens } = useSubscription();
  const [isAnimating, setIsAnimating] = useState(false);
  const prevTokens = useRef(tokens);

  // Check if tokens have decreased
  useEffect(() => {
    if (prevTokens.current !== undefined && tokens < prevTokens.current) {
      // Tokens decreased, trigger animation
      setIsAnimating(true);
      
      // Reset animation after it completes
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 600); // Animation duration
      
      return () => clearTimeout(timer);
    }
    
    // Update previous tokens reference
    prevTokens.current = tokens;
  }, [tokens]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });
  
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      clearAuthCookie();
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <header className="w-full z-50 mx-auto py-2">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between w-full h-14">
          {/* Left - Back button - Wrapped in a div with center alignment */}
          <div className="flex items-center h-full">
            <BackButton />
          </div>
          
          {/* Right - Tokens and Avatar */}
          <div className="flex items-center space-x-5 h-full">
            {/* Token Display - with animation */}
            <div className={`hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-md bg-gray-800/50 text-white shadow-sm transition-all hover:bg-gray-700/50 ${
              isAnimating ? 'animate-credit-decrease' : ''
            }`}>
              <Gem className={`h-5 w-5 text-purple-400 ${isAnimating ? 'animate-pulse' : ''}`} />
              <span className="font-medium text-base">{tokens}</span>
            </div>

            {/* User Avatar - Bigger */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full p-0 h-10 w-10 overflow-hidden">
                    {user.photoURL ? (
                      <div className="w-full h-full rounded-full overflow-hidden">
                        <img 
                          src={user.photoURL} 
                          alt={user.displayName || 'User profile'} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <CircleUser className="h-10 w-10 text-slate-400 hover:text-white" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-[#0D161F] border-gray-800">
                  <DropdownMenuItem onClick={() => router.push('/dashboard')} className="text-slate-400 hover:text-white cursor-pointer">
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/dashboard/profile')} className="text-slate-400 hover:text-white cursor-pointer">
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="text-slate-400 hover:text-white cursor-pointer">
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="outline"
                onClick={() => router.push('/login')}
                className="bg-white text-black border-slate-700 hover:bg-slate-400 transition-colors"
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Add the animation keyframes */}
      <style jsx global>{`
        @keyframes creditDecrease {
          0% {
            background-color: rgba(239, 68, 68, 0.5); /* Red background */
            transform: scale(1.05);
            box-shadow: 0 0 10px rgba(239, 68, 68, 0.7);
          }
          100% {
            background-color: rgba(31, 41, 55, 0.5); /* Back to original */
            transform: scale(1);
            box-shadow: none;
          }
        }
        
        .animate-credit-decrease {
          animation: creditDecrease 0.6s ease-out;
        }
      `}</style>
    </header>
  );
} 