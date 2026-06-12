import { buildUrlEntry, wrapUrlset, sitemapResponse } from "@/lib/sitemap-xml";
import { states } from "@/data/locations";
import { cityToSlug, getZipsForCity } from "@/lib/installer-utils";

const BASE = "https://ship.tires";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ state: string }> }
) {
  const { state: stateParam } = await params;

  // Match by slug (e.g. "california") since sitemap index uses state.slug
  const stateData = states.find((s) => s.slug === stateParam);
  if (!stateData) {
    return new Response("Not found", { status: 404 });
  }

  const now = new Date().toISOString().split("T")[0];
  const entries: string[] = [];
  const abbr = stateData.abbreviation.toLowerCase();

  // State installer page
  entries.push(
    buildUrlEntry({
      loc: `${BASE}/installers/${abbr}`,
      lastmod: now,
      changefreq: "monthly",
      priority: 0.7,
    })
  );

  for (const city of stateData.cities) {
    const slug = cityToSlug(city.name);
    const zips = getZipsForCity(city.name, stateData.abbreviation);

    if (zips.length === 0) continue;

    // City installer page
    entries.push(
      buildUrlEntry({
        loc: `${BASE}/installers/${abbr}/${slug}`,
        lastmod: now,
        changefreq: "monthly",
        priority: 0.6,
      })
    );

    // All zip pages for this city
    for (const zip of zips) {
      entries.push(
        buildUrlEntry({
          loc: `${BASE}/installers/${abbr}/${slug}/${zip}`,
          lastmod: now,
          changefreq: "monthly",
          priority: 0.5,
        })
      );
    }
  }

  return sitemapResponse(wrapUrlset(entries));
}
