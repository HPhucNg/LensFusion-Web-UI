"use client";

import { useRouter } from 'next/navigation';

export default function BackButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className="group flex items-center mb-6 px-4 py-2 rounded-md bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
    >
      <svg
        className="h-5 w-5 mr-2 text-gray-400 group-hover:text-gray-300"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M15 18l-6-6 6-6" />
      </svg>
      <span className="text-gray-300 group-hover:text-white font-medium">
       Go Back
      </span>
    </button>
  );
}