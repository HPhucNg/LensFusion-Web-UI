import { NextResponse } from 'next/server';

export async function upscaleImageServer(imageFile) {
  try {
    const formData = new FormData();
    formData.append('image', imageFile);

    const response = await fetch('https://app.imggen.ai/v1/upscale-image', {
      method: 'POST',
      headers: {
        'X-IMGGEN-KEY': process.env.IMGGEN_API_KEY,
      },
      body: formData
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('ImgGen API Error:', data);
      throw new Error(data.message || 'Unable to upscale image');
    }

    if (!data.success || !data.image) {
      throw new Error(data.message || 'Image upscaling failed');
    }

    return data.image; // Return the base64 image directly
  } catch (error) {
    console.error('Upscale Error:', error);
    throw new Error(error.message || 'Failed to upscale image');
  }
}

export async function upscaleImageClient(imageFile) {
  const formData = new FormData();
  formData.append('image_file', imageFile);

  const response = await fetch('/api/upscale-image', {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    throw new Error('Image upscaling failed');
  }

  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

export async function POST(req) {
  try {
    const formData = await req.formData();
    const image = formData.get('image_file');
    
    if (!image) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }

    const base64Image = await upscaleImageServer(image);
    
    // Convert base64 to binary
    const binaryString = atob(base64Image);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    const blob = new Blob([bytes], { type: 'image/png' });
    return new NextResponse(blob, {
      status: 200,
      headers: { 'Content-Type': 'image/png' },
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Image upscaling failed' }, { status: 500 });
  }
} 