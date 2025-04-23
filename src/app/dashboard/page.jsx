"Acquire API key from: https://imggen.ai/api"


'use client';
import React, { useState, useEffect } from "react";
import { AppSidebar } from "@/components/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import ScrollToTop from "@/components/ScrollToTop";
import Image from "next/image";
import { auth, db } from "@/firebase/FirebaseConfig";
import { doc, getDoc, onSnapshot, collection, query, orderBy, getDocs } from "firebase/firestore";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import ViewModal from "@/components/ViewModal";
import Pin from "@/components/Pin";
import Masonry from "react-responsive-masonry";

// Create a MobileTrigger component to handle conditional rendering
function MobileTrigger() {
  const { openMobile } = useSidebar();
  
  // Only show trigger when sidebar is closed on mobile
  if (openMobile) return null;
  
  return (
    <div className="fixed top-4 left-4 z-[100] md:hidden">
      <SidebarTrigger className="bg-gray-700/70 hover:bg-gray-700 text-white rounded-md shadow-md backdrop-blur-sm" />
    </div>
  );
}

export default function Page() {
  const [user, setUser] = useState(null);
  const [tokens, setTokens] = useState(0);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [columns, setColumns] = useState(4); // default to 4 columns

  // Handle responsive columns
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 640) { // small screens
        setColumns(2);  // 2 column on small screens
      } else if (window.innerWidth <= 1024) { // medium screens
        setColumns(3);  // 3 columns on medium screens
      } else if (window.innerWidth <= 1200) { // medium-large screens
        setColumns(4); 
      } else { // large screens
        setColumns(5);  // 5 columns on large screens
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // call once to set initial column count

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Fetch posts from Firestore - only community posts
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        // Get posts from community collection
        const communityRef = collection(db, "community");
        const q = query(communityRef, orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        
        const fetchedPosts = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        
        setPosts(fetchedPosts);
      } catch (error) {
        console.error("Error fetching community posts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
        if (currentUser) {
            const userRef = doc(db, "users", currentUser.uid);
            const unsubscribeSnapshot = onSnapshot(userRef, (userDoc) => {
              if (userDoc.exists()) {
              const userData = userDoc.data();
              // Merge user auth data with Firestore data
              setUser({
                ...currentUser,
                subscriptionStatus: userData.subscriptionStatus || "inactive",
                tokens: userData.tokens || 0
              });
              setTokens(userData.tokens || 0);
                setLoading(false);
              }
            });
            return () => unsubscribeSnapshot();
          } else {
            setUser(null); 
            setLoading(false);
          }
        });
      
        return () => unsubscribe();
      }, []);

  const router = useRouter();

  const openModal = (index) => {
    setCurrentIndex(index);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  return (
    <div className="relative">
      <SidebarProvider defaultOpen={true}>
        <AppSidebar user={user} />
        
        {/* Mobile-only sidebar trigger that hides when sidebar is open */}
        <MobileTrigger />
        
        <SidebarInset className="overflow-y-auto">
          <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-black text-white min-h-screen pb-16 md:pb-0">
            {/* Add padding to account for fixed header */}
            <div className="pt-8">
              <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                {/* Featured Banner */}
                <div className="relative w-full h-[300px] md:h-[400px] rounded-2xl overflow-hidden mb-12">
                  {/* Background Image */}
                  <div className="absolute inset-0">
                    <div className="w-full h-full bg-gradient-to-r from-gray-700 via-gray-600 to-gray-800 flex items-center justify-center">
                      <svg 
                        className="w-24 h-24 text-gray-400 opacity-30" 
                        xmlns="http://www.w3.org/2000/svg" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={1.5} 
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
                        />
                      </svg>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent"></div>
                  </div>
                  
                  {/* Banner Content */}
                  <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-16">
                    {/* Tab Navigation */}
                    <div className="flex gap-3 mb-6">
                      <div className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-medium">
                        LensFusion 2.0
                      </div>
                      <div className="bg-gray-700/50 backdrop-blur-sm text-gray-200 px-4 py-2 rounded-full text-sm font-medium">
                        Background Generation
                      </div>
                      <div className="bg-gray-700/50 backdrop-blur-sm text-gray-200 px-4 py-2 rounded-full text-sm font-medium">
                        Object Removal
                      </div>
                    </div>
                    
                    {/* Title and Description */}
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                      LensFusion 2.0
                    </h2>
                    <p className="text-xl md:text-2xl text-gray-100 mb-8 max-w-xl">
                      Transform Your Vision, Perfect Every Pixel
                    </p>
                    
                    {/* Call to Action */}
                    <div>
                      <Link 
                        href="/workspace/backgroundgeneration" 
                        className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg text-base transition-colors duration-300 inline-flex items-center"
                      >
                        Start Creating
                        <svg className="w-5 h-5 ml-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>
                
                <h1 className="text-2xl font-bold mb-8">Discover Creations</h1>
                
                {/* Masonry Grid Layout for Images */}
                <div className="flex justify-center px-4 w-full">
                  <div className="p-2 w-full max-w-[1550px]">
                    {loading ? (
                      <div className="text-center py-20">
                        <div className="spinner"></div>
                        <p className="text-xl text-gray-400 mt-4">Loading community creations...</p>
                      </div>
                    ) : posts.length > 0 ? (
                      <Masonry columnsCount={columns} gutter="10px">
                        {posts.map((post, index) => (
                          <div key={post.id} onClick={() => openModal(index)} className="cursor-pointer">
                            <Pin image={post} />
                          </div>
                        ))}
                      </Masonry>
                    ) : (
                      <div className="text-center py-20">
                        <p className="text-xl text-gray-400">No images found in the community.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
      
      {/* View Modal */}
      {showModal && posts.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
          <ViewModal 
            closeModal={closeModal} 
            image={posts[currentIndex]} 
            posts={posts} 
            currentIndex={currentIndex} 
            setCurrentIndex={setCurrentIndex} 
          />
        </div>
      )}
      
      <ScrollToTop/>
    </div>
  );
}