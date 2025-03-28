import React from 'react';
import { db, auth } from '@/firebase/FirebaseConfig';
//import '../styles/modal_styles.css';
import Image from 'next/image';
import useCommentsAndLikes from '@/hooks/useCommentsAndLikes';

function ViewModal({ closeModal, image, posts, currentIndex, setCurrentIndex }) {
    console.log(image);
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


   
    return (
        <div className='md:w-[80%] w-[90%] md:flex-row flex flex-col font-sans relative rounded-xl shadow-md overflow-hidden' style={{ background: 'var(--modal-background)' }}>
            <div className='pt-4 md:pl-2 p-4 flex-1 flex'>
            {currentIndex > 0 && (<button onClick={handlePrevious} disabled={currentIndex === 0} className='flex items-center pr-2'>&lt;</button>)}
                {selectedPost ? (
                    <div className='max-h-[500px] mr-2 mb-4'>
                        <Image 
                            src={selectedPost.img_data} 
                            alt="Selected" 
                            width={700} 
                            height={700} 
                            className="object-contain w-full h-full rounded-xl" />
                    </div>
                ) : (<p>No image selected</p>)}
                {currentIndex < posts.length - 1 && (<button onClick={handleNext} disabled={currentIndex === posts.length - 1} className='flex items-center md:hidden md:block'>&gt;</button>)}
            </div>

            <div className='flex flex-1'>
                <div className='flex flex-col items-start p-4'>
                    <div className="flex items-center justify-between w-full">
                        <div className="flex items-center">
                            <img className="w-[80px] h-auto" src="ellipsis_gray.png" alt="more_options_icon" />
                            <img className="w-[30px] h-auto" src="share.png" alt="share_icon" />
                        </div>

                        <button
                            onClick={handleLiking}
                            className={`px-3 py-1 bg-[#8D5AEA] m-6 text-white border-0 rounded-md cursor-pointer transition-transform duration-200 ease-in-out hover:scale-110 ${likesData.hasLiked ? 'bg-[#F096CC] hover:bg-[#DC78B4]' : ''}`}
                        >
                            ♡ {likesData.likes.length}
                        </button>
                    </div>

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

                    <div className='p-2 pr-6 w-full'>
                        <p className='font-semibold text-md pb-4'>{comments.length} Comments</p>
                        {comments.map((comment) => (
                            <div key={comment.id} className="text-sm">
                                <div className='flex justify-between'>
                                    <strong className='font-semibold'>{comment.createdBy}</strong>
                                    {comment.createdByUID === user?.uid && state.editingCommentId !== comment.id && (
                                        <div>
                                            <button className='hover:text-blue-300' onClick={() => handleEditComment(comment.id, comment.commentText)}>Edit | </button>
                                            <button className='hover:text-red-300' onClick={() => handleDeleteComment(comment.id)}>| Delete</button>
                                        </div>
                                    )}
                                </div>
                                {state.editingCommentId === comment.id ? (
                                    <div>
                                        <textarea 
                                            value={editedCommentText} 
                                            onChange={(e) => handleEditedCommentChange(e.target.value)} // Handle change here
                                            rows="2"  
                                        />
                                        <button onClick={(e) => handleSaveEdit(e, comment.id)}>Save</button>
                                    </div>
                                    ) : (<div className='text-gray-400 p-2'>{comment.commentText}</div>)}
                            </div>
                        ))}
               
                        <form className='pt-6 pb-6 relative' onSubmit={handleSubmit}>
                            <textarea className="w-full border p-2 rounded-[20px] border-[#ccc] bg-transparent placeholder-gray-600 resize-y"
                                value={newComment} 
                                onChange={handleNewCommentChange} 
                                placeholder='Add a comment...' rows="1" />
                            <button type="submit" className="absolute right-2 top-[47%] transform -translate-y-1/2">
                                <img src="/send-icon.png" alt="Send" className="w-5 h-5" />
                            </button>
                        </form>  
                    </div>     
                </div>
                {currentIndex < posts.length - 1 && (<button onClick={handleNext} disabled={currentIndex === posts.length - 1} className='md:flex md:flex-grow md:justify-end md:items-center md:p-2 hidden block'>&gt;</button>)}
            </div>

        </div>
        
    );
}

export default ViewModal;



