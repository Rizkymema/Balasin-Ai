import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typescript: {
    // Disable type checking during build if having issues
    tsconfigPath: "./tsconfig.json",
  },
  eslint: {
    // Allow build to succeed even with ESLint errors
    ignoreDuringBuilds: false,
  },
  // Optimize for Vercel builds
  swcMinify: true,
  compress: true,
};

export default nextConfig;
