import { buildUrlEntry, wrapUrlset, sitemapResponse } from "@/lib/sitemap-xml";
import { states } from "@/data/locations";
import { vehicleMakes, getModelsForMake } from "@/data/vehicle-content";

const BASE = "https://ship.tires";

// Top vehicle makes to include in sitemaps (keep manageable per state)
const TOP_MAKES = vehicleMakes.slice(0, 10);

export function generateStaticParams() {
  return states.map((s) => ({ state: s.slug }));
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ state: string }> }
) {
  const { state: stateSlug } = await params;
  const state = states.find((s) => s.slug === stateSlug);
  if (!state) {
    return new Response("Not found", { status: 404 });
  }

  const now = new Date().toISOString().split("T")[0];
  const entries: string[] = [];

  for (const city of state.cities) {
    for (const make of TOP_MAKES) {
      const models = getModelsForMake(make.slug).slice(0, 5); // top 5 models per make
      for (const model of models) {
        entries.push(
          buildUrlEntry({
            loc: `${BASE}/locations/${state.slug}/${city.slug}/vehicle/${make.slug}/${model.modelSlug}`,
            lastmod: now,
            changefreq: "monthly",
            priority: 0.5,
          })
        );
      }
    }
  }

  return sitemapResponse(wrapUrlset(entries));
}
