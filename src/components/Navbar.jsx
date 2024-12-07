"use client";

import React, { useState, useEffect } from 'react';
import { useAuth0 } from "@auth0/auth0-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Menu, UserCircle2 } from "lucide-react";
import { useRouter } from 'next/navigation';
import Branding from "./Branding";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function Navbar() {
  const router = useRouter();
  const { loginWithRedirect, logout, isAuthenticated, user } = useAuth0();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Handle successful authentication
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/profile');
    }
  }, [isAuthenticated, router]);

  const handleLogin = () => {
    loginWithRedirect({
      redirectUri: "http://localhost:3000/profile"
    });
  };

  const handleLogout = () => {
    logout({ returnTo: window.location.origin });
  };

  return (
    <header className="top-0 w-full z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5 px-4">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 border-slate-900 rounded-full border shadow-xl border-gray-800">
        <div className="flex items-center ml-5">
          <Branding />
        </div>
        
        {/* Navigation Links */}
        <div className="hidden md:flex space-x-4">
          {isAuthenticated ? (
            // Authenticated Navigation
            <>
              <Link href="/dashboard" className="text-slate-400 hover:text-white transition-colors">
                Dashboard
              </Link>
              <Link href="/resources" className="text-slate-400 hover:text-white transition-colors">
                Resources
              </Link>
              <Link href="/upgrade" className="text-slate-400 hover:text-white transition-colors">
                Upgrade
              </Link>
            </>
          ) : (
            // Unauthenticated Navigation
            <>
              <Link href="/solutions" className="text-slate-400 hover:text-white transition-colors">
                Solutions
              </Link>
              <Link href="/resources" className="text-slate-400 hover:text-white transition-colors">
                Resources
              </Link>
              <Link href="/community" className="text-slate-400 hover:text-white transition-colors">
                Community
              </Link>
              <Link href="/pricing" className="text-slate-400 hover:text-white transition-colors">
                Pricing
              </Link>
              <Link href="/contact" className="text-slate-400 hover:text-white transition-colors">
                Contact
              </Link>
            </>
          )}
        </div>

        {/* Right side buttons/menu */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-slate-400 hover:text-slate-900 transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <Menu className="h-6 w-6" />
          </Button>

          {isAuthenticated ? (
            // User Profile Dropdown
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <UserCircle2 className="h-6 w-6 text-slate-400 hover:text-white" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-[#0D161F] border-gray-800">
                <DropdownMenuItem onSelect={() => router.push('/profile')} className="text-slate-400 hover:text-white">
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={handleLogout} className="text-slate-400 hover:text-white">
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            // Login/Register Buttons
            <>
              <Button
                variant="outline"
                onClick={handleLogin}
                className="hidden bg-white text-black md:inline-flex border-slate-700 hover:bg-slate-400 transition-colors"
              >
                Sign in
              </Button>
              <Button
                variant="outline"
                onClick={() => loginWithRedirect({ screen_hint: 'signup' })}
                className="hidden bg-black-80 text-black md:inline-flex border-slate-700 hover:bg-slate-400 transition-colors pr--5"
              >
                Register
              </Button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}

export default Navbar;
