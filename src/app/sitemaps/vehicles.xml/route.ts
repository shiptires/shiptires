import { buildUrlEntry, wrapUrlset, sitemapResponse } from "@/lib/sitemap-xml";
import { vehicleMakes, getModelsForMake } from "@/data/vehicle-content";

const BASE = "https://ship.tires";
const YEARS = ["2015", "2016", "2017", "2018", "2019", "2020", "2021", "2022", "2023", "2024", "2025", "2026"];

export async function GET() {
  const now = new Date().toISOString().split("T")[0];
  const entries: string[] = [];

  // Vehicle make pages
  for (const make of vehicleMakes) {
    entries.push(
      buildUrlEntry({
        loc: `${BASE}/tires/vehicle/${make.slug}`,
        lastmod: now,
        changefreq: "weekly",
        priority: 0.8,
      })
    );

    // Vehicle model pages + year pages
    const models = getModelsForMake(make.slug);
    for (const model of models) {
      // Model page
      entries.push(
        buildUrlEntry({
          loc: `${BASE}/tires/vehicle/${make.slug}/${model.modelSlug}`,
          lastmod: now,
          changefreq: "monthly",
          priority: 0.7,
        })
      );

      // Year pages
      for (const year of YEARS) {
        entries.push(
          buildUrlEntry({
            loc: `${BASE}/tires/vehicle/${make.slug}/${model.modelSlug}/${year}`,
            lastmod: now,
            changefreq: "monthly",
            priority: 0.6,
          })
        );
      }
    }
  }

  return sitemapResponse(wrapUrlset(entries));
}
