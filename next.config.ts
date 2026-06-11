import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3", "zipcodes"],
  staticPageGenerationTimeout: 180,
  async redirects() {
    return [
      { source: "/llm", destination: "/llm.txt", permanent: true },
      { source: "/llms", destination: "/llms.txt", permanent: true },
      { source: "/llm-full", destination: "/llm-full.txt", permanent: true },
      { source: "/llms-full", destination: "/llm-full.txt", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      {
        source: "/brand-logos/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.logo.dev",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "new.tirelibrary.com",
      },
      {
        protocol: "https",
        hostname: "tireweb.tirelibrary.com",
      },
    ],
  },
};

export default nextConfig;
