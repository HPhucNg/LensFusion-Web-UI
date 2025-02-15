import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, setDoc, getDoc, query, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '@/firebase/FirebaseConfig';
import '../styles/modal_styles.css';

function ViewModal({ closeModal, image }) {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [userName, setUserName] = useState('');
    const [editingCommentId, setEditingCommentId] = useState(null);  // Track comment being edited
    const [editedCommentText, setEditedCommentText] = useState('');
    const [userProfileImage, setUserProfileImage] = useState(null);
    const [likes, setLikes] = useState([]);
    const [hasLiked, setHasLiked] = useState(false);

    const user = auth.currentUser;

    const formattedDate = new Date(image.createdAt.seconds * 1000).toLocaleString();

    useEffect(() => {
        const fetchUserProfileImage = async () => {
            try {
                // Fetch community document to get the userId
                const communityRef = doc(db, 'community', image.id); // Community document ID
                const communityDoc = await getDoc(communityRef);
                if (!communityDoc.exists()) {
                    console.error("Community document not found.");
                    return;
                }
    
                const communityData = communityDoc.data();
                const userId = communityData?.userId;  // This is the userId (not a reference, just the ID string)
                if (!userId) {
                    console.error("userId is not found in the community document.");
                    return;
                }
    
                // Query the users collection using the userId
                const userRef = doc(db, 'users', userId);  // Reference the user document by userId
                const userDoc = await getDoc(userRef);
    
                if (userDoc.exists()) {
                    // Set the photoURL of the user
                    setUserProfileImage(userDoc.data().photoURL);
                } else {
                    console.error("User document not found.");
                }
            } catch (error) {
                console.error("Error fetching user photoURL:", error);
            }
        };
    
        if (image) {
            fetchUserProfileImage();
        }
    }, [image]);  // Re-run when `image` changes
    
    

    useEffect(() => {
        if (user) {
            setUserName(user.displayName || user.email || 'Anonymous');
        } else {
            alert("No user is authenticated.");
        }
    }, [user]);

    useEffect(() => {
        // Fetch comments when the image (post) changes
        const fetchComments = async () => {
            try {
                const commentsRef = collection(db, 'community', image.id, 'comments');
                const q = query(commentsRef, orderBy('createdAt', 'asc')); // Sort by createdAt
                const querySnapshot = await getDocs(q);
                const fetchedComments = [];
                querySnapshot.forEach((doc) => {
                    fetchedComments.push({ id: doc.id, ...doc.data() });
                });
                setComments(fetchedComments);
            } catch (e) {
                console.error("Error fetching comments: ", e);
            }
        };

        if (image) {
            fetchComments();
        }
    }, [image]);

    useEffect(() => {
        const fetchLikes = async () => {
            try {
                console.log(image.id)
                const likesRef = collection(db, 'community', image.id, 'likes');
                const querySnapshot = await getDocs(likesRef);
                const fetchedLikes = querySnapshot.docs.map(doc => doc.id);
                setLikes(fetchedLikes);

                // Check if the current user has liked the image
                if (fetchedLikes.includes(user?.uid)) {
                    setHasLiked(true);
                } else {
                    setHasLiked(false);
                }
            } catch (e) {
                console.error("Error fetching likes: ", e);
            }
        };

        if (image && user) {
            fetchLikes();
        }
    }, [image, user]);

    const handleLikeToggle = async () => {
        try {
            const likesRef = doc(db, 'community', image.id, 'likes', user.uid);

            if (hasLiked) {
                // Remove like
                await deleteDocFromLikes(likesRef);
                setLikes((prevLikes) => prevLikes.filter((id) => id !== user.uid));
                setHasLiked(false);
            } else {
               // Add like
                await setDoc(likesRef, { userId: user.uid });
                setLikes((prevLikes) => [...prevLikes, user.uid]);
                setHasLiked(true);
            }
        } catch (e) {
            console.error("Error toggling like: ", e);
        }
    };

    const deleteDocFromLikes = async (imageId, userId) => {
        try {
            // Reference to the like document in the 'likes' subcollection
            const likeRef = doc(db, 'community', imageId, 'likes', userId);
    
            // Delete the like document
            await deleteDoc(likeRef);
            console.log(`Like by user ${userId} deleted successfully.`);
        } catch (error) {
            console.error("Error deleting like:", error);
        }
    };

    const handleCommentChange = (e) => {
        setNewComment(e.target.value);
    };

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
    
        if (newComment.trim() === '') {
            return;
        }
    
        try {
            const commentsRef = collection(db, 'community', image.id, 'comments');
            const docRef = await addDoc(commentsRef, {
                commentText: newComment,
                createdBy: userName,
                createdByUID: user.uid,  // Storing the UID here
                createdAt: new Date(),
            });
    
            // Now that the comment has been added, we get the Firestore-generated ID
            const newCommentWithId = {
                id: docRef.id, // Use the Firestore-generated ID
                commentText: newComment,
                createdBy: userName,
                createdByUID: user.uid
            };
    
            setNewComment('');  // Clear the input field
            setComments([...comments, newCommentWithId]); // Optimistic update with the Firestore-generated ID
        } catch (e) {
            console.error("Error adding comment: ", e);
        }
    };
    


    const handleEditComment = (commentId, currentText) => {
        setEditingCommentId(commentId);
        setEditedCommentText(currentText);
    };

    const handleEditChange = (e) => {
        setEditedCommentText(e.target.value);
    };

    const handleSaveEdit = async (e, commentId) => {
        e.preventDefault();
    
        if (editedCommentText.trim() === '') {
            return;
        }
    
        try {
            // Make sure the comment exists before attempting to update it
            const commentRef = doc(db, 'community', image.id, 'comments', commentId);
            await updateDoc(commentRef, { commentText: editedCommentText });
            
            // Make sure to update the state properly by checking if the comment exists
            setComments((prevComments) =>
                prevComments.map((comment) => 
                    comment.id === commentId
                        ? { ...comment, commentText: editedCommentText } // Update the comment text
                        : comment
                )
            );
            setEditingCommentId(null); // Reset editing mode
            setEditedCommentText(''); // Clear edited text field

        } catch (e) {
            console.error("Error updating comment: ", e);
        }
    };
    

    const handleDeleteComment = async (commentId) => {
        try {
            const commentRef = doc(db, 'community', image.id, 'comments', commentId);
            await deleteDoc(commentRef);

            setComments((prevComments) =>
                prevComments.filter((comment) => comment.id !== commentId)
            );
        } catch (e) {
            console.error("Error deleting comment: ", e);
        }
    };
    return (
        <div className='flex w-full h-full fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[99999] bg-black/50'>
            <div className='flex w-[calc(100%-70px)] h-[calc(100%-30px)] fixed top-1/2 left-1/2 transform -translate-x-[calc(50%+20px)] -translate-y-1/2 flex backdrop-blur-lg rounded-xl overflow-hidden text-white' style={{ background: 'var(--modal-background)' }}>
                <div className='mt-4 ml-2 mb-2 w-1/2'>
                    {image ? (
                        <img src={image.img_data} alt="Selected" className="object-cover w-full h-[calc(100%-40px)] rounded-xl" />
                        ) : (
                        <p>No image selected</p>
                    )}
                </div>
                <div className='w-1/3 ml-20'>
                    <div className='mt-4 mb-4 flex items-center'>
                        {userProfileImage ? (
                            <img src={userProfileImage} alt="User Photo" className="w-8 h-8 rounded-full mr-2" />
                        ) : (
                            <div className="w-8 h-8 bg-gray-500 rounded-full mr-2"></div>  // Fallback if no photo
                        )}
                        <span>{image.created_by}</span>
                    </div>

                    <div className='mt-4 font-bold'> {image.title} </div>
                    <div className='mb-4 text-gray-400 text-sm'> {formattedDate} </div>
                    
                    <div className='mt-2 h-32 mr-3 bg-[var(--card-background)] p-3 rounded-xl'>
                        <div className='text-gray-400 text-sm pb-2'>
                            Prompt Description <p className='text-gray-500 text-base pt-2'>{image.prompt}</p>
                        </div>
                    </div>
                    <div className="comments-section">
                            <h3>Comments:</h3>
                            <div className="comments-list">
                                {comments.map((comment) => (
                                    <div key={comment.id} className="comment">
                                    <div><strong>{comment.createdBy}</strong></div>
                                    {editingCommentId === comment.id ? (
                                        <div>
                                            <textarea
                                                value={editedCommentText}
                                                onChange={handleEditChange}
                                                rows="2"
                                            />
                                            <button onClick={(e) => handleSaveEdit(e, comment.id)}>
                                                Save
                                            </button>
                                        </div>
                                    ) : (
                                        <div>{comment.commentText}</div>
                                    )}
                                
                                    {comment.createdByUID === user.uid && !editingCommentId && (
                                        <div>
                                            <button onClick={() => handleEditComment(comment.id, comment.commentText)}>
                                                Edit
                                            </button>
                                            <button onClick={() => handleDeleteComment(comment.id)}>
                                                Delete
                                            </button>
                                        </div>
                                    )}
                                </div>
                                
                                ))}
                            </div>
                            <form onSubmit={handleCommentSubmit} className="comment-form">
                                <textarea
                                    value={newComment}
                                    onChange={handleCommentChange}
                                    placeholder="Add a comment..."
                                    rows="3"
                                />
                                
                                <div className="buttons-container">
                                    <button type="submit" className="submit-comment-btn">Post Comment</button>
                                    <button onClick={handleLikeToggle} className={`like-btn ${hasLiked ? 'liked' : ''}`}>
                                        ♡ {likes.length}
                                    </button>
                                </div>
                            </form>
                        
                    </div>
                    


                </div>
            </div>
            <div onClick={closeModal} className="icon_close absolute right-0 top-0 p-2">
                <img src="/Vector.png" alt="close_pin" />
            </div>
                
            
        </div>
    );
}

export default ViewModal;

