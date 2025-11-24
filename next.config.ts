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
    // Allow all images from any domain without restrictions
    unoptimized: true,
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
