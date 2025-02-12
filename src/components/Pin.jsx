'use client';

import React from 'react';
import '../styles/pin_styles.css';

function Pin({ pinDetails }) {
    const cardSizes = ['card_large', 'card_medium', 'card_small'];  // Array of card size classes
    const cardSizeClass = cardSizes[Math.floor(Math.random() * 3)];  // Randomize card size

    return (
        <div className={`card ${cardSizeClass}`}>
            <div className="pin_image">
                <img src={pinDetails.img_data} alt={pinDetails.title} />
            </div>
        </div>
    );
}

export default Pin;

