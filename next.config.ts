import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Proxy Clerk dev instance through our own domain to avoid
  // cross-domain cookie issues on deployed environments
  async rewrites() {
    return [
      {
        source: "/__clerk/:path*",
        destination: "https://main-fox-24.clerk.accounts.dev/:path*",
      },
    ];
  },
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
