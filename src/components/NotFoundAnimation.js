'use client';

import React from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

export default function NotFoundAnimation() {
  return (
    <div className="w-full max-w-md mx-auto py-8">
      <DotLottieReact
        src="https://lottie.host/d2d51cfa-0ec2-4c17-84e3-2ba756352ac6/svaJTXZYH0.lottie"
        loop
        autoplay
        style={{ width: '100%', height: 'auto' }}
      />
    </div>
  );
} 