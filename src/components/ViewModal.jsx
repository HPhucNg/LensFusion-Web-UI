import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/firebase/FirebaseConfig';
import '../styles/modal_styles.css';

function ViewModal({ closeModal, image }) {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');

    useEffect(() => {
        // Fetch comments when the image (post) changes
        const fetchComments = async () => {
            try {
                const commentsRef = collection(db, 'pins', image.id, 'comments');
                const q = query(commentsRef, orderBy('createdAt', 'asc')); // Sort by createdAt
                const querySnapshot = await getDocs(q);
                const fetchedComments = [];
                querySnapshot.forEach((doc) => {
                    fetchedComments.push(doc.data());
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
            const commentsRef = collection(db, 'pins', image.id, 'comments');
            await addDoc(commentsRef, {
                commentText: newComment,
                createdBy: 'User1', // Replace with actual logged-in user
                createdAt: new Date(),
            });

            setNewComment('');  // Clear the input field
            setComments([...comments, { commentText: newComment, createdBy: 'User1' }]); // Optimistic update
        } catch (e) {
            console.error("Error adding comment: ", e);
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

                    <div className="midsection">
                        <div>Title: {image.title}</div>
                        <div>Description: {image.description}</div>
                        <div>Created By: {image.created_by}</div>

                        <div className="comments-section">
                            <h3>Comments:</h3>
                            <div className="comments-list">
                                {comments.map((comment, index) => (
                                    <div key={index} className="comment">
                                        <div><strong>{comment.createdBy}</strong></div>
                                        <div>{comment.commentText}</div>
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
