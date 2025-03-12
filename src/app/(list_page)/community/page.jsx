'use client';
import { useState, useEffect, useRef } from 'react';
import { collection, getDocs, query, orderBy, startAfter, limit } from 'firebase/firestore';
import { db } from '@/firebase/FirebaseConfig'; // Firebase config import
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ViewModal from '@/components/ViewModal';
import Pin from '@/components/Pin'; 
import '../style.css'; 
import { cn } from '@/lib/utils';
import Masonry from 'react-responsive-masonry'; // Import Masonry component
import { Nav } from 'react-day-picker';


function Page() {
  const [posts, setPosts] = useState([]);  // State to hold fetched posts
  const [loading, setLoading] = useState(true);  // State for loading state
  const [showModal, setShowModal] = useState(false);  // To control modal visibility
  const [selectedImage, setSelectedImage] = useState(null);  // Store selected image data
  const [selectedCategory, setSelectedCategory] = useState(null);  // State to track the selected category
  const [lastVisible, setLastVisible] = useState(null); // To store the last fetched document for pagination


  const [columns, setColumns] = useState(4); // Default to 4 columns

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 640) { // Small screens
        setColumns(1);  // 1 column on small screens
      } else if (window.innerWidth <= 1024) { // Medium screens
        setColumns(2);  // 2 columns on medium screens
      } else { // Large screens
        setColumns(4);  // 4 columns on large screens
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Call once to set initial column count

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const categories = [
    { id: 'skincare', label: 'Skincare' },
    { id: 'candles', label: 'Candles' },
    { id: 'furniture', label: 'Furniture' },
    { id: 'jewellery', label: 'Jewellery' },
    { id: 'bags', label: 'Bags' },
  ];
  const scrollContainerRef = useRef(null);  // Create a reference to the scroll container
 
  useEffect(() => {
    // Fetch initial posts from Firestore
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const postsQuery = query(
          collection(db, 'community'),
          orderBy('createdAt'),  // Order by timestamp or any field for pagination
          limit(20)  // Fetch only the first 20 posts for the initial load
        );
        const querySnapshot = await getDocs(postsQuery);
        const postsArray = [];
        querySnapshot.forEach((doc) => {
          postsArray.push({ id: doc.id, ...doc.data() });
        });
        setPosts(postsArray);  // Set posts to state
        setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);  // Save the last visible document for pagination
      } catch (e) {
        console.error("Error fetching posts: ", e);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const fetchMorePosts = async () => {
    if (loading || !lastVisible) return;  // Prevent multiple fetches at once

    setLoading(true);
    try {
      const postsQuery = query(
        collection(db, 'community'),
        orderBy('createdAt'),
        startAfter(lastVisible),  // Start after the last visible document
        limit(20)  // Fetch the next 20 posts
      );

      const querySnapshot = await getDocs(postsQuery);
      const postsArray = [];
      querySnapshot.forEach((doc) => {
        postsArray.push({ id: doc.id, ...doc.data() });
      });

      setPosts((prevPosts) => [...prevPosts, ...postsArray]);  // Append the new posts to the existing ones
      setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);  // Update last visible document
    } catch (e) {
      console.error("Error fetching more posts: ", e);
    } finally {
      setLoading(false);
    }
  };

  // Function to handle image click
  const handleImageClick = (image) => {
    setSelectedImage(image);
    setShowModal(true);  // Show the modal
  };

  const closeModal = () => {
    setShowModal(false);  // Hide modal
    setSelectedImage(null); // Reset selected image
}


  // Filter posts based on the selected category
  const filteredPosts = selectedCategory
    ? posts.filter((post) => post.category === selectedCategory)
    : posts;  // Show all posts if no category is selected

  // Handle scroll event to detect when to fetch more posts
  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Check if the user is near the bottom of the page (adjust the threshold)
    if (container.scrollTop + container.clientHeight >= container.scrollHeight - 100) {
      // Trigger fetching more posts when scrolled near the bottom
      fetchMorePosts();
    }
  };

  

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
     <div className="min-h-screen bg-gradient-to-r from-gray-900 via-gray-800 to-black font-sans relative overflow-hidden">
        <Navbar />
        <div className='flex justify-center mb-6'>
          {showModal && (
          <ViewModal
              closeModal={closeModal}
              image={selectedImage}
          />
        )}
      </div>
        <div className='flex justify-center pb-4'>
          <div className="flex flex-wrap justify-center gap-4 rounded-full bg-[var(--card-background)] p-2">
            {/* Category buttons */}
            {categories.map((category) => (
              <button
                key={category.id}
                className={cn('px-6 py-2 text-base sm:px-8 sm:py-3 sm:text-lg transition-all rounded-full relative',
                  selectedCategory === category.id ? 'bg-[#EBDDF7] text-black' : 'text-gray-400 hover:text-white')}
                onClick={() => setSelectedCategory(selectedCategory === category.id ? null : category.id)} // Toggle category selection
              >
                {category.label}
              </button>
            ))}
            {/* All Images button */}
              <button
                className={cn('px-6 py-2 text-base sm:text-lg transition-all rounded-full relative', 
                  selectedCategory === null ? 'bg-[#EBDDF7] text-black' : 'text-gray-400 hover:text-white')}
                onClick={() => setSelectedCategory(null)} // Show all posts
              >
                All Images
              </button>
            </div>
        </div>
        
        <div className='flex flex-grow p-2'>
          {/* Masonry grid container */}
          <Masonry columnsCount={columns} gutter="10px">
            {filteredPosts.map((post) => (
              <div key={post.id} onClick={() => handleImageClick(post)} className='cursor-pointer'>
                <Pin image={post}/>
                </div>
            ))}
          </Masonry>
        </div>

        <Footer />

      {/*{selectedImage && <Pin image={selectedImage} />}*/}

    </div>
      
      
  );
}
export default Page;


