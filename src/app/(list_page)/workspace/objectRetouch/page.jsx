"use client";
import BackButton from '@/components/BackButton';
import Inpaint from './_components/Inpaint';
import WorkspaceNavbar from '@/components/WorkspaceNavbar';


export default function Home() {
  return (
    <main className="container mx-auto p-4">
      <WorkspaceNavbar/>

      <h1 className="text-2xl font-bold mb-6">
        Object Retouch Tool
      </h1>
      <Inpaint />
    </main>
  );
}