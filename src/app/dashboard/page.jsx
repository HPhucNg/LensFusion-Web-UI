import { AppSidebar } from "@/components/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import ScrollToTop from "@/components/ScrollToTop";
import Image from "next/image";

export default function Page() {
  return (
    <div>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="h-screen bg-gradient-to-r from-gray-900 via-gray-800 to-black text-white">
            <header className="flex h-16 shrink-0 items-center gap-2">
              <div className="flex items-center gap-2 px-4">
                <SidebarTrigger className=" fixed z-50-ml-1" />
              </div>
            </header>
          
            <div className="flex flex-col bg-gradient-to-r from-gray-900 via-gray-800 to-black gap-6 p-6 text-white">
            
              <div className="w-full h-96 bg-[#1E1E1E] rounded-lg shadow-md flex items-center justify-center text-gray-300">
                <div className="space-y-4 md:w-1/3 px-20">
                  <h1 className="text-4xl font-bold text-white">Introducing AI Object Removal</h1>
                  <p className="text-2xl text-gray-400">Choose objects and effortless remove</p>
                  <div className="space-x-4">
                    <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg">Try it now</button>
                    <button className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg">Learn more</button>
                  </div>
                </div>
                <div className="md:w-2/3 flex justify-end space-x-4 gap-10 pr-20">
                  <div className="w-80 h-56 bg-gray-800 rounded-lg overflow-hidden">
                    <Image
                      src="/dashboard/remove-before.png"
                      alt="Before object removal"
                      width={320}
                      height={256}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <div className="w-80 h-56 bg-gray-800 rounded-lg overflow-hidden">
                    <Image
                      src="/dashboard/remove-after.png"
                      alt="After object removal"
                      width={384}
                      height={256}
                      className="object-cover w-full h-full"
                    />
                  </div>
                </div>
              </div>

              {/* Grid Sections */}
              <div className="p-6 bg-gradient-to-r from-gray-900 via-gray-800 to-black min-h-screen text-white">
                {/* Section 1 */}
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold"> LensFusion&apos;s AI Tools</h2>
                    <a href="#" className="text-sm text-gray-400 hover:underline">More ...</a>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="aspect-square rounded-lg overflow-hidden shadow-md relative group">
                      <Image
                        src="https://i.pinimg.com/736x/d6/31/ea/d631eaf3e64c2744e44230f25c456d98.jpg"
                        alt="Background Generation"
                        width={300}
                        height={300}
                        className="object-cover w-full h-full"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-stone-800 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
                        <span className="text-white text-lg font-semibold">Background Generation</span>
                      </div>
                    </div>
                    
                    <div className="aspect-square rounded-lg overflow-hidden shadow-md relative group">
                      <Image
                        src="https://i.pinimg.com/236x/45/13/a8/4513a815c4134c94384ca72e13e98e12.jpg"
                        alt="Object Swap"
                        width={300}
                        height={300}
                        className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-stone-800 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
                        <span className="text-white text-lg font-semibold">Object Swap</span>
                      </div>
                    </div>

                    <div className="aspect-square rounded-lg overflow-hidden shadow-md relative group">
                      <Image
                        src="https://i.pinimg.com/236x/34/51/ba/3451ba07e3c79263075365a92a41ee17.jpg"
                        alt="Image Upscale"
                        width={300}
                        height={300}
                        className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-stone-800 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
                        <span className="text-white text-lg font-semibold">Image Upscale</span>
                      </div>
                    </div>

                    <div className="aspect-square rounded-lg overflow-hidden shadow-md relative group">
                      <Image
                        src="https://i.pinimg.com/236x/f2/b2/50/f2b2505f4dfe13e74d6d445a093a1025.jpg"
                        alt="Image Editing"
                        width={300}
                        height={300}
                        className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-stone-800 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
                        <span className="text-white text-lg font-semibold">Image Editing</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2 */}
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">Template</h2>
                    <a href="#" className="text-sm text-gray-400 hover:underline">More ...</a>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="aspect-square rounded-lg overflow-hidden shadow-md relative group">
                      <Image
                        src="https://i.pinimg.com/236x/4e/53/89/4e538924ee22c5077ed18724dc71da95.jpg"
                        alt="Template 1"
                        width={300}
                        height={300}
                        className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-stone-800 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
                        <span className="text-white text-lg font-semibold">Template 1</span>
                      </div>
                    </div>

                    <div className="aspect-square rounded-lg overflow-hidden shadow-md relative group">
                      <Image
                        src="https://i.pinimg.com/736x/80/69/b9/8069b98b4cdccf0012f1baa68c668809.jpg"
                        alt="Template 2"
                        width={300}
                        height={300}
                        className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-stone-800 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
                        <span className="text-white text-lg font-semibold">Template 2</span>
                      </div>
                    </div>

                    <div className="aspect-square rounded-lg overflow-hidden shadow-md relative group">
                      <Image
                        src="https://i.pinimg.com/474x/5c/b3/e5/5cb3e50e19b6591259b0e43264546cb5.jpg"
                        alt="Template 3"
                        width={300}
                        height={300}
                        className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-stone-800 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
                        <span className="text-white text-lg font-semibold">Template 3</span>
                      </div>
                    </div>

                    <div className="aspect-square rounded-lg overflow-hidden shadow-md relative group">
                      <Image
                        src="https://i.pinimg.com/236x/11/40/b1/1140b1be487857b4aed7c745cab01383.jpg"
                        alt="Template 4"
                        width={300}
                        height={300}
                        className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-stone-800 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
                        <span className="text-white text-lg font-semibold">Template 4</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 3 */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">Tutorials</h2>
                    <a href="#" className="text-sm text-gray-400 hover:underline">Learn more</a>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="aspect-square rounded-lg overflow-hidden shadow-md relative group">
                      <Image
                        src="https://i.pinimg.com/236x/f8/66/56/f86656f755bba775581a55ff1fb74973.jpg"
                        alt="Background Generation Tutorial"
                        width={300}
                        height={300}
                        className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-stone-800 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
                        <span className="text-white text-lg font-semibold">Background Generation</span>
                      </div>
                    </div>

                    <div className="aspect-square rounded-lg overflow-hidden shadow-md relative group">
                      <Image
                        src="https://i.pinimg.com/236x/44/46/b6/4446b627d9015e6f60d10eccfd18387d.jpg"
                        alt="Object Swap Tutorial"
                        width={300}
                        height={300}
                        className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-stone-800 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
                        <span className="text-white text-lg font-semibold">Object Swap</span>
                      </div>
                    </div>

                    <div className="aspect-square rounded-lg overflow-hidden shadow-md relative group">
                      <Image
                        src="https://i.pinimg.com/236x/60/45/c4/6045c4daa2bbbace7db886bfb11eccd4.jpg"
                        alt="Image Upscale Tutorial"
                        width={300}
                        height={300}
                        className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-stone-800 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
                        <span className="text-white text-lg font-semibold">Image Upscale</span>
                      </div>
                    </div>

                    <div className="aspect-square rounded-lg overflow-hidden shadow-md relative group">
                      <Image
                        src="https://i.pinimg.com/236x/f1/53/74/f15374812e2a62ec1a433b0c4697cede.jpg"
                        alt="Image Editing Tutorial"
                        width={300}
                        height={300}
                        className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-stone-800 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
                        <span className="text-white text-lg font-semibold">Image Editing</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
          
        </SidebarInset>
      </SidebarProvider>
      <ScrollToTop/>
    </div>
  );
}
