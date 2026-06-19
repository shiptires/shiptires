import { buildUrlEntry, wrapUrlset, sitemapResponse } from "@/lib/sitemap-xml";
import { vehicleMakes, getModelsForMake } from "@/data/vehicle-content";
import { lookupTireSizes } from "@/data/tire-sizes";

const BASE = "https://ship.tires";
const YEARS = ["2015", "2016", "2017", "2018", "2019", "2020", "2021", "2022", "2023", "2024", "2025", "2026"];
const RECENT_YEARS = ["2023", "2024", "2025", "2026"];
const TOP_BRAND_SLUGS = [
  "michelin", "bridgestone", "goodyear", "continental", "pirelli",
  "cooper", "hankook", "yokohama", "toyo", "falken",
];

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

    // Vehicle model pages + year pages + combination pages
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

      // Vehicle + Brand pages (top 10 brands)
      for (const brandSlug of TOP_BRAND_SLUGS) {
        entries.push(
          buildUrlEntry({
            loc: `${BASE}/tires/vehicle/${make.slug}/${model.modelSlug}/brand/${brandSlug}`,
            lastmod: now,
            changefreq: "monthly",
            priority: 0.5,
          })
        );
      }

      // Vehicle + Size pages
      const makeName = make.name;
      const modelName = model.model;
      const sizes = lookupTireSizes(makeName, modelName);
      for (const size of sizes) {
        const sizeSlug = size.toLowerCase().replace(/\//g, "-");
        entries.push(
          buildUrlEntry({
            loc: `${BASE}/tires/vehicle/${make.slug}/${model.modelSlug}/size/${sizeSlug}`,
            lastmod: now,
            changefreq: "monthly",
            priority: 0.5,
          })
        );
      }

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

      // Vehicle + Year + Brand pages (recent years only, top 10 brands)
      for (const year of RECENT_YEARS) {
        for (const brandSlug of TOP_BRAND_SLUGS) {
          entries.push(
            buildUrlEntry({
              loc: `${BASE}/tires/vehicle/${make.slug}/${model.modelSlug}/${year}/brand/${brandSlug}`,
              lastmod: now,
              changefreq: "monthly",
              priority: 0.4,
            })
          );
        }
      }
    }
  }

  return sitemapResponse(wrapUrlset(entries));
}
