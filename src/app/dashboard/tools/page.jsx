'use client';

import React, { useState, useEffect } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { MobileNav } from "@/components/mobile-nav";
import Image from "next/image";
import Link from "next/link";
import { 
  Image as ImageIcon, 
  Scissors, 
  Trash2, 
  ZoomIn, 
  Eraser,
  Expand,
  ArrowLeft
} from "lucide-react";
import { auth, db } from "@/firebase/FirebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { useTheme } from '@/hooks/useTheme';

export default function ToolsPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        const userRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          setUser({
            ...currentUser,
            subscriptionStatus: userDoc.data().subscriptionStatus || "inactive",
            tokens: userDoc.data().tokens || 0
          });
        }
        setLoading(false);
      } else {
        setUser(null);
        setLoading(false);
      }
    });
    
    return () => unsubscribe();
  }, []);

  const tools = [
    {
      id: "background-generation",
      name: "Background Generation",
      description: "Generate custom backgrounds for your images",
      icon: ImageIcon,
      path: "/workspace/backgroundgeneration",
      color: "from-blue-500 to-purple-600"
    },
    {
      id: "background-remover",
      name: "Background Remover",
      description: "Remove backgrounds from images with AI",
      icon: Scissors,
      path: "/dashboard/tools/background-remover",
      color: "from-green-500 to-teal-600"
    },
    {
      id: "object-removal",
      name: "Object Removal",
      description: "Remove unwanted objects from your images",
      icon: Trash2,
      path: "/dashboard/tools/object-removal",
      color: "from-red-500 to-orange-600"
    },
    {
      id: "image-upscaler",
      name: "Image Upscaler",
      description: "Enhance image resolution and quality",
      icon: ZoomIn,
      path: "/dashboard/tools/image-upscaler",
      color: "from-purple-500 to-pink-600"
    },
    {
      id: "object-retouch",
      name: "Object Retouch",
      description: "Touch up and enhance objects in your images",
      icon: Eraser,
      path: "/workspace/objectRetouch",
      color: "from-yellow-500 to-amber-600"
    },
    {
      id: "background-expansion",
      name: "Background Expansion",
      description: "Expand the background of your images",
      icon: Expand,
      path: "/workspace/backgroundexpansion",
      color: "from-indigo-500 to-blue-600"
    }
  ];

  return (
    <div className="relative">
      <SidebarProvider defaultOpen={true}>
        <AppSidebar user={user} />
        <SidebarInset className="overflow-y-auto">
          <div className={`min-h-screen pb-16 md:pb-0 ${
            isDarkMode 
            ? 'bg-gradient-to-r from-gray-900 via-gray-800 to-black text-white' 
            : 'bg-gradient-to-r from-gray-100 via-gray-50 to-white text-gray-800'
          }`}>
            <header className={`w-full flex h-16 shrink-0 items-center justify-between px-4 sticky top-0 z-10 backdrop-blur-sm ${
              isDarkMode 
              ? 'bg-gradient-to-r from-gray-900/90 via-gray-800/90 to-black/90' 
              : 'bg-gradient-to-r from-gray-100/90 via-gray-50/90 to-white/90'
            }`}>
              <div className="flex items-center gap-4">
                <Link href="/dashboard" className={`flex items-center ${
                  isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                }`}>
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  <span className="font-medium">Back</span>
                </Link>
                <h1 className="text-xl font-bold">AI Tools</h1>
              </div>
              <div className="flex items-center">
                <SidebarTrigger className="relative" />
              </div>
            </header>
            
            <div className="container mx-auto px-4 py-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {tools.map((tool) => (
                  <Link
                    key={tool.id}
                    href={tool.path}
                    className={`group p-6 rounded-xl border transition-all duration-300 hover:shadow-xl ${
                      isDarkMode 
                      ? 'border-gray-700 hover:border-gray-500 bg-gray-800/40' 
                      : 'border-gray-200 hover:border-gray-400 bg-white'
                    }`}
                  >
                    <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${tool.color} mb-4`}>
                      <tool.icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {tool.name}
                    </h3>
                    <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                      {tool.description}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
      <MobileNav user={user} />
    </div>
  );
} 