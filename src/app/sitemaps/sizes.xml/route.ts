import { buildUrlEntry, wrapUrlset, sitemapResponse } from "@/lib/sitemap-xml";
import sizes from "@/data/sitemap-sizes.json";

const BASE = "https://ship.tires";

export async function GET() {
  const now = new Date().toISOString().split("T")[0];

  const entries = sizes.map((s) =>
    buildUrlEntry({
      loc: `${BASE}/tires/size/${s.slug}`,
      lastmod: now,
      changefreq: "monthly",
      priority: 0.7,
    })
  );

  return sitemapResponse(wrapUrlset(entries));
}
