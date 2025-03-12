import { NextResponse } from 'next/server';
import sharp from 'sharp';

export async function POST(request) {
    try {
        const { imageUrl, format, quality } = await request.json();

        // Fetch the image
        const response = await fetch(imageUrl);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Initialize Sharp with the image buffer
        let sharpImage = sharp(buffer);

        // Set the output format and quality
        const qualityValue = quality === 'low' ? 40 : quality === 'medium' ? 70 : 90;
        
        switch (format) {
            case 'jpg':
            case 'jpeg':
                sharpImage = sharpImage.jpeg({ quality: qualityValue });
                break;
            case 'png':
                sharpImage = sharpImage.png({ quality: qualityValue });
                break;
            case 'webp':
                sharpImage = sharpImage.webp({ quality: qualityValue });
                break;
            default:
                throw new Error('Unsupported format');
        }

        // Convert the image
        const convertedBuffer = await sharpImage.toBuffer();
        
        // Return the converted image as a base64 string
        const base64Image = convertedBuffer.toString('base64');
        return NextResponse.json({ 
            success: true, 
            data: `data:image/${format};base64,${base64Image}`
        });
    } catch (error) {
        console.error('Error converting image:', error);
        return NextResponse.json({ 
            success: false, 
            error: 'Failed to convert image' 
        }, { status: 500 });
    }
} 