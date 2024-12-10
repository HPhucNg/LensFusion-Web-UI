"use client"
import React, { useRef } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import {db} from '../firebase/FirebaseConfig';
import { addDoc, collection } from 'firebase/firestore';

export default function Home() {
  
  const messageRef = useRef();

  const handleSave = async (e) => {
    e.preventDefault();
    const message = messageRef.current.value.trim();

    if (!message) {
      console.error("Message cannot be empty.");
      return;
    }

    try {
      const docRef = await addDoc(collection(db, "messages"), { message, timestamp: new Date() });
      console.log("Message saved with ID:", docRef.id);
      messageRef.current.value = "";
    } catch (error) {
      console.error("Error saving message:", error);
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-r from-gray-900 via-gray-800 to-black text-white font-sans relative overflow-hidden'>
      <Navbar />
      <div className='flex flex-col justify-center items-center py-10 gap-40 p-4'>
        <section className='flex flex-col justify-center items-center gap-40'>
          <div className="mt-0 flex flex-col justify-center gap-4">
            <h2 className="text-4xl relative w-[80%] mx-auto z-20 md:text-4xl lg:text-7xl font-bold text-center text-white font-sans tracking-tight">
              AI Product Photos That Help You{" "}
              <div className="relative mx-auto inline-block w-max [filter:drop-shadow(0px_1px_3px_rgba(27,_37,_80,_0.14))]">
                <div className="relative bg-clip-text text-transparent bg-no-repeat bg-gradient-to-r from-purple-500 via-violet-500 to-pink-500 py-0">
                  <span className="">Sell More.</span>
                </div>
              </div>
            </h2>
            <div className="flex flex-col sm:flex-row justify-center gap-4 w-[60%] mx-auto py-2">
              <button className="relative inline-flex h-12 overflow-hidden rounded-full p-[1px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50">
                <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
                <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-950 px-16 py-5 text-sm font-medium text-white backdrop-blur-3xl">
                  Get Started
                </span>
              </button>
              <button className="inline-flex h-12 font-semibold animate-shimmer items-center justify-center rounded-full border border-slate-800 bg-[linear-gradient(110deg,#000103,45%,#1e2631,55%,#000103)] bg-[length:200%_100%] px-16 font-medium text-slate-00 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50 text-white">
                Live Demo
              </button>
            </div>
            <div className="mt-10 w-full max-w-5xl mx-auto">
              <div className="relative rounded-xl bg-[#0D161F] p-4 shadow-2xl">
                <video 
                  className="rounded-lg w-full"
                  autoPlay 
                  loop 
                  muted 
                  playsInline
                >
                  <source src="/hero-video.mp4" type="video/mp4" />
                </video>
              </div>
            </div>
          </div>
        </section>
        <section className="relative bg-clip-text text-transparent bg-no-repeat bg-gradient-to-r from-purple-500 via-violet-500 to-pink-500 py-0" >
          <h2>Features</h2>
          <h2>Features</h2>
          <h2>Features</h2>
          <h2>Features</h2>
          <h2>Features</h2>
          <h2>Features</h2>
          <h2>Features</h2>
          <h2>Features</h2>
          <h2>Features</h2>
          <h2>Features</h2>
          <h2>Features</h2>
          <h2>Features</h2>
          <h2>Features</h2>
          <h2>Features</h2>
        </section>
        <div className="relative flex-1 gap-1">
          <form onSubmit={handleSave}>
            <input className='text-black' type='text' placeholder='message' ref={messageRef}></input>
            <button type='submit'>Submit</button>
          </form>
        </div>
      </div>
      <Footer/>
    </div>
  );
}
