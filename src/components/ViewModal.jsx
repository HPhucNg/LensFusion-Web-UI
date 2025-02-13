import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '@/firebase/FirebaseConfig';
import '../styles/modal_styles.css';

function ViewModal({ closeModal, image }) {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [userName, setUserName] = useState('');
    const [editingCommentId, setEditingCommentId] = useState(null);  // Track comment being edited
    const [editedCommentText, setEditedCommentText] = useState('');

    const user = auth.currentUser;

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
        <div className='add_pin_modal'>
            <div className='add_pin_container'>
                <div className="side" id="left_side">
                    <div className="topsection">
                        <div className="post_to">Viewing Image</div>
                    </div>

                    <div className="midsection">
                        {image ? (
                            <img src={image.img_data} alt="Selected" className="object-cover w-full h-full rounded-xl" />
                        ) : (
                            <p>No image selected</p>
                        )}
                    </div>
                </div>

                <div className="side" id="right_side">
                    <div className="topsection">
                        <div onClick={closeModal} className="icon_close">
                            <img src="/Vector.png" alt="close_pin" />
                        </div>
                    </div>

                    <div className="midsection mt-9 md:ml-4">
                        <div>Title: {image.title}</div>
                        <div>Description: {image.description}</div>
                        <div>Created By: {image.created_by}</div>

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
                                                rows="3"
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
                                <button type="submit" className="submit-comment-btn">Post Comment</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ViewModal;

