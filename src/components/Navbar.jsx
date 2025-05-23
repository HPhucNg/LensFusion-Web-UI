"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Menu, UserCircle2, CircleUser, X } from "lucide-react";
import { useRouter } from 'next/navigation';
import Branding from "./Branding";
import { auth } from '@/firebase/FirebaseConfig';
import { signOut } from "firebase/auth";
import { clearAuthCookie } from '@/utils/authCookies';
import { useSubscription } from '@/context/subscriptionContext';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { status: subscriptionStatus} = useSubscription();

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

  const hasActiveSubscription = subscriptionStatus === 'active' || subscriptionStatus === 'canceling';

  const authenticatedLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/community', label: 'Community' },
    { href: '/contact', label: 'Contact' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/about', label: 'About' }
  ];
  
  const unauthenticatedLinks = [
    { href: '/community', label: 'Community' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/contact', label: 'Contact' },
    { href: '/about', label: 'About' }
  ];


  const authenticated = authenticatedLinks.filter(link => 
    !(link.href === '/pricing' && hasActiveSubscription)
  );
  
  const unauthenticated = unauthenticatedLinks;
  const currentLinks = user ? authenticated : unauthenticated;

  return (
    <header className="relative top-0 w-full z-50 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 border-slate-900 rounded-full border shadow-xl border-[var(--border-gray)]">
        <div className="flex items-center ml-5">
          <Branding />
        </div>
        
        {/* Desktop Navigation Links */}
        <div className="hidden md:flex space-x-4">
          {currentLinks.map((link) => (
            <Link 
              key={link.href}
              href={link.href} 
              className="text-slate-400 hover:text-white transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right side buttons/menu */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-slate-400 hover:text-white transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  {user.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt={user.displayName || 'User profile'} 
                      className="h-8 w-8 rounded-full"
                    />
                  ) : (
                    <CircleUser className="h-8 w-8 text-slate-400 hover:text-white" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-[var(--card-background)] border-[var(--border-gray)]">
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
              className="hidden bg-white text-black md:inline-flex border-slate-700 hover:bg-slate-400 transition-colors"
            >
              Sign In
            </Button>
          )}
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-20 left-0 right-0 bg-[#0D161F] border border-gray-800 rounded-lg shadow-xl p-4">
          {currentLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block py-2 px-4 text-slate-400 hover:text-white transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          {!user && (
            <Button
              variant="outline"
              onClick={() => router.push('/login')}
              className="w-full mt-4 bg-white text-black border-slate-700 hover:bg-slate-400 transition-colors"
            >
              Sign In
            </Button>
          )}
        </div>
      )}
    </header>
  );
}