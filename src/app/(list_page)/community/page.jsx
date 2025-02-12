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

  useEffect(() => {
    // Fetch community posts from the correct Firestore collection
    const fetchPosts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'pins'));
        const postsArray = [];
        querySnapshot.forEach((doc) => {
          postsArray.push({ id: doc.id, ...doc.data() });
        });
        setPosts(postsArray);  // Set posts to state
      } catch (e) {
        console.error("Error fetching posts: ", e);
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
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
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
        />
      )}
    </main>
  );
}

export default Page;


