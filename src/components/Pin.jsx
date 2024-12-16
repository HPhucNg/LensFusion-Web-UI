'use client'
import React from 'react';
import '../styles/pin_styles.css';

function Pin({ pinDetails }) { // Accept pinDetails directly
    // Generate a random integer between 0 and 2
    const randomCardSize = Math.floor(Math.random() * 3); // This will give 0, 1, or 2

    // Map random value to class names
    const cardSizeClass = randomCardSize === 0 ? 'card_large' :
                          randomCardSize === 1 ? 'card_medium' : 
                          'card_small';

    return (

        <div className={`card ${cardSizeClass}`}>
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
