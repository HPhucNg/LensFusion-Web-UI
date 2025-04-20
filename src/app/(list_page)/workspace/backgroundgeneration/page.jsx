"use client";
import BackButton from '@/components/BackButton';
import ImageProcessor from './_components/ImageProcessor';
import WorkspaceNavbar from '@/components/WorkspaceNavbar';

export default function Home() {
  return (
    <main className="container mx-auto p-4">
     <WorkspaceNavbar/>

      <h1 className="text-2xl font-bold mb-6">
        Image Processing with HuggingFace
      </h1>
      <ImageProcessor />
    </main>
  );
}