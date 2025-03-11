import React, { useState, useEffect } from 'react';
import { getSessions, deleteSession } from '@/lib/sessionManager';
import { Button } from '@/components/ui/button';
import { Laptop, Smartphone, Globe, X, Tablet } from 'lucide-react';

export default function ActiveSessions({ userId, onClose }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSessions();
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
      await deleteSession(sessionId);
      setSessions(sessions.filter(session => session.id !== sessionId));
    } catch (error) {
      setError('Failed to terminate session');
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

        <div className="p-4 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="mb-4 p-2 bg-red-500/10 border border-red-500 rounded text-red-500">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {getDeviceIcon(session.deviceInfo.userAgent)}
                  <div>
                    <h4 className="font-medium text-white">
                      {session.deviceInfo.platform}
                    </h4>
                    <p className="text-sm text-gray-400">
                      Last active: {new Date(session.lastActive).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {session.deviceInfo.userAgent}
                    </p>
                  </div>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleTerminateSession(session.id)}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Terminate
                </Button>
              </div>
            ))}

            {sessions.length === 0 && (
              <p className="text-center text-gray-400">No active sessions found</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 