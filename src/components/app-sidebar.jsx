"use client"

import * as React from "react"
import {
  BookOpen,
  Bot,
  Command,
  Frame,
  LifeBuoy,
  Map,
  PieChart,
  Send,
  Settings2,
  SquareTerminal,
  Image as ImageIcon,
  Eraser,
  Scissors,
  Expand,
  Trash2,
  ZoomIn,
  History,
  Clock,
  ChevronRight,
  Brush,
  Stars
} from "lucide-react"
import { useTheme } from '@/hooks/useTheme'
import { collection, query, where, orderBy, limit, getDocs, getCountFromServer } from 'firebase/firestore'
import { db, auth } from '@/firebase/FirebaseConfig'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import GalleryModal from '@/components/GalleryModal'
import { cn } from '@/lib/utils'

import { NavProjects } from "@/components/nav-projects"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

const data = {
  navSecondary: [
    {
      title: "Contact",
      url: "/contact",
      icon: Send,
    },
    {
      title: "About Us",
      url: "/about",
      icon: LifeBuoy,
    },
  ],
  projects: [
    {
      name: "Background Generation",
      url: "/workspace/backgroundgeneration",
      icon: ImageIcon,
    },
    {
      name: "Object Retouch",
      url: "/workspace/objectRetouch",
      icon: Brush,
    },
    {
      name: "Object Removal",
      url: "/dashboard/tools/object-removal",
      icon: Eraser,
    },
    {
      name: "Background Expansion",
      url: "/workspace/backgroundexpansion",
      icon: Expand,
    },
    {
      name: "Background Removal",
      url: "/dashboard/tools/background-remover",
      icon: Scissors,
    },
    {
      name: "Image UpScale",
      url: "/dashboard/tools/image-upscaler",
      icon: Stars,
    },
  ]
}

// Function to convert timestamp to relative time
function getRelativeTime(timestamp) {
  if (!timestamp) return '';
  
  const now = new Date();
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const diffMs = now - date;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return `${Math.floor(diffDays / 7)}w ago`;
}

// Function to get short type name
function getShortTypeName(type) {
  const typeMap = {
    'background-generation': 'BG Gen',
    'background-removed': 'BG Removal',
    'object-removal': 'Obj Removal',
    'image-upscale': 'Upscale',
    'background-expansion': 'Expansion',
    'object-retouch': 'Retouch'
  };
  
  return typeMap[type] || type;
}

