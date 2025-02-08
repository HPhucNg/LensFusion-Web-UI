"use client";

import React, { useState, useEffect } from 'react';
import Image from "next/image";
import { Settings, User2, Share2, Moon, Check } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { useRouter } from 'next/navigation';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { auth, db } from '@/firebase/FirebaseConfig';
import { doc, setDoc, getDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { deleteUser } from 'firebase/auth';

const AccountDeletionDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setError('');
    
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No user found');
      }

      // Delete user data from Firestore
      await deleteDoc(doc(db, 'users', user.uid));

      // Delete the user account
      await deleteUser(user);

      setIsOpen(false);
      router.push('/');
    } catch (error) {
      console.error('Error deleting account:', error);
      setError(error.message || 'Failed to delete account. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full justify-start py-6 border-gray-700 bg-gradient-to-r from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-700 shadow-lg transition-all duration-300 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white"
        >
          <Settings className="mr-3 h-5 w-5 text-white" />
          <span className="text-lg">Manage Account</span>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="bg-[#0D161F] border border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">Delete Account</DialogTitle>
          <DialogDescription className="text-gray-400">
            Are you sure you want to delete your account? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="text-red-500 text-sm mt-2 p-2 bg-red-500/10 rounded">
            {error}
          </div>
        )}

        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
          <Button
            variant="ghost"
            onClick={() => setIsOpen(false)}
            className="text-white hover:text-gray-300 hover:bg-gray-800"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeleteAccount}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isDeleting ? 'Deleting...' : 'Delete Account'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default function UserProfile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
          customerId: customerId,
          subscriptionStatus: subscriptionStatus,
          currentPlan: currentPlan,
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
          customerId: customerId || existingData.customerId,
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
                {user?.email || "No email provided"}
              </p>
              <div className="w-full space-y-3">
                <AccountDeletionDialog />
                <Button variant="outline" className="w-full justify-start py-6 border-gray-700 bg-gradient-to-r from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-700 shadow-lg transition-all duration-300 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white">
                  <User2 className="mr-3 h-5 w-5 text-white" />
                  <span className="text-lg">Manage Subscription</span>
                </Button>
                <Button variant="outline" className="w-full justify-start py-6 border-gray-700 bg-gradient-to-r from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-700 shadow-lg transition-all duration-300 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white">
                  <Share2 className="mr-3 h-5 w-5 text-white" />
                  <span className="text-lg">Share</span>
                </Button>
                <Button variant="outline" className="w-full justify-start py-6 border-gray-700 bg-gradient-to-r from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-700 shadow-lg transition-all duration-300 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white">
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
                  <h3 className="text-2xl font-bold text-white">Milestone Tracker</h3>
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
                      <div className="relative aspect-square rounded-xl overflow-hidden shadow-2xl group cursor-pointer transform transition-all duration-300 hover:scale-105">
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
                {[1, 2, 3, 4, 5].map((page) => (
                  <Button
                    key={page}
                    variant="outline"
                    className={`w-10 h-10 text-lg font-medium ${page === 1 ? 'bg-white text-black hover:bg-gray-200' : 'border-gray-700 bg-gradient-to-r from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-700'} shadow-lg transition-all duration-300`}
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
    </div>
  );
}