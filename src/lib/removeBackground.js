import { NextResponse } from 'next/server';

export async function removeBackgroundServer(imageFile) {
  const apiFormData = new FormData();
  apiFormData.append('image_file', imageFile);

  const response = await fetch('https://api.remove.bg/v1.0/removebg', {
    method: 'POST',
    headers: {
      'X-Api-Key': process.env.NEXT_PUBLIC_REMOVE_BG_API_KEY,
    },
    body: apiFormData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Background removal failed:', errorText);
    throw new Error('Background removal failed');
  }

  return response.arrayBuffer();
}

export async function removeBackgroundClient(imageFile) {
  const formData = new FormData();
  formData.append('image_file', imageFile);

  const response = await fetch('/api/remove-background', {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    throw new Error('Background removal failed');
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

    const imageBuffer = await removeBackgroundServer(image);
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: { 'Content-Type': 'image/png' },
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Background removal failed' }, { status: 500 });
  }
}