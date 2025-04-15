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

    //const handleMakeSame = () => {
      // will query db and fetch tool used 
      // then reroute to that tool
      // and preset settings fill in prompt
      // just ask user for image
      // only for image to image generation and  bg generation??
    //};

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
                                                <svg viewBox="0 0 61 61" xmlns="http://www.w3.org/2000/svg" fill="currentColor" className="w-[25px] h-auto">
                                                    <defs>
                                                        <filter id="a" width="200%" height="200%" x="-50%" y="-50%" filterUnits="objectBoundingBox">
                                                            <feOffset dy="1" in="SourceAlpha" result="shadowOffsetOuter1"></feOffset>
                                                            <feGaussianBlur stdDeviation="10" in="shadowOffsetOuter1" result="shadowBlurOuter1"></feGaussianBlur>
                                                            <feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0" in="shadowBlurOuter1" result="shadowMatrixOuter1"></feColorMatrix>
                                                            <feMerge>
                                                                <feMergeNode in="shadowMatrixOuter1"></feMergeNode>
                                                                <feMergeNode in="SourceGraphic"></feMergeNode>
                                                            </feMerge>
                                                        </filter>
                                                    </defs>
                                                    <path fillRule="evenodd" d="M36.503 19h-13.509c-1.651 0-2.994 1.341-2.994 2.994v14.012c0 1.651 1.341 2.994 2.994 2.994h14.012c1.651 0 2.994-1.341 2.994-2.994v-13.509.503l-2 3v10.006c0 .548-.447.994-.994.994h-14.012c-.548 0-.994-.447-.994-.994v-14.012c0-.548.447-.994.994-.994h10.012l2.994-2h.503zm1.398.706c.39-.39 1.02-.392 1.413.001.391.391.391 1.024.001 1.413l-8.486 8.486-2.121.707.707-2.121 8.486-8.486z" filter="url(#a)"></path>
                                                </svg>
                                            </button>
                                            <button className='hover:text-red-300' onClick={() => handleDeleteComment(comment.id)}> 
                                                <svg
                                                    viewBox="-2.5 0 61 61"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    fill="currentColor"
                                                    width="30"
                                                    height="30"
                                                    className="w-[25px] h-auto"
                                                >
                                                    <defs>
                                                    <filter
                                                        id="a"
                                                        width="200%"
                                                        height="200%"
                                                        x="-50%"
                                                        y="-50%"
                                                        filterUnits="objectBoundingBox"
                                                    >
                                                        <feOffset dy="1" in="SourceAlpha" result="shadowOffsetOuter1" />
                                                        <feGaussianBlur stdDeviation="10" in="shadowOffsetOuter1" result="shadowBlurOuter1" />
                                                        <feColorMatrix
                                                        values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0"
                                                        in="shadowBlurOuter1"
                                                        result="shadowMatrixOuter1"
                                                        />
                                                        <feMerge>
                                                        <feMergeNode in="shadowMatrixOuter1" />
                                                        <feMergeNode in="SourceGraphic" />
                                                        </feMerge>
                                                    </filter>
                                                    </defs>
                                                    <path
                                                    fillRule="evenodd"
                                                    d="M36 26v10.997c0 1.659-1.337 3.003-3.009 3.003h-9.981c-1.662 0-3.009-1.342-3.009-3.003v-10.997h16zm-2 0v10.998c0 .554-.456 1.002-1.002 1.002h-9.995c-.554 0-1.002-.456-1.002-1.002v-10.998h12zm-9-5c0-.552.451-1 .991-1h4.018c.547 0 .991.444.991 1 0 .552-.451 1-.991 1h-4.018c-.547 0-.991-.444-.991-1zm0 6.997c0-.551.444-.997 1-.997.552 0 1 .453 1 .997v6.006c0 .551-.444.997-1 .997-.552 0-1-.453-1-.997v-6.006zm4 0c0-.551.444-.997 1-.997.552 0 1 .453 1 .997v6.006c0 .551-.444.997-1 .997-.552 0-1-.453-1-.997v-6.006zm-6-5.997h-4.008c-.536 0-.992.448-.992 1 0 .556.444 1 .992 1h18.016c.536 0 .992-.448.992-1 0-.556-.444-1-.992-1h-4.008v-1c0-1.653-1.343-3-3-3h-3.999c-1.652 0-3 1.343-3 3v1z"
                                                    filter="url(#a)"
                                                    />
                                                </svg>
                                            </button>
                                        </div>
                                    )}
                                </div>
                                {state.editingCommentId === comment.id ? (
                                    <div>
                                        <textarea 
                                            className='border h-[35px] p-2 rounded-sm border-[#ccc] bg-transparent'
                                            value={editedCommentText} 
                                            onChange={(e) => handleEditedCommentChange(e.target.value)} // handle change here
                                            rows="2"  
                                        />
                                        <button onClick={(e) => handleSaveEdit(e, comment.id)}>✔️</button>
                                    </div>
                                ) : (
                                    <div className='text-gray-400 p-2'>{comment.commentText}</div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* button to load more comments */}
                    {visibleComments < comments.length && (
                        <button onClick={handleLoadMore} className="text-blue-500 text-xs">
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
                            <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" className="w-6 h-6 text-blue-500">
                                <g fill="currentColor" fillRule="nonzero">
                                <path d="m3.45559904 3.48107721 3.26013002 7.74280879c.20897233.4963093.20897233 1.0559187 0 1.552228l-3.26013002 7.7428088 18.83130296-8.5189228zm-.74951511-1.43663117 20.99999997 9.49999996c.3918881.1772827.3918881.7338253 0 .911108l-20.99999997 9.5c-.41424571.1873968-.8433362-.2305504-.66690162-.6495825l3.75491137-8.9179145c.10448617-.2481546.10448617-.5279594 0-.776114l-3.75491137-8.9179145c-.17643458-.41903214.25265591-.83697933.66690162-.64958246z"/>
                                <path d="m6 12.5v-1h16.5v1z"/>
                                </g>
                            </svg>
                        </button>
                        <div className="ml-2 flex items-center space-x-1">
                            <button 
                                type="button"
                                onClick={handleLiking}
                                className={`px-3 py-1 bg-[#8D5AEA] text-white border-0 rounded-md cursor-pointer transition-transform duration-200 ease-in-out hover:scale-110 ${likesData.hasLiked ? 'bg-[#F096CC] hover:bg-[#DC78B4]' : ''}`}
                            >♡ <span className="text-sm">{likesData.likes.length}</span></button>
                        </div>
                    </form>
                    <div className='flex justify-end'>
                        <button className='p-2 border rounded-md border-2 text-sm bg-[var(--border-gray)] hover:bg-gray-700'>Make Same</button> {/*onClick={handleMakeSame}*/}
                    </div>
                </div>
        
               <button className='absolute top-3 right-2 w-6 md:8 transform hover:scale-90 cursor-pointer rounded-lg bg-[var(--border-gray)] backdrop-blur-sm border' onClick={closeModal}>
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
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
