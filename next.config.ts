import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    ppr: true
  },
  images: {
    remotePatterns: [
      {
        hostname: "avatar.vercel.sh"
      },
      {
        protocol: "https",
        hostname: "*" // Allow images from all domains
      }
    ]
  }
};

export default nextConfig;
