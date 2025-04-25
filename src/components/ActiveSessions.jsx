import React, { useState, useEffect } from 'react';
import { getSessions, deleteSession, monitorSessions } from '@/lib/sessionManager';
import { Button } from '@/components/ui/button';
import { 
  Laptop, 
  Smartphone, 
  Globe, 
  X, 
  Tablet, 
  Clock, 
  MapPin,
  Shield
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { signOut } from 'firebase/auth';
import { format } from 'date-fns';
import { UAParser } from 'ua-parser-js';
import ReauthPopup from './ReauthPopup';

export default function ActiveSessions({ userId, onClose }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showReauth, setShowReauth] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const { currentUser, auth } = useAuth();

  useEffect(() => {
    let unsubscribe;

    const setupSessionMonitoring = async () => {
      try {
        // First fetch the current sessions
        const userSessions = await getSessions(userId);
        setSessions(userSessions);

        // Identify current session
        const currentSession = userSessions.find(session => 
          session.deviceInfo.userAgent === navigator.userAgent && 
          session.deviceInfo.platform === navigator.platform
        );

        if (currentSession) {
          setCurrentSessionId(currentSession.id);
        }

        // Only set up real-time monitoring if we have a current session
        if (currentSession) {
          unsubscribe = monitorSessions(userId, () => {
            console.log('Session removed, showing reauth popup');
            setShowReauth(true);
          });
        }
      } catch (error) {
        console.error('Error setting up session monitoring:', error);
        setError('Failed to load sessions');
      } finally {
        setLoading(false);
      }
    };

    setupSessionMonitoring();

    // Clean up listener
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [userId]);

  const fetchSessions = async () => {
    try {
      const userSessions = await getSessions(userId);
      setSessions(userSessions);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      setError('Failed to load sessions');
    }
  };

  const handleRemoveDevice = async (sessionId) => {
    try {
      if (!window.confirm('Are you sure you want to remove this device? This will sign out the user on that device.')) {
        return;
      }

      console.log('Attempting to remove device:', sessionId);
      
      // Get the session details from local state
      const sessionToRemove = sessions.find(session => session.id === sessionId);
      if (!sessionToRemove) {
        setError('Session not found');
        return;
      }

      // Remove the session
      await deleteSession(sessionId);
      
      // Update local state
      setSessions(sessions.filter(session => session.id !== sessionId));
      
      // Check if this was the current session
      const isCurrentSession = 
        sessionToRemove.deviceInfo.userAgent === navigator.userAgent && 
        sessionToRemove.deviceInfo.platform === navigator.platform;

      if (isCurrentSession) {
        console.log('Current session removed, showing reauth popup');
        setShowReauth(true);
      } else {
        // For other devices, we need to force a sign-out
        // This will be handled by the real-time listener on the other device
        console.log('Session terminated for another device');
      }

      // Show success message
      setError('Device removed successfully');
      setTimeout(() => setError(''), 3000);
    } catch (error) {
      console.error('Error removing device:', error);
      setError('Failed to remove device: ' + error.message);
    }
  };

  const handleSignOutAll = async () => {
    try {
      console.log('Attempting to sign out of all devices');
      
      // Show confirmation for signing out of all devices
      if (window.confirm('Are you sure you want to sign out of all devices? This will log you out everywhere.')) {
        try {
          // List of all possible auth-related cookies
          const authCookies = [
            'auth_token',
            'session_id',
            'user_id',
            'authToken',
            'firebase:authUser',
            'firebase:host:lensfusion-fc879.firebaseapp.com',
            'firebase:host:lensfusion-fc879.firebaseapp.com:session',
            'firebase:host:lensfusion-fc879.firebaseapp.com:session:last',
            'firebase:host:lensfusion-fc879.firebaseapp.com:session:last:last',
            'firebase:host:lensfusion-fc879.firebaseapp.com:session:last:last:last'
          ];

          // Clear all auth-related cookies
          authCookies.forEach(cookieName => {
            try {
              deleteCookie(cookieName);
              // Also try to delete with domain
              deleteCookie(cookieName, { domain: window.location.hostname });
              // And with path
              deleteCookie(cookieName, { path: '/' });
            } catch (error) {
              console.warn(`Failed to delete cookie ${cookieName}:`, error);
            }
          });
          
          // Clear local storage
          localStorage.clear();
          sessionStorage.clear();
          
          // Sign out from Firebase
          await signOut(auth);
          
          // Add a small delay to ensure cleanup is complete
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Get the base URL
          const baseUrl = window.location.origin;
          
          // Force a complete page reload with cache clearing
          window.location.replace(`${baseUrl}/login?clear=1&t=${Date.now()}`);
        } catch (error) {
          console.error('Error during cleanup:', error);
          // Even if cleanup fails, still redirect to login
          const baseUrl = window.location.origin;
          window.location.replace(`${baseUrl}/login?clear=1&t=${Date.now()}`);
        }
      }
    } catch (error) {
      console.error('Error signing out of all devices:', error);
      setError('Failed to sign out of all devices: ' + error.message);
    }
  };

  const getDeviceType = (userAgent) => {
    const parser = new UAParser(userAgent);
    const device = parser.getDevice();
    const browser = parser.getBrowser();
    const os = parser.getOS();

    if (device.type === 'mobile') {
      return `${os.name} ${device.model || 'Mobile'}`;
    } else if (device.type === 'tablet') {
      return `${os.name} ${device.model || 'Tablet'}`;
    } else {
      return `${browser.name} on ${os.name}`;
    }
  };

  const formatDate = (date) => {
    try {
      const d = new Date(date);
      return format(d, 'MM/dd/yy');
    } catch (error) {
      return 'Unknown date';
    }
  };

  const formatFullDate = (date) => {
    try {
      const d = new Date(date);
      return format(d, 'MMMM do, yyyy');
    } catch (error) {
      return 'Unknown date';
    }
  };

  const getDeviceIcon = (userAgent) => {
    if (userAgent.toLowerCase().includes('mobile')) {
      return <Smartphone className="h-5 w-5" />;
    } else if (userAgent.toLowerCase().includes('tablet')) {
      return <Tablet className="h-5 w-5" />;
    } else {
      return <Laptop className="h-5 w-5" />;
    }
  };

  const formatDuration = (date) => {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-[#0D161F] border border-gray-800 rounded-lg w-full max-w-2xl m-4">
          <div className="border-b border-gray-800 p-4 flex justify-between items-center">
            <h2 className="text-xl font-bold text-white">Manage Your Devices</h2>
            <Button
              variant="ghost"
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="p-4">
            {/* Devices Table */}
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-sm text-gray-400 border-b border-gray-800 pb-2">
                <div>Devices</div>
                <div>Date Added</div>
                <div className="text-right">Actions</div>
              </div>

              {sessions.map((session) => {
                const isCurrentSession = 
                  session.deviceInfo.userAgent === navigator.userAgent && 
                  session.deviceInfo.platform === navigator.platform;

                return (
                  <div
                    key={session.id}
                    className="grid grid-cols-3 gap-4 items-center py-3 border-b border-gray-800"
                  >
                    <div className="flex items-center gap-2">
                      {getDeviceIcon(session.deviceInfo.userAgent)}
                      <div>
                        <div className="font-medium text-white">
                          {getDeviceType(session.deviceInfo.userAgent)}
                        </div>
                        {isCurrentSession && (
                          <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                            Current Device
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-white">{formatDate(session.createdAt)}</div>
                      <div className="text-xs text-gray-400">{formatFullDate(session.createdAt)}</div>
                    </div>
                    <div className="text-right">
                      {!isCurrentSession && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveDevice(session.id)}
                          className="text-red-500 hover:text-red-400"
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}

              {sessions.length === 0 && (
                <p className="text-center text-gray-400 py-4">No devices found</p>
              )}
            </div>

            {error && (
              <div className="mt-4 p-2 bg-red-500/10 border border-red-500 rounded text-red-500">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>

      {showReauth && <ReauthPopup onClose={() => setShowReauth(false)} />}
    </>
  );
} 