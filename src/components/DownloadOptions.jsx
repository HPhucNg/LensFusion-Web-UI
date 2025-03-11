import React from 'react';
import { Button } from "@/components/ui/button";
import { Download } from 'lucide-react';

const DownloadOptions = ({ imageUrl, filename = 'image' }) => {
    const downloadImage = (format) => {
        // Create a temporary link element
        const link = document.createElement('a');
        
        // If the image is already in the desired format, download directly
        if (imageUrl.toLowerCase().endsWith(`.${format.toLowerCase()}`)) {
            link.href = imageUrl;
            link.download = `${filename}.${format.toLowerCase()}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            return;
        }

        // For format conversion, create a canvas
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = imageUrl;
        
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            
            // Convert to desired format
            let mimeType;
            switch (format.toLowerCase()) {
                case 'png':
                    mimeType = 'image/png';
                    break;
                case 'jpg':
                case 'jpeg':
                    mimeType = 'image/jpeg';
                    break;
                case 'webp':
                    mimeType = 'image/webp';
                    break;
                default:
                    mimeType = 'image/png';
            }
            
            // Get the data URL and trigger download
            const dataUrl = canvas.toDataURL(mimeType);
            link.href = dataUrl;
            link.download = `${filename}.${format.toLowerCase()}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        };
    };

    return (
        <div className="flex flex-col gap-2 w-full">
            <div className="text-sm font-medium text-gray-400 mb-1">Download Format</div>
            <div className="flex gap-2">
                <Button
                    onClick={() => downloadImage('PNG')}
                    className="flex-1 bg-gray-800 hover:bg-gray-700 text-white"
                >
                    <Download className="w-4 h-4 mr-2" />
                    PNG
                </Button>
                <Button
                    onClick={() => downloadImage('JPG')}
                    className="flex-1 bg-gray-800 hover:bg-gray-700 text-white"
                >
                    <Download className="w-4 h-4 mr-2" />
                    JPG
                </Button>
                <Button
                    onClick={() => downloadImage('WEBP')}
                    className="flex-1 bg-gray-800 hover:bg-gray-700 text-white"
                >
                    <Download className="w-4 h-4 mr-2" />
                    WEBP
                </Button>
            </div>
        </div>
    );
};

export default DownloadOptions; 