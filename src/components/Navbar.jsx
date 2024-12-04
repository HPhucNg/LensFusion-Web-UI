"use client";

import { useAuth0 } from "@auth0/auth0-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Menu } from "lucide-react";
import Branding from "./Branding";

function Navbar() {
  const { loginWithRedirect, logout, isAuthenticated } = useAuth0();
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
          {isAuthenticated && (
            <Link href="/profile" className="text-slate-400 hover:text-white transition-colors">
              Profile
            </Link>
          )}
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
          {isAuthenticated ? (
            <Button
              variant="outline"
              onClick={() => logout({ returnTo: window.location.origin })}
              className="hidden bg-red-500 text-white md:inline-flex border-red-700 hover:bg-red-600 transition-colors"
            >
              Log Out
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => loginWithRedirect()}
              className="hidden bg-white text-black md:inline-flex border-slate-700 hover:bg-slate-400 transition-colors"
            >
              Sign In
            </Button>
          )}
        </div>
      </nav>
    </header>
  );
}

export default Navbar;
