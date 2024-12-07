"use client"

import React, { useState } from "react";
import { Button } from "@/components/ui/button"

import Link from "next/link";
import { Menu } from "lucide-react";
import Branding from "./Branding";

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  return (
      <header className=" top-0 w-full z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5 px-4">
        <nav className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 border-slate-900 rounded-full border shadow-xl border-gray-800">
          <div className="flex items-center ml-5">
            <Branding/>
          </div>
          <div className="hidden md:flex space-x-4">
            <Link
              href="/solutions"
              className="text-slate-400 hover:text-white transition-colors"
            >
              Solutions
            </Link>
            <Link
              href="/resources"
              className="text-slate-400 hover:text-white transition-colors"
            >
              Resources
            </Link>
            <Link
              href="/community"
              className="text-slate-400 hover:text-white transition-colors"
            >
              Community
            </Link>
            <Link
              href="/pricing"
              className="text-slate-400 hover:text-white transition-colors"
            >
            Pricing
            </Link>
            <Link
              href="/contact"
              className="text-slate-400 hover:text-white transition-colors"
            >
            Contact
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-slate-400 hover:text-slate-900 transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Menu className="h-6 w-6" />
            </Button>
            <Link href="#">
              <Button
                variant="outline"
                className="hidden bg-white text-black md:inline-flex border-slate-700 hover:bg-slate-400 transition-colors"
              >
                Sign in
              </Button>
            </Link>
            <Link  href="#">
                <Button
                variant="outline"
                className="hidden bg-black-80 text-black md:inline-flex border-slate-700 hover:bg-slate-400 transition-colors pr--5"
                >
                Register
              </Button>
            </Link>
          </div>
        </nav>
    </header>
  );
}

export default Navbar;
