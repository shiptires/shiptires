import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  // Static LLM/AI discovery files
  const aiReadablePages = [
    "/",
    "/llm.txt",
    "/llms.txt",
    "/llm-full.txt",
    "/llms-full.txt",
    "/.well-known/ai-agent.json",
    "/.well-known/ai-plugin.json",
    "/openapi.json",
  ];

  // Pages AI live-search agents can crawl for real-time answers
  const aiLiveSearchPages = [
    ...aiReadablePages,
    "/tires",
    "/tires/",
    "/tires/size/",
    "/tires/vehicle/",
    "/locations",
    "/locations/",
    "/installers",
    "/installers/",
    "/search",
    "/about",
    "/contact",
    "/faq",
    "/shipping",
    "/returns",
    "/blog",
    "/blog/",
    "/rankings",
    "/racing",
    "/racing/",
    "/racing-tech",
    "/racing-tech/",
    "/vehicle-lookup",
    "/sitemap.xml",
  ];

  return {
    rules: [
      // Default: allow everything except /api/ and /admin/
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/", "/checkout/"],
      },

      // --- Search engines ---
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/api/", "/admin/", "/checkout/"],
      },
      {
        userAgent: "Bingbot",
        allow: "/",
        disallow: ["/api/", "/admin/", "/checkout/"],
      },

      // --- AI training crawlers (limited to LLM files + discovery) ---
      {
        userAgent: "GPTBot",
        allow: aiReadablePages,
        disallow: ["/api/", "/admin/", "/checkout/"],
      },
      {
        userAgent: "ClaudeBot",
        allow: aiReadablePages,
        disallow: ["/api/", "/admin/", "/checkout/"],
      },
      {
        userAgent: "Google-Extended",
        allow: aiReadablePages,
        disallow: ["/api/", "/admin/", "/checkout/"],
      },
      {
        userAgent: "PerplexityBot",
        allow: aiReadablePages,
        disallow: ["/api/", "/admin/", "/checkout/"],
      },
      {
        userAgent: "Applebot-Extended",
        allow: aiReadablePages,
        disallow: ["/api/", "/admin/", "/checkout/"],
      },
      {
        userAgent: "meta-externalagent",
        allow: aiReadablePages,
        disallow: ["/api/", "/admin/", "/checkout/"],
      },
      {
        userAgent: "Bytespider",
        allow: aiReadablePages,
        disallow: ["/api/", "/admin/", "/checkout/"],
      },
      {
        userAgent: "CCBot",
        allow: aiReadablePages,
        disallow: ["/api/", "/admin/", "/checkout/"],
      },
      {
        userAgent: "Amazonbot",
        allow: aiReadablePages,
        disallow: ["/api/", "/admin/", "/checkout/"],
      },
      {
        userAgent: "Diffbot",
        allow: aiReadablePages,
        disallow: ["/api/", "/admin/", "/checkout/"],
      },
      {
        userAgent: "FacebookBot",
        allow: aiReadablePages,
        disallow: ["/api/", "/admin/", "/checkout/"],
      },
      {
        userAgent: "cohere-ai",
        allow: aiReadablePages,
        disallow: ["/api/", "/admin/", "/checkout/"],
      },

      // --- AI live-search agents (can browse site content) ---
      {
        userAgent: "OAI-SearchBot",
        allow: aiLiveSearchPages,
        disallow: ["/api/", "/admin/", "/checkout/"],
      },
      {
        userAgent: "ChatGPT-User",
        allow: aiLiveSearchPages,
        disallow: ["/api/", "/admin/", "/checkout/"],
      },
      {
        userAgent: "Claude-User",
        allow: aiLiveSearchPages,
        disallow: ["/api/", "/admin/", "/checkout/"],
      },
      {
        userAgent: "Claude-SearchBot",
        allow: aiLiveSearchPages,
        disallow: ["/api/", "/admin/", "/checkout/"],
      },
      {
        userAgent: "Perplexity-User",
        allow: aiLiveSearchPages,
        disallow: ["/api/", "/admin/", "/checkout/"],
      },
      {
        userAgent: "Google-CloudVertexBot",
        allow: aiLiveSearchPages,
        disallow: ["/api/", "/admin/", "/checkout/"],
      },
      {
        userAgent: "MicrosoftPreview",
        allow: aiLiveSearchPages,
        disallow: ["/api/", "/admin/", "/checkout/"],
      },
    ],
    sitemap: "https://ship.tires/sitemap.xml",
  };
}
