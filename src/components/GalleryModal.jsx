'use client'
import React, { useState } from 'react';
import '../styles/modal_styles.css';

function GalleryModal({ closeModal, image }) {  // Accept the 'image' prop
    const [showModalPin, setShowModalPin] = useState(false);

    return (
        <div>
            <div className="w-[880px] h-[550px] absolute top-[60%] left-[50%] transform -translate-x-1/2 -translate-y-1/2 flex overflow-hidden text-white border-2 border-transparent rounded-[50px] bg-white bg-opacity-30 backdrop-blur-lg p-[2px]">
                
                <div className="side" id="left_side">
                    <div className="topsection">
                        <div className="post_to">Viewing Image</div>
                    </div>
                
                    <div className="midsection">
                        <div className="upload_img_container">
                            <div id="dotted_border">
                                {/* Render the selected image */}
                                {image ? (
                                    <img src={image} alt="Selected" className="object-cover w-full h-full rounded-xl" />
                                ) : (
                                    <p>No image selected</p>
                                )}
                            </div>
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

                    <div className="midsection">
                        <button class="w-[240px] h-[40px] mb-4 rounded-[22px] flex justify-center items-center text-[#1a202c] bg-pink-100 hover:bg-[rgb(245,105,129)] transition-all duration-100">Open Workflow</button>
                        <button class="w-[240px] h-[40px] mb-4 rounded-[22px] flex justify-center items-center text-[#1a202c] bg-pink-100 hover:bg-[rgb(245,105,129)] transition-all duration-100" >Post to Community</button>
                        <button class="w-[240px] h-[40px] mb-4 rounded-[22px] flex justify-center items-center text-[#1a202c] bg-pink-100 hover:bg-[rgb(245,105,129)] transition-all duration-100">Delete</button> 
                    </div>
                </div>
            </div>
        </div>
    );
}

export default GalleryModal;
