"use client";
import React, { useState, useEffect} from 'react';
import { defaultParams, ratioSettings } from './config';
import { generateImage } from './apiHelper'; 
import DownloadOptions from '@/components/DownloadOptions';
import { GenerateButton } from '../backgroundgeneration/_components/GenerateButton';
import WorkspaceNavbar from '@/components/WorkspaceNavbar';
import { saveToGallery } from '@/lib/saveToGallery';
import { auth } from '@/firebase/FirebaseConfig';


export default function Home() {
    const [selectedImage, setSelectedImage] = useState(null);
    const [ratio, setRatio] = useState('9:16');
    const [params, setParams] = useState(defaultParams);
    const [generatedImage, setGeneratedImage] = useState(null); 
    const [prevImage, setPrevImage] = useState(null); 
    const [isLoading, setIsLoading] = useState(false);
    const [sliderPosition, setSliderPosition] = useState(50); // for the sliding effect of prev and generated image 

    const [currentUser, setCurrentUser] = useState(null);
    const [userTokens, setUserTokens] = useState(0);
    const [insufficientTokens, setInsufficientTokens] = useState(false);

     useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(user => {
          setCurrentUser(user);
        });
        
        return () => unsubscribe();
      }, []);

    // file input change and set the selected file
    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setSelectedImage(file);
            setParams((prevParams) => ({
                ...prevParams,
                image: file // Add the selected image to params
            }));
        }
    };

    // handle close (X) button click
    const handleCloseImage = (event) => {
       // event.stopPropagation();
        setSelectedImage(null);
    };

     // selected user expected ratio
     const handleRatioChange = (event) => {
        const newRatio = event.target.value
        setRatio(newRatio);
        if (newRatio === "custom") {
            setParams((prevParams) => ({
                ...prevParams,
                width: prevParams.width,
                height: prevParams.height
            }));
        } else {
            setParams((prevParams) => ({
                ...prevParams,
                width: ratioSettings[newRatio].width,
                height: ratioSettings[newRatio].height
            }));
        }
    };

    const handleWidthChange = (event) => {
        const newWidth = event.target.value
        const ratioWidth = ratioSettings[ratio].width

        setParams((prevParams) => ({
            ...prevParams,
            width: newWidth
          }));

        if (newWidth !== ratioWidth) {
            setRatio('custom')
        }
        
    }
    const handleHeightChange = (event) => {
        const newHeight = event.target.value
        const ratioHeight = ratioSettings[ratio].height

        setParams((prevParams) => ({
            ...prevParams,
            height: newHeight
          }));

        if (newHeight !== ratioHeight) {
            setRatio('custom')
        }
    }

    // update params for various settings
    const handleParamChange = (key, value) => {
        setParams((prevParams) => ({
            ...prevParams,
            [key]: value
        }));
    };

    // for calling API when user is ready
    const handleGenerateClick = async () => {
        setIsLoading(true); // start loading
        const result = await generateImage(params);
        setIsLoading(false); // stop loading once the request completes

        if (result) {
            // set both images
            const { image1_base64, image2_base64 } = result;
    
            if (image1_base64) {
                setPrevImage(image1_base64);
            }
            if (image2_base64) {
                setGeneratedImage(image2_base64);
                // auto-save to gallery if the user is logged in
                if (currentUser) {
                    try {
                        await saveToGallery(
                            image2_base64, 
                            currentUser.uid, 
                            'background-expansion', 
                        );
                    } catch (saveError) {
                    console.error("Error saving to gallery:", saveError);
                    // Continue anyway - don't block the image generation
                    }
                }
            }
            
        } else {
            console.error("No valid result received from the inference.");
        }
    };

    const handleSliderMouseDown = (e) => {
        e.preventDefault();
    
        const onMouseMove = (moveEvent) => {
            const container = e.target.closest('.relative'); // Get the container div
            const containerWidth = container.offsetWidth;
            const offsetX = moveEvent.clientX - container.offsetLeft;
            const newSliderPosition = Math.max(0, Math.min(100, (offsetX / containerWidth) * 100)); // constrain to 0-100%
            setSliderPosition(newSliderPosition);
        };
    
        const onMouseUp = () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };
    
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    };
    
    // to adjust the width of the generated image
    const generateImageStyle = {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        clipPath: `inset(0 0 0 ${sliderPosition}%)`,  // Reveal only the right side
        transition: 'clip-path 0.1s ease-out', // Smooth transition of clipping
    };

    const handleClear = () => {
        // Reset all states
        setSelectedImage(null);
        setGeneratedImage(null);
        setPrevImage(null);
        setRatio('9:16');
        setParams(defaultParams);  // Reset to default parameters
        setSliderPosition(50);
    };



    return (
        <div className="min-h-screen bg-gradient-to-r from-gray-900 via-gray-800 to-black font-sans relative overflow-hidden">
            <main className="container mx-auto p-4">
               <WorkspaceNavbar/>
                <h1 className="text-2xl font-bold mb-6">
                    Diffuser Image Outpaint
                </h1>
                <div className='bg-[var(--card-background)] p-5 h-auto'> 
                    <h1 className='text-xl font-bold text-purple-500 pb-2'>Background Expansion</h1>
                    {/* conditionally rendering based on availability of prevImage and generatedImage */}
                    {generatedImage ? (
                        <div className=' w-full h-auto'>
                            <div className="flex justify-end mb-2"> 
                                <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg]:size-4 [&amp;_svg]:shrink-0 hover:bg-accent h-8 rounded-md px-3 text-xs text-red-500 hover:text-red-400" onClick={handleClear}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x w-4 h-4 mr-2"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>Clear</button>
                            </div>
                            <div className="relative w-full h-auto">
                                {prevImage && (
                                    <img
                                        src={prevImage}
                                        alt="Previous Image"
                                        className="object-contain rounded-md w-full h-[500px] "
                                    />
                                )}
                                {generatedImage && (
                                    <img
                                        src={generatedImage}
                                        alt="Generated Image"
                                        className="object-contain rounded-md w-full h-[500px]"
                                        style={generateImageStyle}
                                    />
                                )}
                                {generatedImage && (
                                    <div
                                        className="w-[10px] h-full bg-blue-200 absolute top-0 left-0 z-3 cursor-ew-resize"
                                        style={{
                                            left: `${sliderPosition}%`, // based on the state
                                            transform: 'translateX(0)', // keep slider inside container
                                        }}
                                        onMouseDown={(e) => handleSliderMouseDown(e)}
                                    ></div>
                                )}
                            </div>
                            <div className='mt-4'>
                                <DownloadOptions imageUrl={generatedImage} filename="generated-image" />
                            </div>
                        </div>
                    ) : (
                        <div className='flex gap-[16px] flex-wrap'> {/* user input */}
                            <div className="flex-1 relative bg-gray-900 p-2 rounded-lg"> {/* upload image */}
                                {selectedImage ? (
                                    // if an image is selected, display the image
                                    <div className="relative w-full h-full">
                                        <img
                                            src={URL.createObjectURL(selectedImage)}
                                            alt="Selected Image"
                                            className="object-cover rounded-md w-full h-full"
                                        />
                                        <button
                                            onClick={handleCloseImage}
                                            className="p-2 absolute top-2 right-2 bg-gray-900/80 hover:bg-red-500/90 rounded-lg backdrop-blur-sm border border-gray-600/50 shadow-md transition-all hover:scale-110"
                                            title="Remove image"
                                        >
                                            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                ) : (
                                    // if no image is selected, display the upload label
                                    <label className="w-full h-full flex items-center justify-center cursor-pointer rounded-xl border-2 border-dashed border-gray-600 hover:border-purple-900 transition-all duration-300">
                                        <div className="text-center p-6 space-y-4">
                                            <div className="relative">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleFileChange}
                                                    className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                                                />
                                                <div className="flex flex-col items-center justify-center space-y-3">
                                                    <svg
                                                        className="w-16 h-16 text-white/70 group-hover:scale-110 transition-transform duration-300"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="2"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                    >
                                                        <path d="M12 13v8" />
                                                        <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
                                                        <path d="m8 17 4-4 4 4" />
                                                    </svg>
                                                    <p className="text-sm text-gray-400 font-medium">
                                                        Drag & drop image<br />
                                                        or click to upload
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </label>
                                )}
                            </div>
                            <div className='flex-1 flex flex-col gap-[16px] w-full p-2 bg-gradient-to-r from-gray-900 via-gray-900 to-gray-900 rounded-lg pb-4'> {/* change settings */}
                                <div className='flex text-xs flex-wrap font-medium text-gray-500'>
                                    <div className='flex-grow  p-2'> {/* expected ratio */}
                                        <h3 className='pb-2'>Expected Ratio</h3>
                                        <div className='flex flex-wrap'>
                                        {/* 9:16 Radio Button */}
                                        <label
                                            htmlFor='9:16'
                                            className='border rounded-md p-2 border-[var(--border-gray)] mr-2 flex items-center cursor-pointer'
                                        >
                                            <input
                                            type='radio'
                                            id='9:16'
                                            value='9:16'
                                            name='ratio'
                                            checked={ratio === '9:16'}
                                            onChange={handleRatioChange}
                                            className='mr-2 accent-purple-500'
                                            />
                                            9:16
                                        </label>

                                        {/* 16:9 Radio Button */}
                                        <label
                                            htmlFor='16:9'
                                            className='border rounded-md p-2 border-[var(--border-gray)] mr-2 flex items-center cursor-pointer'
                                        >
                                            <input
                                            type='radio'
                                            id='16:9'
                                            value='16:9'
                                            name='ratio'
                                            checked={ratio === '16:9'}
                                            onChange={handleRatioChange}
                                            className='mr-2 accent-purple-500'
                                            />
                                            16:9
                                        </label>

                                        {/* 1:1 Radio Button */}
                                        <label
                                            htmlFor='1:1'
                                            className='border rounded-md p-2 border-[var(--border-gray)] mr-2 flex items-center cursor-pointer'
                                        >
                                            <input
                                            type='radio'
                                            id='1:1'
                                            value='1:1'
                                            name='ratio'
                                            checked={ratio === '1:1'}
                                            onChange={handleRatioChange}
                                            className='mr-2 accent-purple-500'
                                            />
                                            1:1
                                        </label>

                                        {/* Custom Radio Button */}
                                        <label
                                            htmlFor='ratio-custom'
                                            className='border rounded-md p-2 border-[var(--border-gray)] mr-2 flex items-center cursor-pointer'
                                        >
                                            <input
                                            type='radio'
                                            id='ratio-custom'
                                            value='custom'
                                            name='ratio'
                                            checked={ratio === 'custom'}
                                            onChange={handleRatioChange}
                                            className='mr-2 accent-purple-500'
                                            />
                                            Custom
                                        </label>
                                        </div>
                                    </div>
                                    <div className='flex-grow p-2'> {/* alignment */}
                                        <h3 className='pb-2'>Alignment</h3>
                                        <select
                                            value={params.alignment}
                                            onChange={(e) => handleParamChange('alignment', e.target.value)}
                                            className="bg-transparent w-full border border-[var(--border-gray)] rounded-md p-2 text-gray-300"
                                        >
                                            <option value="Middle">Middle</option>
                                            <option value="Left">Left</option>
                                            <option value="Right">Right</option>
                                            <option value="Top">Top</option>
                                            <option value="Bottom">Bottom</option>
                                        </select>
                                    </div>
                                </div>
                                <div className='rounded-md text-xs font-medium p-2'> {/* advanced settings */}
                                    <h3 className='flex justify-between text-sm font-semibold '>Advanced settings</h3>
                        
                                        <div className='flex rounded-md mt-2 mb-4 text-gray-500'>
                                            <div className='flex-grow '>
                                                <h3>Target Width: {params.width}</h3>
                                                <input
                                                    type="range"
                                                    min="720"
                                                    max="1536"
                                                    value={params.width}
                                                    onChange={handleWidthChange}
                                                    className="w-full mt-4 accent-purple-500"
                                            />
                                            </div> {/* 720 -1536 */}
                                            <div className='flex-grow pl-2'>
                                                <h3>Target Height: {params.height}</h3>
                                                <input
                                                    type="range"
                                                    min="720"
                                                    max="1536"
                                                    value={params.height}
                                                    onChange={handleHeightChange}
                                                    className="w-full mt-4 accent-purple-500"
                                            />
                                            </div>
                                        </div>
                                        <div className='rounded-md mb-4 text-gray-500'>
                                            <h3>Steps: {params.num_inference_steps}</h3>
                                            <input
                                                type="range"
                                                min="4"
                                                max="12"
                                                value={params.num_inference_steps}
                                                onChange={(e) => handleParamChange('num_inference_steps', e.target.value)}
                                                className="w-full mt-4 accent-purple-500"
                                            />                                        
                                        </div>
                                        
                                        <div className='rounded-md mb-2'>
                                            <h3 className='pb-2 text-gray-500'>Resize Input Image</h3>
                                            <div className='flex flex-wrap'>
                                                {/* full option */}
                                                <label
                                                    htmlFor='Full'
                                                    className='border rounded-md p-2 border-[var(--border-gray)] mr-2 flex items-center cursor-pointer'
                                                >
                                                    <input
                                                    type='radio'
                                                    id='Full'
                                                    value='Full'
                                                    name='resize'
                                                    checked={params.resize_option === 'Full'}
                                                    onChange={(e) => handleParamChange('resize_option', e.target.value)}
                                                    className='mr-2 accent-purple-500'
                                                    />
                                                    Full
                                                </label>

                                                {/* 50% option */}
                                                <label
                                                    htmlFor='50'
                                                    className='border rounded-md p-2 border-[var(--border-gray)] mr-2 flex items-center cursor-pointer'
                                                >
                                                    <input
                                                    type='radio'
                                                    id='50'
                                                    value='50'
                                                    name='resize'
                                                    checked={params.resize_option === '50'}
                                                    onChange={(e) => handleParamChange('resize_option', e.target.value)}
                                                    className='mr-2 accent-purple-500'
                                                    />
                                                    50%
                                                </label>

                                                {/* 33% option */}
                                                <label
                                                    htmlFor='33'
                                                    className='border rounded-md p-2 border-[var(--border-gray)] mr-2 flex items-center cursor-pointer'
                                                >
                                                    <input
                                                    type='radio'
                                                    id='33'
                                                    value='33'
                                                    name='resize'
                                                    checked={params.resize_option === '33'}
                                                    onChange={(e) => handleParamChange('resize_option', e.target.value)}
                                                    className='mr-2 accent-purple-500'
                                                    />
                                                    33%
                                                </label>

                                                {/* 25% option */}
                                                <label
                                                    htmlFor='25'
                                                    className='border rounded-md p-2 border-[var(--border-gray)] mr-2 flex items-center cursor-pointer'
                                                >
                                                    <input
                                                    type='radio'
                                                    id='25'
                                                    value='25'
                                                    name='resize'
                                                    checked={params.resize_option === '25'}
                                                    onChange={(e) => handleParamChange('resize_option', e.target.value)}
                                                    className='mr-2 accent-purple-500'
                                                    />
                                                    25%
                                                </label>

                                                {/* custom option */}
                                                <label
                                                    htmlFor='resize-custom'
                                                    className='border rounded-md p-2 border-[var(--border-gray)] mr-2 flex items-center cursor-pointer'
                                                >
                                                    <input
                                                    type='radio'
                                                    id='resize-custom'
                                                    value='custom'
                                                    name='resize'
                                                    checked={params.resize_option === 'custom'}
                                                    onChange={(e) => handleParamChange('resize_option', e.target.value)}
                                                    className='mr-2 accent-purple-500'
                                                    />
                                                    Custom
                                                </label>
                                            </div>
                                        </div>
                                      
                                </div> 
                                {/*<button className='bg-purple-400 p-1 hover:bg-purple-500 rounded-md' onClick={handleGenerateClick} disabled={!selectedImage || isLoading}>{isLoading ? 'Generating ...' : 'Generate'}</button>*/}
                                <GenerateButton 
                                    handleGenerate={handleGenerateClick} 
                                    isProcessing={isLoading} 
                                    selectedFile={selectedImage} 
                                />
                            </div>
                        </div>
                        )}
                </div>
                  
            </main>
        </div>
    )
}
