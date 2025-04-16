import React from 'react';
import { Button } from "@/components/ui/button";
import { Download } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
        <div className="w-full">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button className="w-full h-12 app-accent-bg hover:opacity-90 text-base font-medium">
                        <Download className="w-5 h-5 mr-2" />
                        Download Image
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64 bg-gray-800 border-gray-700" align="end">
                    <DropdownMenuItem 
                        onClick={() => downloadImage('PNG')}
                        className="text-white hover:bg-gray-700 cursor-pointer h-10 text-base"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        PNG
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                        onClick={() => downloadImage('JPG')}
                        className="text-white hover:bg-gray-700 cursor-pointer h-10 text-base"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        JPG
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                        onClick={() => downloadImage('WEBP')}
                        className="text-white hover:bg-gray-700 cursor-pointer h-10 text-base"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        WEBP
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
};

export default DownloadOptions; 