/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    images: {
      domains: [
        'picsum.photos', 
        'pebblely.com', 
        'i.pinimg.com',
        'firebasestorage.googleapis.com', 
        'api.remove.bg',
        'raynamaru-hd-painter.hf.space', 
        'storage.googleapis.com'
      ], 
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'lllyasviel-iclight-v2-vary.hf.space', 
        },
        {
          protocol: 'https',
          hostname: 'raynamaru-hd-painter.hf.space',
        },
        {
          protocol: 'https',
          hostname: '*.fal.ai',
        },
        {
          protocol: 'https',
          hostname: 'firebasestorage.googleapis.com',
          // pathname: '/v0/b/**',
        },
      ],
    },
    serverRuntimeConfig: {
      // Will only be available on the server side
      FAL_KEY: process.env.FAL_KEY,
    },
    experimental: {
      serverActions: {
        bodySizeLimit: '10mb' // Increased from default 1mb to 10mb
      }
    }
  };
  
  export default nextConfig;
  