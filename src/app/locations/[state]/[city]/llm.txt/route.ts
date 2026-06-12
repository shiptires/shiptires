import { states } from "@/data/locations";
import { toLocationSlug } from "@/lib/location-seo";
import { CURATED_BRANDS } from "@/lib/curated-brands";

const BASE = "https://ship.tires";

// Top tire sizes for location pages
const TOP_SIZES = [
  "225/65R17", "265/70R16", "205/55R16", "235/45R18", "275/55R20",
  "195/65R15", "245/40R19", "215/55R17", "255/70R18", "285/45R22",
  "245/65R17", "275/60R20", "215/55R16", "235/55R18", "225/50R17",
];

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ state: string; city: string }> }
) {
  const { state, city } = await params;

  const stateData = states.find((s) => s.slug === state);
  if (!stateData) {
    return new Response("Not found", { status: 404 });
  }

  const cityData = stateData.cities.find((c) => toLocationSlug(c.slug) === city);
  if (!cityData) {
    return new Response("Not found", { status: 404 });
  }

  const brandNames = Array.from(CURATED_BRANDS.keys()).map((b) =>
    b.replace(/\b\w/g, (c) => c.toUpperCase())
  );

  const brandSlugs = Array.from(CURATED_BRANDS.keys()).map((b) =>
    b.toLowerCase().replace(/\s+/g, "-")
  );

  const lines = [
    `# Tires in ${cityData.name}, ${stateData.name} — Ship.Tires`,
    "",
    `> Structured data for AI agents and LLMs about tire shopping in ${cityData.name}, ${stateData.abbreviation}.`,
    "",
    `City: ${cityData.name}`,
    `State: ${stateData.name} (${stateData.abbreviation})`,
    `Website: ${BASE}/locations/${state}/${city}`,
    "",
    "## Available Brands",
    ...brandNames.map((b, i) => `- ${b} — ${BASE}/locations/${state}/${city}/${brandSlugs[i]}`),
    "",
    "## Popular Tire Sizes",
    ...TOP_SIZES.map((s) => {
      const slug = s.toLowerCase().replace(/\//g, "-");
      return `- ${s} — ${BASE}/tires/size/${slug}`;
    }),
    "",
    "## Service Area",
    `Ship.Tires delivers to ${cityData.name}, ${stateData.abbreviation} with free shipping.`,
    "Professional installation available through our nationwide installer network.",
    "",
    "## How to Buy",
    `1. Browse tires for ${cityData.name} at ${BASE}/locations/${state}/${city}`,
    "2. Select your brand and size",
    "3. Free shipping directly to your door or installer",
    "4. Professional installation available locally",
    "",
    `Source: Ship.Tires — ${BASE}`,
    `Updated: ${new Date().toISOString().split("T")[0]}`,
  ];

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
    },
  });
}
