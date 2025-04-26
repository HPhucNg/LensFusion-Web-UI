import React, { useState } from 'react';
import { db, auth } from '@/firebase/FirebaseConfig';
import Image from 'next/image';
import useCommentsAndLikes from '@/hooks/useCommentsAndLikes';
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
    
      const closeFullscreen = (e) => {
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
        id: selectedPost.id,
      }).toString();
    
      router.push(`/workspace/backgroundgeneration?${query}`);
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
                        <div className='relative group'>
                            <Image 
                                src={selectedPost.img_data} 
                                alt="Selected" 
                                width={700} 
                                height={700} 
                                className="object-contain w-full h-full rounded-xl" />
                            {/* expand image button */}
                            <button
                                onClick={() => openFullscreen(selectedPost.img_data)} 
                                className="absolute top-2 right-2 p-2 bg-gray-900/80 hover:bg-gray-700/90 rounded-lg backdrop-blur-sm border border-gray-600/50 shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:scale-110"
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

            <div className='flex flex-1'> {/* right */}
                <div className='flex flex-col items-start p-4 w-full'>

                    <div className='flex p-2 items-center font-bold'>
                        {userProfileImage ? (
                            <img src={userProfileImage} alt="User Photo" className="w-10 h-10 rounded-full mr-2" />
                        ) : (
                            <div className="w-10 h-10 bg-gray-500 rounded-full mr-2"></div>
                        )}
                        <p>{userName}</p>
                    </div>

                    <div className='text-xl font-bold p-2'>
                        <h2>{selectedPost.title}</h2>
                    </div>

                    <div className='text-gray-400 text-sm pl-2'>
                        <p>{formattedDate}</p>
                    </div>

                    <div className='rounded-md bg-[var(--card-background)] w-full mt-2 p-2'>
                        <p className='text-xs pb-2 text-gray-400'>Picture Description words</p>
                        <p className='text-sm'>{selectedPost.prompt}</p>
                        <div className='text-xs text-gray-400 border-t mt-2 pt-2'>
                            <p className='flex justify-between pb-2'>Model <span>Background Generation</span></p> 
                        </div>
                    </div>
                    
                    <div className='flex justify-between w-full mt-auto pt-4 pb-4'>
                        <button className='px-3 py-1 border rounded-md text-sm bg-[var(--border-gray)] cursor-pointer transition-transform duration-200 ease-in-out hover:scale-110' onClick={handleMakeSame}>Make Same</button> {/*onClick={handleMakeSame}*/}
                        <div className='flex'>
                            <div className="ml-2 flex items-center space-x-1">
                                <button 
                                    className="px-3 py-1 bg-blue-300 text-white border-0 rounded-md text-sm cursor-pointer transition-transform duration-200 ease-in-out hover:scale-110 flex items-center space-x-1" 
                                    onClick={handleOpenComments}
                                >
                                    <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="w-4 h-4"
                                    viewBox="0 0 78.667 78.667"
                                    fill="currentColor"
                                    >
                                    <g>
                                        <path d="M9.49,73.833c-1.493,0-2.943-0.24-4.309-0.713l-3.113-1.077l2.392-2.265c3.165-2.997,3.964-6.455,4.016-9.046   C3.004,54.666,0,47.097,0,39.334c0-19.023,17.645-34.5,39.333-34.5s39.334,15.477,39.334,34.5   c0,19.022-17.646,34.498-39.334,34.498c-6.458,0-12.827-1.399-18.505-4.057C18.689,71.289,14.366,73.833,9.49,73.833z    M20.361,65.078l1.148,0.581c5.397,2.729,11.561,4.173,17.824,4.173c19.483,0,35.334-13.682,35.334-30.498   c0-16.818-15.851-30.5-35.334-30.5S4,22.516,4,39.334c0,6.99,2.814,13.823,7.925,19.238l0.52,0.552l0.024,0.757   c0.087,2.72-0.401,6.407-2.818,9.951c4.63-0.074,8.89-3.298,9.705-3.95L20.361,65.078z"/>
                                    </g>
                                    </svg>
                                    <span className="text-sm">{comments.length}</span>
                                </button>
                            </div>


                            <div className="ml-2 flex items-center space-x-1">
                                    <button 
                                        type="button"
                                        onClick={handleLiking}
                                        className={`px-3 py-1 bg-[#8D5AEA] text-sm text-white border-0 rounded-md cursor-pointer transition-transform duration-200 ease-in-out hover:scale-110  ${likesData.hasLiked ? 'bg-[#F096CC] hover:bg-[#DC78B4]' : ''}`}
                                    >♡ <span className="text-sm">{likesData.likes.length}</span>
                                    </button>
                            </div>
                        </div>

                    </div>
                </div>
                
                {showCommentsOverlay && (
                    <div className="absolute top-0 right-0 w-full md:w-[50%] h-full bg-[var(--card-background)] backdrop-blur-lg z-50 rounded-xl shadow-lg p-4 transition-all duration-300 flex">
                        {/* close button */}
                        <button onClick={handleCloseComments} className="flex-1 absolute top-2 right-2 transform hover:scale-90 cursor-pointer rounded-lg bg-[var(--border-gray)] backdrop-blur-sm border">
                            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        
                        <div className='flex flex-col w-full'>
                            <p className='font-semibold text-md p-2 '>{comments.length} Comments</p>
                            <div className="p-3 w-[90%] flex-1 overflow-y-auto"> {/* give room for the close button */}
                                    {comments.map((comment) => (
                                        <div key={comment.id} className="text-sm ">
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
                                                        className='border h-[35px] p-2 rounded-sm border-[#ccc] bg-transparent text-white'
                                                        value={editedCommentText}
                                                        onChange={(e) => handleEditedCommentChange(e.target.value)}
                                                        rows="2"
                                                    />
                                                    <button onClick={(e) => handleSaveEdit(e, comment.id)}>✔️</button>
                                                </div>
                                            ) : (
                                                <div className='text-gray-300 p-2'>{comment.commentText}</div>
                                            )}
                                    </div>
                                    ))}
                            </div>
                            

                            {/* add comment */}
                            <form className='pt-6 pb-6 pl-2 w-full flex-2 ' onSubmit={handleSubmit}>
                                    <div className="relative w-[90%]">
                                        <textarea 
                                        className="w-full pr-10 border p-2 rounded-[20px] border-[#ccc] bg-transparent placeholder-gray-600 resize-y"
                                        value={newComment} 
                                        onChange={handleNewCommentChange} 
                                        placeholder='Add a comment...' 
                                        rows="1" 
                                        />
                                        <button 
                                        type="submit" 
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer"
                                        >
                                        <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" className="w-6 h-6 text-blue-500">
                                            <g fill="currentColor" fillRule="nonzero">
                                            <path d="m3.45559904 3.48107721 3.26013002 7.74280879c.20897233.4963093.20897233 1.0559187 0 1.552228l-3.26013002 7.7428088 18.83130296-8.5189228zm-.74951511-1.43663117 20.99999997 9.49999996c.3918881.1772827.3918881.7338253 0 .911108l-20.99999997 9.5c-.41424571.1873968-.8433362-.2305504-.66690162-.6495825l3.75491137-8.9179145c.10448617-.2481546.10448617-.5279594 0-.776114l-3.75491137-8.9179145c-.17643458-.41903214.25265591-.83697933.66690162-.64958246z"/>
                                            <path d="m6 12.5v-1h16.5v1z"/>
                                            </g>
                                        </svg>
                                        </button>
                                    </div>
                                </form>
                            </div>
                            {currentIndex < posts.length - 1 && (
                                <button onClick={handleNext} disabled={currentIndex === posts.length - 1} className='md:flex right-2 md:items-center md:p-2 hidden block text-3xl'>
                                    &gt;
                                </button>
                            )}
                    </div>
                    
                )}

        
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