export function AppSidebar({
  user,
  ...props
}) {
  const { theme } = useTheme();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [recentGenerations, setRecentGenerations] = useState([]);
  const [totalGenerations, setTotalGenerations] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  
  // Fetch recent generations using the same method as profile page
  useEffect(() => {
    async function fetchUserImages() {
      if (!user?.uid) return;
      
      try {
        setIsLoading(true);
        const userImagesRef = collection(db, 'user_images');
        
        // Get total count first
        const countQuery = query(userImagesRef, where('userID', '==', user.uid));
        const snapshot = await getCountFromServer(countQuery);
        setTotalGenerations(snapshot.data().count);
        
        // Then fetch the actual images
        const q = query(userImagesRef, where('userID', '==', user.uid));
        
        const querySnapshot = await getDocs(q);
        // Map and sort the results
        let images = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            ...data,
            uid: doc.id,
            // Adding processed fields for the sidebar display
            type: getShortTypeName(data.type),
            fullType: data.type,
            url: `/dashboard/gallery/${doc.id}`,
            timestamp: getRelativeTime(data.createdAt)
          };
        });
        
        
        images.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt.toDate ? a.createdAt.toDate() : a.createdAt) : new Date(0);
          const dateB = b.createdAt ? new Date(b.createdAt.toDate ? b.createdAt.toDate() : b.createdAt) : new Date(0);
          return dateB - dateA;
        });
        
        // Take only the first 4 items instead of 7
        setRecentGenerations(images.slice(0, 4));
      } catch (error) {
        console.error("Error fetching user images:", error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchUserImages();
  }, [user?.uid]);
  
  // Handle image click to open gallery modal
  const handleImageClick = (e, image) => {
    e.preventDefault(); // Prevent navigating to the URL
    e.stopPropagation(); // Prevent event bubbling
    setSelectedImage(image);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  // Handle image deletion
  const handleImageDelete = (imageId) => {
    setRecentGenerations(prevImages => prevImages.filter(image => image.uid !== imageId));
    setTotalGenerations(prev => prev - 1);
  };
  
  // Prepare user data for NavUser component with proper fallbacks
  const userData = React.useMemo(() => ({
    name: user?.displayName || "User",
    email: user?.email || "user@example.com",
    avatar: user?.photoURL || "",
    subscriptionStatus: user?.subscriptionStatus || "inactive",
    tokens: user?.tokens || 0
  }), [user?.displayName, user?.email, user?.photoURL, user?.subscriptionStatus, user?.tokens]);

  return (
    <>
      <Sidebar 
        variant="inset" 
        className="bg-[var(--sidebar-background)] text-[color:hsl(var(--sidebar-foreground))] transition-colors duration-200 border-r border-[#00000015] dark:border-[#ffffff15] overflow-hidden flex-shrink-0 h-screen dark:bg-gray-900 bg-gray-50" 
        {...props}
      >
        <SidebarFooter className="bg-[var(--sidebar-background)] dark:bg-gray-900 bg-gray-50">
          <NavUser user={userData} />
        </SidebarFooter>
        <SidebarContent className="bg-[var(--sidebar-background)] overflow-y-auto dark:bg-gray-900 bg-gray-50 scrollbar">
          <NavProjects projects={data.projects} />
          
          {/* Recent Generations Section */}
          <SidebarGroup>
            <SidebarGroupLabel className="text-[color:hsl(var(--sidebar-foreground))]">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4" />
                <span>Recent Generations</span>
              </div>
            </SidebarGroupLabel>
            <SidebarMenu>
              {isLoading ? (
                // Show loading skeletons for 3 items
                Array(3).fill(0).map((_, index) => (
                  <SidebarMenuItem key={`skeleton-${index}`}>
                    <div className={cn(
                      "flex items-center gap-3 p-3",
                      isCollapsed && "justify-center"
                    )}>
                      <div className="w-10 h-10 bg-gray-300 dark:bg-gray-700 animate-pulse rounded-md"></div>
                      {!isCollapsed && (
                        <>
                          <div className="flex-1 h-5 bg-gray-300 dark:bg-gray-700 animate-pulse rounded"></div>
                          <div className="w-12 h-4 bg-gray-300 dark:bg-gray-700 animate-pulse rounded"></div>
                        </>
                      )}
                    </div>
                  </SidebarMenuItem>
                ))
              ) : recentGenerations.length > 0 ? (
                // Show actual generations
                <>
                  {recentGenerations.map((gen) => (
                    <SidebarMenuItem key={gen.uid} className="mb-2">
                      <div className="px-2">
                        <div 
                          className={cn(
                            "flex items-center gap-3 text-sidebar-muted hover:text-sidebar-foreground font-medium cursor-pointer",
                            isCollapsed && "justify-center"
                          )}
                          onClick={(e) => handleImageClick(e, gen)}
                        >
                          <div className="w-10 h-10 rounded-md overflow-hidden bg-gray-300 flex-shrink-0 border border-gray-400 dark:border-gray-700">
                            {gen.img_data ? (
                              <img 
                                src={gen.img_data} 
                                alt={gen.type} 
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect width='18' height='18' x='3' y='3' rx='2' ry='2'/%3E%3Ccircle cx='9' cy='9' r='2'/%3E%3Cpath d='m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21'/%3E%3C/svg%3E";
                                }}
                              />
                            ) : (
                              <ImageIcon className="w-10 h-10 text-gray-500" />
                            )}
                          </div>
                          {!isCollapsed && (
                            <>
                              <div className="flex flex-col flex-1 min-w-0">
                                <span className="truncate max-w-[80px] text-sm font-medium">{gen.type}</span>
                                <span className="text-xs text-sidebar-muted-foreground">{gen.timestamp}</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </SidebarMenuItem>
                  ))}
                  
                  {/* More link to profile */}
                  {totalGenerations > 4 && (
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild tooltip="View all generations">
                        <Link 
                          href="/dashboard/profile" 
                          className={cn(
                            "flex items-center gap-3 text-sidebar-muted hover:text-sidebar-foreground font-medium bg-gray-800/20 dark:bg-gray-800/30 rounded-md mt-2",
                            isCollapsed 
                              ? "justify-center p-2" 
                              : "justify-between p-3"
                          )}
                        >
                          {isCollapsed ? (
                            <span className="sr-only">View all images</span>
                          ) : (
                            <span className="text-sm">View all {totalGenerations} images</span>
                          )}
                          <ChevronRight className={cn("h-4 w-4", isCollapsed && "mx-auto")} />
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                </>
              ) : (
                // No generations found
                <SidebarMenuItem>
                  <div className={cn(
                    "p-2 flex items-center justify-center",
                    isCollapsed ? "h-10" : "px-2 py-1"
                  )}>
                    {isCollapsed ? (
                      <ImageIcon className="w-5 h-5 text-sidebar-muted-foreground opacity-70" />
                    ) : (
                      <span className="text-xs text-sidebar-muted-foreground">No recent generations</span>
                    )}
                  </div>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroup>
          
          <NavSecondary items={data.navSecondary} className="mt-auto" />
        </SidebarContent>
      </Sidebar>

      {/* Gallery Modal */}
      {showModal && (
        <GalleryModal
          closeModal={closeModal}
          image={selectedImage}
          onDelete={handleImageDelete}
        />
      )}
    </>
  );
}
