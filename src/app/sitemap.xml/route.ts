import { wrapSitemapIndex, sitemapResponse } from "@/lib/sitemap-xml";
import { states } from "@/data/locations";

const BASE = "https://ship.tires";

export async function GET() {
  const now = new Date().toISOString().split("T")[0];

  const sitemaps: { loc: string; lastmod: string }[] = [
    { loc: `${BASE}/sitemaps/brands.xml`, lastmod: now },
    { loc: `${BASE}/sitemaps/products.xml`, lastmod: now },
    { loc: `${BASE}/sitemaps/sizes.xml`, lastmod: now },
    { loc: `${BASE}/sitemaps/vehicles.xml`, lastmod: now },
    { loc: `${BASE}/sitemaps/llm.xml`, lastmod: now },
  ];

  // Per-state location sitemaps
  for (const state of states) {
    sitemaps.push({
      loc: `${BASE}/sitemaps/locations/${state.slug}`,
      lastmod: now,
    });
  }

  // Per-state installer sitemaps
  for (const state of states) {
    sitemaps.push({
      loc: `${BASE}/sitemaps/installers/${state.slug}`,
      lastmod: now,
    });
  }

  // Per-state city+vehicle sitemaps
  for (const state of states) {
    sitemaps.push({
      loc: `${BASE}/sitemaps/city-vehicles/${state.slug}`,
      lastmod: now,
    });
  }

  const xml = wrapSitemapIndex(sitemaps);

  return sitemapResponse(xml);
}
