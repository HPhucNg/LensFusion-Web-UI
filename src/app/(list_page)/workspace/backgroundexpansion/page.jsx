"use client";
import React, { useState, useEffect } from 'react';

export default function Home() {
    const [selectedFile, setSelectedFile] = useState(null);
    const [selectedAlignment, setSelectedAlignment] = useState('Middle');

    // file input change and set the selected file
    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
        setSelectedFile(file);
        }
    };

     // select dropdown change for alignment
     const handleAlignmentChange = (event) => {
        setSelectedAlignment(event.target.value);
    };

    // handle close (X) button click
    const handleCloseImage = (event) => {
        event.stopPropagation();
        setSelectedFile(null);
    };


    return (
        <div className="min-h-screen bg-gradient-to-r from-gray-900 via-gray-800 to-black font-sans relative overflow-hidden">
            <h1 className="text-center text-xl font-bold m-10">Diffusers Image Outpaint</h1>
            <main className='flex flex-wrap justify-center w-[80%] gap-[16px] mx-auto'> {/* main container */}
                <div className='flex flex-col gap-[16px] flex-1' > {/* left side */}
                    <div
                        className="border-2 border-dashed border-gray-500 rounded-md relative flex items-center justify-center"
                        style={{ minHeight: "250px" }}
                    >
                        {/* Upload image container */}
                        <input
                            type="file"
                            accept="image/*" // only image files
                            className="hidden"
                            onChange={handleFileChange}
                            id="file-upload"
                        />
                        <label
                            htmlFor="file-upload"
                            className="w-full h-full text-center cursor-pointer flex items-center justify-center"
                        >
                            {/* Show "Click to Upload" text if no image is selected */}
                            {!selectedFile && <span className="text-white">Click to Upload</span>}

                            {/* Show image if one is selected */}
                            {selectedFile && (
                                <div className="relative w-full h-full">
                                    <img
                                        src={URL.createObjectURL(selectedFile)}
                                        alt="Selected Image"
                                        className="object-cover rounded-md w-full h-full"
                                    />
                                </div>
                            )}
                        </label>

                        {/* Close (X) icon outside the label to prevent triggering file input */}
                        {selectedFile && (
                            <button
                                onClick={handleCloseImage}
                                className="absolute top-2 right-2 text-white bg-black bg-opacity-50 p-1 rounded-full"
                            >✖</button>
                        )}    
                    </div>
                    <div className='border p-2 border-gray-500 rounded-md'>
                        <h3 className='text-sm text-gray-300 pb-2'>Prompt (Optional)</h3>
                        <input type='text' className='bg-transparent border border-gray-500 rounded-md w-full'></input>
                    </div>
                    <button className='border-2 bg-purple-300 p-2 hover:bg-purple-500 rounded-md'>Generate</button>
                    <div className='flex border border-gray-500 rounded-md justify-between text-sm text-gray-300'>
                        <div className='flex-grow p-2'> {/* expected ratio */}
                            <h3 className='pb-2'>Expected Ratio</h3>
                            <button className='border mr-2 rounded-md p-1 border-gray-300 '>
                                <input type='radio' value='9:16' name='ratio'/>
                                <label htmlFor='9:16'> 9:16</label>
                            </button>
                            <button className='border rounded-md p-1 border-gray-300 mr-2 '>
                                <input type='radio' value='16:9' name='ratio'/>
                                <label htmlFor='16:9'> 16:9</label>
                            </button>
                            <button className='border rounded-md p-1 border-gray-300 mr-2 '>
                                <input type='radio' value='1:1' name='ratio'/>
                                <label htmlFor='1:1'> 1:1</label>
                            </button>
                            <button className='border rounded-md p-1 border-gray-300 mr-2 '>
                                <input type='radio' value='custom' name='ratio'/>
                                <label htmlFor='custom'> Custom</label>
                            </button>
                        </div>
                        <div className="border-l border-gray-500 h-full" /> {/* vertical border */}
                        <div className='flex-grow p-2'> {/* alignment */}
                            <h3 className='pb-2'>Alignment</h3>
                            <select
                                value={selectedAlignment}
                                onChange={handleAlignmentChange}
                                className="bg-transparent w-full border border-gray-300 rounded-md p-2 text-gray-300"
                            >
                                <option value="middle">Middle</option>
                                <option value="left">Left</option>
                                <option value="right">Right</option>
                                <option value="top">Top</option>
                                <option value="bottom">Bottom</option>
                            </select>
                        </div>
                    </div>
                    <div className='advanced settings'>
                        {/* advanced settings */}
                    </div>
                    <div className='examples'>
                        {/* examples - table: image input, target width, target height, alignment */}
                    </div>
                </div> 

                <div className='flex flex-col gap-[16px] flex-1'> {/* right side */}
                    <div className='border min-h-[250px] border-gray-300 rounded-md'> {/* generated image */}
                        
                    </div>
                   
                    <div className='border min-h-[250px] border-gray-300 rounded-md'> {/* history */}
                        
                    </div>
                    <div className='border min-h-[250px] border-gray-300 rounded-md'> {/* preview */}
                            
                    </div>
    
                </div> 
            </main>
        </div>
    )
}