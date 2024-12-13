import { AppSidebar } from "@/components/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

export default function Page() {
  return (
    <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-black ">
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="h-screen bg-gradient-to-r from-gray-900 via-gray-800 to-black text-white">
            <header className="flex h-16 shrink-0 items-center gap-2">
              <div className="flex items-center gap-2 px-4">
                <SidebarTrigger className="-ml-1" />
              </div>
            </header>
          
            <div className="flex flex-col gap-6 p-6 bg-gradient-to-r from-gray-900 via-gray-800 to-black min-h-screen text-white">
            
              <div className="w-full h-96 bg-gray-700 rounded-lg shadow-md flex items-center justify-center text-gray-300">
                <span>Lensfusion</span>
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
                    <div className="aspect-square bg-gray-700 rounded-lg flex items-center justify-center shadow-md">
                      <span className="text-white">Background Generation</span>
                    </div>
                    <div className="aspect-square bg-gray-700 rounded-lg flex items-center justify-center shadow-md">
                      <span className="text-white">Object Swap</span>
                    </div>
                    <div className="aspect-square bg-gray-700 rounded-lg flex items-center justify-center shadow-md">
                      <span className="text-white">Image Upscale</span>
                    </div>
                    <div className="aspect-square bg-gray-700 rounded-lg flex items-center justify-center shadow-md">
                      <span className="text-white">Image Editing</span>
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
                    <div className="aspect-square bg-gray-700 rounded-lg flex items-center justify-center shadow-md"></div>
                    <div className="aspect-square bg-gray-700 rounded-lg flex items-center justify-center shadow-md"></div>
                    <div className="aspect-square bg-gray-700 rounded-lg flex items-center justify-center shadow-md"></div>
                    <div className="aspect-square bg-gray-700 rounded-lg flex items-center justify-center shadow-md"></div>
                  </div>
                </div>

                {/* Section 3 */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">Tutorials</h2>
                    <a href="#" className="text-sm text-gray-400 hover:underline">Learn more</a>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="aspect-square bg-gray-700 rounded-lg flex items-center justify-center shadow-md">
                      <span className="text-white">Background Generation</span>
                    </div>
                    <div className="aspect-square bg-gray-700 rounded-lg flex items-center justify-center shadow-md">
                      <span className="text-white">Object Swap</span>
                    </div>
                    <div className="aspect-square bg-gray-700 rounded-lg flex items-center justify-center shadow-md">
                      <span className="text-white">Image Upscale</span>
                    </div>
                    <div className="aspect-square bg-gray-700 rounded-lg flex items-center justify-center shadow-md">
                      <span className="text-white">Image Editing</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
          
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
