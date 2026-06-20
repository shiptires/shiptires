import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3", "zipcodes", "ssh2", "ssh2-sftp-client"],
  staticPageGenerationTimeout: 600,
  async redirects() {
    return [
      { source: "/llm", destination: "/llm.txt", permanent: true },
      { source: "/llms", destination: "/llms.txt", permanent: true },
      { source: "/llm-full", destination: "/llm-full.txt", permanent: true },
      { source: "/llms-full", destination: "/llms-full.txt", permanent: true },
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
          {
            key: "Link",
            value:
              '</.well-known/api-catalog>; rel="api-catalog", </openapi.json>; rel="service-desc"; type="application/openapi+json", </.well-known/acp.json>; rel="acp"',
          },
        ],
      },
      {
        source: "/brand-logos/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/:path*.txt",
        headers: [
          { key: "Cache-Control", value: "public, max-age=3600, stale-while-revalidate=86400" },
          { key: "Content-Type", value: "text/plain; charset=utf-8" },
        ],
      },
      {
        source: "/.well-known/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=3600, stale-while-revalidate=86400" },
          { key: "Access-Control-Allow-Origin", value: "*" },
        ],
      },
      {
        source: "/openapi.json",
        headers: [
          { key: "Cache-Control", value: "public, max-age=3600, stale-while-revalidate=86400" },
          { key: "Access-Control-Allow-Origin", value: "*" },
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
      {
        protocol: "https",
        hostname: "www.r2cthemes.com",
      },
      {
        protocol: "https",
        hostname: "pub-1404e52fd5554e9dac9a045b7bb89f22.r2.dev",
      },
    ],
  },
};

export default nextConfig;
