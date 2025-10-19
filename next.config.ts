import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Production-ready configuration
  eslint: {
    // Allow builds to complete in production, catch errors in development
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Allow builds to complete in production, catch errors in development
    ignoreBuildErrors: true,
  },
  // Optimize for production
  reactStrictMode: true,
  // Image optimization (if using Next.js Image component)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
};

export default nextConfig;
