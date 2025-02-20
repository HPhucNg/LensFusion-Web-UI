import React, { useState, useEffect, useCallback, useReducer } from 'react';
import { collection, addDoc, getDocs, setDoc, getDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '@/firebase/FirebaseConfig';
import '../styles/modal_styles.css';
import Image from 'next/image';

function ViewModal({ closeModal, image }) {
    const initialState = {
        comments: [],
        newComment: '',
        editingCommentId: null,
        editedCommentText: '',
        likesData: { likes: [], hasLiked: false },
        userName: '',
        userProfileImage: null,
    };

    const commentsReducer = (state, action) => {
        switch (action.type) {
            case 'SET_COMMENTS':
                return { ...state, comments: action.payload };
            case 'SET_NEW_COMMENT':
                return { ...state, newComment: action.payload };
            case 'SET_EDITED_COMMENT_TEXT':
                return { ...state, editedCommentText: action.payload };
            case 'SET_EDITING_COMMENT_ID':
                return { ...state, editingCommentId: action.payload };
            case 'SET_LIKES':
                return { ...state, likesData: action.payload };
            case 'SET_USER_PROFILE_IMAGE':
                return { ...state, userProfileImage: action.payload };
            case 'SET_USER_NAME':
                return { ...state, userName: action.payload };
            default:
                return state;
        }
    };

    const [state, dispatch] = useReducer(commentsReducer, initialState);

    const { comments, newComment, editedCommentText, likesData, userName, userProfileImage } = state;
    const user = auth.currentUser;
    const formattedDate = new Date(image.createdAt.seconds * 1000).toLocaleString();

    


    // Set User Name
    useEffect(() => {
        if (user) {
            dispatch({ type: 'SET_USER_NAME', payload: user.displayName || user.email || 'Anonymous' });
        } else {
            alert("No user is authenticated.");
        }
    }, [user]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch comments
                const commentsRef = collection(db, 'community', image.id, 'comments');
                const querySnapshot = await getDocs(commentsRef);
                const fetchedComments = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
                // Fetch likes
                const likesRef = collection(db, 'community', image.id, 'likes');
                const likeSnapshot = await getDocs(likesRef);
                const fetchedLikes = likeSnapshot.docs.map(doc => doc.id);
                const hasUserLiked = fetchedLikes.includes(user?.uid);
    
                // Fetch user profile image
                const communityRef = doc(db, 'community', image.id);
                const communityDoc = await getDoc(communityRef);
                if (!communityDoc.exists()) return;
                const userId = communityDoc.data()?.userId;
                if (!userId) return;
    
                const userRef = doc(db, 'users', userId);
                const userDoc = await getDoc(userRef);
                const userProfileImage = userDoc.exists() ? userDoc.data().photoURL : null;
    
                // Dispatch state updates in one go
                dispatch({ 
                    type: 'SET_COMMENTS', 
                    payload: fetchedComments 
                });
                dispatch({ 
                    type: 'SET_LIKES', 
                    payload: { likes: fetchedLikes, hasLiked: hasUserLiked } 
                });
                dispatch({ 
                    type: 'SET_USER_PROFILE_IMAGE', 
                    payload: userProfileImage 
                });
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };
    
        if (image && user) {
            fetchData();
        }
    }, [image, user]);
    
    

    // Like Toggle Handler
    const handleLikeToggle = async () => {
        try {
            const likesRef = doc(db, 'community', image.id, 'likes', user.uid);
            const { hasLiked } = likesData;

            if (hasLiked) {
                await deleteDoc(likesRef);
                dispatch({
                    type: 'SET_LIKES',
                    payload: { likes: likesData.likes.filter(id => id !== user.uid), hasLiked: false },
                });
            } else {
                await setDoc(likesRef, { userId: user.uid });
                dispatch({
                    type: 'SET_LIKES',
                    payload: { likes: [...likesData.likes, user.uid], hasLiked: true },
                });
            }
        } catch (e) {
            console.error("Error toggling like: ", e);
        }
    };

    // Handle Comment Submit
    const handleCommentSubmit = useCallback(async (e) => {
        e.preventDefault();
        if (newComment.trim() === '') return;

        try {
            const commentsRef = collection(db, 'community', image.id, 'comments');
            const docRef = await addDoc(commentsRef, {
                commentText: newComment,
                createdBy: user.displayName || user.email,
                createdByUID: user.uid,
                createdAt: new Date(),
            });

            const newCommentWithId = {
                id: docRef.id,
                commentText: newComment,
                createdBy: user.displayName || user.email,
                createdByUID: user.uid
            };

            dispatch({ type: 'SET_NEW_COMMENT', payload: '' });
            dispatch({ type: 'SET_COMMENTS', payload: [...comments, newCommentWithId] });
        } catch (e) {
            console.error("Error adding comment: ", e);
        }
    }, [newComment, user, image.id, comments]);

    // Handle Edit Comment
    const handleEditComment = (commentId, currentText) => {
        dispatch({ type: 'SET_EDITING_COMMENT_ID', payload: commentId });
        dispatch({ type: 'SET_EDITED_COMMENT_TEXT', payload: currentText });
    };

    // Handle Save Edit
    const handleSaveEdit = async (e, commentId) => {
        e.preventDefault();
        if (editedCommentText.trim() === '') return;

        try {
            const commentRef = doc(db, 'community', image.id, 'comments', commentId);
            await updateDoc(commentRef, { commentText: editedCommentText });

            dispatch({
                type: 'SET_COMMENTS',
                payload: comments.map(comment =>
                    comment.id === commentId ? { ...comment, commentText: editedCommentText } : comment
                ),
            });

            dispatch({ type: 'SET_EDITING_COMMENT_ID', payload: null });
            dispatch({ type: 'SET_EDITED_COMMENT_TEXT', payload: '' });
        } catch (e) {
            console.error("Error updating comment: ", e);
        }
    };

    // Handle Delete Comment
    const handleDeleteComment = async (commentId) => {
        try {
            const commentRef = doc(db, 'community', image.id, 'comments', commentId);
            await deleteDoc(commentRef);

            dispatch({
                type: 'SET_COMMENTS',
                payload: comments.filter(comment => comment.id !== commentId),
            });
        } catch (e) {
            console.error("Error deleting comment: ", e);
        }
    };

    return (
        <div className='flex w-full h-full fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[99999] bg-black/50'>
            <div className='flex w-[calc(100%-70px)] h-[calc(100%-30px)] fixed top-1/2 left-1/2 transform -translate-x-[calc(50%+20px)] -translate-y-1/2 flex backdrop-blur-lg rounded-xl overflow-hidden text-white' style={{ background: 'var(--modal-background)' }}>
                <div className='mt-4 ml-2 mb-2 w-1/2'>
                    {image ? (
                        <div className='w-full h-full'>
                            <Image src={image.img_data} alt="Selected" width={800} height={800} className="object-cover w-full h-full rounded-xl" />
                        </div>
                    ) : (
                        <p>No image selected</p>
                    )}
                </div>
                <div className='w-1/3 ml-20'>
                    <div className='mt-4 mb-4 flex items-center'>
                        {userProfileImage ? (
                            <img src={userProfileImage} alt="User Photo" className="w-8 h-8 rounded-full mr-2" />
                        ) : (
                            <div className="w-8 h-8 bg-gray-500 rounded-full mr-2"></div>
                        )}
                        <span>{image.created_by}</span>
                    </div>
                    <div className='mt-4 font-bold'>{image.title}</div>
                    <div className='mb-4 text-gray-400 text-sm'>{formattedDate}</div>
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
                                    {state.editingCommentId === comment.id ? (
                                        <div>
                                            <textarea value={editedCommentText} onChange={(e) => dispatch({ type: 'SET_EDITED_COMMENT_TEXT', payload: e.target.value })} rows="2" />
                                            <button onClick={(e) => handleSaveEdit(e, comment.id)}>Save</button>
                                        </div>
                                    ) : (
                                        <div>{comment.commentText}</div>
                                    )}
                                    {comment.createdByUID === user.uid && state.editingCommentId !== comment.id && (
                                        <div>
                                            <button onClick={() => handleEditComment(comment.id, comment.commentText)}>Edit</button>
                                            <button onClick={() => handleDeleteComment(comment.id)}>Delete</button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        <form onSubmit={handleCommentSubmit} className="comment-form">
                            <textarea value={newComment} onChange={(e) => dispatch({ type: 'SET_NEW_COMMENT', payload: e.target.value })} placeholder="Add a comment..." rows="3" />
                            <div className="buttons-container">
                                <button type="submit" className="submit-comment-btn">Post Comment</button>
                                <button onClick={handleLikeToggle} className={`like-btn ${likesData.hasLiked ? 'liked' : ''}`}>♡ {likesData.likes.length}</button>
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


