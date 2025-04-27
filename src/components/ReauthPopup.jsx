import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Shield, AlertTriangle } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '@/firebase/FirebaseConfig';
import { deleteSession } from '@/lib/sessionManager';

export default function ReauthPopup({ onClose }) {
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Automatically sign out when the popup appears
    const handleSignOut = async () => {
      try {
        setIsSigningOut(true);
        setError(null);

        // Get current session ID from localStorage
        const currentSessionId = localStorage.getItem('current_session_id');
        
        if (currentSessionId) {
          try {
            // Delete the current session
            await deleteSession(currentSessionId);
          } catch (error) {
            console.warn('Error deleting session:', error);
          }
        }

        // Clear all auth-related cookies
        document.cookie.split(';').forEach(cookie => {
          const [name] = cookie.split('=');
          document.cookie = `${name.trim()}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        });
        
        // Clear local storage
        localStorage.clear();
        sessionStorage.clear();
        
        // Sign out from Firebase
        await signOut(auth);
        
        // Force a page reload to clear any cached state
        window.location.href = '/login?reauth=1&redirect=' + encodeURIComponent(window.location.pathname);
      } catch (error) {
        console.error('Error during sign out:', error);
        setError('Failed to sign out properly. Please try again.');
        setIsSigningOut(false);
      }
    };

    handleSignOut();
  }, []);

  const handleReauth = () => {
    // Clear any remaining auth state
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_token');
    
    // Redirect to login page with a flag to show reauth message
    window.location.href = '/login?reauth=1&redirect=' + encodeURIComponent(window.location.pathname);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
      <div className="bg-[#0D161F] border border-gray-800 rounded-lg w-full max-w-md m-4 p-6">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="bg-red-500/20 p-3 rounded-full">
            <AlertTriangle className="h-8 w-8 text-red-400" />
          </div>
          
          <h2 className="text-xl font-bold text-white">Session Terminated</h2>
          
          <div className="space-y-2">
            <p className="text-gray-400">
              Your session has been terminated from another device. For security reasons, you need to sign in again.
            </p>
            <p className="text-sm text-gray-500">
              This helps protect your account from unauthorized access.
            </p>
          </div>

          {error && (
            <div className="text-red-500 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-4 mt-4 w-full">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 text-gray-400 hover:text-white"
              disabled={isSigningOut}
            >
              Close
            </Button>
            <Button
              onClick={handleReauth}
              className="flex-1 bg-red-500 hover:bg-red-600"
              disabled={isSigningOut}
            >
              {isSigningOut ? 'Signing Out...' : 'Sign In Again'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 