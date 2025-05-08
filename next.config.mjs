/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    images: {
      domains: ['picsum.photos', 'pebblely.com', 'i.pinimg.com','firebasestorage.googleapis.com', 'api.remove.bg','raynamaru-hd-painter.hf.space'], // Allow picsum.photos as a valid image domain
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'lllyasviel-iclight-v2-vary.hf.space', // 'lllyasviel-iclight-v2.hf.space' back up space 
        },
        {
          protocol: 'https',
          hostname: 'raynamaru-hd-painter.hf.space',
        },
        // {
        //   protocol: 'https',
        //   hostname: 'firebasestorage.googleapis.com',
        // },
      ],
    },
    experimental: {
      serverActions: {
        bodySizeLimit: '10mb' // Increased from default 1mb to 10mb
      }
    }
  };
  
  export default nextConfig;
  