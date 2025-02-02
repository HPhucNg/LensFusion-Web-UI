'use client'
import React, { useState } from 'react';
import '../styles/modal_styles.css';

function GalleryModal({ closeModal, image, openPostModal }) {  // Accept the 'image' prop
    const [showModalPin, setShowModalPin] = useState(false);

    // Trigger Post Modal when "Post to Community" is clicked
    const handlePostToCommunityClick = () => {
        openPostModal();  // This will open the Post Modal in UserProfile
        closeModal();     // Close the Gallery Modal
    };

    return (
        <div className='add_pin_modal'>
            <div className='add_pin_container'>
                <div className="side" id="left_side">
                    <div className="topsection">
                        <div className="post_to">Manage Image</div>
                    </div>
                
                    <div className="midsection">
                        <div>
                                {/* Render the selected image */}
                                {image ? (
                                    <img src={image} alt="Selected" className="object-cover w-full h-full rounded-xl" />
                                ) : (
                                    <p>No image selected</p>
                                )}
                        </div>

                        <div className="modals_pin" style={{ display: showModalPin ? 'block' : 'none' }}>
                            {/* Optionally add pin image or other functionality */}
                        </div>
                    </div>
                </div>

                <div className="side" id="right_side">
                    <div className="topsection">
                        <div onClick={closeModal} className="icon_close">
                            <img src="/Vector.png" alt="close_pin" />
                        </div>
                    </div>

                    <div className="midsection items-center">
                        <button className="w-[240px] h-[40px] mb-4 rounded-[22px] flex justify-center items-center text-[#1a202c] bg-[hsl(261,80%,64%)] hover:bg-[hsl(260,72.6%,77.1%)] text-white transition-all duration-100">Open Workflow</button>
                        <button className="w-[240px] h-[40px] mb-4 rounded-[22px] flex justify-center items-center text-[#1a202c] bg-[hsl(261,80%,64%)] hover:bg-[hsl(260,72.6%,77.1%)] text-white transition-all duration-100" onClick={handlePostToCommunityClick} >Post to Community</button>
                        <button className="w-[240px] h-[40px] mb-4 rounded-[22px] flex justify-center items-center text-[#1a202c] bg-[hsl(261,80%,64%)] hover:bg-[hsl(260,72.6%,77.1%)] text-white transition-all duration-100">Delete</button> 
                    </div>
                </div>
            </div>
        </div>
    );
}

export default GalleryModal;
