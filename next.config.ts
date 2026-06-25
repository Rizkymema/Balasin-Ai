import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typescript: {
    tsconfigPath: "./tsconfig.json",
  },
  serverExternalPackages: ["better-sqlite3", "pdf-parse", "mammoth"],
  eslint: {
    ignoreDuringBuilds: false,
  },
  compress: true,
};

export default nextConfig;
