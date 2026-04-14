import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Proxy Clerk requests through our domain to avoid Cloudflare challenge
  // on accounts.fairaudit.site that breaks the OAuth callback flow
  async rewrites() {
    return [
      {
        source: "/__clerk/:path*",
        destination: "https://clerk.fairaudit.site/:path*",
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
