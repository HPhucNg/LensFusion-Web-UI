"use client";
import BackButton from '@/components/BackButton';
import Inpaint from './_components/Inpaint';


export default function Home() {
  return (
    <main className="container mx-auto p-4">
      <BackButton /> {/* Use the BackButton component */}

      <h1 className="text-2xl font-bold mb-6">
        Object Retouch with HuggingFace
      </h1>
      <Inpaint />
    </main>
  );
}