import { buildUrlEntry, wrapUrlset, sitemapResponse } from "@/lib/sitemap-xml";
import { CURATED_BRANDS } from "@/lib/curated-brands";
import { states } from "@/data/locations";
import { toLocationSlug } from "@/lib/location-seo";
import { vehicleMakes, getModelsForMake } from "@/data/vehicle-content";
import products from "@/data/sitemap-products.json";
import sizes from "@/data/sitemap-sizes.json";

const BASE = "https://ship.tires";

export async function GET() {
  const now = new Date().toISOString().split("T")[0];
  const entries: string[] = [];

  // Global llm.txt files
  for (const file of ["/llm.txt", "/llms.txt", "/llm-full.txt", "/llms-full.txt"]) {
    entries.push(
      buildUrlEntry({ loc: `${BASE}${file}`, lastmod: now, changefreq: "monthly", priority: 1.0 })
    );
  }

  // Brand llm.txt
  for (const brandName of CURATED_BRANDS.keys()) {
    const slug = brandName.toLowerCase().replace(/\s+/g, "-");
    entries.push(
      buildUrlEntry({ loc: `${BASE}/tires/${slug}/llm.txt`, lastmod: now, changefreq: "weekly", priority: 0.7 })
    );
  }

  // Product (model) llm.txt — from pre-exported data
  for (const p of products) {
    entries.push(
      buildUrlEntry({ loc: `${BASE}/tires/${p.brandSlug}/${p.modelSlug}/llm.txt`, lastmod: now, changefreq: "weekly", priority: 0.5 })
    );
  }

  // Size llm.txt
  for (const s of sizes) {
    entries.push(
      buildUrlEntry({ loc: `${BASE}/tires/size/${s.slug}/llm.txt`, lastmod: now, changefreq: "monthly", priority: 0.5 })
    );
  }

  // Vehicle make llm.txt
  for (const make of vehicleMakes) {
    entries.push(
      buildUrlEntry({ loc: `${BASE}/tires/vehicle/${make.slug}/llm.txt`, lastmod: now, changefreq: "monthly", priority: 0.6 })
    );
  }

  // Location llm.txt (state+city only, no brand combos)
  for (const state of states) {
    for (const city of state.cities) {
      const citySlug = toLocationSlug(city.slug);
      entries.push(
        buildUrlEntry({ loc: `${BASE}/locations/${state.slug}/${citySlug}/llm.txt`, lastmod: now, changefreq: "monthly", priority: 0.4 })
      );
    }
  }

  return sitemapResponse(wrapUrlset(entries));
}
