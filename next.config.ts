import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for @react-pdf/renderer to work in client components
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
  // Turbopack config (Next.js 16 default bundler)
  turbopack: {
    resolveAlias: {
      canvas: "",
    },
  },
  // Allow UploadThing image domains
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "utfs.io" },
    ],
  },
};

export default nextConfig;
