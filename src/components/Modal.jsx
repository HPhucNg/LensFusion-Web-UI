'use client'
import React, { useState } from 'react';
import '../styles/modal_styles.css';

function upload_img(event, pinDetails, setPinDetails, setShowLabel, setShowModalPin) {
    if (event.target.files && event.target.files[0]) {
        if (/image\/*/.test(event.target.files[0].type)) {
            const reader = new FileReader();
            reader.onload = function () {
                setPinDetails({
                    ...pinDetails,
                    img_data: reader.result
                });
                setShowLabel(false);
                setShowModalPin(true);
            };
            reader.readAsDataURL(event.target.files[0]);
        }
    }
}

function save_pin(pinDetails, add_pin) {
    const users_data = {
        ...pinDetails,
        created_by: 'Jack',
        title: document.querySelector('#pin_title').value,
        description: document.querySelector('#pin_description').value,
        destination: document.querySelector('#pin_destination').value,
    };

    add_pin(users_data); // Pass the final pin data to add_pin function
}

function Modal({ closeModal, add_pin }) { // Accept add_pin as a prop
    const [pinDetails, setPinDetails] = useState({
        created_by: '',
        title: '',
        description: '',
        destination: '',
        pin_num: '',
        img_data: '',
    });

    const [showLabel, setShowLabel] = useState(true);
    const [showModalPin, setShowModalPin] = useState(false);

    return (
        
        <div className="add_pin_modal">
            <div className="add_pin_container ">
                <div className="side" id="left_side">
                    <div className="topsection">
                        <div className="post_to">Post to Community</div>
                    </div>
                
                    <div className="midsection">
                        <label htmlFor="upload_img" id="upload_img_label"
                            style={{ display: showLabel ? 'block' : 'none' }}
                        >
                            <div className="upload_img_container">
                                <div id="dotted_border">
                                    <div>Click to upload</div>
                                </div>
                            </div>

                            <input onChange={event => upload_img(event, pinDetails, setPinDetails, setShowLabel, setShowModalPin)} type="file" name="upload_img" id="upload_img" value="" />
                        </label>

                        <div className="modals_pin"
                            style={{
                                display: showModalPin ? 'block' : 'none'
                            }}
                        >
                            <div className='pin_image'>
                                <img src={pinDetails.img_data} alt="pin_image" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="side" id="right_side">
                    <div className="topsection">
                        <div onClick={closeModal} className='icon_close'>
                            <img src="/Vector.png" alt="close_pin" />
                        </div>
                    </div>

                    <div className="midsection">
                        <input placeholder="Add your Title" type="text" className="new_pin_input" id="pin_title" />
                        <input placeholder="Caption your image" type="text" className="new_pin_input" id="pin_description" />
                        <input placeholder="Add a destination link" type="text" className="new_pin_input" id="pin_destination" />
                    </div>

                    <div className="bottomsection">
                        <div onClick={() => save_pin(pinDetails, add_pin)} className='publish_pin'>Publish</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Modal;
