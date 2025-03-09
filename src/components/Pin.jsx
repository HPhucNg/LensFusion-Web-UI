import React from 'react';
import Image from 'next/image'; // Assuming you are using Next.js Image component
import useCommentsAndLikes from '@/hooks/useCommentsAndLikes';
import { db, auth } from '@/firebase/FirebaseConfig';

function Pin({ image }) {
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
        <div className="group">
            <div className="relative w-full">
                {image ? (
                    <div className="relative w-full h-full">
                        {/* Image */}
                        <Image 
                            src={image.img_data} 
                            alt={image.title} 
                            width={800} 
                            height={800} 
                            className="object-cover w-full h-full rounded-xl" 
                        />

                        {/* User Info positioned at the bottom of the image */}
                        <div className='absolute bottom-0 left-0 right-0 p-4 flex justify-between items-center bg-gradient-to-t from-black via-transparent to-transparent rounded-b-xl z-10'>
                            {/* Left side: User profile and username */}
                            <div className="flex items-center">
                                {userProfileImage ? (
                                    <img src={userProfileImage} alt="User Photo" className="w-8 h-8 rounded-full mr-2" />
                                ) : (
                                    <div className="w-8 h-8 bg-gray-500 rounded-full mr-2"></div>
                                )}
                                <span className="text-white">{userName}</span>
                            </div>

                            {/* Right side: Likes count */}
                            <span className="text-white group-hover:hidden">♡ {likesData.likes.length}</span>
                        </div>
                
                    </div>
                ) : (
                    <p>No image selected</p>
                )}
            </div>

            {/* Title Backdrop and Button */}
            <div className="overflow-hidden h-0 group-hover:h-10 transition-all duration-300 bg-black/40 rounded-b-xl z-20">
                <div className="flex justify-end items-center p-2"> {/* Flex container to align button to the right */}
                    <button 
                        onClick={handleLikeToggle} 
                        className={`p-2 bg-[#8D5AEA] text-white border-0 rounded-md cursor-pointer transition-transform duration-200 ease-in-out hover:scale-110 ${likesData.hasLiked ? 'bg-[#F096CC] hover:bg-[#DC78B4]' : ''}`}
                    >
                        ♡ {likesData.likes.length}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Pin;
