'use client'
import React, { useState } from 'react';
import '../styles/modal_styles.css';

function ViewModal({ closeModal, image}) {  // Accept the 'image' prop
    const [showModalPin, setShowModalPin] = useState(false);



    return (
        <div className='add_pin_modal'>
            {/* LIGHT MODE
            <div className="w-[880px] h-[550px] absolute top-[40%] left-[50%] transform -translate-x-1/2 -translate-y-1/2 flex overflow-hidden text-white border-2 border-transparent rounded-[50px] bg-white bg-opacity-30 backdrop-blur-lg p-[2px]">
               */} 
            <div className='add_pin_container '>
                <div className="side" id="left_side">
                    <div className="topsection">
                        <div className="post_to">Viewing Image</div>
                    </div>
                
                    <div className="midsection">
                        <div>
                                {/* Render the selected image */}
                                {image ? (
                                    <img src={image.img_data} alt="Selected" className="object-cover w-full h-full rounded-xl" />
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

                    <div className="midsection">
                        <div>Title: {image.title}</div>
                        <div>Description: {image.description}</div>
                        <div>Created By: {image.created_by}</div>
                        <div>Like</div>
                        <div>Comment</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ViewModal;