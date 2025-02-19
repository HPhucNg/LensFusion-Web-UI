'use client';

import React from 'react';
import Image from 'next/image';  // Import Image component from next/image
import '../styles/pin_styles.css';

function Pin({ pinDetails }) {
    const cardSizes = ['card_large', 'card_medium', 'card_small'];  // Array of card size classes
    const cardSizeClass = cardSizes[Math.floor(Math.random() * 3)];  // Randomize card size

    return (
        <div className={`card ${cardSizeClass}`}>
            <div className="pin_image">
                <Image 
                    src={pinDetails.img_data}  // Image URL
                    alt={pinDetails.title}  // Image alt text
                    width={400}  // Specify the width
                    height={400}  // Specify the height
                    className="object-cover"  // Optional class for styling
                />
            </div>
        </div>
    );
}

export default Pin;
