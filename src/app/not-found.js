import Link from 'next/link';
import NotFoundAnimation from '@/components/NotFoundAnimation';
import Image from 'next/image';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#ffffff' }}>
      <div className="container mx-auto p-4">
        <div className="py-4">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <div className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12">
              <Image
                src="/icon.ico"
                alt="Brand Logo"
                width={32}
                height={32}
                className="object-contain w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 transform scale-100"
              />  
            </div>
            <span className="font-semibold italic text-xl md:text-2xl lg:text-2xl text-gray-800">
              LensFusion
            </span>
          </Link>
        </div>
      </div>
      
      <div className="flex-grow flex items-center justify-center p-4">
        <div className="text-center space-y-6 max-w-2xl">
          <NotFoundAnimation />
          <h2 className="text-2xl font-semibold text-gray-800">Page Not Found</h2>
          <p className="text-gray-600">
            Oops! The page you're looking for doesn't exist or has been moved.
          </p>
          <div className="pt-6">
            <Link 
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 text-base font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
            >
              Return To Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 