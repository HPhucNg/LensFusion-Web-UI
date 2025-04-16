"use client";

import React from "react";
import Head from "next/head";
import BackButton from "@/components/BackButton";
import ImageProcessor from "./_components/ImageProcessor";

export default function ObjectRemovalPage() {
  return (
    <main className="container mx-auto p-4">
      <Head>
        <title>Object Removal Tool</title>
      </Head>
      
      <BackButton />
      
      <h1 className="text-2xl font-bold mb-6">Object Removal Tool</h1>
      <p className="mb-4">
        Upload an image and our AI will automatically remove unwanted objects from it.
      </p>
    <ImageProcessor></ImageProcessor>
    </main>
  );
} 