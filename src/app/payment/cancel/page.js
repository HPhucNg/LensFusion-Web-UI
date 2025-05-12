'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

//displays after user cancels the subscriptions
export default function Cancel() {
  const router = useRouter();

  //auto redirect
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/dashboard/profile');
    }, 5000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-r from-gray-900 via-gray-800 to-black text-white flex items-center justify-center">
      <div className="flex items-center justify-center">
        <div className="text-center p-8 rounded-xl shadow-2xl border border-gray-800">
          <h1 className="text-3xl font-bold mb-4">Subscription canceled.</h1>
          <p className="mb-4">We will miss you!</p>
          <p className="text-gray-400"> You will be redirected to the Dashboard in a few seconds...</p>
        </div>
      </div>
    </div>
  );
}