"use client";

import React, { useState, useEffect } from 'react';
import Image from "next/image";
import { Settings, User2, Share2, Moon, Check } from 'lucide-react';
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
import { auth, db } from '@/firebase/FirebaseConfig';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import GalleryModal from '../../../components/GalleryModal.jsx';
import Modal from '../../../components/Modal.jsx';

export default function UserProfile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);  // To control modal visibility
  const [selectedImage, setSelectedImage] = useState(null);  // Store selected image data
  const [showPostModal, setShowPostModal] = useState(false); // For Post Modal

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

  const saveUserToFirebase = async (userData) => {
    try {
      const userRef = doc(db, 'users', userData.uid);
      await setDoc(userRef, {
        email: userData.email,
        name: userData.displayName,
        photoURL: userData.photoURL,
        lastLogin: serverTimestamp(),
      }, { merge: true });
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
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-gray-900 via-gray-800 to-black text-white">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Left Column - Profile */}
          <div className="flex-shrink-0 w-full lg:w-1/4">
            <div className="flex flex-col items-center bg-[#0D161F] p-8 rounded-2xl shadow-2xl border border-gray-800">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName}
                  className="w-40 h-40 rounded-full shadow-2xl border-4 border-gray-800 mb-6"
                />
              ) : (
                <div className="w-40 h-40 bg-gray-800 rounded-full flex items-center justify-center mb-6 shadow-2xl border-4 border-gray-700">
                  <User2 className="w-20 h-20 text-gray-400" />
                </div>
              )}
              <h2 className="text-3xl font-bold text-center mb-2">
                {user?.displayName || "Guest"}
              </h2>
              <p className="text-gray-400 text-lg mb-4">
                {user?.email || "default text box"}
              </p>
              <div className="w-full space-y-3">
                <Button variant="outline" className="w-full justify-start py-6 border-gray-700 bg-gradient-to-r from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-700 shadow-lg transition-all duration-300 text-white">
                  <Settings className="mr-3 h-5 w-5 text-white" />
                  <span className="text-lg">Manage Account</span>
                </Button>
                <Button variant="outline" className="w-full justify-start py-6 border-gray-700 bg-gradient-to-r from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-700 shadow-lg transition-all duration-300 text-white">
                  <User2 className="mr-3 h-5 w-5 text-white" />
                  <span className="text-lg">Manage Subscription</span>
                </Button>
                <Button variant="outline" className="w-full justify-start py-6 border-gray-700 bg-gradient-to-r from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-700 shadow-lg transition-all duration-300 text-white">
                  <Share2 className="mr-3 h-5 w-5 text-white" />
                  <span className="text-lg">Share</span>
                </Button>
                <Button variant="outline" className="w-full justify-start py-6 border-gray-700 bg-gradient-to-r from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-700 shadow-lg transition-all duration-300 text-white">
                  <Moon className="mr-3 h-5 w-5 text-white" />
                  <span className="text-lg">Dark Mode</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Right Column - Content */}
          <div className="flex-grow">
            <div className="mb-8">
              {/* Milestone Tracker */}
              <Card className="bg-[#0D161F] border-gray-800 shadow-2xl">
                <CardHeader>
                  <h3 className="text-2xl font-bold text-white">Milestone tracker</h3>
                </CardHeader>
                <CardContent>
                  <Progress value={35} className="h-3 rounded-lg bg-gray-800" />
                  <p className="mt-2 text-gray-400">35% Complete</p>
                </CardContent>
              </Card>
            </div>

            {/* Gallery Section */}
            <div className="bg-[#0D161F] p-6 rounded-2xl shadow-2xl border border-gray-800">
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
                          
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300">
                          <div className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                            <Check className="w-5 h-5 text-white" />
                          </div>
                        </div>
                      </div>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-80 bg-[#0D161F] border-gray-800 shadow-2xl">
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
                {[1, 2, '...', 9, 10].map((page, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="icon"
                    className={`w-10 h-10 text-lg font-medium text-white ${
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
    </div>
  );
}