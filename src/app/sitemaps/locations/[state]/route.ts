import { buildUrlEntry, wrapUrlset, sitemapResponse } from "@/lib/sitemap-xml";
import { states } from "@/data/locations";
import { toLocationSlug } from "@/lib/location-seo";
import { CURATED_BRANDS } from "@/lib/curated-brands";

const BASE = "https://ship.tires";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ state: string }> }
) {
  const { state } = await params;

  const stateData = states.find((s) => s.slug === state);
  if (!stateData) {
    return new Response("Not found", { status: 404 });
  }

  const now = new Date().toISOString().split("T")[0];
  const entries: string[] = [];

  const allBrandSlugs = Array.from(CURATED_BRANDS.keys()).map((name) =>
    name.toLowerCase().replace(/\s+/g, "-")
  );

  // State page
  entries.push(
    buildUrlEntry({
      loc: `${BASE}/locations/${stateData.slug}`,
      lastmod: now,
      changefreq: "monthly",
      priority: 0.7,
    })
  );

  for (const city of stateData.cities) {
    const citySlug = toLocationSlug(city.slug);

    // City page
    entries.push(
      buildUrlEntry({
        loc: `${BASE}/locations/${stateData.slug}/${citySlug}`,
        lastmod: now,
        changefreq: "monthly",
        priority: 0.7,
      })
    );

    // City × brand pages
    for (const brandSlug of allBrandSlugs) {
      entries.push(
        buildUrlEntry({
          loc: `${BASE}/locations/${stateData.slug}/${citySlug}/${brandSlug}`,
          lastmod: now,
          changefreq: "monthly",
          priority: 0.6,
        })
      );
    }
  }

  return sitemapResponse(wrapUrlset(entries));
}
