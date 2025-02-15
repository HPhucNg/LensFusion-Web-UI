/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['picsum.photos', 'pebblely.com', 'i.pinimg.com','firebasestorage.googleapis.com', 'api.remove.bg'], // Allow picsum.photos as a valid image domain
  },
};

export default nextConfig;

/* ⚠ The "images.domains" configuration is deprecated. Please use "images.remotePatterns" configuration instead.*/

  /** @type {import('next').NextConfig} 
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'pebblely.com',
      },
      {
        protocol: 'https',
        hostname: 'i.pinimg.com',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
    ],
  },
};

export default nextConfig;
*/
  