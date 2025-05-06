'use client';
import React from 'react';
import '../(list_page)/style.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

function page() {
  return (
    <>
      <main className="relative flex flex-col md:flex-row">
        {/* navbar is positioned on top */}
        <div className="absolute top-0 left-0 right-0 z-10">
          <Navbar />
        </div>

        {/* left section */}
        <div className="w-full md:w-1/3">
          <img 
            src='https://firebasestorage.googleapis.com/v0/b/lensfusion-fc879.firebasestorage.app/o/public_resources%2Fabout%2Fabout.webp?alt=media&token=578c9046-5a42-49ec-9f21-55a04b3d2562' 
            alt="About Us"
            className="w-full h-full object-cover" 
          />
        </div>

        {/* right section */}
        <div className="w-full md:w-2/3 bg-[rgb(253,247,229)] p-8 md:p-20 pb-10 pt-15 md:pt-32">
          <h1 className="text-[50px] md:text-[120px] pb-5 text-black font-serif">
            About us.
          </h1>
          <div className="flex flex-col md:flex-row text-black gap-8">
            <p className="text-lg md:text-base">
              Our mission is to empower businesses with innovative solutions that facilitate the creation of high-quality visual content. We aim to provide accessible tools that enable companies to craft compelling images that effectively showcase their products and communicate their brand vision.
            </p>
            <div className="flex flex-col text-sm gap-6">
              <p>
                In today's digital landscape, high-quality imagery is essential for capturing customer attention and driving engagement. However, the cost of professional photography, along with the need for specialized equipment and skilled professionals, can present a significant barrier for small businesses and independent entrepreneurs. We are committed to bridging this gap by offering a more affordable and efficient alternative.
              </p>
              <p>
                We offer an intuitive, user-friendly platform that allows businesses to leverage advanced AI technology to generate professional-grade images. Our platform empowers users to customize settings and parameters, enabling them to create personalized visual content without the need for technical expertise or complex coding skills.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}

export default page;


