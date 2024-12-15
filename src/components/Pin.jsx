'use client'
import React from 'react';
import '../styles/pin_styles.css';

function Pin({ pinDetails }) { // Accept pinDetails directly
    return (
        <div className='card'>
            <div className='pin_title'>{pinDetails.title}</div>
            
            <div className='pin_modal'>
                <div className="modal_head">
                    <div className="post_title">{pinDetails.title}</div>
                </div>
                
                <div className="modal_foot">
                    <div className="destination">
                        <span>{pinDetails.destination}</span>
                    </div>
                </div>
            </div> 

            <div className='pin_image'>
                <img src={pinDetails.img_data} alt="pin_image" />
            </div> 
        </div>
    );
}

export default Pin;
