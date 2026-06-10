import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const aiReadablePages = ["/", "/llm.txt", "/llms.txt", "/llm-full.txt"];

  return {
    rules: [
      // Default: allow everything except /api/
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/"],
      },

      // --- Search engines ---
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/api/"],
      },
      {
        userAgent: "Bingbot",
        allow: "/",
        disallow: ["/api/"],
      },

      // --- AI training crawlers ---
      {
        userAgent: "GPTBot",
        allow: aiReadablePages,
        disallow: ["/api/"],
      },
      {
        userAgent: "ClaudeBot",
        allow: aiReadablePages,
        disallow: ["/api/"],
      },
      {
        userAgent: "Google-Extended",
        allow: aiReadablePages,
        disallow: ["/api/"],
      },
      {
        userAgent: "PerplexityBot",
        allow: aiReadablePages,
        disallow: ["/api/"],
      },
      {
        userAgent: "Applebot-Extended",
        allow: aiReadablePages,
        disallow: ["/api/"],
      },
      {
        userAgent: "meta-externalagent",
        allow: aiReadablePages,
        disallow: ["/api/"],
      },

      // --- AI live-search agents ---
      {
        userAgent: "OAI-SearchBot",
        allow: aiReadablePages,
        disallow: ["/api/"],
      },
      {
        userAgent: "ChatGPT-User",
        allow: aiReadablePages,
        disallow: ["/api/"],
      },
      {
        userAgent: "Claude-User",
        allow: aiReadablePages,
        disallow: ["/api/"],
      },
      {
        userAgent: "Claude-SearchBot",
        allow: aiReadablePages,
        disallow: ["/api/"],
      },
      {
        userAgent: "Perplexity-User",
        allow: aiReadablePages,
        disallow: ["/api/"],
      },
    ],
    sitemap: "https://ship.tires/sitemap.xml",
  };
}
