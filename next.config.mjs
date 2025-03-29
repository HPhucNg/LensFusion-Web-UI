/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    images: {
      domains: ['picsum.photos', 'pebblely.com', 'i.pinimg.com','firebasestorage.googleapis.com', 'api.remove.bg','raynamaru-hd-painter.hf.space'], // Allow picsum.photos as a valid image domain
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'lllyasviel-iclight-v2.hf.space',
        },
        {
          protocol: 'https',
          hostname: 'raynamaru-hd-painter.hf.space',
        },
      ],
    },
    experimental: {
      serverActions: {
        bodySizeLimit: '4mb' // Increased from default 1mb to 4mb
      }
    }
  };
  
  export default nextConfig;
  