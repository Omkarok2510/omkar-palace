import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // ❗ Ignore ESLint errors during builds
    ignoreDuringBuilds: true,
};

module.exports = nextConfig;
