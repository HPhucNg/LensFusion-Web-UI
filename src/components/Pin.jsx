'use client'
import React, { useState } from 'react';
import '../pin_styles.css'
{/*view community post image*/}

function upload_img(event, setPinImage) {
    if (event.target.files &&event.target.files[0]) {   {/*check what type of file*/}
        if (/image\/*/.test(event.target.files[0].type)){ {/*cif image, upload the stuff*/}
            const reader = new FileReader();
            reader.onload = function(){
                setPinImage(reader.result); {/*change state of the pin image to actual data url which changes src*/}
            }
            reader.readAsDataURL(event.target.files[0])
        }
    }
}

function Pin() {
    const [pinImage, setPinImage] = useState()
    return (
        <div>
            <input onChange={event => upload_img(event, setPinImage)} type="file" name="picture" id="picture" value=""/>

            <div className='card'>
                <div className='pin_title'></div> {/*title that the user is not going to see */}
                <div className='pin_modal'> {/*overlay*/}
                    <div className="modal_head">
                        <div className="post_title">Post to Community</div>
                    </div>
                    <div className="modal_foot">
                        <div className="destination">
                            <span>Publish</span>
                        </div>
                    </div>
                </div>  
                <div className='pin_image'> {/*actual image on top of the overlay*/}
                    <img src={pinImage} alt="pin_image"/>
                </div> 
            </div>
        </div>
    )
}

export default Pin;