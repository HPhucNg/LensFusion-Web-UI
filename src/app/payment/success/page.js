'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

//displays when user successfully pay for the subscription
export default function Success() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/dashboard/profile');
    }, 5000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-r from-gray-900 via-gray-800 to-black text-white">
      <Navbar />
      <div className="flex items-center justify-center">
        <div className="text-center p-8 rounded-xl shadow-2xl border border-gray-800">
          <h1 className="text-3xl font-bold mb-4">Payment Successful!</h1>
          <p className="mb-4">Thank you for your purchase!</p>
          <p className="text-gray-400"> You will be redirected to your profile in a few seconds...</p>
        </div>
      </div>
      <Footer />
    </div>
  );
}