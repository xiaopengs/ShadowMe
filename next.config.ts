import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  serverExternalPackages: ['sql.js'],
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
