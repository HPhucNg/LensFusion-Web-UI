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
                        <span>{userName}</span>
                    </div>
                    <div className='mt-4 font-bold'>{image.title}</div>
                    <div className='mb-4 text-gray-400 text-sm'>{formattedDate}</div>
                    <div className='mt-2 h-32 mr-3 bg-[var(--card-background)] p-3 rounded-xl'>
                        <div className='text-gray-400 text-sm pb-2'>
                            Prompt Description <p className='text-gray-500 text-base pt-2'>{image.prompt}</p>
                        </div>
                    </div>
                    <div className="mt-[20px]">
                        <h3>Comments:</h3>
                        <div className="mb-5 max-h-[100px] overflow-y-auto bg-[var(--card-background)] rounded-[10px]">
                            {comments.map((comment) => (
                                <div key={comment.id} className="mb-2.5 p-1.5 border-b border-[#ccc] text-[#CBD5E0] text-sm">
                                    <div><strong className='font-bold text-base text-[#6B7280]'>{comment.createdBy}</strong></div>
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
                        <form onSubmit={handleCommentSubmit}>
                            <textarea className="w-full p-2.5 border border-[#ccc] rounded-md resize-y text-black" 
                            value={newComment} 
                            onChange={handleNewCommentChange} 
                            placeholder='Add a comment...' rows="3" />
                            <div className="flex mt-[10px] items-center gap-[10px]">
                                <button type="submit" className="mt-2 px-4 py-2 bg-[#8D5AEA] text-white border-0 rounded-lg cursor-pointer hover:bg-[#B69AF9]">Post Comment</button>
                                <button onClick={handleLikeToggle} className={`mt-2 px-4 py-2 bg-[#8D5AEA] text-white border-0 rounded-md cursor-pointer transition-transform duration-200 ease-in-out hover:scale-110 ${likesData.hasLiked ? 'bg-[#F096CC] hover:bg-[#DC78B4]' : ''}`}>♡ {likesData.likes.length}</button>
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


