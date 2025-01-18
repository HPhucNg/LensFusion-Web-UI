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
                        <input placeholder="Open Workflow" type="text" className="new_pin_input" id="pin_title" />
                        <input placeholder="Post to Community" type="text" className="new_pin_input" id="pin_description" />
                        <input placeholder="Delete" type="text" className="new_pin_input" id="pin_destination" />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default GalleryModal;
