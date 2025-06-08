
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'orderhk.pokeguide.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'orderhkuat.pokeguide.com',
        port: '',
        pathname: '/**',
      }
    ],
  },
};

export default nextConfig;
