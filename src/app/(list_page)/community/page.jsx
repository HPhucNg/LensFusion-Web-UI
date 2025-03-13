'use client';
import { useState, useEffect, useRef } from 'react';
import { collection, getDocs, query, orderBy, startAfter, limit } from 'firebase/firestore';
import { db } from '@/firebase/FirebaseConfig'; 
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ViewModal from '@/components/ViewModal';
import Pin from '@/components/Pin'; 
import '../style.css'; 
import { cn } from '@/lib/utils';
import Masonry from 'react-responsive-masonry'; 


function Page() {
  const [posts, setPosts] = useState([]);  // hold fetched posts
  const [loading, setLoading] = useState(true);  // loading state
  const [showModal, setShowModal] = useState(false);  // control modal visibility
  const [selectedImage, setSelectedImage] = useState(null);  // selected image data
  const [selectedCategory, setSelectedCategory] = useState(null);  // track the selected category
  const [lastVisible, setLastVisible] = useState(null); // store the last fetched document for pagination
  const [currentIndex, setCurrentIndex] = useState(null); // hold the current image's index


  const [columns, setColumns] = useState(4); // default to 4 columns

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 640) { // small screens
        setColumns(2);  // 2 column on small screens
      } else if (window.innerWidth <= 1024) { // medium screens
        setColumns(3);  // 3 columns on medium screens
      } else { // large screens
        setColumns(4);  // 4 columns on large screens
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // call once to set initial column count

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
  const scrollContainerRef = useRef(null);  // reference to the scroll container
 
  useEffect(() => {
    // fetch initial posts from Firestore
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const postsQuery = query(
          collection(db, 'community'),
          orderBy('createdAt'),  // order by timestamp or any field for pagination
          limit(20)  // fetch only the first 20 posts for the initial load
        );
        const querySnapshot = await getDocs(postsQuery);
        const postsArray = [];
        querySnapshot.forEach((doc) => {
          postsArray.push({ id: doc.id, ...doc.data() });
        });
        setPosts(postsArray);  // set posts to state
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
    if (loading || !lastVisible) return;  // prevent multiple fetches at once

    setLoading(true);
    try {
      const postsQuery = query(
        collection(db, 'community'),
        orderBy('createdAt'),
        startAfter(lastVisible),  // start after the last visible document
        limit(20)  // fetch the next 20 posts
      );

      const querySnapshot = await getDocs(postsQuery);
      const postsArray = [];
      querySnapshot.forEach((doc) => {
        postsArray.push({ id: doc.id, ...doc.data() });
      });

      setPosts((prevPosts) => [...prevPosts, ...postsArray]);  // append the new posts to the existing ones
      setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);  // update last visible document
    } catch (e) {
      console.error("Error fetching more posts: ", e);
    } finally {
      setLoading(false);
    }
  };

  const modalRef = useRef(null); // to handle jumping up to viewmodal
  const handleImageClick = (image, index) => {
    setSelectedImage(image);
    setCurrentIndex(index); 
    setShowModal(true);  
    if (modalRef.current) {
      modalRef.current.scrollIntoView({
        behavior: 'smooth', // smooth scroll to modal
        block: 'start',     // align the modal at the top
      });
    }
  };

  const closeModal = () => {
    setShowModal(false);  
    setSelectedImage(null); // reset selected image
}


  // filter posts based on the selected category
  const filteredPosts = selectedCategory
    ? posts.filter((post) => post.category === selectedCategory)
    : posts;  // all posts if no category is selected

  // scroll event to detect when to fetch more posts
  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // if the user is near the bottom of the page 
    if (container.scrollTop + container.clientHeight >= container.scrollHeight - 100) {
      // trigger fetching more posts when scrolled near the bottom
      fetchMorePosts();
    }
  };

  

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
     <div className="min-h-screen bg-gradient-to-r from-gray-900 via-gray-800 to-black font-sans relative overflow-hidden">
        <Navbar />
        <div className='flex justify-center mb-6' ref={modalRef}>
          {showModal && (
          <ViewModal
              closeModal={closeModal}
              image={selectedImage}
              posts={posts} 
              currentIndex={currentIndex} 
              setCurrentIndex={setCurrentIndex} 
          />
        )}
        </div>
        <div className='flex justify-center pb-4'>
          <div className="flex flex-wrap justify-center gap-4 rounded-full bg-[var(--card-background)] p-2">
            {/* category buttons */}
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
            {/* all images button */}
              <button
                className={cn('px-6 py-2 text-base sm:text-lg transition-all rounded-full relative', 
                  selectedCategory === null ? 'bg-[#EBDDF7] text-black' : 'text-gray-400 hover:text-white')}
                onClick={() => setSelectedCategory(null)} // all posts
              >
                All Images
              </button>
            </div>
        </div>
        
        <div className="flex justify-center px-4"> {/* to center */}
          <div className="p-2 max-w-[1270px] w-full"> {/* make width is responsive */}
            {/* masonry grid container */}
            <Masonry columnsCount={columns} gutter="10px">
              {filteredPosts.map((post, index) => (
                <div key={post.id} onClick={() => handleImageClick(post, index)} className="cursor-pointer">
                  <Pin image={post} />
                </div>
              ))}
            </Masonry>
          </div>
        </div>
        <Footer />

      {/*{selectedImage && <Pin image={selectedImage} />}*/}

    </div>
      
      
  );
}
export default Page;


