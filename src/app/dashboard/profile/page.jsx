"use client";

import React, { useState, useEffect } from 'react';
import Image from "next/image";
import { useRouter } from 'next/navigation';
import { Settings, User2, Share2, Moon, Sun, Check, Lock, Bell, Shield, X, Camera, Smartphone, AlertTriangle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { 
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import GalleryModal from '@/components/GalleryModal';
import Modal from '@/components/Modal';
import ActiveSessions from '@/components/ActiveSessions';
import { useSubscription } from '@/context/subscriptionContext';
import { auth, db, storage } from '@/firebase/FirebaseConfig';
import { 
  doc, 
  setDoc, 
  getDoc, 
  deleteDoc, 
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { 
  deleteUser, 
  updateProfile
} from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { collection, getDocs, query, where } from 'firebase/firestore';

// Account Management Dialog Component
const AccountManagementDialog = ({ isOpen, onClose, user }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showActiveSessions, setShowActiveSessions] = useState(false);
  const router = useRouter();

  // Form States
  const [profileData, setProfileData] = useState({
    displayName: user?.displayName || '',
    photoURL: user?.photoURL || '',
    firstName: '',
    lastName: '',
    location: '',
    phoneNumber: '',
    timezone: 'UTC',
  });

  const [securitySettings, setSecuritySettings] = useState({});

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    productUpdates: true,
    securityAlerts: true,
    marketingEmails: false,
  });

  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'public', // public, friends, private
    showOnlineStatus: true,
    shareUsageData: false,
  });

  const [interfaceSettings, setInterfaceSettings] = useState({
    colorScheme: 'system', // system, dark, light
    reducedAnimations: false,
    highContrastMode: false,
    fontSize: 'medium', // small, medium, large
  });

  // Fetch user settings if they exist
  useEffect(() => {
    const fetchUserSettings = async () => {
      if (!user) return;
      
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          // Update profile data
          setProfileData(prev => ({
            ...prev,
            displayName: user.displayName || '',
            photoURL: user.photoURL || '',
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            bio: userData.bio || '',
            location: userData.location || '',
            phoneNumber: userData.phoneNumber || '',
            timezone: userData.timezone || 'UTC',
          }));
          
          // Update security settings
          if (userData.securitySettings) {
            setSecuritySettings(userData.securitySettings);
          }
          
          // Update notification settings
          if (userData.notificationSettings) {
            setNotificationSettings(userData.notificationSettings);
          }
          
          // Update privacy settings
          if (userData.privacySettings) {
            setPrivacySettings(userData.privacySettings);
          }
          
          // Update interface settings
          if (userData.interfaceSettings) {
            setInterfaceSettings(userData.interfaceSettings);
            
            // Apply the theme if it's defined
            if (userData.interfaceSettings.colorScheme && userData.interfaceSettings.colorScheme !== 'system') {
              setTheme(userData.interfaceSettings.colorScheme);
              document.documentElement.classList.remove("dark", "light");
              document.documentElement.classList.add(userData.interfaceSettings.colorScheme);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching user settings:', error);
      }
    };
    
    fetchUserSettings();
  }, [user]);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
  
    setIsLoading(true);
    setError('');
  
    try {
      // Create a unique file name using user ID and timestamp
      const fileExtension = file.name.split('.').pop();
      const fileName = `${user.uid}_${Date.now()}.${fileExtension}`;
      
      // Create a reference to the file in Firebase Storage
      const fileRef = ref(storage, `profile-pictures/${user.uid}/${fileName}`);
  
      // Delete old profile picture if it exists
      if (profileData.photoURL) {
        try {
          const oldFileRef = ref(storage, profileData.photoURL);
          await deleteObject(oldFileRef);
        } catch (error) {
          // Ignore error if old file doesn't exist
          console.log('No old file to delete');
        }
      }
  
      // Upload the new file
      await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(fileRef);
  
      // Update profile
      await updateProfile(auth.currentUser, {
        photoURL: downloadURL
      });
  
      // Store only the storage path in Firestore
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        photoURL: downloadURL,
        profilePicturePath: `profile-pictures/${user.uid}/${fileName}` // Store the path instead of URL
      });
  
      setProfileData(prev => ({
        ...prev,
        photoURL: downloadURL
      }));
  
      setSuccess('Profile picture updated successfully!');
    } catch (error) {
      setError('Error uploading image: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileUpdate = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      await updateProfile(auth.currentUser, {
        displayName: profileData.displayName,
        photoURL: profileData.photoURL,
      });

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        name: profileData.displayName,
        photoURL: profileData.photoURL,
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        bio: profileData.bio,
        location: profileData.location,
        phoneNumber: profileData.phoneNumber,
        timezone: profileData.timezone,
        updatedAt: serverTimestamp(),
      });

      setSuccess('Profile updated successfully!');
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSecurityUpdate = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        securitySettings,
        updatedAt: serverTimestamp(),
      });

      setSuccess('Security settings updated successfully!');
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationUpdate = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        notificationSettings,
        updatedAt: serverTimestamp(),
      });

      setSuccess('Notification preferences updated successfully!');
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrivacyUpdate = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        privacySettings,
        updatedAt: serverTimestamp(),
      });

      setSuccess('Privacy settings updated successfully!');
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInterfaceUpdate = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        interfaceSettings,
        updatedAt: serverTimestamp(),
      });

      // Apply theme changes immediately
      if (interfaceSettings.colorScheme !== 'system') {
        setTheme(interfaceSettings.colorScheme);
        document.documentElement.classList.remove("dark", "light");
        document.documentElement.classList.add(interfaceSettings.colorScheme);
        localStorage.setItem("theme", interfaceSettings.colorScheme);
      }

      setSuccess('Interface settings updated successfully!');
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsLoading(true);
    setError('');

    try {
      await deleteDoc(doc(db, 'users', user.uid));
      await deleteUser(user);
      onClose();
      router.push('/');
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-[#0D161F] border border-gray-800 rounded-lg w-full max-w-4xl m-4">
        {/* Header */}
        <div className="border-b border-gray-800 p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Account Management</h2>
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex h-[600px]">
          {/* Sidebar */}
          <div className="w-64 border-r border-gray-800">
            <nav className="space-y-1 p-4">
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center space-x-2 px-4 py-2 rounded-lg ${
                  activeTab === 'profile' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800/50'
                }`}
              >
                <User2 className="h-5 w-5" />
                <span>Profile</span>
              </button>
              
              <button
                onClick={() => setActiveTab('security')}
                className={`w-full flex items-center space-x-2 px-4 py-2 rounded-lg ${
                  activeTab === 'security' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800/50'
                }`}
              >
                <Lock className="h-5 w-5" />
                <span>Security</span>
              </button>
              
              <button
                onClick={() => setActiveTab('notifications')}
                className={`w-full flex items-center space-x-2 px-4 py-2 rounded-lg ${
                  activeTab === 'notifications' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800/50'
                }`}
              >
                <Bell className="h-5 w-5" />
                <span>Notifications</span>
              </button>
              
              <button
                onClick={() => setActiveTab('privacy')}
                className={`w-full flex items-center space-x-2 px-4 py-2 rounded-lg ${
                  activeTab === 'privacy' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800/50'
                }`}
              >
                <Shield className="h-5 w-5" />
                <span>Privacy</span>
              </button>
              
              <button
                onClick={() => setActiveTab('interface')}
                className={`w-full flex items-center space-x-2 px-4 py-2 rounded-lg ${
                  activeTab === 'interface' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800/50'
                }`}
              >
                <Settings className="h-5 w-5" />
                <span>Interface</span>
              </button>
              
              <button
                onClick={() => setActiveTab('danger')}
                className={`w-full flex items-center space-x-2 px-4 py-2 rounded-lg ${
                  activeTab === 'danger' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800/50'
                }`}
              >
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <span className="text-red-500">Danger Zone</span>
              </button>
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {error && (
              <div className="mb-4 p-2 bg-red-500/10 border border-red-500 rounded text-red-500">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 p-2 bg-green-500/10 border border-green-500 rounded text-green-500">
                {success}
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-white">Profile Information</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={profileData.displayName}
                      onChange={(e) => setProfileData(prev => ({ ...prev, displayName: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={profileData.firstName}
                      onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={profileData.lastName}
                      onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  
                  
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      value={profileData.location}
                      onChange={(e) => setProfileData(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  
                 
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Timezone
                    </label>
                    <select
                      value={profileData.timezone}
                      onChange={(e) => setProfileData(prev => ({ ...prev, timezone: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="UTC">UTC (Coordinated Universal Time)</option>
                      <option value="EST">EST (Eastern Standard Time)</option>
                      <option value="CST">CST (Central Standard Time)</option>
                      <option value="MST">MST (Mountain Standard Time)</option>
                      <option value="PST">PST (Pacific Standard Time)</option>
                      <option value="GMT">GMT (Greenwich Mean Time)</option>
                    </select>
                  </div>
                  
                
                </div>
                
               

                <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Profile Picture
                </label>
                <div className="flex items-center gap-4">
                  {/* Profile Picture Preview */}
                  <div className="relative w-20 h-20">
                    {profileData.photoURL ? (
                      <img
                        src={profileData.photoURL}
                        alt="Profile Preview"
                        className="w-20 h-20 rounded-full object-cover border-2 border-gray-800"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center border-2 border-gray-700">
                        <User2 className="w-10 h-10 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Upload Control */}
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="photo-upload"
                    />
                    <Button 
                      variant="outline" 
                      className="inline-flex items-center gap-2 px-3 py-1 text-sm text-white bg-transparent border border-gray-700 hover:bg-gray-800"
                      onClick={() => document.getElementById('photo-upload').click()}
                      disabled={isLoading}
                    >
                      <Camera className="h-4 w-4" />
                      <span className="text-white">
                        {isLoading ? 'Uploading...' : 'Upload Profile Picture'}
                      </span>
                    </Button>
                  </div>
                </div>
              </div>
                <Button
                  onClick={handleProfileUpdate}
                  disabled={isLoading}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {isLoading ? 'Saving...' : 'Save Profile'}
                </Button>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-white">Security Settings</h3>
                
                <div className="space-y-4">                  
                  <div className="p-4 bg-gray-800/50 rounded-lg">
                    <div className="mb-3">
                      <h4 className="font-medium text-white">Active Sessions</h4>
                      <p className="text-sm text-gray-400">View and manage your active sessions across different devices</p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setShowActiveSessions(true)}
                      className="bg-transparent border border-gray-700 hover:bg-gray-800 text-white"
                    >
                      View Active Sessions
                    </Button>
                  </div>
                </div>
                
                <Button
                  onClick={handleSecurityUpdate}
                  disabled={isLoading}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {isLoading ? 'Saving...' : 'Save Security Settings'}
                </Button>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-white">Notification Preferences</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-white">Email Notifications</h4>
                      <p className="text-sm text-gray-400">Receive notifications via email</p>
                    </div>
                    <div className="flex items-center">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={notificationSettings.emailNotifications}
                          onChange={() => setNotificationSettings(prev => ({
                            ...prev, 
                            emailNotifications: !prev.emailNotifications
                          }))}
                        />
                        <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:bg-purple-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                      </label>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-white">Push Notifications</h4>
                      <p className="text-sm text-gray-400">Receive push notifications in browser</p>
                    </div>
                    <div className="flex items-center">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={notificationSettings.pushNotifications}
                          onChange={() => setNotificationSettings(prev => ({
                            ...prev, 
                            pushNotifications: !prev.pushNotifications
                          }))}
                        />
                        <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:bg-purple-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                      </label>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-white">Product Updates</h4>
                      <p className="text-sm text-gray-400">Receive updates about new features and improvements</p>
                    </div>
                    <div className="flex items-center">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={notificationSettings.productUpdates}
                          onChange={() => setNotificationSettings(prev => ({
                            ...prev, 
                            productUpdates: !prev.productUpdates
                          }))}
                        />
                        <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:bg-purple-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                      </label>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-white">Security Alerts</h4>
                      <p className="text-sm text-gray-400">Get notified about security-related activity</p>
                    </div>
                    <div className="flex items-center">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={notificationSettings.securityAlerts}
                          onChange={() => setNotificationSettings(prev => ({
                            ...prev, 
                            securityAlerts: !prev.securityAlerts
                          }))}
                        />
                        <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:bg-purple-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                      </label>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-white">Marketing Emails</h4>
                      <p className="text-sm text-gray-400">Receive promotional emails and special offers</p>
                    </div>
                    <div className="flex items-center">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={notificationSettings.marketingEmails}
                          onChange={() => setNotificationSettings(prev => ({
                            ...prev, 
                            marketingEmails: !prev.marketingEmails
                          }))}
                        />
                        <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:bg-purple-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                      </label>
                    </div>
                  </div>
                </div>
                
                <Button
                  onClick={handleNotificationUpdate}
                  disabled={isLoading}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {isLoading ? 'Saving...' : 'Save Notification Preferences'}
                </Button>
              </div>
            )}

            {/* Privacy Tab */}
            {activeTab === 'privacy' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-white">Privacy Settings</h3>
                
                <div className="space-y-4">
                  <div className="p-4 bg-gray-800/50 rounded-lg">
                    <div className="mb-3">
                      <h4 className="font-medium text-white">Profile Visibility</h4>
                      <p className="text-sm text-gray-400">Control who can see your profile</p>
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2">
                        <input 
                          type="radio" 
                          name="profileVisibility" 
                          value="public" 
                          checked={privacySettings.profileVisibility === 'public'}
                          onChange={() => setPrivacySettings(prev => ({
                            ...prev, 
                            profileVisibility: 'public'
                          }))}
                          className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600"
                        />
                        <span className="text-white">Public (Everyone can see your profile)</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input 
                          type="radio" 
                          name="profileVisibility" 
                          value="friends" 
                          checked={privacySettings.profileVisibility === 'friends'}
                          onChange={() => setPrivacySettings(prev => ({
                            ...prev, 
                            profileVisibility: 'friends'
                          }))}
                          className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600"
                        />
                        <span className="text-white">Friends Only (Only friends can see your profile)</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input 
                          type="radio" 
                          name="profileVisibility" 
                          value="private" 
                          checked={privacySettings.profileVisibility === 'private'}
                          onChange={() => setPrivacySettings(prev => ({
                            ...prev, 
                            profileVisibility: 'private'
                          }))}
                          className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600"
                        />
                        <span className="text-white">Private (Your profile is hidden from everyone)</span>
                      </label>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-white">Online Status</h4>
                      <p className="text-sm text-gray-400">Show when you're online to other users</p>
                    </div>
                    <div className="flex items-center">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={privacySettings.showOnlineStatus}
                          onChange={() => setPrivacySettings(prev => ({
                            ...prev, 
                            showOnlineStatus: !prev.showOnlineStatus
                          }))}
                        />
                        <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:bg-purple-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                      </label>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-white">Usage Data Sharing</h4>
                      <p className="text-sm text-gray-400">Share anonymous usage data to help improve our service</p>
                    </div>
                    <div className="flex items-center">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={privacySettings.shareUsageData}
                          onChange={() => setPrivacySettings(prev => ({
                            ...prev, 
                            shareUsageData: !prev.shareUsageData
                          }))}
                        />
                        <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:bg-purple-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                      </label>
                    </div>
                  </div>
                </div>
                
                <Button
                  onClick={handlePrivacyUpdate}
                  disabled={isLoading}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {isLoading ? 'Saving...' : 'Save Privacy Settings'}
                </Button>
              </div>
            )}

            {/* Interface Tab */}
            {activeTab === 'interface' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-white">Interface Settings</h3>
                
                <div className="space-y-4">
                  <div className="p-4 bg-gray-800/50 rounded-lg">
                    <div className="mb-3">
                      <h4 className="font-medium text-white">Color Scheme</h4>
                      <p className="text-sm text-gray-400">Choose your preferred color scheme</p>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        variant={interfaceSettings.colorScheme === 'system' ? "default" : "outline"}
                        onClick={() => setInterfaceSettings(prev => ({...prev, colorScheme: 'system'}))}
                        className={`bg-transparent border border-gray-700 hover:bg-gray-800 text-white ${
                          interfaceSettings.colorScheme === 'system' ? 'bg-purple-600 border-purple-600' : ''
                        }`}
                      >
                        System
                      </Button>
                      <Button
                        variant={interfaceSettings.colorScheme === 'light' ? "default" : "outline"}
                        onClick={() => setInterfaceSettings(prev => ({...prev, colorScheme: 'light'}))}
                        className={`bg-transparent border border-gray-700 hover:bg-gray-800 text-white ${
                          interfaceSettings.colorScheme === 'light' ? 'bg-purple-600 border-purple-600' : ''
                        }`}
                      >
                        Light
                      </Button>
                      <Button
                        variant={interfaceSettings.colorScheme === 'dark' ? "default" : "outline"}
                        onClick={() => setInterfaceSettings(prev => ({...prev, colorScheme: 'dark'}))}
                        className={`bg-transparent border border-gray-700 hover:bg-gray-800 text-white ${
                          interfaceSettings.colorScheme === 'dark' ? 'bg-purple-600 border-purple-600' : ''
                        }`}
                      >
                        Dark
                      </Button>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gray-800/50 rounded-lg">
                    <div className="mb-3">
                      <h4 className="font-medium text-white">Text Size</h4>
                      <p className="text-sm text-gray-400">Adjust the text size for better readability</p>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        variant={interfaceSettings.fontSize === 'small' ? "default" : "outline"}
                        onClick={() => setInterfaceSettings(prev => ({...prev, fontSize: 'small'}))}
                        className={`bg-transparent border border-gray-700 hover:bg-gray-800 text-white ${
                          interfaceSettings.fontSize === 'small' ? 'bg-purple-600 border-purple-600' : ''
                        }`}
                      >
                        Small
                      </Button>
                      <Button
                        variant={interfaceSettings.fontSize === 'medium' ? "default" : "outline"}
                        onClick={() => setInterfaceSettings(prev => ({...prev, fontSize: 'medium'}))}
                        className={`bg-transparent border border-gray-700 hover:bg-gray-800 text-white ${
                          interfaceSettings.fontSize === 'medium' ? 'bg-purple-600 border-purple-600' : ''
                        }`}
                      >
                        Medium
                      </Button>
                      <Button
                        variant={interfaceSettings.fontSize === 'large' ? "default" : "outline"}
                        onClick={() => setInterfaceSettings(prev => ({...prev, fontSize: 'large'}))}
                        className={`bg-transparent border border-gray-700 hover:bg-gray-800 text-white ${
                          interfaceSettings.fontSize === 'large' ? 'bg-purple-600 border-purple-600' : ''
                        }`}
                      >
                        Large
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-white">Reduce Animations</h4>
                      <p className="text-sm text-gray-400">Minimize animations for a simpler experience</p>
                    </div>
                    <div className="flex items-center">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={interfaceSettings.reducedAnimations}
                          onChange={() => setInterfaceSettings(prev => ({
                            ...prev, 
                            reducedAnimations: !prev.reducedAnimations
                          }))}
                        />
                        <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:bg-purple-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                      </label>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-white">High Contrast Mode</h4>
                      <p className="text-sm text-gray-400">Increase contrast for better accessibility</p>
                    </div>
                    <div className="flex items-center">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={interfaceSettings.highContrastMode}
                          onChange={() => setInterfaceSettings(prev => ({
                            ...prev, 
                            highContrastMode: !prev.highContrastMode
                          }))}
                        />
                        <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:bg-purple-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                      </label>
                    </div>
                  </div>
                </div>
                
                <Button
                  onClick={handleInterfaceUpdate}
                  disabled={isLoading}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {isLoading ? 'Saving...' : 'Save Interface Settings'}
                </Button>
              </div>
            )}

            {/* Danger Zone Tab */}
            {activeTab === 'danger' && (
              <div className="space-y-4">
                <div className="p-4 border border-red-500/50 rounded-lg bg-red-500/10">
                  <h3 className="text-lg font-medium text-red-500 mb-2">Delete Account</h3>
                  <p className="text-gray-400 mb-4">
                    Once you delete your account, there is no going back. Please be certain.
                  </p>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteAccount}
                    disabled={isLoading}
                    className="w-full bg-red-600 hover:bg-red-700 text-white"
                  >
                    {isLoading ? 'Deleting...' : 'Delete Account'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {showActiveSessions && (
        <ActiveSessions
          userId={user.uid}
          onClose={() => setShowActiveSessions(false)}
        />
      )}
    </div>
  );
};

// Main UserProfile Component
export default function UserProfile() {
  const [user, setUser] = useState(null);
  const [isloading, setLoading] = useState(true);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [userImages, setUserImages] = useState([]); // State to store user images
  const [showModal, setShowModal] = useState(false);  // To control modal visibility
  const [selectedImage, setSelectedImage] = useState(null);  // Store selected image data
  const [showCommunityModal, setShowCommunityModal] = useState(false); // For Community Modal
  const [theme, setTheme] = useState("dark");

  // Check for saved theme in localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  // Toggle theme function
  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.remove("dark", "light");
    document.documentElement.classList.add(newTheme);
  };
  const { tokens, loading } = useSubscription();
  const [isLoading, setIsLoading] = useState(true);
  const [isManageAccountOpen, setIsManageAccountOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Function to fetch user images from Firestore
  const fetchUserImages = async (user) => {
    setIsLoadingImages(true); // Set loading state for images
    try {
      const userImagesRef = collection(db, 'user_images');
      const q = query(userImagesRef, where('userID', '==', user.uid)); // Filter by userID
      const querySnapshot = await getDocs(q);
      //const images = querySnapshot.docs.map((doc) => doc.data()); // Extract image data
      const images = querySnapshot.docs.map((doc) => ({
        ...doc.data(),
        uid: doc.id  // Assuming the document ID is used as the UID
      }));
      setUserImages(images); // Set images in state
    } catch (error) {
      console.error('Error fetching user images:', error);
    } finally {
      setIsLoadingImages(false); // Reset loading state regardless of success or failure
    }
  };
  
  // Fetch user images when user changes
  useEffect(() => {
    if (user) {
      fetchUserImages(user);
    }
  }, [user]);
  

  const saveUserToFirebase = async (userData, tokensToAdd = 0, customerId = null, subscriptionStatus = 'inactive', currentPlan = null) => {
    try {
      if (!userData || !userData.uid) {
        console.error("User data is missing essential properties.");
        return;
      }
      const userRef = doc(db, 'users', userData.uid); 
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        const newUser = {
          email: userData.email,
          name: userData.displayName || "guest",
          photoURL: userData.photoURL,
          lastLogin: serverTimestamp(),
          tokens: tokensToAdd, 
          customerId: customerId || null, 
          subscriptionStatus: subscriptionStatus,
          currentPlan: currentPlan ,
        };
        await setDoc(userRef, newUser);
        console.log("New user created in Firebase");
      } else {
        const existingData = userDoc.data();
        const updatedData = {
          email: userData.email,
          name: userData.displayName || existingData.name || "guest",
          photoURL: userData.photoURL,
          lastLogin: serverTimestamp(),
          tokens: (existingData.tokens || 0) + tokensToAdd,
          customerId: customerId || existingData.customerId || null, 
          subscriptionStatus: subscriptionStatus || existingData.subscriptionStatus,
          currentPlan: currentPlan || existingData.currentPlan,
        };

        await setDoc(userRef, updatedData);
        console.log("User saved to Firebase");
      }
    } catch (error) {
      console.error("Error saving user data:", error);
    }
  };

  // Handle image click to open gallery modal
  const handleImageClick = (image) => {
    setSelectedImage(image);
    setShowModal(true);
  };

  // Show loading spinner while fetching data
  if (isLoadingImages) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-gray-900 via-gray-800 to-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  const closeModal = () => {
    setShowModal(false);
}
  const openCommunityModal = () => {
    setShowModal(false);  // Close Gallery Modal
    setShowCommunityModal(true);  // Open Community Modal
  };

  const closeCommunityModal = () => {
    setShowCommunityModal(false);  // Close Community Modal
  };

  const handleImageDeleted = (deletedImageId) => {
    // Update the userImages state by filtering out the deleted image
    setUserImages(prevImages => prevImages.filter(image => 
      (image.uid !== deletedImageId && image.id !== deletedImageId)
    ));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-gray-900 via-gray-800 to-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-gray-900 via-gray-800 to-black text-white flex items-center justify-center">
        <p className="text-2xl font-semibold">Please log in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-gray-900 via-gray-800 to-black text-white font-sans relative overflow-hidden">
      <Navbar /> 
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Left Column - Profile */}
          <div className="flex-shrink-0 w-full lg:w-1/4">
            <div className="flex flex-col items-center bg-[var(--card-background)] p-8 rounded-2xl  border border-[var(--border-gray)]">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName}
                  className="w-40 h-40 rounded-full  border-4 border-[var(--border-gray)] mb-6"
                />
              ) : (
                <div className="w-40 h-40 bg-gray-800 rounded-full flex items-center justify-center mb-6 border-4 border-[var(--border-gray)]">
                  <User2 className="w-20 h-20 text-gray-400" />
                </div>
              )}
              <h2 className="text-3xl font-bold text-center mb-2">
                {user?.displayName || "Guest"}
              </h2>
              <p className="text-gray-400 text-lg mb-4">
                {user?.email || "No email provided"}
              </p>
              <div className="w-full justify-start text-center py-3 border-2 border-purple-400 bg-gradient-to-r from-gray-900 to-gray-800 rounded-full hover:scale-105 transition-all hover:border-purple-500 px-8 mb-6">
                <h3 className="text- font-semibold truncate">
                  Credits: {tokens}
                </h3>
              </div>
              <div className="w-full space-y-3">
                <Button variant="outline" onClick={() => setIsManageAccountOpen(true)} className="w-full justify-start py-6 border-[var(--border-gray)] bg-gradient-to-r from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-700  transition-all duration-300 text-white">
                  <Settings className="mr-3 h-5 w-5 " />
                  <span className="text-lg">Manage Account</span>
                </Button>
                <Button variant="outline" className="w-full justify-start py-6 border-[var(--border-gray)] bg-gradient-to-r from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-700  transition-all duration-300 text-white">
                  <User2 className="mr-3 h-5 w-5 " />
                  <span className="text-lg">Manage Subscription</span>
                </Button>
                <Button variant="outline" className="w-full justify-start py-6 border-[var(--border-gray)] bg-gradient-to-r from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-700  transition-all duration-300 text-white">
                  <Share2 className="mr-3 h-5 w-5" />
                  <span className="text-lg">Share</span>
                </Button>
                <Button variant="outline" className="w-full justify-start py-6 border-[var(--border-gray)] bg-gradient-to-r from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-700  transition-all duration-300 text-white" onClick={toggleTheme}>
                  {theme === "dark" ? (
                  <Sun className="mr-3 h-5 w-5 " />
                ) : (
                  <Moon className="mr-3 h-5 w-5 " />
                )}
                  <span className="text-lg">{theme === "dark" ? "Light" : "Dark"} Mode</span>
                </Button>

                </div>
            </div>
          </div>

          {/* Right Column - Content */}
          <div className="flex-grow">
            <div className="mb-8">
              {/* Milestone Tracker */}
              <Card className="bg-[var(--card-background)] border-[var(--border-gray)]">
                <CardHeader>
                  <h3 className="text-2xl font-bold">Milestone tracker</h3>
                </CardHeader>
                <CardContent>
                  <Progress value={35} className="h-3 rounded-lg" />
                  <p className="mt-2 text-gray-400">35% Complete</p>
                </CardContent>
              </Card>
            </div>

            {/* Gallery Section */}
            <div className="bg-[var(--card-background)] p-6 rounded-2xl border border-[var(--border-gray)]">
              <h3 className="text-2xl font-bold mb-6">Your Gallery</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {userImages.length > 0 ? (
                  userImages.map((image, index) => (
                <HoverCard key={index}>
                  <HoverCardTrigger asChild>
                    <div
                      className="relative aspect-square rounded-xl overflow-hidden shadow-2xl group cursor-pointer transform transition-all duration-300 hover:scale-105"
                      onClick={() => handleImageClick(image)} // Pass the image URL to the modal
                    >
                      <Image
                        src={image.img_data}  // Directly use the img_data (image URL)
                        alt={`Gallery item ${index}`}
                        width={400}
                        height={400}
                        className="object-cover"
                        placeholder="blur"
                        blurDataURL={`data:image/svg+xml;base64,...`}  // Optional for blur effect
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <div className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <Check className="w-5 h-5 text-white" />
                        </div>
                      </div>
                    </div>
                  </HoverCardTrigger>
                <HoverCardContent className="w-80 bg-[var(--card-background)] border-[var(--border-gray)]">
                  <div className="space-y-2">
                    <h4 className="text-lg font-semibold">Image Details</h4>
                    <p className="text-gray-400">Gallery item {index + 1}</p>
                  </div>
                </HoverCardContent>
              </HoverCard>
      ))
    ) : (
      <p className="text-gray-400">No images available.</p>
    )}
  </div>
             
           

              {/* Pagination */}
              <div className="flex justify-center items-center gap-3 mt-8">
                {[1, 2, 3, 4, 5].map((page) => (
                  <Button
                    key={page}
                    variant="outline"
                    className={`w-10 h-10 text-lg font-medium ${
                      page === 1 
                        ? 'bg-white text-black hover:bg-gray-200' 
                        : 'border-gray-700 bg-gradient-to-r from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-700'
                    } shadow-lg transition-all duration-300`}
                  >
                    {page}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Account Management Dialog */}
      <AccountManagementDialog 
        isOpen={isManageAccountOpen}
        onClose={() => setIsManageAccountOpen(false)}
        user={user}
      />

      <Footer />
      {/* Gallery Modal */}
      {showModal && (
                <GalleryModal
                    closeModal={closeModal}
                    image={selectedImage}
                    openCommunityModal={openCommunityModal}
                    onImageDeleted={handleImageDeleted}
                />
            )}

            {/* Community Modal */}
            {showCommunityModal && (
                <Modal
                    closeModal={closeCommunityModal}
                    add_community={() => {}}
                    selectedImage={selectedImage}
                    createdBy={user?.displayName}
                />
      )}
    </div>
  );
}