import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/"],
      },
      {
        userAgent: "GPTBot",
        allow: ["/", "/llm.txt", "/llm-full.txt"],
        disallow: ["/api/"],
      },
      {
        userAgent: "ChatGPT-User",
        allow: ["/", "/llm.txt", "/llm-full.txt"],
        disallow: ["/api/"],
      },
      {
        userAgent: "Claude-Web",
        allow: ["/", "/llm.txt", "/llm-full.txt"],
        disallow: ["/api/"],
      },
      {
        userAgent: "PerplexityBot",
        allow: ["/", "/llm.txt", "/llm-full.txt"],
        disallow: ["/api/"],
      },
      {
        userAgent: "Applebot-Extended",
        allow: ["/", "/llm.txt", "/llm-full.txt"],
        disallow: ["/api/"],
      },
    ],
    sitemap: "https://ship.tires/sitemap.xml",
  };
}
