'use client';
import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/FirebaseConfig'; // Firebase config import
import Pin from '@/components/Pin'; // Pin is the component to render each post
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ViewModal from '@/components/ViewModal';
import '../style.css'; 
import { cn } from '@/lib/utils';
import Image from "next/image";
import Masonry from 'react-responsive-masonry'; // Import Masonry component


function Page() {
  const [posts, setPosts] = useState([]);  // State to hold fetched posts
  const [loading, setLoading] = useState(true);  // State for loading state
  const [showModal, setShowModal] = useState(false);  // To control modal visibility
  const [selectedImage, setSelectedImage] = useState(null);  // Store selected image data
  const [selectedCategory, setSelectedCategory] = useState(null);  // State to track the selected category
  const categories = [
    { id: 'skincare', label: 'Skincare' },
    { id: 'candles', label: 'Candles' },
    { id: 'furniture', label: 'Furniture' },
    { id: 'jewellery', label: 'Jewellery' },
    { id: 'bags', label: 'Bags' },
  ];

  useEffect(() => {
    // Fetch community posts from the correct Firestore collection
    const fetchPosts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'community'));
        const postsArray = [];
        querySnapshot.forEach((doc) => {
          postsArray.push({ id: doc.id, ...doc.data() });
        });
        setPosts(postsArray);  // Set posts to state
      } catch (e) {
        console.error("Error fetching community posts: ", e);
      } finally {
        setLoading(false);  // Set loading to false after fetching
      }
    };
  
    fetchPosts();
  }, []);

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


  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-gray-900 via-gray-800 to-black text-white font-sans relative overflow-hidden">
      <Navbar />
      <main>
        <div className="flex justify-center mb-8">
          <div className="flex rounded-full bg-black/40 p-1">
            {/* Category buttons */}
            {categories.map((category) => (
              <button
                key={category.id}
                className={cn('px-8 py-3 text-lg transition-all rounded-full relative',
                  selectedCategory === category.id
                    ? 'bg-[#EBDDF7] text-black'
                    : 'text-gray-400 hover:text-white',
                )}
                onClick={() => setSelectedCategory(selectedCategory === category.id ? null : category.id)} // Toggle category selection
              > 
                {category.label}
              </button>
            ))}
            {/* All Images button */}
            <button
              className={cn('px-8 py-3 text-lg transition-all rounded-full relative',
                selectedCategory === null ? 'bg-[#EBDDF7] text-black' : 'text-gray-400 hover:text-white',
              )}
              onClick={() => setSelectedCategory(null)} // Show all posts
            >
              All Images
            </button>
          </div>
        </div>

        <div className="p-4">
          {/* Masonry grid container */}
          <Masonry columnsCount={4} gutter="10px">
            {posts.map((post, i) => (
              <div key={i} onClick={() => handleImageClick(post)} className='cursor-pointer'>
                <Image
                  src={post.img_data} // Image URL
                  alt={post.title} // Image alt text
                  width={400} // Specify the width
                  height={400} // Specify the height
                  style={{ width: "100%", display: "block", borderRadius: "5%" }} // Ensure the image fills the width of the container
                />
              </div>
            ))}
          </Masonry>
        </div>
      </main>
      <Footer />
      {showModal && (
        <ViewModal
            closeModal={closeModal}
            image={selectedImage}
        />
      )}

    </div>
      
      
  );
}

export default Page;


