'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

//displays when user successfully pay for the subscription
export default function Success() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/dashboard');
    }, 5000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-r from-gray-900 via-gray-800 to-black text-white flex items-center justify-center">
      <div className="flex items-center justify-center">
        <div className="text-center p-8 ">
          <h1 className="text-3xl font-bold mb-4">Payment Successful!</h1>
          <p className="mb-4">Thank you for your purchase!</p>
          <p className="text-gray-400"> You will be redirected to your profile in a few seconds...</p>
        </div>
      </div>
    </div>
  );
}