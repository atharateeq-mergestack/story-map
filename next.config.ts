import type { NextConfig } from 'next';
import withBundleAnalyzer from '@next/bundle-analyzer';
import './src/libs/Env';

// Define the base Next.js configuration
let baseConfig: NextConfig = {
  eslint: {
    dirs: ['.'],
  },
  poweredByHeader: false,
  reactStrictMode: true,
  // Exclude import-in-the-middle from serverExternalPackages to fix version conflict warnings
  serverExternalPackages: [],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'drive.google.com',
        pathname: '/uc',
      },
      {
        protocol: 'https',
        hostname: '**.googleusercontent.com',
      },
    ],
    // Allow any image format
    formats: ['image/avif', 'image/webp'],
  },
};

// Conditionally enable bundle analysis
if (process.env.ANALYZE === 'true') {
  baseConfig = withBundleAnalyzer()(baseConfig);
}

const nextConfig = baseConfig;
export default nextConfig;
