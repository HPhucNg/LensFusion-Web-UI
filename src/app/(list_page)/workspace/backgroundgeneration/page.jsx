"use client";
import BackButton from '@/components/BackButton';
import ImageProcessor from './_components/ImageProcessor';
import WorkspaceNavbar from '@/components/WorkspaceNavbar';

export default function Home() {
  return (
    <main className="container mx-auto p-4 pb-0 min-h-screen flex flex-col">
     <WorkspaceNavbar/>

      <h1 className="text-2xl font-bold mb-4">
        Background Generation
      </h1>
      <div className="flex-1 overflow-auto">
        <ImageProcessor />
      </div>
    </main>
  );
}