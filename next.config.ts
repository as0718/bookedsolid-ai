import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Production-ready configuration
  eslint: {
    // Fail builds on ESLint errors (production quality)
    ignoreDuringBuilds: false,
  },
  typescript: {
    // Fail builds on TypeScript errors (production quality)
    ignoreBuildErrors: false,
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
