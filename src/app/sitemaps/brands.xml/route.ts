import { buildUrlEntry, wrapUrlset, sitemapResponse } from "@/lib/sitemap-xml";
import { CURATED_BRANDS } from "@/lib/curated-brands";
import { blogPosts } from "@/data/blog-posts";
import { racingArticles } from "@/data/racing-articles";
import { racingTechArticles } from "@/data/racing-tech";

const BASE = "https://ship.tires";

export async function GET() {
  const now = new Date().toISOString().split("T")[0];

  const entries: string[] = [];

  // Static pages
  const staticPages = [
    { loc: BASE, changefreq: "weekly" as const, priority: 1.0 },
    { loc: `${BASE}/tires`, changefreq: "weekly" as const, priority: 0.9 },
    { loc: `${BASE}/locations`, changefreq: "weekly" as const, priority: 0.9 },
    { loc: `${BASE}/vehicle-lookup`, changefreq: "monthly" as const, priority: 0.8 },
    { loc: `${BASE}/rankings`, changefreq: "weekly" as const, priority: 0.7 },
    { loc: `${BASE}/search`, changefreq: "weekly" as const, priority: 0.7 },
    { loc: `${BASE}/about`, changefreq: "monthly" as const, priority: 0.5 },
    { loc: `${BASE}/contact`, changefreq: "monthly" as const, priority: 0.6 },
    { loc: `${BASE}/shipping`, changefreq: "monthly" as const, priority: 0.5 },
    { loc: `${BASE}/returns`, changefreq: "monthly" as const, priority: 0.5 },
    { loc: `${BASE}/faq`, changefreq: "monthly" as const, priority: 0.6 },
    { loc: `${BASE}/blog`, changefreq: "weekly" as const, priority: 0.6 },
    { loc: `${BASE}/racing`, changefreq: "weekly" as const, priority: 0.6 },
    { loc: `${BASE}/racing/f1`, changefreq: "weekly" as const, priority: 0.6 },
    { loc: `${BASE}/racing/nascar`, changefreq: "weekly" as const, priority: 0.6 },
    { loc: `${BASE}/racing/le-mans`, changefreq: "weekly" as const, priority: 0.6 },
    { loc: `${BASE}/racing/indycar`, changefreq: "weekly" as const, priority: 0.6 },
    { loc: `${BASE}/racing-tech`, changefreq: "weekly" as const, priority: 0.6 },
    { loc: `${BASE}/installers`, changefreq: "weekly" as const, priority: 0.8 },
  ];

  for (const p of staticPages) {
    entries.push(buildUrlEntry({ ...p, lastmod: now }));
  }

  // Brand pages
  for (const brandName of CURATED_BRANDS.keys()) {
    const slug = brandName.toLowerCase().replace(/\s+/g, "-");
    entries.push(
      buildUrlEntry({ loc: `${BASE}/tires/${slug}`, lastmod: now, changefreq: "weekly", priority: 0.8 })
    );
  }

  // Blog pages
  for (const post of blogPosts) {
    entries.push(
      buildUrlEntry({
        loc: `${BASE}/blog/${post.slug}`,
        lastmod: new Date(post.date).toISOString().split("T")[0],
        changefreq: "monthly",
        priority: 0.5,
      })
    );
  }

  // Racing articles
  for (const article of racingArticles) {
    entries.push(
      buildUrlEntry({
        loc: `${BASE}/racing/${article.series}/${article.slug}`,
        lastmod: new Date(article.date).toISOString().split("T")[0],
        changefreq: "monthly",
        priority: 0.5,
      })
    );
  }

  // Racing tech articles
  for (const article of racingTechArticles) {
    entries.push(
      buildUrlEntry({
        loc: `${BASE}/racing-tech/${article.slug}`,
        lastmod: new Date(article.date).toISOString().split("T")[0],
        changefreq: "monthly",
        priority: 0.5,
      })
    );
  }

  return sitemapResponse(wrapUrlset(entries));
}
