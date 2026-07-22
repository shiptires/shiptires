import { buildUrlEntry, wrapUrlset, sitemapResponse } from "@/lib/sitemap-xml";
import { vehicleMakes, getModelsForMake } from "@/data/vehicle-content";
import { lookupTireSizes } from "@/data/tire-sizes";

const BASE = "https://ship.tires";
const YEARS = [
  "2010", "2011", "2012", "2013", "2014", "2015", "2016", "2017",
  "2018", "2019", "2020", "2021", "2022", "2023", "2024", "2025", "2026",
];
const TOP_BRAND_SLUGS = [
  "michelin", "bridgestone", "goodyear", "continental", "pirelli",
  "cooper", "yokohama", "toyo", "falken",
];

export async function generateStaticParams() {
  return vehicleMakes.map((make) => ({ make: make.slug }));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ make: string }> },
) {
  const { make } = await params;
  const now = new Date().toISOString().split("T")[0];
  const entries: string[] = [];

  // Make page
  entries.push(
    buildUrlEntry({
      loc: `${BASE}/tires/vehicle/${make}`,
      lastmod: now,
      changefreq: "weekly",
      priority: 0.8,
    })
  );

  const models = getModelsForMake(make);
  for (const model of models) {
    // Model page
    entries.push(
      buildUrlEntry({
        loc: `${BASE}/tires/vehicle/${make}/${model.modelSlug}`,
        lastmod: now,
        changefreq: "monthly",
        priority: 0.7,
      })
    );

    // Vehicle + Brand pages (top 10 brands)
    for (const brandSlug of TOP_BRAND_SLUGS) {
      entries.push(
        buildUrlEntry({
          loc: `${BASE}/tires/vehicle/${make}/${model.modelSlug}/brand/${brandSlug}`,
          lastmod: now,
          changefreq: "monthly",
          priority: 0.5,
        })
      );
    }

    // Vehicle + Size pages
    const sizes = lookupTireSizes(model.model, model.model);
    // Use the make name for proper lookup
    const makeEntry = vehicleMakes.find((m) => m.slug === make);
    const makeName = makeEntry?.name ?? model.model;
    const properSizes = lookupTireSizes(makeName, model.model);
    for (const size of properSizes) {
      const sizeSlug = size.toLowerCase().replace(/\//g, "-");
      entries.push(
        buildUrlEntry({
          loc: `${BASE}/tires/vehicle/${make}/${model.modelSlug}/size/${sizeSlug}`,
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
          loc: `${BASE}/tires/vehicle/${make}/${model.modelSlug}/${year}`,
          lastmod: now,
          changefreq: "monthly",
          priority: 0.6,
        })
      );
    }

    // Vehicle + Year + Brand pages (all years, top 10 brands)
    for (const year of YEARS) {
      for (const brandSlug of TOP_BRAND_SLUGS) {
        entries.push(
          buildUrlEntry({
            loc: `${BASE}/tires/vehicle/${make}/${model.modelSlug}/${year}/brand/${brandSlug}`,
            lastmod: now,
            changefreq: "monthly",
            priority: 0.4,
          })
        );
      }
    }
  }

  return sitemapResponse(wrapUrlset(entries));
}
