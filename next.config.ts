import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3", "zipcodes"],
  staticPageGenerationTimeout: 180,
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
    ],
  },
};

export default nextConfig;
