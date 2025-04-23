"use client";

import React from "react";
import Head from "next/head";
import BackButton from "@/components/BackButton";
import ImageProcessor from "./_components/ImageProcessor";
import WorkspaceNavbar from "@/components/WorkspaceNavbar";

export default function ObjectRemovalPage() {
  return (
    <main className="container mx-auto p-4">
      <WorkspaceNavbar/>
      <h1 className="text-2xl font-bold mb-6">Object Removal Tool</h1>
      <p className="mb-4">
        Upload an image and our AI will automatically remove unwanted objects from it.
      </p>
    <ImageProcessor></ImageProcessor>
    </main>
  );
} 