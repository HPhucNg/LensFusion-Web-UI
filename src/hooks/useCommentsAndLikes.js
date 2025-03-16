import { useEffect, useReducer, useCallback } from 'react';
import { db, auth } from '@/firebase/FirebaseConfig';
import { collection, getDocs, doc, getDoc, addDoc, deleteDoc, updateDoc, setDoc } from 'firebase/firestore';

// Initial State
const initialState = {
  comments: [],
  newComment: '',
  editingCommentId: null,
  editedCommentText: '',
  likesData: { likes: [], hasLiked: false },
  userName: '',
  userProfileImage: null,
};

// Reducer
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

const useCommentsAndLikes = (image) => {
  const [state, dispatch] = useReducer(commentsReducer, initialState);
  const { comments, newComment, editedCommentText, likesData, userName, userProfileImage } = state;
  const user = auth.currentUser;

  useEffect(() => {
    const fetchData = async () => {
      try {
        // fetch comments
        const commentsRef = collection(db, 'community', image.id, 'comments');
        const querySnapshot = await getDocs(commentsRef);
        const fetchedComments = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // fetch likes
        const likesRef = collection(db, 'community', image.id, 'likes');
        const likeSnapshot = await getDocs(likesRef);
        const fetchedLikes = likeSnapshot.docs.map(doc => doc.id);
        const hasUserLiked = user ? fetchedLikes.includes(user.uid) : false;

        // fetch user profile image and name
        //const communityRef = doc(db, 'community', image.id);
        //const communityDoc = await getDoc(communityRef);
        //if (!communityDoc.exists()) return;
        //const userId = communityDoc.data()?.userId;
        //if (!userId) return;
        const userId = image.userId;

        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        const userProfileImage = userDoc.exists() ? userDoc.data().photoURL : null;
        const userName = userDoc.exists() ? userDoc.data().name : null;

        // state updates in one go
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
        dispatch({
            type: 'SET_USER_NAME',
            payload: userName
          });
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    if (image) {
      fetchData();
    }
  }, [image, user]);

  const handleLikeToggle = async () => {
    if (!user) return; // cannot like if user is not authenticated
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
  

  const handleNewCommentChange = (e) => {
      dispatch({ type: 'SET_NEW_COMMENT', payload: e.target.value });
  };
  
  const handleCommentSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!user || newComment.trim() === '') return; // prevent comment submission

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

  const handleEditComment = (commentId, currentText) => {
    dispatch({ type: 'SET_EDITING_COMMENT_ID', payload: commentId });
    dispatch({ type: 'SET_EDITED_COMMENT_TEXT', payload: currentText });
  };

  const handleEditedCommentChange = (newText) => {
    dispatch({ type: 'SET_EDITED_COMMENT_TEXT', payload: newText });
  };

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

  return {
    state,
    handleLikeToggle,
    handleCommentSubmit,
    handleEditComment,
    handleSaveEdit,
    handleDeleteComment,
    handleNewCommentChange,
    handleEditedCommentChange
  };
};

export default useCommentsAndLikes;
