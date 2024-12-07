"use client";

import React, { useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
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

export default function UserProfile() {
  const { user, isAuthenticated, isLoading } = useAuth0();

  if (isLoading) {
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
              {isAuthenticated && user.picture ? (
                <img
                  src={user.picture}
                  alt={user.name}
                  className="w-32 h-32 rounded-full shadow-lg mb-4"
                />
              ) : (
                <div className="w-32 h-32 bg-gray-800 rounded-full flex items-center justify-center mb-4">
                  <User2 className="w-16 h-16 text-gray-400" />
                </div>
              )}
              <h2 className="text-2xl font-bold">
                {isAuthenticated ? user.name : "Guest"}
              </h2>
              <p className="text-gray-400">
                {isAuthenticated ? user.email : "default text box"}
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
                <Button variant="outline" className="w-full justify-start bg-white text-black hover:bg-gray-100 rounded-full">
                  <Settings className="mr-2 h-4 w-4" />
                  Manage Account
                </Button>
                <Button variant="outline" className="w-full justify-start bg-white text-black hover:bg-gray-100 rounded-full">
                  <User2 className="mr-2 h-4 w-4" />
                  Manage Subscription
                </Button>
                <Button variant="outline" className="w-full justify-start bg-white text-black hover:bg-gray-100 rounded-full">
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
                <Button variant="outline" className="w-full justify-start bg-white text-black hover:bg-gray-100 rounded-full">
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
                      <div className="relative aspect-square rounded-2xl overflow-hidden group cursor-pointer">
                        <Image
                          src={`/placeholder-${index}.jpg`}
                          alt={`Gallery item ${index}`}
                          fill
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="absolute top-2 right-2 w-6 h-6 bg-white/20 rounded-md flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
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
