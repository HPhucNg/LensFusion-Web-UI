import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/FirebaseConfig';  // Firebase config import
import Pin from './Pin';  // Component to display individual pin
import Navbar from './Navbar';
import Footer from './Footer';

function CommunityPage() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch posts from Firestore
        const fetchPosts = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, 'pins_test'));
                const postsArray = [];
                querySnapshot.forEach((doc) => {
                    postsArray.push({ id: doc.id, ...doc.data() });
                });
                setPosts(postsArray);  // Set posts state
            } catch (error) {
                console.error("Error fetching posts: ", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
    }, []);

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <main>
            <Navbar />
            <div className="posts">
                {posts.map((post) => (
                    <Pin key={post.id} pinDetails={post} />
                ))}
            </div>
            <Footer />
        </main>
    );
}

export default CommunityPage;
