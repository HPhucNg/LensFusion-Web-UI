import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const data = await request.json();
    const { token } = data;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token is required' },
        { status: 400 }
      );
    }

    // Verify token with Cloudflare Turnstile API
    const formData = new URLSearchParams();
    formData.append('secret', process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY || '');
    formData.append('response', token);
    
    const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const outcome = await result.json();
    
    if (outcome.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid CAPTCHA token' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error verifying Turnstile token:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 