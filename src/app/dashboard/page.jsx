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
import { doc, getDoc, onSnapshot, collection, query, orderBy, getDocs, where } from "firebase/firestore";
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

// Define the categories for filtering
const categories = [
  { id: 'all', label: 'All', color: '#B9EF9B' },
  { id: 'skincare', label: 'Skincare', color: '#E6CCB1' },
  { id: 'candles', label: 'Candles', color: '#E6E0B1' },
  { id: 'furniture', label: 'Furniture', color: '#B1DBE6' },
  { id: 'cars', label: 'Cars', color: '#C7B1E6' },
  { id: 'bags', label: 'Bags', color: '#B8B1E6' },
  { id: 'jewelry', label: 'Jewelry', color: '#E6B1D8' },
  { id: 'shoes', label: 'Shoes', color: '#B1E6C2' },
  { id: 'watches', label: 'Watches', color: '#E6D8B1' },
  { id: 'toys', label: 'Toys', color: '#E6B1B1' },
  { id: 'electronics', label: 'Electronics', color: '#B1C7E6' },
  { id: 'others', label: 'Others', color: '#D9B1E6' },
];

// Sort options
const sortOptions = [
  { id: 'latest', label: 'Latest' },
  { id: 'popular', label: 'Popular' },
];

export default function Page() {
  const [user, setUser] = useState(null);
  const [tokens, setTokens] = useState(0);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [columns, setColumns] = useState(4); // default to 4 columns
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('latest');

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

  // Filter and sort posts
  useEffect(() => {
    // First filter by category
    let filtered = [...posts];
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(post => post.category === selectedCategory);
    }
    
    // Then sort based on sortBy option
    if (sortBy === 'popular') {
      filtered.sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0));
    } else {
      // Sort by latest (default)
      filtered.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);
    }
    
    setFilteredPosts(filtered);
  }, [selectedCategory, sortBy, posts]);

  // Fetch posts from Firestore with likes count
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        // Get posts from community collection
        const communityRef = collection(db, "community");
        const q = query(communityRef, orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        
        const postsWithoutLikes = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          likesCount: 0 // Initialize with 0
        }));
        
        // Get likes count for each post
        const postsWithLikes = await Promise.all(
          postsWithoutLikes.map(async (post) => {
            const likesRef = collection(db, "community", post.id, "likes");
            const likesSnapshot = await getDocs(likesRef);
            return {
              ...post,
              likesCount: likesSnapshot.size
            };
          })
        );
        
        setPosts(postsWithLikes);
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

  // Handle category selection
  const handleCategoryClick = (categoryId) => {
    setSelectedCategory(categoryId);
  };

  // Handle sort option change
  const handleSortChange = (sortId) => {
    setSortBy(sortId);
  };

  return (
    <div className="relative">
      <SidebarProvider defaultOpen={true}>
        <AppSidebar user={user} />
        
        {/* Mobile-only sidebar trigger that hides when sidebar is open */}
        <MobileTrigger />
        
        <SidebarInset className="overflow-y-auto">
          <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-black text-white min-h-screen pb-16 md:pb-0 dark:bg-gradient-to-r dark:from-gray-900 dark:via-gray-800 dark:to-black dark:text-white">
            {/* Add padding to account for fixed header */}
            <div className="pt-8">
              <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                {/* Featured Banner */}
                <div className="relative w-full h-[300px] md:h-[400px] lg:h-[500px] xl:h-[600px] rounded-2xl overflow-hidden mb-12 bg-black">
                  {/* Background Video */}
                  <div className="absolute inset-0">
                    <video 
                      className="w-full h-full object-cover"
                      autoPlay
                      loop
                      muted
                      playsInline
                    >
                      <source src="https://firebasestorage.googleapis.com/v0/b/lensfusion-fc879.firebasestorage.app/o/public_resources%2Fdashboard%2Fvideo%2Fhero1.mp4?alt=media&token=fadaf77f-d7d9-469f-bed9-3b63c2618a59" type="video/mp4" />
                    </video>
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.7), rgba(0,0,0,0.4), transparent)' }}></div>
                  </div>
                  
                  {/* Banner Content */}
                  <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-8 md:px-16 lg:px-20">
                    {/* Tab Navigation */}
                    {/* <div className="flex gap-3 mb-6">
                      <div className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-medium">
                        LensFusion 2.0
                      </div>
                      <div className="bg-gray-700/50 backdrop-blur-sm text-gray-200 px-4 py-2 rounded-full text-sm font-medium">
                        Background Generation
                      </div>
                      <div className="bg-gray-700/50 backdrop-blur-sm text-gray-200 px-4 py-2 rounded-full text-sm font-medium">
                        Object Removal
                      </div>
                    </div> */}
                    
                    {/* Title and Description */}
                    <div className="max-w-[50%] lg:max-w-[40%]">
                      <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-bold text-white mb-2 sm:mb-4">
                        LensFusion
                      </h2>
                      <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-100 mb-4 sm:mb-6">
                        Transform Your Vision, Perfect Every Pixel
                      </p>
                      
                      {/* Call to Action */}
                      <div>
                        <Link 
                          href="/workspace/backgroundgeneration" 
                          className="bg-purple-600 hover:bg-purple-700 text-white px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-lg text-sm sm:text-base transition-colors duration-300 inline-flex items-center"
                        >
                          Start Creating
                          <svg className="w-4 h-4 sm:w-5 sm:h-5 ml-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center mb-4">
                  <h1 className="text-2xl font-bold">Discover Creations</h1>
                  
                  {/* Sort Options */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400">Sort by:</span>
                    <div className="flex rounded-lg overflow-hidden border border-gray-700">
                      {sortOptions.map((option) => (
                        <button
                          key={option.id}
                          onClick={() => handleSortChange(option.id)}
                          className={`px-3 py-1.5 text-sm transition-colors ${
                            sortBy === option.id 
                              ? 'bg-gray-700 text-white' 
                              : 'bg-transparent text-gray-400 hover:bg-gray-800'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Category Filter Buttons */}
                <div className="mb-8">
                  <div className="mb-3">
                    <h2 className="text-sm font-medium text-gray-400">Filter by category:</h2>
                  </div>
                  <div className="flex flex-wrap gap-2 sm:gap-3 overflow-x-auto pb-3 -mx-2 px-2 scrollbar-thin">
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => handleCategoryClick(category.id)}
                        className={`px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm rounded-full transition-all duration-300 ease-in-out transform hover:scale-105 flex items-center justify-center whitespace-nowrap shadow-sm ${
                          selectedCategory === category.id 
                            ? 'font-medium ring-2 ring-white/20 ring-offset-1 ring-offset-transparent' 
                            : 'font-normal hover:shadow-md'
                        }`}
                        style={{
                          backgroundColor: selectedCategory === category.id ? category.color : 'rgba(255, 255, 255, 0.07)',
                          color: selectedCategory === category.id ? '#141823' : 'white',
                          backdropFilter: 'blur(8px)',
                          minWidth: category.id === 'all' ? '60px' : '80px',
                          animation: selectedCategory === category.id ? 'tagPulse 2s infinite' : 'none'
                        }}
                      >
                        {category.label}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Masonry Grid Layout for Images */}
                <div className="flex justify-center px-4 w-full">
                  <div className="p-2 w-full max-w-[1550px]">
                    {loading ? (
                      <div className="text-center py-20">
                        <div className="spinner"></div>
                        <p className="text-xl text-gray-400 mt-4">Loading community creations...</p>
                      </div>
                    ) : filteredPosts.length > 0 ? (
                      <Masonry columnsCount={columns} gutter="10px">
                        {filteredPosts.map((post, index) => (
                          <div key={post.id} onClick={() => openModal(index)} className="cursor-pointer">
                            <Pin image={post} />
                          </div>
                        ))}
                      </Masonry>
                    ) : (
                      <div className="text-center py-20">
                        <p className="text-xl text-gray-400">
                          {selectedCategory === 'all' 
                            ? "No images found in the community." 
                            : `No ${selectedCategory} images found in the community.`}
                        </p>
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
      {showModal && filteredPosts.length > 0 && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4"
          onClick={() => closeModal()} // Close modal when clicking on backdrop
        >
          <ViewModal 
            closeModal={closeModal} 
            image={filteredPosts[currentIndex]} 
            posts={filteredPosts} 
            currentIndex={currentIndex} 
            setCurrentIndex={setCurrentIndex} 
          />
        </div>
      )}
      
      <ScrollToTop/>
    </div>
  );
}