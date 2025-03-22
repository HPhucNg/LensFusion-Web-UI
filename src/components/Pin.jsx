import React from 'react';
import Image from 'next/image';
import useCommentsAndLikes from '@/hooks/useCommentsAndLikes';
import { db, auth } from '@/firebase/FirebaseConfig';

function Pin({ image }) {
    const { state } = useCommentsAndLikes(image);
    const { likesData, userProfileImage, userName } = state;

    return (
        <div className="relative w-full group"> {/* group class added for hover */}
            {/* image container */}
            <div className="relative w-full h-auto">
                <Image 
                    src={image.img_data} 
                    alt={image.title} 
                    width={800} 
                    height={800} 
                    className="object-cover w-full h-full rounded-xl" 
                />

                {/* user info positioned at the bottom of the image */}
                <div className="absolute bottom-0 left-0 right-0 pl-4 pr-4 pb-2 bg-gradient-to-t from-black/50 to-transparent flex justify-between items-center rounded-b-xl z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center overflow-hidden">
                        {userProfileImage ? (
                            <img src={userProfileImage} alt="User Photo" className="w-6 h-6 rounded-full mr-2" />
                        ) : (
                            <div className="w-6 h-6 bg-gray-500 rounded-full mr-2"></div>
                        )}
                        <span className="text-white text-sm">{userName}</span>
                    </div>
                    <span className="text-white text-sm">♡ {likesData.likes.length}</span>
                </div>
            </div>
        </div>
    );
}

export default Pin;
