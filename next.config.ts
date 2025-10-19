import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // reactStrictMode: true,
  experimental: {
    reactCompiler: true,
  },

  // typescript: {
  //   ignoreBuildErrors: true,
  // },
  eslint: {
    ignoreDuringBuilds: true,
  },

  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
