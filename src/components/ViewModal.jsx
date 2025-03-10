import React from 'react';
import { db, auth } from '@/firebase/FirebaseConfig';
//import '../styles/modal_styles.css';
import Image from 'next/image';
import useCommentsAndLikes from '@/hooks/useCommentsAndLikes';

function ViewModal({ closeModal, image }) {
    const { 
        state,
        handleLikeToggle,
        handleCommentSubmit,
        handleNewCommentChange,
        handleEditComment,
        handleEditedCommentChange,
        handleSaveEdit,
        handleDeleteComment,
    } = useCommentsAndLikes(image); 

    const { comments, newComment, editedCommentText, likesData, userProfileImage, userName } = state;
    const user = auth.currentUser;
    const formattedDate = new Date(image.createdAt.seconds * 1000).toLocaleString();
   
    return (
        <div className='flex w-full h-full fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[99999] bg-black/50'>
            <div className='flex w-full h-full overflow-y-auto md:overflow-y-hidden md:w-[calc(100%-70px)] md:h-[calc(100%-30px)] fixed md:top-1/2 md:left-1/2 md:transform md:-translate-x-[calc(50%+20px)] md:-translate-y-1/2 flex-col md:flex-row backdrop-blur-lg md:rounded-xl overflow-hidden text-white' style={{ background: 'var(--modal-background)' }}>
                {/* Image Section */}
                <div className='md:ml-4 md:mb-2 h-[30%] md:h-full flex justify-center items-center md:w-1/2'>
                    {image ? (
                        <div className='md:w-full w-[60%] h-[80%] md:h-[95%]'>
                            <Image src={image.img_data} alt="Selected" width={800} height={800} className="object-cover w-full h-full rounded-xl" />
                        </div>
                    ) : (
                        <p>No image selected</p>
                    )}
                </div>
                
                {/* Content Section */}
                <div className='w-full md:w-1/3 ml-4 md:ml-20'>
                    <div className='mt-4 mb-4 flex items-center'>
                        {userProfileImage ? (
                            <img src={userProfileImage} alt="User Photo" className="w-8 h-8 rounded-full mr-2" />
                        ) : (
                            <div className="w-8 h-8 bg-gray-500 rounded-full mr-2"></div>
                        )}
                        <span>{userName}</span>
                    </div>
                    <div className='mt-4 font-bold'>{image.title}</div>
                    <div className='mb-4 text-gray-400 text-sm'>{formattedDate}</div>
                    <div className='mt-2 h-32 mr-3  md:w-auto w-[90%] bg-[var(--card-background)] p-3 rounded-xl'>
                        <div className='text-gray-400 text-sm pb-2'>
                            Prompt Description <p className='text-gray-500 text-base pt-2'>{image.prompt}</p>
                        </div>
                    </div>
                    <div className="mt-[20px]">
                        <h3>Comments:</h3>
                        <div className="mb-5 md:max-h-[100px] bg-transparent border border-[#ccc] md:w-auto w-[90%] max-h-[90px] overflow-y-auto bg-[var(--card-background)] rounded-[10px]">
                            {comments.map((comment) => (
                                <div key={comment.id} className="mb-2.5 p-1.5 border-b border-[#ccc] text-[#CBD5E0] text-sm">
                                    <div className='flex justify-between'>
                                        <strong className='text-sm text-[#6B7280]'>{comment.createdBy}</strong>
                                        {comment.createdByUID === user.uid && state.editingCommentId !== comment.id && (
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
                                    ) : (
                                        <div className='text-white'>{comment.commentText}</div>
                                    )}
                                </div>
                            ))}
                        </div>
                        <form onSubmit={handleCommentSubmit}>
                            <textarea className="md:w-full w-[90%] p-2.5 border rounded-xl border-[#ccc] bg-transparent placeholder-gray-600 rounded-md resize-y text-black" 
                            value={newComment} 
                            onChange={handleNewCommentChange} 
                            placeholder='Add a comment...' rows="1" />
                            <div className="flex mt-[10px] items-center gap-[10px]">
                                <button type="submit" className="px-4 py-2 bg-[#8D5AEA] text-white border-0 rounded-lg cursor-pointer hover:bg-[#B69AF9]">Post Comment</button>
                                <button onClick={handleLikeToggle} className={`px-4 py-2 bg-[#8D5AEA] text-white border-0 rounded-md cursor-pointer transition-transform duration-200 ease-in-out hover:scale-110 ${likesData.hasLiked ? 'bg-[#F096CC] hover:bg-[#DC78B4]' : ''}`}>♡ {likesData.likes.length}</button>
                                <div onClick={closeModal} className="w-[10%] md:opacity-0 md:pointer-events-none hover:scale-90 absolute right-0 top-0 p-2">
                                    <img className='' src="/Vector.png" alt="close_pin" />
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            <div onClick={closeModal} className="w-[4%] hover:scale-90 absolute right-0 top-0 p-2">
                <img src="/Vector.png" alt="close_pin" />
            </div>
        </div>
    );
}

export default ViewModal;



