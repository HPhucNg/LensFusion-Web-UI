import React, { useState, useEffect } from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu";
import Image from 'next/image'; 
import { auth, db } from '@/firebase/FirebaseConfig'; 
import { collection, addDoc, doc, updateDoc, getDoc, getDocs, deleteDoc, deleteField } from 'firebase/firestore';

function Modal({ closeModal, add_community, selectedImage, initialStatus, setImageStatus }) {
    const [pinDetails, setPinDetails] = useState({
        created_by: '',
        title: '',
        prompt: selectedImage?.positivePrompt || 'No prompt available',
        negativePrompt: selectedImage?.negativePrompt || null,
        img_data: selectedImage?.img_data,
        category: '',  // new category field in pin details state
    });
    //console.log(selectedImage.communityPostId);
    const [userData, setUserData] = useState({ created_by: '', userPic: '' });

    const [isEditing, setIsEditing] = useState(false); // is editing an existing post

    // Function to truncate text with increased character limit
    const truncateText = (text, maxLength = 200) => {
        if (!text) return '';
        return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
    };
    
    // check if the post is being managed or new (based on communityPost flag)
    const headingText = initialStatus ? "Manage Post to Community" : "Post to Community";
    const [isLoading, setIsLoading] = useState(false);
    const [communityPostId, setCommunityPostId] = useState(selectedImage?.communityPostId);

    // first fetch user data from 'users' collection using selectedImage.userID (userId)
    useEffect(() => {
        const fetchUserData = async () => {
            if (selectedImage?.userID) {
                setIsLoading(true);
                try {
                    const userRef = doc(db, 'users', selectedImage.userID);  // fetch by ID from 'users' collection
                    const userDoc = await getDoc(userRef);

                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        setUserData({
                            created_by: userData.name || 'Unknown',  // set the user's name
                            userPic: userData.photoURL || '',  // set the user's photoURL
                        });
                    } else {
                        console.log("User not found.");
                    }
                } catch (error) {
                    console.error("Error fetching user data: ", error);
                }
                setIsLoading(false);
            }
        };

        fetchUserData();
    }, [selectedImage]);

    // then fetch community post data after user data is fetched // fetch post data if communityPost is true
    useEffect(() => {
        const fetchCommunityPost = async () => {
            if (selectedImage?.uid) {
                setIsLoading(true);
                try {
                    const userImageRef = doc(db, 'user_images', selectedImage.uid);
                    const userImageDoc = await getDoc(userImageRef);

                    if (userImageDoc.exists()) {
                        const userImageData = userImageDoc.data();
                        if (userImageData.hasOwnProperty('communityPostId')) {
                                setCommunityPostId(userImageData.communityPostId)
                        } 
                        else { setCommunityPostId(false)}

                        if (userImageData.communityPostId) {
                            //console.log("heree", userImageData.communityPostId)
                            //console.log("post", communityPostId)
                            const communityPostRef = doc(db, 'community', userImageData.communityPostId);
                            const communityPostDoc = await getDoc(communityPostRef);
                            if (communityPostDoc.exists()) {
                                const communityPostData = communityPostDoc.data();
                                setPinDetails({
                                    created_by: communityPostData.created_by || '',
                                    title: communityPostData.title || '',
                                    prompt: communityPostData.prompt || selectedImage.positivePrompt || 'No prompt available.',
                                    negativePrompt: communityPostData.negativePrompt || selectedImage.negativePrompt || null,
                                    img_data: communityPostData.img_data || selectedImage?.img_data,
                                    category: communityPostData.category || '',
                                });
                                setIsEditing(true);
                            }
                        }
                    }
                } catch (error) {
                    console.error("Error fetching community post data: ", error);
                }
                setIsLoading(false);
            }
        };

        if (userData.created_by) {  // only fetch community post once user data is set
            fetchCommunityPost();
        }
    }, [userData, selectedImage]);


    const save_community = async () => {
        const users_data = {
            ...pinDetails,
            
        };

        try {
            // communityPost is false, save as a new post
            if (!initialStatus) {
                const communityRef = await addDoc(collection(db, 'community'), {
                    created_by: userData.created_by,
                    title: users_data.title || 'Untitled',
                    prompt: users_data.prompt || 'No prompt available',
                    negativePrompt: users_data.negativePrompt,
                    img_data: users_data.img_data,
                    userImageId: selectedImage.uid,
                    createdAt: new Date(), // Timestamp
                    userId: auth.currentUser?.uid, 
                    category: users_data.category, // save the category when posting
                });

                console.log('Community Post saved with ID: ', communityRef.id);

                // update the user's image document to set communityPost to true
                const userImageRef = doc(db, 'user_images', selectedImage.uid);
                await updateDoc(userImageRef, {
                    communityPostId: communityRef.id, 
                });
                setCommunityPostId(communityRef.id);
                setImageStatus(true);
                // update the image status in the parent component
                add_community(users_data); 
                closeModal(); 

            } else {
                // if communityPost is true, update the existing post
                const communityPostRef = doc(db, 'community', communityPostId);
                console.log("editing", communityPostId)
                await updateDoc(communityPostRef, {
                    title: users_data.title || 'Untitled',
                    category: users_data.category,  // update the category when editing the post
                    prompt: users_data.prompt,
                    negativePrompt: users_data.negativePrompt
                });
                console.log('Community Post updated with ID: ', communityPostId);
                add_community(users_data); 
                closeModal();
            }
        } catch (e) {
            console.error('Error adding/updating document: ', e);
        }
    };

    const removeFromCommunity = async () => {
        try {
            // reference to the community post in the 'community' collection
            const communityPostRef = doc(db, 'community', communityPostId);
    
            // remove likes subcollection (if it exists)
            const likesRef = collection(communityPostRef, 'likes');
            const likesSnapshot = await getDocs(likesRef);
            likesSnapshot.forEach(async (likeDoc) => {
                await deleteDoc(doc(likesRef, likeDoc.id));  // delete each like document
            });
    
            // remove comments subcollection (if it exists)
            const commentsRef = collection(communityPostRef, 'comments');
            const commentsSnapshot = await getDocs(commentsRef);
            commentsSnapshot.forEach(async (commentDoc) => {
                await deleteDoc(doc(commentsRef, commentDoc.id));  // delete each comment document
            });
    
            //remove the community post itself
            await deleteDoc(communityPostRef);
    
            // update the user's image document to remove the community post reference
            const userImageRef = doc(db, 'user_images', selectedImage.uid);
            await updateDoc(userImageRef, {
                communityPostId: deleteField(),
            });
            // update the parent component's state
            
            alert("Image removed from community successfully!");
            setImageStatus(false);
            closeModal(); 
        } catch (error) {
            console.error("Error removing image from community: ", error);
        }
    };

    const handleRemoveClick = () => {
        // ask the user for confirmation
        const userConfirmed = window.confirm("Are you sure you want to remove this image from the community?");
        
        if (userConfirmed) {
            // if the user confirms, proceed with removing the image from the community
            removeFromCommunity();
            console.log("Image removed from community.");
        } else {
            console.log("Image removal canceled.");
        }
    };
    

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 text-white flex justify-center items-center">
            <div className="border-2 border-transparent rounded-[50px] w-full max-w-4xl h-auto min-h-[550px] max-h-[90vh] overflow-y-auto p-6 md:p-8" style={{ background: 'var(--modal-background)', backdropFilter: 'var(--modal-backdrop)'}}>
                <div className="flex items-center mb-4 justify-between w-full">
                    <div onClick={closeModal} className="w-4 transform hover:scale-90">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6 text-white">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                        </svg>
                    </div>
                    <h1 className="text-2xl font-extrabold flex-grow text-center">{headingText}</h1>
                    {/* show the Remove from Community button only if the image is in the community */}
                    {initialStatus && (
                        <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="w-8 transform hover:scale-90">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6 text-white">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 12h12M6 6h12m-6 12h6"></path>
                            </svg>
                        </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 bg-[#0D161F] border-gray-800">
                          <DropdownMenuItem onClick={handleRemoveClick} className="text-slate-400 hover:text-white cursor-pointer">
                            Remove from Community
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      
                        
                    )}
                </div>
                <div className="flex flex-col sm:flex-row items-start gap-6 p-4 h-full"> {/* Main section - left and right side */}
                    {/* Left side - image */}
                    <div className="w-full sm:w-[320px] h-[320px] flex-shrink-0 rounded-xl overflow-hidden">
                        {pinDetails.img_data && (
                            <Image 
                                src={pinDetails.img_data}  
                                alt="Selected"  
                                width={320}  
                                height={320}  
                                className="object-contain w-full h-full rounded-xl" 
                            />       
                        )}
                    </div>
                    <div className="w-full sm:flex-1 space-y-4 overflow-y-auto pr-1">
                        <div>
                            <label className="text-sm font-medium text-gray-400">Title:</label>
                            <input
                                placeholder="Add your Title Here"
                                type="text"
                                className="bg-transparent placeholder-gray-500 text-lg border-b-2 mt-1 border-gray-400 focus:outline-none w-full"
                                id="community_title"
                                value={pinDetails.title}
                                onChange={(e) => setPinDetails({ ...pinDetails, title: e.target.value })}
                            />
                        </div>
                        {/* Prompts section with truncation but no toggle */}
                        {(pinDetails.prompt || pinDetails.negativePrompt) && (
                            <div className="space-y-3">
                                {pinDetails.prompt && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-400">Positive Prompt:</label>
                                        <div className="text-white text-sm mt-1 bg-gray-800/50 p-2 rounded-md">
                                            <p>{truncateText(pinDetails.prompt, 200)}</p>
                                        </div>
                                    </div>
                                )}
                                
                                {pinDetails.negativePrompt && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-400">Negative Prompt:</label>
                                        <div className="text-white text-sm mt-1 bg-gray-800/50 p-2 rounded-md">
                                            <p>{truncateText(pinDetails.negativePrompt, 200)}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {/* User info */}
                        <div className="flex items-center">
                            {userData.userPic ? (
                                <img src={userData.userPic} alt="User" className="w-8 h-8 rounded-full mr-2" />
                            ) : ( <div className="w-8 h-8 bg-gray-600 rounded-full mr-2"></div>
                            )}
                            <p className="font-medium">{userData.created_by}</p>
                        </div>
                        <div> {/* Category Dropdown */}
                        <label className="text-sm font-medium text-gray-400">Category:</label>
                            <select 
                                className="w-full mt-1 bg-gray-800/50 border border-gray-600 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#8d5aed] transition-all duration-200"
                                value={pinDetails.category}
                                onChange={(e) => setPinDetails({ ...pinDetails, category: e.target.value })}
                            >
                                <option value="">Select Category</option>
                                <option value="toys">Toys</option>
                                <option value="skincare">Skincare</option>
                                <option value="candles">Candles</option>
                                <option value="furniture">Furniture</option>
                                <option value="cars">Cars</option>
                                <option value="bags">Bags</option>
                                <option value="jewelry">Jewelry</option>
                                <option value="shoes">Shoes</option>
                                <option value="watches">Watches</option>
                                <option value="electronics">Electronics</option>
                                <option value="others">Others</option>
                            </select>
                        </div>
                        <div className='pt-2'>
                            <button
                                onClick={save_community} 
                                className="w-full py-2 rounded-full bg-[#8d5aed] hover:bg-[#b69aef] transition-colors duration-300"
                            >
                                {initialStatus ? 'Update Post' : 'Publish to Community'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Modal;

