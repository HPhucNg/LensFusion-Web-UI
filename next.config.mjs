/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
      domains: ['picsum.photos', 
        'pebblely.com', 
        'i.pinimg.com', 
        'firebasestorage.googleapis.com'// Add Firebase Storage domain
      ], // Allow picsum.photos as a valid image domain
    },
  };
  
  export default nextConfig;
  