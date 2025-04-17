import React, { useState, useEffect, useMemo } from 'react';
import { getSessions, deleteSession } from '@/lib/sessionManager';
import { Button } from '@/components/ui/button';
import { 
  Laptop, 
  Smartphone, 
  Globe, 
  X, 
  Tablet, 
  AlertTriangle, 
  Search, 
  Clock, 
  MapPin,
  Shield,
  SortAsc,
  SortDesc,
  Filter
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ActiveSessions({ userId, onClose }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [sessionToTerminate, setSessionToTerminate] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('lastActive');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterBy, setFilterBy] = useState('all');
  const { currentUser } = useAuth();

  useEffect(() => {
    fetchSessions();
    // Refresh sessions every 30 seconds
    const interval = setInterval(fetchSessions, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  const fetchSessions = async () => {
    try {
      const userSessions = await getSessions(userId);
      setSessions(userSessions);
    } catch (error) {
      setError('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleTerminateSession = async (sessionId) => {
    try {
      console.log('Attempting to terminate session:', sessionId);
      await deleteSession(sessionId);
      
      // Check if this was the current session
      const wasCurrentSession = sessions.find(s => 
        s.id === sessionId && 
        s.deviceInfo.userAgent === navigator.userAgent && 
        s.deviceInfo.platform === navigator.platform
      );

      if (!wasCurrentSession) {
        // Only update the UI if it wasn't the current session
        setSessions(sessions.filter(session => session.id !== sessionId));
        setShowConfirm(false);
        setSessionToTerminate(null);
      }
      // If it was the current session, the deleteSession function will handle the redirect
    } catch (error) {
      console.error('Error terminating session:', error);
      setError('Failed to terminate session: ' + error.message);
      setShowConfirm(false);
      setSessionToTerminate(null);
    }
  };

  const handleTerminateAll = async () => {
    try {
      console.log('Attempting to terminate all sessions');
      
      // Show confirmation for terminating all sessions
      if (window.confirm('Are you sure you want to terminate all sessions? This will log you out of all devices.')) {
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
          
          // Terminate all sessions
          for (const session of sessions) {
            try {
              console.log('Terminating session:', session.id);
              await deleteSession(session.id);
            } catch (error) {
              console.error('Error terminating session:', session.id, error);
              // Continue with other sessions even if one fails
            }
          }
          
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
      console.error('Error terminating all sessions:', error);
      setError('Failed to terminate sessions: ' + error.message);
    }
  };

  const confirmTermination = (session) => {
    setSessionToTerminate(session);
    setShowConfirm(true);
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

  const filteredAndSortedSessions = useMemo(() => {
    let result = [...sessions];

    // Filter by search query
    if (searchQuery) {
      result = result.filter(session => 
        session.deviceInfo.platform.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session.deviceInfo.userAgent.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by device type
    if (filterBy !== 'all') {
      result = result.filter(session => {
        const userAgent = session.deviceInfo.userAgent.toLowerCase();
        if (filterBy === 'mobile') return userAgent.includes('mobile');
        if (filterBy === 'tablet') return userAgent.includes('tablet');
        if (filterBy === 'desktop') return !userAgent.includes('mobile') && !userAgent.includes('tablet');
        return true;
      });
    }

    // Sort sessions
    result.sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      const multiplier = sortOrder === 'asc' ? 1 : -1;

      if (sortBy === 'lastActive' || sortBy === 'createdAt') {
        // Handle both Timestamp and Date objects
        const aTime = aValue?.toDate ? aValue.toDate().getTime() : new Date(aValue).getTime();
        const bTime = bValue?.toDate ? bValue.toDate().getTime() : new Date(bValue).getTime();
        return (aTime - bTime) * multiplier;
      }
      return String(aValue).localeCompare(String(bValue)) * multiplier;
    });

    return result;
  }, [sessions, searchQuery, sortBy, sortOrder, filterBy]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#0D161F] border border-gray-800 rounded-lg w-full max-w-2xl m-4">
        <div className="border-b border-gray-800 p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Active Sessions</h2>
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-4">
          {/* Controls */}
          <div className="flex flex-col gap-4 mb-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search sessions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-800/50 border-gray-700"
                />
              </div>
              <Select value={filterBy} onValueChange={setFilterBy}>
                <SelectTrigger className="w-[180px] bg-gray-800/50 border-gray-700">
                  <SelectValue placeholder="Filter by device" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Devices</SelectItem>
                  <SelectItem value="desktop">Desktop</SelectItem>
                  <SelectItem value="mobile">Mobile</SelectItem>
                  <SelectItem value="tablet">Tablet</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="bg-gray-800/50 border-gray-700"
              >
                {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
              </Button>
            </div>
            {sessions.length > 1 && (
              <Button
                variant="destructive"
                onClick={handleTerminateAll}
                className="w-full bg-red-600 hover:bg-red-700 text-white"
              >
                Terminate All Other Sessions
              </Button>
            )}
          </div>

          {error && (
            <div className="mb-4 p-2 bg-red-500/10 border border-red-500 rounded text-red-500">
              {error}
            </div>
          )}

          <div className="space-y-4 max-h-[50vh] overflow-y-auto">
            {filteredAndSortedSessions.map((session) => {
              const isCurrentSession = 
                session.deviceInfo.userAgent === navigator.userAgent && 
                session.deviceInfo.platform === navigator.platform;

              return (
                <div
                  key={session.id}
                  className={`flex items-center justify-between p-4 bg-gray-800/50 rounded-lg ${
                    isCurrentSession ? 'border-l-4 border-blue-500' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {getDeviceIcon(session.deviceInfo.userAgent)}
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-white">
                          {session.deviceInfo.platform}
                        </h4>
                        {isCurrentSession && (
                          <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                            Current Session
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Last active: {formatDuration(session.lastActive)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {session.deviceInfo.userAgent}
                      </p>
                    </div>
                  </div>
                  {!isCurrentSession && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => confirmTermination(session)}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      Terminate
                    </Button>
                  )}
                </div>
              );
            })}

            {filteredAndSortedSessions.length === 0 && (
              <p className="text-center text-gray-400">No active sessions found</p>
            )}
          </div>
        </div>

        {/* Confirmation Dialog */}
        {showConfirm && sessionToTerminate && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[#0D161F] border border-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="h-6 w-6 text-yellow-500" />
                <h3 className="text-lg font-semibold text-white">Confirm Termination</h3>
              </div>
              <p className="text-gray-400 mb-4">
                Are you sure you want to terminate this session? This will log out the device:
              </p>
              <div className="bg-gray-800/50 p-3 rounded mb-4">
                <p className="text-sm text-white">{sessionToTerminate.deviceInfo.platform}</p>
                <p className="text-xs text-gray-400">{sessionToTerminate.deviceInfo.userAgent}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Last active: {formatDuration(sessionToTerminate.lastActive)}
                </p>
              </div>
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowConfirm(false);
                    setSessionToTerminate(null);
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleTerminateSession(sessionToTerminate.id)}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Terminate Session
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 