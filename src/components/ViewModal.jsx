import React, { useState } from 'react';
import { db, auth } from '@/firebase/FirebaseConfig';
import Image from 'next/image';
import useCommentsAndLikes from '@/hooks/useCommentsAndLikes';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu";
import { FullscreenModal } from '../app/(list_page)/workspace/backgroundgeneration/_components/FullscreenModal';

import { useRouter } from 'next/navigation'; // to redirect for "make same" function

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
    const [showCommentsOverlay, setShowCommentsOverlay] = useState(false);

    const handleOpenComments = () => {
        setShowCommentsOverlay(true);
    };

    const handleCloseComments = () => {
        setShowCommentsOverlay(false);
    };


    const openFullscreen = (imageUrl) => {
        setFullscreenImage(imageUrl);
        setIsFullscreen(true);
    };
    
    const closeFullscreen = () => {
        setIsFullscreen(false);
        setFullscreenImage(null);
    };

    const { comments, newComment, editedCommentText, likesData, userProfileImage, userName } = state;
    const user = auth.currentUser;
    const date = new Date(selectedPost.createdAt.seconds * 1000);
    const pad = (n) => n.toString().padStart(2, '0');
    const formattedDate = `${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${date.getFullYear()}  ${pad(date.getHours() % 12 || 12)}:${pad(date.getMinutes())}:${pad(date.getSeconds())} ${date.getHours() >= 12 ? 'PM' : 'AM'}`;

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
   // const [visibleComments, setVisibleComments] = useState(3); // initially show 3 comments

    // handle loading more comments
    //const handleLoadMore = () => {
      //  setVisibleComments((prev) => prev + 3); // load 3 more comments each time
    //};

    const router = useRouter();
    const handleMakeSame = () => { {/* reroute to tool and preset settings */}
      const query = new URLSearchParams({
        prompt: selectedPost.prompt,
        n_prompt: selectedPost.negativePrompt || "",
        category: selectedPost.category || ""
      }).toString();
    
      router.push(`/workspace/backgroundgeneration?${query}`);
    }; 


    return (
        <div 
            className='max-w-[95vw] md:max-w-[90vw] lg:max-w-[80vw] xl:max-w-[1200px] h-[85vh] md:h-[80vh] md:flex-row flex flex-col font-sans relative rounded-xl shadow-md overflow-hidden backdrop-blur-md' 
            style={{ background: 'var(--modal-background)' }}
            onClick={(e) => e.stopPropagation()} // Prevent clicks from reaching the backdrop
        >
            <div className='h-[50%] md:h-full pt-2 md:pt-4 md:pl-2 p-4 flex flex-col md:flex-1 md:flex relative'>
                {/* Close button - visible on all sizes */}
                <button
                    onClick={closeModal}
                    className="absolute top-2 right-2 z-10 p-2 bg-gray-900/80 hover:bg-gray-700/90 rounded-full backdrop-blur-sm border border-gray-600/50 shadow-md transition-all duration-200 hover:scale-110"
                    title="Close"
                >
                    <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                
                <div className='flex w-full flex-1 items-center justify-center'>
                    {currentIndex > 0 && (
                        <button 
                            onClick={handlePrevious} 
                            disabled={currentIndex === 0} 
                            className='absolute left-2 top-1/2 transform -translate-y-1/2 z-30 flex items-center justify-center h-12 w-12 text-3xl text-white/70 hover:text-white transition-colors bg-black/30 hover:bg-black/50 rounded-full'
                        >
                            &lt;
                        </button>
                    )}
                    
                    {selectedPost ? (
                        <div className='relative group w-full h-full flex items-center justify-center pb-3'>
                            <div className='relative w-auto h-auto flex items-center justify-center'>
                                <div className='rounded-xl flex items-center justify-center transition-opacity duration-200'>
                                    <Image 
                                        src={selectedPost.img_data} 
                                        alt={selectedPost.title || "Image"} 
                                        width={550} 
                                        height={550}
                                        className="object-contain rounded-lg"
                                        style={{
                                            maxWidth: "min(550px, 100%)",
                                            maxHeight: "min(500px, 100%)",
                                            width: 'auto',
                                            height: 'auto'
                                        }}
                                        priority={true}
                                    />
                                </div>
                            </div>
                            
                            {/* fullscreen button */}
                            <button
                                onClick={() => openFullscreen(selectedPost.img_data)} 
                                className="absolute top-2 right-2 p-2 bg-gray-900/80 hover:bg-gray-700/90 rounded-full backdrop-blur-sm border border-gray-600/50 shadow-md opacity-70 md:opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
                                title="View fullscreen"
                            >
                                <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                </svg>
                            </button>
                        </div>
                    ) : (
                        <p className="text-center w-full py-20">No image selected</p>
                    )}
                    
                    {currentIndex < posts.length - 1 && (
                        <button 
                            onClick={handleNext} 
                            disabled={currentIndex === posts.length - 1} 
                            className='absolute right-2 top-1/2 transform -translate-y-1/2 z-30 flex items-center justify-center h-12 w-12 text-3xl text-white/70 hover:text-white transition-colors bg-black/30 hover:bg-black/50 rounded-full'
                        >
                            &gt;
                        </button>
                    )}
                </div>
                
                {/* Mobile navigation indicator */}
                <div className="flex justify-center mt-3 gap-1 md:hidden">
                    {posts.length > 1 && Array.from({ length: Math.min(posts.length, 5) }).map((_, i) => {
                        // If more than 5 posts, show only current index area
                        const showIndex = posts.length <= 5 ? i : currentIndex - 2 + i;
                        if (showIndex < 0 || showIndex >= posts.length) return null;
                        
                        return (
                            <div
                                key={showIndex}
                                className={`h-1.5 rounded-full ${currentIndex === showIndex ? 'w-4 bg-white' : 'w-1.5 bg-gray-500'}`}
                            ></div>
                        );
                    })}
                </div>
            </div>

            <div className='h-[50%] md:h-full md:min-w-[350px] md:max-w-[400px] md:w-[40%] md:border-l border-gray-700/30 flex flex-col'> {/* Details sidebar */}
                <div className='flex flex-col p-4 w-full flex-1 overflow-y-auto max-h-[calc(100%-80px)] scrollbar-thin'>
                    <div className='flex p-2 items-center font-bold'>
                        {userProfileImage ? (
                            <img src={userProfileImage} alt="User Photo" className="w-10 h-10 rounded-full mr-2" />
                        ) : (
                            <div className="w-10 h-10 bg-gray-500 rounded-full mr-2"></div>
                        )}
                        <p>{userName}</p>
                    </div>

                    <div className='text-xl font-bold p-2 min-h-[40px]'>
                        <h2>{selectedPost.title}</h2>
                    </div>

                    <div className='text-gray-400 text-sm pl-2 min-h-[20px]'>
                        <p>{formattedDate}</p>
                    </div>

                    {/* Category tag if available */}
                    <div className='pl-2 mt-2 min-h-[28px]'>
                        {selectedPost.category && (
                            <span 
                                className='inline-block px-3 py-1 rounded-full text-xs'
                                style={{
                                    backgroundColor: getCategoryColor(selectedPost.category),
                                    color: '#141823'
                                }}
                            >
                                {selectedPost.category}
                            </span>
                        )}
                    </div>

                    <div className='rounded-md bg-[var(--card-background)] w-full mt-2 p-3 shadow-sm min-h-[120px] flex-1'>
                        <p className='text-xs pb-2 text-gray-400'>Description</p>
                        <p className='text-sm'>{selectedPost.prompt}</p>
                        <div className='text-xs text-gray-400 border-t mt-2 pt-2'>
                            <p className='flex justify-between pb-2'>Model <span>Background Generation</span></p> 
                        </div>
                    </div>
                </div>
                
                {/* Fixed bottom action bar */}
                <div className='h-[80px] min-h-[80px] w-full border-t border-gray-700/30 p-4 flex justify-between items-center gap-2 bg-[var(--card-background)]/80 backdrop-blur-md sticky bottom-0 left-0 right-0 z-10'>
                    <button 
                        className='px-3 py-1.5 rounded-md text-sm border-none bg-gray-700/70 hover:bg-gray-600/90 text-white cursor-pointer transition-all duration-200 ease-in-out hover:scale-105 shadow-sm' 
                        onClick={handleMakeSame}
                    >
                        Use Prompt
                    </button>
                    
                    <div className='flex gap-2'>
                        <button 
                            className="px-3 py-1.5 bg-blue-500/80 hover:bg-blue-500 text-white border-0 rounded-md text-sm cursor-pointer transition-all duration-200 ease-in-out hover:scale-105 flex items-center space-x-1 shadow-sm" 
                            onClick={handleOpenComments}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-4 h-4 mr-1"
                                viewBox="0 0 78.667 78.667"
                                fill="currentColor"
                            >
                                <g>
                                    <path d="M9.49,73.833c-1.493,0-2.943-0.24-4.309-0.713l-3.113-1.077l2.392-2.265c3.165-2.997,3.964-6.455,4.016-9.046   C3.004,54.666,0,47.097,0,39.334c0-19.023,17.645-34.5,39.333-34.5s39.334,15.477,39.334,34.5   c0,19.022-17.646,34.498-39.334,34.498c-6.458,0-12.827-1.399-18.505-4.057C18.689,71.289,14.366,73.833,9.49,73.833z    M20.361,65.078l1.148,0.581c5.397,2.729,11.561,4.173,17.824,4.173c19.483,0,35.334-13.682,35.334-30.498   c0-16.818-15.851-30.5-35.334-30.5S4,22.516,4,39.334c0,6.99,2.814,13.823,7.925,19.238l0.52,0.552l0.024,0.757   c0.087,2.72-0.401,6.407-2.818,9.951c4.63-0.074,8.89-3.298,9.705-3.95L20.361,65.078z"/>
                                </g>
                            </svg>
                            {comments.length}
                        </button>

                        <button 
                            type="button"
                            onClick={handleLiking}
                            className={`px-3 py-1.5 text-sm text-white border-0 rounded-md cursor-pointer transition-all duration-200 ease-in-out hover:scale-105 shadow-sm flex items-center space-x-1 ${likesData.hasLiked ? 'bg-[#F096CC] hover:bg-[#DC78B4]' : 'bg-[#8D5AEA] hover:bg-[#7D4ADA]'}`}
                        >
                            <span className="mr-1">♡</span> {likesData.likes.length}
                        </button>
                    </div>
                </div>
            </div>
            
            {/* Comments overlay */}
            {showCommentsOverlay && (
                <div className="absolute top-0 right-0 w-full md:w-[450px] h-full bg-[var(--card-background)]/95 backdrop-blur-xl z-20 rounded-xl shadow-xl p-6 transition-all duration-300 flex border border-gray-700/30">
                    {/* close button */}
                    <button onClick={handleCloseComments} className="absolute top-4 right-4 p-2 bg-gray-700/70 hover:bg-gray-600/90 rounded-full backdrop-blur-sm border border-gray-500/30 shadow-sm transition-all duration-200 hover:scale-105">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    
                    <div className='flex flex-col w-full'>
                        <p className='font-semibold text-lg pb-2 border-b border-gray-700/30'>{comments.length} Comments</p>
                        <div className="py-4 w-full flex-1 overflow-y-auto scrollbar-thin pr-2 space-y-3">
                            {comments.map((comment) => (
                                <div key={comment.id} className="text-sm hover:bg-[var(--border-gray)]/50 group p-3 rounded-lg transition-all duration-200">
                                    <div className='flex justify-between items-center'>
                                        <strong className='font-semibold text-white/90'>{comment.createdBy}</strong>
                                        {comment.createdByUID === user?.uid && state.editingCommentId !== comment.id && (
                                        <div className='invisible group-hover:visible transition-opacity'>  
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                <button className="w-8 transform hover:scale-90">
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5 text-gray-400">
                                                        <circle cx="5" cy="12" r="2" />
                                                        <circle cx="12" cy="12" r="2" />
                                                        <circle cx="19" cy="12" r="2" />
                                                    </svg>
                                                </button>
                                                </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-36 bg-[var(--card-background)] border-[var(--border-gray)]">
                                                        <DropdownMenuItem onClick={() => handleEditComment(comment.id, comment.commentText)} className="text-slate-400 hover:text-white cursor-pointer">
                                                            Edit Comment
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleDeleteComment(comment.id)} className="text-slate-400 hover:text-white cursor-pointer">
                                                            Delete Comment 
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                        </div>
                                        )}
                                    </div>
                                    {state.editingCommentId === comment.id ? (
                                        <div>
                                            <textarea
                                                value={editedCommentText}
                                                onChange={handleEditedCommentChange}
                                                className="w-full px-3 py-2 mt-2 bg-gray-700/50 border border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                                rows="2"
                                            />
                                            <div className="flex justify-end mt-2 space-x-2">
                                                <button
                                                    onClick={() => handleEditComment(null, '')}
                                                    className="px-3 py-1.5 text-xs bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={handleSaveEdit}
                                                    className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-500 transition-colors"
                                                >
                                                    Save
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="mt-1 text-white/80">{comment.commentText}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                        
                        {/* Add comment form */}
                        <div className="mt-auto pt-3 border-t border-gray-700/30">
                            <form onSubmit={handleSubmit} className="flex flex-col space-y-2">
                                <div className="relative rounded-lg shadow-sm">
                                    <textarea
                                        value={newComment}
                                        onChange={handleNewCommentChange}
                                        placeholder="Add a comment..."
                                        className="w-full bg-gray-800/80 border border-gray-700/70 rounded-lg p-3 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500/70 focus:border-purple-500/70 min-h-[60px] max-h-[100px] resize-none pr-14"
                                    />
                                    <button
                                        type="submit"
                                        className={`absolute bottom-2.5 right-2.5 p-2.5 text-white rounded-full transition-all duration-300 ease-out flex items-center justify-center shadow-md ${
                                            newComment.trim() 
                                            ? 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 hover:scale-110 hover:rotate-12 hover:shadow-lg' 
                                            : 'bg-gray-600/70 cursor-not-allowed'
                                        }`}
                                        disabled={!newComment.trim()}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="22" y1="2" x2="11" y2="13"></line>
                                            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                                        </svg>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
            
            {isFullscreen && (
                <FullscreenModal 
                    isFullscreen={isFullscreen} 
                    fullscreenImage={fullscreenImage} 
                    closeFullscreen={closeFullscreen} 
                />
            )}
        </div>
    );
}

// Helper function to get color for category tag
function getCategoryColor(category) {
    const categoryColors = {
        toys: '#E6B1B1',
        skincare: '#E6CCB1',
        candles: '#E6E0B1',
        furniture: '#B1DBE6',
        cars: '#C7B1E6',
        bags: '#B8B1E6',
        jewelry: '#E6B1D8',
        shoes: '#B1E6C2',
        watches: '#E6D8B1',
        electronics: '#B1C7E6',
        others: '#D9B1E6'
    };
    
    return categoryColors[category] || '#B9EF9B';
}

export default ViewModal;
