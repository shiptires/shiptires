import { lookupTireSizes } from "@/data/tire-sizes";
import { getMakeContent, getModelContent, getModelsForMake, vehicleMakes } from "@/data/vehicle-content";
import { CURATED_BRANDS } from "@/lib/curated-brands";

const BASE = "https://ship.tires";
const YEARS = ["2015", "2016", "2017", "2018", "2019", "2020", "2021", "2022", "2023", "2024", "2025", "2026"];

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ make: string; model: string }> }
) {
  const { make, model } = await params;

  const makeName = make.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const modelName = model.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const sizes = lookupTireSizes(makeName, modelName);
  if (!sizes || sizes.length === 0) {
    return new Response("Not found", { status: 404 });
  }

  const makeContent = getMakeContent(make);
  const modelContent = getModelContent(make, model);

  const vehicleClass = modelContent?.vehicleClass ?? "vehicle";
  const popularBrands = makeContent?.popularBrands ?? ["Michelin", "Goodyear", "Bridgestone", "Continental"];

  // Related models from same make
  const otherModels = getModelsForMake(make)
    .filter((m) => m.modelSlug !== model)
    .slice(0, 10);

  const lines = [
    `# ${makeName} ${modelName} Tires on Ship.Tires`,
    "",
    `> Find tires for the ${makeName} ${modelName} with free shipping at Ship.Tires.`,
    "",
    `Vehicle: ${makeName} ${modelName}`,
    `Type: ${vehicleClass}`,
    `Website: ${BASE}/tires/vehicle/${make}/${model}`,
    `Compatible Sizes: ${sizes.join(", ")}`,
    `Total Sizes: ${sizes.length}`,
    "",
    "## Compatible Tire Sizes",
    ...sizes.map((s) => `- ${s} — ${BASE}/tires/size/${s.toLowerCase().replace(/\//g, "-")}`),
    "",
    "## Model Years",
    ...YEARS.map((y) => `- ${y} ${makeName} ${modelName} — ${BASE}/tires/vehicle/${make}/${model}/${y}`),
    "",
    "## Recommended Brands",
    ...popularBrands.map((b) => {
      const slug = b.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      return `- ${b} — ${BASE}/tires/${slug}`;
    }),
    "",
    ...(otherModels.length > 0 ? [
      `## Other ${makeName} Models`,
      ...otherModels.map((m) => `- ${makeName} ${m.model} — ${BASE}/tires/vehicle/${make}/${m.modelSlug}`),
      "",
    ] : []),
    "## How to Buy",
    `1. Browse tires at ${BASE}/tires/vehicle/${make}/${model}`,
    "2. Select your tire size",
    "3. Choose from top brands — free shipping on all orders",
    "4. Call/Text (279) 238-8473 for help",
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
