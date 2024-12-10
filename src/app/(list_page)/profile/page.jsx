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

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-gray-900 via-gray-800 to-black text-white">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-12">
          {/* Left Column - Profile */}
          <div className="flex-shrink-0">
            <div className="flex flex-col items-center">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName}
                  className="w-32 h-32 rounded-full shadow-lg mb-4"
                />
              ) : (
                <div className="w-32 h-32 bg-gray-800 rounded-full flex items-center justify-center mb-4">
                  <User2 className="w-16 h-16 text-gray-400" />
                </div>
              )}
              <h2 className="text-2xl font-bold">
                {user?.displayName || "Guest"}
              </h2>
              <p className="text-gray-400">
                {user?.email || "default text box"}
              </p>
            </div>
          </div>

          {/* Right Column - Content */}
          <div className="flex-grow">
            <div className="flex flex-col md:flex-row justify-between gap-8 mb-8">
              {/* Milestone Tracker */}
              <Card className="flex-grow bg-[#0D161F] border-gray-800">
                <CardHeader>
                  <h3 className="text-xl font-semibold text-white">Milestone tracker</h3>
                </CardHeader>
                <CardContent>
                  <Progress value={35} className="h-2" />
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start border-slate-800 bg-[linear-gradient(110deg,#000103,45%,#1e2631,55%,#000103)] hover:bg-slate-800">
                  <Settings className="mr-2 h-4 w-4" />
                  Manage Account
                </Button>
                <Button variant="outline" className="w-full justify-start border-slate-800 bg-[linear-gradient(110deg,#000103,45%,#1e2631,55%,#000103)] hover:bg-slate-800">
                  <User2 className="mr-2 h-4 w-4" />
                  Manage Subscription
                </Button>
                <Button variant="outline" className="w-full justify-start border-slate-800 bg-[linear-gradient(110deg,#000103,45%,#1e2631,55%,#000103)] hover:bg-slate-800">
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
                <Button variant="outline" className="w-full justify-start border-slate-800 bg-[linear-gradient(110deg,#000103,45%,#1e2631,55%,#000103)] hover:bg-slate-800">
                  <Moon className="mr-2 h-4 w-4" />
                  Dark Mode
                </Button>
              </div>
            </div>

            {/* Gallery Section */}
            <div>
              <h3 className="text-xl font-semibold mb-6">Your Gallery</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((index) => (
                  <HoverCard key={index}>
                    <HoverCardTrigger asChild>
                      <div className="relative aspect-square rounded-[25px] overflow-hidden bg-[#0D161F] p-2 shadow-2xl group cursor-pointer">
                        <Image
                          src={`https://picsum.photos/200/200?random=${index}`}
                          alt={`Gallery item ${index}`}
                          width={200}
                          height={200}
                          className="object-cover rounded-[25px]"
                        />
                        <div className="absolute top-2 right-2 w-6 h-6 rounded-md flex items-center justify-center bg-gray-900/50 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-80">
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold">Image Details</h4>
                        <p className="text-sm">Gallery item {index}</p>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex justify-center items-center gap-2 mt-6">
                {[1, 2, '...', 9, 10].map((page, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="icon"
                    className={`w-8 h-8 ${
                      page === 1 ? 'bg-white text-black' : 'bg-transparent'
                    } border-gray-800 hover:bg-gray-800`}
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