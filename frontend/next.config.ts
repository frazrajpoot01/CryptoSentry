import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['assets.coingecko.com', 'via.placeholder.com'], // ✅ fixed domain
  },
  reactStrictMode: true,
};

export default nextConfig;