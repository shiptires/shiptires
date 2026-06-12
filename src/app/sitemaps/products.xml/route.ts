import { buildUrlEntry, wrapUrlset, sitemapResponse } from "@/lib/sitemap-xml";
import { CURATED_BRANDS } from "@/lib/curated-brands";
import products from "@/data/sitemap-products.json";

const BASE = "https://ship.tires";

// Top sizes for brand×size crosslinks
const TOP_SIZE_SLUGS = [
  "225-65r17", "265-70r16", "205-55r16", "235-45r18", "275-55r20",
  "195-65r15", "245-40r19", "215-55r17", "255-70r18", "285-45r22",
  "245-65r17", "275-60r20", "215-55r16", "235-55r18", "225-50r17",
  "245-45r18", "225-45r17", "235-70r16", "265-60r18", "255-55r20",
];

export async function GET() {
  const now = new Date().toISOString().split("T")[0];
  const entries: string[] = [];

  // Brand + model product pages
  for (const p of products) {
    entries.push(
      buildUrlEntry({
        loc: `${BASE}/tires/${p.brandSlug}/${p.modelSlug}`,
        lastmod: now,
        changefreq: "weekly",
        priority: 0.7,
      })
    );
  }

  // Brand × size pages
  const allBrandSlugs = Array.from(CURATED_BRANDS.keys()).map((name) =>
    name.toLowerCase().replace(/\s+/g, "-")
  );

  for (const brandSlug of allBrandSlugs) {
    for (const sizeSlug of TOP_SIZE_SLUGS) {
      entries.push(
        buildUrlEntry({
          loc: `${BASE}/tires/${brandSlug}/size/${sizeSlug}`,
          lastmod: now,
          changefreq: "monthly",
          priority: 0.6,
        })
      );
    }
  }

  return sitemapResponse(wrapUrlset(entries));
}
