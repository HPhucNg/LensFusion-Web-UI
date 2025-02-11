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
import UploadImage from '../../(list_page)/solutions/UploadImage';  // Import the UploadImage component
import Modal from '@/components/Modal';
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
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Account Management Dialog Component
const AccountManagementDialog = ({ isOpen, onClose, user }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  // Form States
  const [profileData, setProfileData] = useState({
    displayName: user?.displayName || '',
    photoURL: user?.photoURL || '',
  });

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
      });

      setSuccess('Profile updated successfully!');
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
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={profileData.displayName}
                    onChange={(e) => setProfileData({ ...profileData, displayName: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-2 text-white"
                  />
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
    </div>
  );
};

// Main UserProfile Component
export default function UserProfile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);  // To control modal visibility
  const [selectedImage, setSelectedImage] = useState(null);  // Store selected image data
  const [showPostModal, setShowPostModal] = useState(false); // For Post Modal
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
  const [isManageAccountOpen, setIsManageAccountOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
      if (user) {
        saveUserToFirebase(user);
      }
    });

    return () => unsubscribe();
  }, []);

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

  // Function to handle image click
  const handleImageClick = (index) => {
    setSelectedImage(`https://picsum.photos/400/400?random=${index}`);
    setShowModal(true);  // Show the modal
  };

  const closeModal = () => {
    setShowModal(false);
}
  const openPostModal = () => {
    setShowModal(false);  // Close Gallery Modal
    setShowPostModal(true);  // Open Post Modal
  };

  const closePostModal = () => {
    setShowPostModal(false);  // Close Post Modal
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
                {[1, 2, 3, 4, 5, 6, 7, 8].map((index) => (
                  <HoverCard key={index}>
                    <HoverCardTrigger asChild>
                      <div className="relative aspect-square rounded-xl overflow-hidden shadow-2xl group cursor-pointer transform transition-all duration-300 hover:scale-105"
                      onClick={() => handleImageClick(index)}>
                        <Image
                          src={`https://picsum.photos/400/400?random=${index}`}
                          alt={`Gallery item ${index}`}
                          width={400}
                          height={400}
                          className="object-cover"
                          placeholder="blur"
                          blurDataURL={`data:image/svg+xml;base64,...`}
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
                        <p className="text-gray-400">Gallery item {index}</p>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                ))}
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
                    openPostModal={openPostModal}  // Pass openPostModal function
                />
            )}

            {/* Post Modal */}
            {showPostModal && (
                <Modal
                    closeModal={closePostModal}
                    add_pin={() => {}}
                    selectedImage={selectedImage}
                    createdBy={user?.displayName}
                />
      )}
      {/*This is for testing */}
      console.log(user.uid)
      <UploadImage userID={user.uid}/> {/* Pass user ID as a prop */}
    </div>
  );
}