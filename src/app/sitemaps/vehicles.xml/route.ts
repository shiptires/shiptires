import { wrapSitemapIndex, sitemapResponse } from "@/lib/sitemap-xml";
import { vehicleMakes } from "@/data/vehicle-content";

const BASE = "https://ship.tires";

export async function GET() {
  const now = new Date().toISOString().split("T")[0];

  const sitemaps = vehicleMakes.map((make) => ({
    loc: `${BASE}/sitemaps/vehicles/${make.slug}`,
    lastmod: now,
  }));

  return sitemapResponse(wrapSitemapIndex(sitemaps));
}
