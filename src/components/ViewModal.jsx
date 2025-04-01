import React, { useState } from 'react';
import { db, auth } from '@/firebase/FirebaseConfig';
//import '../styles/modal_styles.css';
import Image from 'next/image';
import useCommentsAndLikes from '@/hooks/useCommentsAndLikes';
import { FullscreenModal } from '../app/(list_page)/workspace/backgroundgeneration/_components/FullscreenModal';

function ViewModal({ closeModal, image, posts, currentIndex, setCurrentIndex }) {
    const selectedPost = posts[currentIndex];
    const { 
        state,
        handleLikeToggle,
        handleCommentSubmit,
        handleNewCommentChange,
        handleEditComment,
        handleEditedCommentChange,
        handleSaveEdit,
        handleDeleteComment,
    } = useCommentsAndLikes(selectedPost); 

    const [isFullscreen, setIsFullscreen] = useState(false);
    const [fullscreenImage, setFullscreenImage] = useState(null);

    const openFullscreen = (imageUrl) => {
        setFullscreenImage(imageUrl);
        setIsFullscreen(true);
      };
    
      const closeFullscreen = (e) => {
        setIsFullscreen(false);
        setFullscreenImage(null);
      };

    const { comments, newComment, editedCommentText, likesData, userProfileImage, userName } = state;
    const user = auth.currentUser;
    const formattedDate = new Date(selectedPost.createdAt.seconds * 1000).toLocaleString();

    // login prompt
    const showLoginPrompt = (action) => {
        alert(`Please log in to ${action}.`);
    };

    const handleSubmit = async (e) => {
        if (!user) {
            showLoginPrompt('comment');
            return;
        }
        await handleCommentSubmit(e);
    };

    const handleLiking = async () => {
        if (!user) {
            showLoginPrompt('like');
            return;
        }
        await handleLikeToggle();
    };

    const handlePrevious = () => {
        if (currentIndex > 0) {
          setCurrentIndex(currentIndex - 1); // previous image
        }
    };

    const handleNext = () => {
        if (currentIndex < posts.length - 1) {
          setCurrentIndex(currentIndex + 1); // next image
        }
    };

    // state to manage how many comments to show at a time
    const [visibleComments, setVisibleComments] = useState(3); // initially show 3 comments

    // handle loading more comments
    const handleLoadMore = () => {
        setVisibleComments((prev) => prev + 3); // load 3 more comments each time
    };

    return (
        <div className='md:w-[80%] md:flex-row flex flex-col font-sans relative rounded-xl shadow-md overflow-hidden' style={{ background: 'var(--modal-background)' }}>
            <div className='pt-6 md:pl-2 p-4 flex-1 flex'>
                {currentIndex > 0 && (
                    <button onClick={handlePrevious} disabled={currentIndex === 0} className='flex items-center pr-2 text-3xl'>
                        &lt;
                    </button>
                )}
                {selectedPost ? (
                    <div className='mr-2 mb-4 grow'>
                        <div className='relative'>
                            <Image 
                                src={selectedPost.img_data} 
                                alt="Selected" 
                                width={700} 
                                height={700} 
                                className="object-contain w-full h-full rounded-xl" />
                            {/* expand image button */}
                            <button
                                onClick={() => openFullscreen(selectedPost.img_data)} 
                                className="absolute top-2 right-2 p-2 bg-gray-900/80 hover:bg-gray-700/90 rounded-lg backdrop-blur-sm border border-gray-600/50 shadow-md transition-all hover:scale-110"
                                title="View fullscreen"
                            >
                                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                </svg>
                            </button>
            </div>
                    </div>
                ) : (<p>No image selected</p>)}
                {currentIndex < posts.length - 1 && (
                    <button onClick={handleNext} disabled={currentIndex === posts.length - 1} className='flex items-center md:hidden md:block text-3xl'>
                        &gt;
                    </button>
                )}
            </div>

            <div className='flex flex-1'>
                <div className='flex flex-col items-start p-4'>

                    <div className='text-4xl font-medium p-2'>
                        <h2>{selectedPost.title}</h2>
                    </div>

                    <div className='text-gray-400 text-sm pl-2'>
                        <p>{formattedDate}</p>
                    </div>

                    <div className='prompt p-2'>
                        <p>{selectedPost.prompt}</p>
                    </div>

                    <div className='flex p-2 items-center font-bold'>
                        {userProfileImage ? (
                            <img src={userProfileImage} alt="User Photo" className="w-10 h-10 rounded-full mr-2" />
                        ) : (
                            <div className="w-10 h-10 bg-gray-500 rounded-full mr-2"></div>
                        )}
                        <p>{userName}</p>
                    </div>

                    {/* scrollable container for comments */}
                    <div className="comments-container max-h-[200px] border-2 p-2 w-full rounded-md overflow-y-auto">
                        <p className='font-semibold text-md pb-4'>{comments.length} Comments</p>
                        {comments.slice(0, visibleComments).map((comment) => (
                            <div key={comment.id} className="text-sm">
                                <div className='flex justify-between'>
                                    <strong className='font-semibold'>{comment.createdBy}</strong>
                                    {comment.createdByUID === user?.uid && state.editingCommentId !== comment.id && (
                                        <div>
                                            <button className='hover:text-blue-300' onClick={() => handleEditComment(comment.id, comment.commentText)}> 
                                                <img className="w-[30px] hover:bg-gray-300 hover:rounded-[15px] h-auto" src='edit_icon.webp' /> 
                                            </button>
                                            <button className='hover:text-red-300' onClick={() => handleDeleteComment(comment.id)}> 
                                                <img className="w-[30px] h-auto  hover:bg-gray-300 hover:rounded-[15px]" src='delete_icon.webp' /> 
                                            </button>
                                        </div>
                                    )}
                                </div>
                                {state.editingCommentId === comment.id ? (
                                    <div>
                                        <textarea 
                                            className='border h-[40px] p-2 rounded-sm border-[#ccc] bg-transparent'
                                            value={editedCommentText} 
                                            onChange={(e) => handleEditedCommentChange(e.target.value)} // handle change here
                                            rows="2"  
                                        />
                                        <button onClick={(e) => handleSaveEdit(e, comment.id)}>Save</button>
                                    </div>
                                ) : (
                                    <div className='text-gray-400 p-2'>{comment.commentText}</div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* button to load more comments */}
                    {visibleComments < comments.length && (
                        <button onClick={handleLoadMore} className="text-blue-500 text-sm">
                            Load More
                        </button>
                    )}

                    {/* comment submission form with flex layout */}
                    <form className='pt-6 pb-6 relative flex items-center w-full' onSubmit={handleSubmit}>
                        <textarea 
                            className="flex-grow border p-2 rounded-[20px] border-[#ccc] bg-transparent placeholder-gray-600 resize-y"
                            value={newComment} 
                            onChange={handleNewCommentChange} 
                            placeholder='Add a comment...' 
                            rows="1" 
                        />
                        <button 
                            type="submit" 
                            className="absolute right-16 top-[50%] transform -translate-y-1/2 cursor-pointer"
                        >
                            <img src="/send-icon.png" alt="Send" className="w-5 h-5" />
                        </button>
                        <div className="ml-2 flex items-center space-x-1">
                            <button 
                                type="button"
                                onClick={handleLiking}
                                className={`px-3 py-1 bg-[#8D5AEA] text-white border-0 rounded-md cursor-pointer transition-transform duration-200 ease-in-out hover:scale-110 ${likesData.hasLiked ? 'bg-[#F096CC] hover:bg-[#DC78B4]' : ''}`}
                            >♡ <span className="text-sm">{likesData.likes.length}</span></button>
                        </div>
                    </form>

                </div>
        
               {/* <button className='absolute top-3 right-2 w-6 md:8 transform hover:scale-90 cursor-pointer bg-gray-900/80 hover:bg-gray-700/90 rounded-lg backdrop-blur-sm border' onClick={closeModal}>
                    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>*/}
                <img 
                    src='./Vector.png' 
                    className='absolute top-3 right-2 w-6 md:8 transform hover:scale-90 cursor-pointer' 
                    onClick={closeModal}
                />
                {currentIndex < posts.length - 1 && (
                    <button onClick={handleNext} disabled={currentIndex === posts.length - 1} className='md:flex md:flex-grow md:justify-end md:items-center md:p-2 hidden block text-3xl'>
                        &gt;
                    </button>
                )}
            </div>
             <FullscreenModal
                isFullscreen={isFullscreen}
                fullscreenImage={fullscreenImage}
                closeFullscreen={closeFullscreen}
            />
        </div>
    );
}

export default ViewModal;
