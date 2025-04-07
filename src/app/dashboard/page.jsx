'use client';
import React, { useState, useEffect } from "react";
import { AppSidebar } from "@/components/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import ScrollToTop from "@/components/ScrollToTop";
import Image from "next/image";
import { auth, db } from "@/firebase/FirebaseConfig";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import Link from "next/link";
import { useRouter } from 'next/navigation';

export default function Page() {
  const [user, setUser] = useState(null);
  const [tokens, setTokens] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
        if (currentUser) {
          setUser(currentUser); 
            const userRef = doc(db, "users", currentUser.uid);
            const unsubscribeSnapshot = onSnapshot(userRef, (userDoc) => {
              if (userDoc.exists()) {
                setTokens(userDoc.data().tokens || 0);
                setLoading(false);
              }
            });
            return () => unsubscribeSnapshot();
          } else {
            setUser(null); 
            setLoading(false);
          }
        });
      
        return () => unsubscribe();
      }, []);

      const router = useRouter();

      const handleTokens = (paymentPageLink) => {
        if (!user) {
          router.push('/login');
        } else if (paymentPageLink) {
          router.push('/pricing');
        } else {
          console.error('No payment page link provided.');
        }
      };

  return (
    <div className="min-h-screen">
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="min-h-screen bg-gradient-to-r from-gray-900 via-gray-800 to-black text-white">
            {/* Hero Section - More Responsive */}
            <header className="flex h-16 shrink-0 items-center">
              <div className="container mx-auto flex items-center px-4">
                <SidebarTrigger className="fixed z-50" />
              </div>
              <div className="ml-auto">
              <div className="flex items-center gap-4">
                  {loading ? (
                    <span className="text-lg font-medium">...Loading...</span>
                  ) : !user ? (
                    <span className="text-lg font-medium">Please log in to view your tokens.</span>
                  ) : (
                    <span
                      className="text-center py-1 border-2 mr-4 border-white bg-gradient-to-r from-gray-900 to-gray-800 rounded-full hover:scale-105 transition-all hover:border-purple-500 px-10 whitespace-nowrap overflow-hidden cursor-pointer"
                      onClick={() => handleTokens('/payment')}
                    >
                      Tokens: {tokens}
                    </span>
                  )}
                </div>
              </div>
            </header>
          
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {/* Hero Content - Enhanced Flexibility */}
              <div className="w-full  min-h-[15rem] lg:min-h-[20rem] bg-[#1E1E1E] rounded-lg shadow-md flex flex-col lg:flex-row items-center justify-center text-gray-300 p-6 sm:p-8 space-y-6 lg:space-y-0 lg:space-x-8">
                <div className="w-full lg:w-1/2 text-center lg:text-left space-y-6">
                  <h1 className="text-2xl md:text-3lg lg:text-6lg font-bold text-white leading-tight">
                    Introducing AI Object Removal
                  </h1>
                  <p className="text-xl md:text-lg text-gray-400 mb-6">
                    Choose objects and effortlessly remove them from your images with advanced AI technology
                  </p>
                  <div className="flex justify-center lg:justify-start space-x-4">
                    <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 md:px-8 py-3 rounded-lg text-base transition-colors duration-300">
                      Try it now
                    </button>
                    <button className="bg-gray-700 hover:bg-gray-600 text-white px-6 md:px-8 py-3 rounded-lg text-base transition-colors duration-300">
                      Learn more
                    </button>
                  </div>
                </div>
                <div className="w-full lg:w-1/2 flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                  {['before', 'after'].map((type) => (
                    <div 
                      key={type} 
                      className="w-full sm:w-1/2 lg:w-auto aspect-video bg-gray-800 rounded-lg overflow-hidden shadow-lg"
                    >
                      <Image
                        src={`/dashboard/remove-${type}.png`}
                        alt={`${type} object removal`}
                        layout="responsive"
                        width={384}
                        height={256}
                        className="object-cover w-full h-full transition-transform duration-300 hover:scale-105"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Grid Sections with Container and Enhanced Responsiveness */}
              <div className="space-y-12 mt-12">
                {[
                  { title: "LensFusion's AI Tools", items: [
                    { src: "https://i.pinimg.com/736x/d6/31/ea/d631eaf3e64c2744e44230f25c456d98.jpg", title: "Background Generation", link: "/workspace/backgroundgeneration" },
                    { src: "https://i.pinimg.com/736x/e1/30/18/e1301863d4a6c3ca747db7ed9ce3beb4.jpg", title: "Background Removal", link: "/dashboard/tools/background-remover" },
                    { src: "https://i.pinimg.com/236x/45/13/a8/4513a815c4134c94384ca72e13e98e12.jpg", title: "Object Swap" },
                    { src: "https://i.pinimg.com/236x/34/51/ba/3451ba07e3c79263075365a92a41ee17.jpg", title: "Image Upscale", link: "/dashboard/tools/image-upscaler" },
                    { src: "https://i.pinimg.com/236x/f2/b2/50/f2b2505f4dfe13e74d6d445a093a1025.jpg", title: "Image Editing" }
                  ]},
                  { title: "Template", items: [
                    { src: "https://i.pinimg.com/236x/4e/53/89/4e538924ee22c5077ed18724dc71da95.jpg", title: "Template 1" },
                    { src: "https://i.pinimg.com/736x/80/69/b9/8069b98b4cdccf0012f1baa68c668809.jpg", title: "Template 2" },
                    { src: "https://i.pinimg.com/474x/5c/b3/e5/5cb3e50e19b6591259b0e43264546cb5.jpg", title: "Template 3" },
                    { src: "https://i.pinimg.com/236x/11/40/b1/1140b1be487857b4aed7c745cab01383.jpg", title: "Template 4" }
                  ]},
                  { title: "Tutorials", items: [
                    { src: "https://i.pinimg.com/236x/f8/66/56/f86656f755bba775581a55ff1fb74973.jpg", title: "Background Generation" },
                    { src: "https://i.pinimg.com/236x/3f/23/88/3f2388f22ae0594ae77f03fd697f821c.jpg", title: "Object Swap" },
                    { src: "https://i.pinimg.com/236x/60/45/c4/6045c4daa2bbbace7db886bfb11eccd4.jpg", title: "Image Upscale" },
                    { src: "https://i.pinimg.com/236x/f1/53/74/f15374812e2a62ec1a433b0c4697cede.jpg", title: "Image Editing" }
                  ]}
                ].map((section, sectionIndex) => (
                  <div 
                    key={sectionIndex} 
                    className="border-t border-white/20 pt-8"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
                      <h2 className="text-2xl font-semibold mb-4 sm:mb-0">{section.title}</h2>
                      <a href="#" className="text-lg text-gray-400 hover:underline">More ...</a>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                      {section.items.map((item, index) => (
                        <div 
                          key={index} 
                          className="aspect-square rounded-lg overflow-hidden shadow-md relative group"
                        >
                          {item.link ? (
                            <Link href={item.link}>
                              <Image
                                src={item.src}
                                alt={item.title}
                                layout="responsive"
                                width={300}
                                height={300}
                                className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-110"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-stone-800 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
                                <span className="text-white text-lg font-semibold">{item.title}</span>
                              </div>
                            </Link>
                          ) : (
                            <Image
                              src={item.src}
                              alt={item.title}
                              layout="responsive"
                              width={300}
                              height={300}
                              className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-110"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
      <ScrollToTop/>
    </div>
  );
}