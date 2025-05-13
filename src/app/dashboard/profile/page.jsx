"use client";

import React, { useState, useEffect, useTransition, useCallback } from 'react';
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
import DoughnutChart from './DoughnutChart';
import { Category, categoriesData, categoryMapping } from './Category'
import { useTheme } from '@/hooks/useTheme';
import SubscriptionManagement from './SubscriptionManagement'
import { useSearchParams } from 'next/navigation';

import { 
  doc, 
  setDoc, 
  getDoc, 
  deleteDoc, 
  updateDoc,
  serverTimestamp ,
  onSnapshot
} from 'firebase/firestore';
import { 
  deleteUser, 
  updateProfile
} from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { applyInterfaceSettings, getAccentColorValue, getFontSizeValue, getGridViewClasses } from '@/lib/interfaceUtils';

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
  });

  const [securitySettings, setSecuritySettings] = useState({});

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    productUpdates: true,
    securityAlerts: true,
    marketingEmails: false,
  });

  const [interfaceSettings, setInterfaceSettings] = useState({
    colorScheme: 'system',
    reducedAnimations: false,
    highContrastMode: false,
    fontSize: 'medium',
    gridViewType: 'compact',
    accentColor: 'purple',
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
          }));
          
          // Update security settings
          if (userData.securitySettings) {
            setSecuritySettings(userData.securitySettings);
          }
          
          // Update notification settings
          if (userData.notificationSettings) {
            setNotificationSettings(userData.notificationSettings);
          }
          
          // Update interface settings
          if (userData.interfaceSettings) {
            setInterfaceSettings(userData.interfaceSettings);
            
            // Apply interface settings
            applyInterfaceSettings(userData.interfaceSettings);
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

      // Apply all interface settings
      applyInterfaceSettings(interfaceSettings);

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
      <div className="dark:bg-[#0D161F]  bg-[var(--card-background)] border border-[var(--border-gray)] rounded-lg w-full max-w-4xl m-4">
        {/* Header */}
        <div className="border-b border-[var(--border-gray)] p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold ">Account Management</h2>
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-gray-400 hover:text"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex h-[600px]">
          {/* Sidebar */}
          <div className="w-64 border-r border-[var(--border-gray)]">
            <nav className="space-y-1 p-4">
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center space-x-2 px-4 py-2 rounded-lg ${
                  activeTab === 'profile' ? 'dark:bg-gray-800 bg-gray-200 dark:text-white' : 'text-gray-400 dark:hover:bg-gray-800/50 hover:bg-gray-500/50 hover:text-white'
                }`}
              >
                <User2 className="h-5 w-5" />
                <span>Profile</span>
              </button>
              
              <button
                onClick={() => setActiveTab('security')}
                className={`w-full flex items-center space-x-2 px-4 py-2 rounded-lg ${
                  activeTab === 'security' ? 'dark:bg-gray-800 bg-gray-200 dark:text-white' : 'text-gray-400 dark:hover:bg-gray-800/50 hover:bg-gray-500/50 hover:text-white'
                }`}
              >
                <Lock className="h-5 w-5" />
                <span>Security</span>
              </button>
              
              <button
                onClick={() => setActiveTab('notifications')}
                className={`w-full flex items-center space-x-2 px-4 py-2 rounded-lg ${
                  activeTab === 'notifications' ? 'dark:bg-gray-800 bg-gray-200 dark:text-white' : 'text-gray-400 dark:hover:bg-gray-800/50 hover:bg-gray-500/50 hover:text-white'
                }`}
              >
                <Bell className="h-5 w-5" />
                <span>Notifications</span>
              </button>
              
              <button
                onClick={() => setActiveTab('interface')}
                className={`w-full flex items-center space-x-2 px-4 py-2 rounded-lg ${
                  activeTab === 'interface' ? 'dark:bg-gray-800 bg-gray-200 dark:text-white' : 'text-gray-400 dark:hover:bg-gray-800/50 hover:bg-gray-500/50 hover:text-white'
                }`}
              >
                <Settings className="h-5 w-5" />
                <span>Interface</span>
              </button>
              
              <button
                onClick={() => setActiveTab('danger')}
                className={`w-full flex items-center space-x-2 px-4 py-2 rounded-lg ${
                  activeTab === 'danger' ? 'dark:bg-gray-800 bg-gray-200 dark:text-white' : 'text-gray-400 dark:hover:bg-gray-800/50 hover:bg-gray-500/50 hover:text-white'
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
                <h3 className="text-lg font-medium ">Profile Information</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={profileData.displayName}
                      onChange={(e) => setProfileData(prev => ({ ...prev, displayName: e.target.value }))}
                      className="w-full bg-gray-200/50 dark:bg-gray-800/50 border border-[var(--border-gray)] rounded-lg px-3 py-2  focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                      className="w-full bg-gray-200/50 dark:bg-gray-800/50  border border-[var(--border-gray)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                      className="w-full bg-gray-200/50 dark:bg-gray-800/50 border border-[var(--border-gray)] rounded-lg px-3 py-2  focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                      className="w-full bg-gray-200/50 dark:bg-gray-800/50  border border-[var(--border-gray)] rounded-lg px-3 py-2  focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
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
                        className="w-20 h-20 rounded-full object-cover border-2 border-[var(--border-gray)]"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center border-2 border-[var(--border-gray)]">
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
                      className="inline-flex items-center gap-2 px-3 py-1 text-sm text-white bg-transparent border border-[var(--border-gray)] hover:bg-gray-800"
                      onClick={() => document.getElementById('photo-upload').click()}
                      disabled={isLoading}
                    >
                      <Camera className="h-4 w-4" />
                      <span className="text-gray-400">
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
                <h3 className="text-lg font-medium ">Security Settings</h3>
                
                <div className="space-y-4">
                  <div className="p-4 bg-gray-200/50 dark:bg-gray-800/50 rounded-lg">
                    <div className="mb-3">
                      <h4 className="font-medium">Active Sessions</h4>
                      <p className="text-sm text-gray-400">View and manage your active sessions across different devices</p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setShowActiveSessions(true)}
                      className="bg-transparent border border-gray-700 hover:bg-gray-800 "
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
                <h3 className="text-lg font-medium ">Notification Preferences</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-200/50 dark:bg-gray-800/50 rounded-lg">
                    <div>
                      <h4 className="font-medium ">Email Notifications</h4>
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
                  
                  <div className="flex items-center justify-between p-4 bg-gray-200/50 dark:bg-gray-800/50 rounded-lg">
                    <div>
                      <h4 className="font-medium">Push Notifications</h4>
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
                  
                  <div className="flex items-center justify-between p-4 bg-gray-200/50 dark:bg-gray-800/50 rounded-lg">
                    <div>
                      <h4 className="font-medium ">Product Updates</h4>
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
                  
                  <div className="flex items-center justify-between p-4 bg-gray-200/50 dark:bg-gray-800/50 rounded-lg">
                    <div>
                      <h4 className="font-medium ">Security Alerts</h4>
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
                  
                  <div className="flex items-center justify-between p-4 bg-gray-200/50 dark:bg-gray-800/50 rounded-lg">
                    <div>
                      <h4 className="font-medium ">Marketing Emails</h4>
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

            {/* Interface Tab */}
            {activeTab === 'interface' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium ">Interface Settings</h3>
                
                <div className="space-y-4">
                  <div className="p-4 bg-gray-200/50 dark:bg-gray-800/50  rounded-lg">
                    <div className="mb-3">
                      <h4 className="font-medium ">Color Scheme</h4>
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
                        className={`bg-transparent border border-[var(--border-gray)] dark:hover:bg-gray-800 hover:bg-gray-300 hover:text-white  ${
                          interfaceSettings.colorScheme === 'light' ? 'bg-purple-600 border-purple-600' : ''
                        }`}
                      >
                        Light
                      </Button>
                      <Button
                        variant={interfaceSettings.colorScheme === 'dark' ? "default" : "outline"}
                        onClick={() => setInterfaceSettings(prev => ({...prev, colorScheme: 'dark'}))}
                        className={`bg-transparent border border-[var(--border-gray)]  dark:hover:bg-gray-800 hover:bg-gray-300 hover:text-white  ${
                          interfaceSettings.colorScheme === 'dark' ? 'bg-purple-600 border-purple-600' : ''
                        }`}
                      >
                        Dark
                      </Button>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gray-200/50 dark:bg-gray-800/50 rounded-lg">
                    <div className="mb-3">
                      <h4 className="font-medium ">Accent Color</h4>
                      <p className="text-sm text-gray-400">Choose accent color for UI elements</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <Button
                        variant={interfaceSettings.accentColor === 'purple' ? "default" : "outline"}
                        onClick={() => setInterfaceSettings(prev => ({...prev, accentColor: 'purple'}))}
                        className={`bg-transparent border dark:hover:bg-gray-800 hover:bg-gray-300 hover:text-white  ${
                          interfaceSettings.accentColor === 'purple' ? 'bg-purple-600 border-purple-600' : 'border-[var(--border-gray)] '
                        }`}
                      >
                        <div className="w-4 h-4 rounded-full bg-purple-500 mr-2"></div>
                        Purple
                      </Button>
                      <Button
                        variant={interfaceSettings.accentColor === 'blue' ? "default" : "outline"}
                        onClick={() => setInterfaceSettings(prev => ({...prev, accentColor: 'blue'}))}
                        className={`bg-transparent border dark:hover:bg-gray-800 hover:bg-gray-300 hover:text-white  ${
                          interfaceSettings.accentColor === 'blue' ? 'bg-blue-600 border-blue-600' : 'border-[var(--border-gray)]'
                        }`}
                      >
                        <div className="w-4 h-4 rounded-full bg-blue-500 mr-2"></div>
                        Blue
                      </Button>
                      <Button
                        variant={interfaceSettings.accentColor === 'teal' ? "default" : "outline"}
                        onClick={() => setInterfaceSettings(prev => ({...prev, accentColor: 'teal'}))}
                        className={`bg-transparent border dark:hover:bg-gray-800 hover:bg-gray-300 hover:text-white  ${
                          interfaceSettings.accentColor === 'teal' ? 'bg-teal-600 border-teal-600' : 'border-[var(--border-gray)] '
                        }`}
                      >
                        <div className="w-4 h-4 rounded-full bg-teal-500 mr-2"></div>
                        Teal
                      </Button>
                      <Button
                        variant={interfaceSettings.accentColor === 'amber' ? "default" : "outline"}
                        onClick={() => setInterfaceSettings(prev => ({...prev, accentColor: 'amber'}))}
                        className={`bg-transparent border dark:hover:bg-gray-800 hover:bg-gray-300 hover:text-white  ${
                          interfaceSettings.accentColor === 'amber' ? 'bg-amber-600 border-amber-600' : 'border-[var(--border-gray)] '
                        }`}
                      >
                        <div className="w-4 h-4 rounded-full bg-amber-500 mr-2"></div>
                        Amber
                      </Button>
                      <Button
                        variant={interfaceSettings.accentColor === 'pink' ? "default" : "outline"}
                        onClick={() => setInterfaceSettings(prev => ({...prev, accentColor: 'pink'}))}
                        className={`bg-transparent border dark:hover:bg-gray-800 hover:bg-gray-300 hover:text-white  ${
                          interfaceSettings.accentColor === 'pink' ? 'bg-pink-600 border-pink-600' : 'border-[var(--border-gray)] '
                        }`}
                      >
                        <div className="w-4 h-4 rounded-full bg-pink-500 mr-2"></div>
                        Pink
                      </Button>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gray-200/50 dark:bg-gray-800/50 rounded-lg">
                    <div className="mb-3">
                      <h4 className="font-medium">Text Size</h4>
                      <p className="text-sm text-gray-400">Adjust the text size for better readability</p>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        variant={interfaceSettings.fontSize === 'small' ? "default" : "outline"}
                        onClick={() => setInterfaceSettings(prev => ({...prev, fontSize: 'small'}))}
                        className={`bg-transparent border border-[var(--border-gray)]  dark:hover:bg-gray-800 hover:bg-gray-300 hover:text-white  ${
                          interfaceSettings.fontSize === 'small' ? 'bg-purple-600 border-purple-600' : ''
                        }`}
                      >
                        Small
                      </Button>
                      <Button
                        variant={interfaceSettings.fontSize === 'medium' ? "default" : "outline"}
                        onClick={() => setInterfaceSettings(prev => ({...prev, fontSize: 'medium'}))}
                        className={`bg-transparent border border-[var(--border-gray)]  dark:hover:bg-gray-800 hover:bg-gray-300 hover:text-white  ${
                          interfaceSettings.fontSize === 'medium' ? 'bg-purple-600 border-purple-600' : ''
                        }`}
                      >
                        Medium
                      </Button>
                      <Button
                        variant={interfaceSettings.fontSize === 'large' ? "default" : "outline"}
                        onClick={() => setInterfaceSettings(prev => ({...prev, fontSize: 'large'}))}
                        className={`bg-transparent border border-[var(--border-gray)]  dark:hover:bg-gray-800 hover:bg-gray-300 hover:text-white  ${
                          interfaceSettings.fontSize === 'large' ? 'bg-purple-600 border-purple-600' : ''
                        }`}
                      >
                        Large
                      </Button>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gray-200/50 dark:bg-gray-800/50 rounded-lg">
                    <div className="mb-3">
                      <h4 className="font-medium ">Gallery View</h4>
                      <p className="text-sm text-gray-400">Set your preferred gallery view density</p>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        variant={interfaceSettings.gridViewType === 'compact' ? "default" : "outline"}
                        onClick={() => setInterfaceSettings(prev => ({...prev, gridViewType: 'compact'}))}
                        className={`bg-transparent border border-[var(--border-gray)]  dark:hover:bg-gray-800 hover:bg-gray-300 hover:text-white  ${
                          interfaceSettings.gridViewType === 'compact' ? 'bg-purple-600 border-purple-600' : ''
                        }`}
                      >
                        Compact
                      </Button>
                      <Button
                        variant={interfaceSettings.gridViewType === 'comfortable' ? "default" : "outline"}
                        onClick={() => setInterfaceSettings(prev => ({...prev, gridViewType: 'comfortable'}))}
                        className={`bg-transparent border border-[var(--border-gray)]  dark:hover:bg-gray-800 hover:bg-gray-300 hover:text-white  ${
                          interfaceSettings.gridViewType === 'comfortable' ? 'bg-purple-600 border-purple-600' : ''
                        }`}
                      >
                        Comfortable
                      </Button>
                      <Button
                        variant={interfaceSettings.gridViewType === 'spacious' ? "default" : "outline"}
                        onClick={() => setInterfaceSettings(prev => ({...prev, gridViewType: 'spacious'}))}
                        className={`bg-transparent border border-[var(--border-gray)]  dark:hover:bg-gray-800 hover:bg-gray-300 hover:text-white  ${
                          interfaceSettings.gridViewType === 'spacious' ? 'bg-purple-600 border-purple-600' : ''
                        }`}
                      >
                        Spacious
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-200/50 dark:bg-gray-800/50  rounded-lg">
                    <div>
                      <h4 className="font-medium ">Reduce Animations</h4>
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
                  
                  <div className="flex items-center justify-between p-4 bg-gray-200/50 dark:bg-gray-800/50 rounded-lg">
                    <div>
                      <h4 className="font-medium ">High Contrast Mode</h4>
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
  // 1. All useState hooks first
  const [user, setUser] = useState(null);
  const [imageStatus, setImageStatus] = useState(false);  // Track image's posted status
  const [currentPage, setCurrentPage] = useState(1); // Default to first page
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [userImages, setUserImages] = useState([]); 
  const [showModal, setShowModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isPending, startTransition] = useTransition();
  const [prefetchedImages, setPrefetchedImages] = useState({});
  const [hoveredPage, setHoveredPage] = useState(null);
  //const [showCommunityModal, setShowCommunityModal] = useState(false);
  
  // Checks if manage subscription tab is open or not
  const [showSubscription, setShowSubscription] = useState(false);
  const searchParams = useSearchParams();

  // Use the theme hook instead of inline theme logic
  const { theme, toggleTheme } = useTheme();
  
  const [isManageAccountOpen, setIsManageAccountOpen] = useState(false);
  const [hoveredCategoryIndex, setHoveredCategoryIndex] = useState(null);
  const [userSettings, setUserSettings] = useState({
    interfaceSettings: {
      gridViewType: 'compact',
    }
  });
 
  //subscription management
  const [isSubscriptionManagementOpen, setIsSubscriptionManagementOpen] = useState(false);

  //const [categories, setCategories] = useState (null)
  const [activeCategory, setActiveCategory] = useState(-1);
  const [categoryData, setCategoryData] = useState(categoriesData);

  const updateCategoryData = (data) => {
    setCategoryData(data);
  };

  const imagesPerPage = 8;

  // Reset to page 1 when active category changes
  useEffect(() => {
    // Reset to first page when category changes
    setCurrentPage(1);
    // Clear prefetched images state since we're changing categories
    setPrefetchedImages({});
  }, [activeCategory]);

  // Get selected category images in user gallery
  const getSelectedCategoryImages = () => {
    if (activeCategory === -1) {
      return userImages;
    } else if (activeCategory === -2) { // Special case for Community category
      // Return only images that have a communityPostId set
      return userImages.filter(image => image.communityPostId || image.communityPost);
    } else {
      const selectedCategory = categoryData[activeCategory]?.name;
      
      const categoryKey = Object.keys(categoryMapping).find(
        key => categoryMapping[key] === selectedCategory
      );
      
      return userImages.filter(image => image.type === categoryKey);
    }
  };

  const categoryImages = getSelectedCategoryImages();
  const totalPages = Math.max(1, Math.ceil(categoryImages.length / imagesPerPage));
  
  // Adjust current page if it exceeds the total pages after category change
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  // Check if the URL parameter exists to open subscription
  useEffect(() => {
    if (searchParams.get('openSubscription') === 'true') {
      setShowSubscription(true);
    }
  }, [searchParams]);

  // Close subscription management modal
  const handleCloseSubscription = () => {
    setShowSubscription(false);
  };

  // Paginate the images
  const startIndex = (currentPage - 1) * imagesPerPage;
  const endIndex = startIndex + imagesPerPage;
  const paginatedImages = categoryImages.slice(startIndex, endIndex);

  // Handle page click with transition
  const handlePageClick = useCallback((page) => {
    if (page === currentPage) return;
    
    // Use transition to mark pagination state updates as non-urgent
    startTransition(() => {
      setCurrentPage(page);
    });
  }, [currentPage]);

  // Prefetch images for a specific page
  const prefetchImagesForPage = useCallback((page) => {
    if (prefetchedImages[page] || !categoryImages.length) return;
    
    const pageStartIndex = (page - 1) * imagesPerPage;
    const pageEndIndex = pageStartIndex + imagesPerPage;
    const pageImages = categoryImages.slice(pageStartIndex, pageEndIndex);
    
    // Instead of using new Image(), which conflicts with Next.js's Image component,
    // we'll just mark these pages as prefetched without creating actual image elements
    if (typeof window !== 'undefined') {
      // Only run this on the client side
      pageImages.forEach(image => {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = image.img_data;
        link.as = 'image';
        document.head.appendChild(link);
      });
    }
    
    // Store prefetched status
    setPrefetchedImages(prev => ({
      ...prev,
      [page]: true
    }));
  }, [categoryImages, imagesPerPage, prefetchedImages]);

  // Handle mouse enter on pagination button
  const handlePaginationHover = useCallback((page) => {
    setHoveredPage(page);
    prefetchImagesForPage(page);
  }, [prefetchImagesForPage]);

  // Prefetch adjacent pages when current page changes
  useEffect(() => {
    if (currentPage > 1) {
      prefetchImagesForPage(currentPage - 1);
    }
    if (currentPage < totalPages) {
      prefetchImagesForPage(currentPage + 1);
    }
  }, [currentPage, prefetchImagesForPage, totalPages]);

  // Prefetch first page images on initial load
  useEffect(() => {
    if (categoryImages.length > 0) {
      prefetchImagesForPage(1);
    }
  }, [categoryImages, prefetchImagesForPage]);

  // Handle delete image in child component and show in parent
  const handleImageDelete = (imageId) => {
    setUserImages((prevImages) => prevImages.filter(image => image.uid !== imageId));
  };
  
  // 2. All context hooks
  const { tokens, loading: subscriptionLoading } = useSubscription();

  // 3. All useEffect hooks
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      fetchUserSettings();
      fetchUserImages(user);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        setUserSettings(docSnapshot.data());
      }
    });
    
    return () => unsubscribe();
  }, [user]);

  // Helper functions
  const fetchUserSettings = async () => {
    if (!user) return;
    
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserSettings(userData);
         // lock tokens for 60 days
         if (userData && userData.lockedTokens && userData.lockedTokensExpirationDate) {
          const expirationDate = userData.lockedTokensExpirationDate.toDate 
            ? userData.lockedTokensExpirationDate.toDate() 
            : new Date(userData.lockedTokensExpirationDate);
          
          if (userData.subscriptionStatus === 'active' || userData.subscriptionStatus === 'canceling') {
            // Clear locked tokens after user subscribes back to plan
            await updateDoc(userDocRef, {
                lockedTokens: null,
                lockedTokensExpirationDate: null
            });
            const updatedDoc = await getDoc(userDocRef);
            setUserSettings(updatedDoc.data());
          } else if (new Date() > expirationDate && userData.tokens > 0) {
            // Delete users tokens after 60 days and inactive
            const freeTrialTokens = userData.freeTrialTokens || 0;
            await updateDoc(userDocRef, {
              tokens: freeTrialTokens,
              lockedTokens: null,
              lockedTokensExpirationDate: null
            });
              
            // Refresh the data after update
            const updatedDoc = await getDoc(userDocRef);
            setUserSettings(updatedDoc.data());
          } else {
            setUserSettings(userData);
          }
        } else {
          setUserSettings(userData);
      }
        if (userData.interfaceSettings) {
          applyInterfaceSettings(userData.interfaceSettings);
        }
      }
    } catch (error) {
      console.error('Error fetching user settings:', error);
    }
  };

  const fetchUserImages = async (user) => {
    setIsLoadingImages(true);
    try {
      // Fetch without orderBy to avoid requiring composite index
      const userImagesRef = collection(db, 'user_images');
      const q = query(userImagesRef, where('userID', '==', user.uid));
      const querySnapshot = await getDocs(q);
      const images = querySnapshot.docs.map((doc) => ({
        ...doc.data(),
        uid: doc.id
      }));
      
      // Sort images by createdAt on the client side
      const sortedImages = images.sort((a, b) => {
        // Handle different timestamp formats
        const getTimestamp = (item) => {
          if (!item.createdAt) return 0;
          if (item.createdAt.toDate) return item.createdAt.toDate().getTime();
          if (item.createdAt.seconds) return item.createdAt.seconds * 1000;
          if (typeof item.createdAt === 'string') return new Date(item.createdAt).getTime();
          return 0;
        };
        
        return getTimestamp(b) - getTimestamp(a); // Descending order (newest first)
      });
      
      setUserImages(sortedImages);
    } catch (error) {
      console.error('Error fetching user images:', error);
    } finally {
      setIsLoadingImages(false);
    }
  };

  // Show free trial message - calculates number of days are left in users free trial
  const useFreeTrialDays = (createdAt, hasFreeTrialTokens) => {
    if (!createdAt || !hasFreeTrialTokens) return 0;
    
    const creationDate = typeof createdAt.toDate === 'function'
      ? createdAt.toDate() 
      : new Date(createdAt);
    const expirationDate = new Date(creationDate);
    expirationDate.setDate(expirationDate.getDate() + 7);
    
    const now = new Date();
    return Math.max(0, Math.ceil((expirationDate - now) / (1000 * 60 * 60 * 24)));
  };

  // Message to user to subscribe and show after freeTrialToken expired
  const subscribeToUseCreditsMessage = (subscriptionStatus, createdAt) => {
    if (subscriptionStatus !== 'inactive' || !createdAt) {
      return false;
    }
    
    const creationDate = typeof createdAt.toDate === 'function'
      ? createdAt.toDate() 
      : new Date(createdAt);
    
    const now = new Date();
    const daysSinceCreation = Math.floor((now - creationDate) / (1000 * 60 * 60 * 24));
    
    return daysSinceCreation > 7;
  };

  const daysLeft = useFreeTrialDays(userSettings?.createdAt, userSettings?.freeTrialTokens > 0);

  const showMessage = subscribeToUseCreditsMessage(
    userSettings?.subscriptionStatus, 
    userSettings?.createdAt
  );

  // Fetch user images when user changes
  useEffect(() => {
    if (user) {
      fetchUserImages(user);
    }
  }, [user, imageStatus]);
  

  // Handle image click to open gallery modal
  const handleImageClick = (image) => {
    // Debounce the click to prevent multiple rapid clicks
    if (window.imageClickTimeout) {
      return;
    }
    
    window.imageClickTimeout = setTimeout(() => {
      setSelectedImage(image);
      setShowModal(true);
      setImageStatus(image?.communityPost || false);
      window.imageClickTimeout = null;
    }, 100);
  };

  const closeModal = () => {
    setShowModal(false);
    // Allow time for modal to properly unmount
    setTimeout(() => {
      setSelectedImage(null);
    }, 300);
  }

  {/*const handleImageDeleted = (deletedImageId) => {
    setUserImages(prevImages => prevImages.filter(image => 
      (image.uid !== deletedImageId && image.id !== deletedImageId)
    ));
  };*/}

  // Add community posts count
  const communityPostsCount = userImages.filter(image => 
    image.communityPostId || image.communityPost
  ).length;

  // Loading states
  if (isLoading || subscriptionLoading || isLoadingImages) {
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
      <main className="container mx-auto">
          {/* Left Column - Profile */}
        <div className="flex flex-col md:flex-row lg:flex-row gap-4  w-full">
          <div className="flex flex-col items-center bg-[var(--card-background)] p-8 rounded-2xl  border border-[var(--border-gray)] md:w-80 w-full flex-shrink-0">
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
                {userSettings?.email || user?.email || "No email provided"}
              </p>
              <div className="w-full justify-start text-center py-3 border-2 border-purple-400 bg-gradient-to-r from-gray-900 to-gray-800 rounded-full px-4 sm:px-8 mb-3">
                <div className="flex items-center justify-center gap-2 w-full overflow-visible">
                  <span className="text-lg font-semibold whitespace-nowrap">Credits: {tokens}</span>
                  {userSettings?.subscriptionStatus === 'inactive' && userSettings?.lockedTokens > 0 && (
                    <Lock className="flex-shrink-0 w-4 h-4 text-yellow-500" />
                  )}
                </div>
              </div>

              {/* Only show free trial message if freeTrialTokens exist AND trial hasn't expired */}
              {(userSettings?.freeTrialTokens > 0 && daysLeft > 0) && (
                <div className="px-4 py-3 bg-gray-100 dark:bg-gray-800/10 border border-gray-300 dark:border-gray-700 rounded-lg flex items-center">
                  <div className="text-xs font-medium text-yellow-600 dark:text-yellow-500">
                    Free trial credits will expire in {daysLeft} {daysLeft === 1 ? 'day' : 'days'}
                  </div>
                </div>
              )}

              {/* Display 60 day countdown before resetting credits */}
              {userSettings?.lockedTokens > 0 && userSettings?.lockedTokensExpirationDate && (
                <div className="my-3 px-4 py-3 bg-gray-100 dark:bg-gray-800/10 border border-gray-300 dark:border-gray-700 rounded-lg flex items-center">
                  <span className="text-gray-700 dark:text-gray-200 text-xs">
                    <span className="text-yellow-600 dark:text-yellow-500 font-medium text-xs">
                      {Math.ceil((new Date(
                        typeof userSettings.lockedTokensExpirationDate.toDate === 'function'
                          ? userSettings.lockedTokensExpirationDate.toDate()
                          : new Date(userSettings.lockedTokensExpirationDate)
                      ) - new Date()) / (1000 * 60 * 60 * 24))} days
                    </span> remaining until your credits reset.Subscribe to enable credits.
                  </span>
                </div>
              )}

              {/* Message to user to subscribe and show after freeTrialToken expired */}
              {showMessage && (
                <div className="my-3 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg flex items-center gap-3">
                  <span className="text-gray-400">
                    Subscribe to enable credits
                  </span>
                </div>
              )}
              
              <div className="w-full space-y-3 mt-4">
                <Button variant="outline" onClick={() => setIsManageAccountOpen(true)} className="w-full justify-start py-6 border-[var(--border-gray)] bg-gradient-to-r from-gray-900 to-gray-800 hover:text-[#c792ff] hover:from-gray-800 hover:to-gray-700 overflow-hidden transition-all duration-300">
                  <Settings className="mr-3 h-5 w-5 " />
                  <span className="text-lg">Manage Account</span>
                </Button>
                <Button variant="outline" className="w-full justify-start py-6 border-[var(--border-gray)] bg-gradient-to-r from-gray-900 to-gray-800 hover:text-[#c792ff] hover:from-gray-800 hover:to-gray-700  transition-all duration-300 overflow-hidden" onClick={() => setIsSubscriptionManagementOpen(true)}>
                  <User2 className="mr-3 h-5 w-5 " />
                  <span className="text-lg">Manage Subscription</span>
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
          

          {/* Right Column - Content */}
          <div className="flex-grow">
            <div className="mb-4">
              {/* Image generation Tracker */}
              <Card className="bg-[var(--card-background)] border-[var(--border-gray)]">
                <CardHeader>
                  <div className="flex flex-col lg:flex-row items-center justify-center gap-6">
                    
                    <div className="flex-shrink-0 w-full lg:w-auto lg:max-w-[250px] space-y-4">
                      <DoughnutChart 
                        hoveredCategoryIndex={hoveredCategoryIndex}
                        activeCategory={activeCategory}
                        categories={categoryData} 
                      />
                    </div>
                    <div className="w-full">
                      <div className="max-w-[1100px] space-y-6">
                        <Category 
                          hoveredIndex={hoveredCategoryIndex}
                          setHoveredIndex={setHoveredCategoryIndex}
                          activeCategory={activeCategory}
                          setActiveCategory={setActiveCategory}
                          theme={theme}
                          onCategoriesUpdate={updateCategoryData}
                        />
                      </div>
                    </div>
                  </div>
                </CardHeader>
            </Card>
            </div>

            {/* Gallery Section */}
            <div className="bg-[var(--card-background)] p-6 rounded-2xl border border-[var(--border-gray)]">
              <h3 className="text-xl font-bold mb-4">Your Gallery</h3>

              {/* Gallery with loading state */}
              <div className="relative min-h-[300px]">
                {/* Pending state indicator */}
                {isPending && (
                  <div className="absolute inset-0 bg-black/20 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl">
                    <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}

                {/* Gallery grid with fade transition */}
                <div className={`grid grid-cols-3 md:grid-cols-2 lg:grid-cols-4 gap-6 transition-opacity duration-300 ${isPending ? 'opacity-50' : 'opacity-100'}`}>
                  {paginatedImages.length > 0 ? (
                    paginatedImages.map((image, index) => (
                      <div 
                        key={image.uid || index} 
                        className="relative aspect-square rounded-xl overflow-hidden shadow-2xl group cursor-pointer transform transition-transform hover:scale-105"
                        onClick={() => handleImageClick(image)}
                      >
                        <Image
                          src={image.img_data}
                          alt={`Gallery item ${index}`}
                          width={400}
                          height={400}
                          className="object-cover w-full h-full"
                          placeholder="blur"
                          blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzFjMWMxYyIvPjwvc3ZnPg=="
                          loading={index < 4 ? "eager" : "lazy"}
                          priority={index < 4}
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="absolute top-2 right-2 w-6 h-6 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                            <Check className="w-5 h-5 text-white" />
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400">No images available.</p>
                  )}
                </div>
              </div>

              {/* Pagination with theme-aware styling */}
              {categoryImages.length > 0 && totalPages > 1 ? (
              <div className="flex justify-center mt-8">
                <div className="inline-flex items-center gap-2">
                  {/* Previous button */}
                  <button
                    onClick={currentPage > 1 ? () => handlePageClick(currentPage - 1) : undefined}
                    disabled={currentPage === 1 || isPending}
                    className={`h-10 px-3 text-sm font-medium flex items-center rounded-lg transition-colors ${
                      currentPage === 1 || isPending
                        ? 'text-gray-400 cursor-default' 
                        : theme === 'dark' 
                          ? 'bg-gray-800/50 hover:bg-gray-700/70 text-gray-200' 
                          : 'bg-gray-200/80 hover:bg-gray-300/80 text-gray-700 border border-gray-300/50'
                    }`}
                    onMouseEnter={currentPage > 1 ? () => handlePaginationHover(currentPage - 1) : undefined}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                      <path d="m15 18-6-6 6-6"/>
                    </svg>
                    Prev
                  </button>
                  
                  {/* First page */}
                  {totalPages > 3 && currentPage > 2 && (
                    <>
                      <button 
                        onClick={() => handlePageClick(1)}
                        disabled={isPending}
                        className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                          isPending 
                            ? 'opacity-50 cursor-default' 
                            : theme === 'dark'
                              ? 'bg-gray-800/50 hover:bg-gray-700/70 text-gray-200'
                              : 'bg-gray-200/80 hover:bg-gray-300/80 text-gray-700 border border-gray-300/50'
                        }`}
                        onMouseEnter={() => handlePaginationHover(1)}
                      >
                        1
                      </button>
                      {currentPage > 3 && <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>...</span>}
                    </>
                  )}
                  
                  {/* Current page and adjacent pages */}
                  {[...Array(totalPages)].map((_, i) => {
                    const pageNum = i + 1;
                    // Only render pages near current page
                    if (
                      pageNum === currentPage || 
                      pageNum === currentPage - 1 || 
                      pageNum === currentPage + 1
                    ) {
                      return (
                        <button
                          key={pageNum}
                          onClick={pageNum !== currentPage ? () => handlePageClick(pageNum) : undefined}
                          disabled={isPending || pageNum === currentPage}
                          className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                            pageNum === currentPage 
                              ? theme === 'dark'
                                ? 'bg-purple-600 text-white' 
                                : 'bg-purple-500 text-white shadow-sm'
                              : isPending 
                                ? 'opacity-50 cursor-default' 
                                : theme === 'dark'
                                  ? 'bg-gray-800/50 hover:bg-gray-700/70 text-gray-200'
                                  : 'bg-gray-200/80 hover:bg-gray-300/80 text-gray-700 border border-gray-300/50'
                          } ${hoveredPage === pageNum ? theme === 'dark' ? 'ring-2 ring-purple-500/50' : 'ring-2 ring-purple-400/30' : ''}`}
                          onMouseEnter={() => handlePaginationHover(pageNum)}
                          onMouseLeave={() => setHoveredPage(null)}
                        >
                          {pageNum}
                        </button>
                      );
                    }
                    return null;
                  })}
                  
                  {/* Last page */}
                  {totalPages > 3 && currentPage < totalPages - 1 && (
                    <>
                      {currentPage < totalPages - 2 && <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>...</span>}
                      <button 
                        onClick={() => handlePageClick(totalPages)}
                        disabled={isPending}
                        className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                          isPending 
                            ? 'opacity-50 cursor-default' 
                            : theme === 'dark'
                              ? 'bg-gray-800/50 hover:bg-gray-700/70 text-gray-200'
                              : 'bg-gray-200/80 hover:bg-gray-300/80 text-gray-700 border border-gray-300/50'
                        }`}
                        onMouseEnter={() => handlePaginationHover(totalPages)}
                      >
                        {totalPages}
                      </button>
                    </>
                  )}
                  
                  {/* Next button */}
                  <button
                    onClick={currentPage < totalPages ? () => handlePageClick(currentPage + 1) : undefined}
                    disabled={currentPage === totalPages || isPending}
                    className={`h-10 px-3 text-sm font-medium flex items-center rounded-lg transition-colors ${
                      currentPage === totalPages || isPending
                        ? 'text-gray-400 cursor-default' 
                        : theme === 'dark' 
                          ? 'bg-gray-800/50 hover:bg-gray-700/70 text-gray-200' 
                          : 'bg-gray-200/80 hover:bg-gray-300/80 text-gray-700 border border-gray-300/50'
                    }`}
                    onMouseEnter={currentPage < totalPages ? () => handlePaginationHover(currentPage + 1) : undefined}
                  >
                    Next
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
                      <path d="m9 18 6-6-6-6"/>
                    </svg>
                  </button>
                </div>
              </div>
              ) : null}
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

      {/* <Footer /> */}
      {/* Gallery Modal*/}
      {showModal && selectedImage && (
        <div className="fixed inset-0 z-50">
          <GalleryModal
            closeModal={closeModal}
            image={selectedImage}
            onDelete={handleImageDelete}
          />
        </div>
      )}

      {/* subscription management */}
      {isSubscriptionManagementOpen && (
        <SubscriptionManagement 
          onClose={() => setIsSubscriptionManagementOpen(false)}
        />
      )}
      
      {/* Nav user routes to manage subscription page */}
      {showSubscription && (
        <SubscriptionManagement onClose={handleCloseSubscription} />
      )}
            
    </div>
  );
}