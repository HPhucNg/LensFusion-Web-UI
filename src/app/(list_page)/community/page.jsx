'use client';
import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/FirebaseConfig'; // Firebase config import
import Pin from '@/components/Pin'; // Pin is the component to render each post
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ViewModal from '@/components/ViewModal';
import '../style.css'; 

function Page() {
  const [posts, setPosts] = useState([]);  // State to hold fetched posts
  const [loading, setLoading] = useState(true);  // State for loading state
  const [showModal, setShowModal] = useState(false);  // To control modal visibility
  const [selectedImage, setSelectedImage] = useState(null);  // Store selected image data
  const [error, setError] = useState(null);  // State for error handling

  useEffect(() => {
    // Fetch community posts from the correct Firestore collection
    const fetchPosts = async () => {
      try {
        setLoading(true);
        setError(null);
        const querySnapshot = await getDocs(collection(db, 'community'));
        const postsArray = [];
        querySnapshot.forEach((doc) => {
          postsArray.push({ id: doc.id, ...doc.data() });
        });
        setPosts(postsArray);  // Set posts to state
      } catch (e) {
        console.error("Error fetching community posts: ", e);
        setError("Failed to load community posts. Please try again later.");
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-gray-900 via-gray-800 to-black text-white font-sans flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-gray-900 via-gray-800 to-black text-white font-sans flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-r from-gray-900 via-gray-800 to-black text-white font-sans relative overflow-hidden">
      <Navbar />
      
      <div className="mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8">Community Posts</h1>
        <div className="pin_container">
          {/* Display each post using the Pin component */}
          {posts.map((post) => (
            <div key={post.id} onClick={() => handleImageClick(post)} className="cursor-pointer">
              <Pin pinDetails={post} />
            </div>
          ))}
        </div>
      </div>
      
      <Footer />
      {showModal && (
        <ViewModal
            closeModal={closeModal}
            image={selectedImage}
            isPublic={true}
        />
      )}
    </main>
  );
}

export default Page;


