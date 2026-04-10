import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@consumet/extensions', 'got-scraping'],
};

export default nextConfig;