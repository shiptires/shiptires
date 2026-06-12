import { getModelBySlug } from "@/lib/db";

const BASE = "https://ship.tires";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ brand: string; model: string }> }
) {
  const { brand, model } = await params;

  const data = await getModelBySlug(brand, model);
  if (!data || data.tires.length === 0) {
    return new Response("Not found", { status: 404 });
  }

  const tireRows = data.tires;
  const first = tireRows[0];
  const brandName = data.brand;
  const modelName = data.model;

  // Extract unique sizes
  const sizes = [...new Set(
    tireRows
      .filter((t) => t.width && t.aspect_ratio && t.rim_size)
      .map((t) => `${t.width}/${t.aspect_ratio}R${t.rim_size}`)
  )].sort();

  // Extract specs
  const seasons = [...new Set(tireRows.map((t) => t.season).filter(Boolean))];
  const terrains = [...new Set(tireRows.map((t) => t.terrain).filter(Boolean))];
  const loadRatings = [...new Set(tireRows.map((t) => t.load_rating).filter(Boolean))].sort();
  const speedRatings = [...new Set(tireRows.map((t) => t.speed_rating).filter(Boolean))].sort();

  // Price range
  const prices = tireRows
    .map((t) => {
      if (!t.price_map) return null;
      try {
        const pm = typeof t.price_map === "string" ? JSON.parse(t.price_map) : t.price_map;
        return pm.retail || pm.map || pm.msrp || null;
      } catch { return null; }
    })
    .filter((p): p is number => p !== null && p > 0);

  const minPrice = prices.length ? Math.min(...prices) : null;
  const maxPrice = prices.length ? Math.max(...prices) : null;

  const lines = [
    `# ${brandName} ${modelName} on Ship.Tires`,
    "",
    `> Structured data for AI agents and LLMs about the ${brandName} ${modelName} tire.`,
    "",
    `Brand: ${brandName}`,
    `Model: ${modelName}`,
    `Website: ${BASE}/tires/${brand}/${model}`,
    `Variants: ${tireRows.length}`,
    ...(minPrice && maxPrice ? [`Price Range: $${minPrice.toFixed(2)} – $${maxPrice.toFixed(2)}`] : []),
    "",
    "## Category",
    ...(seasons.length ? [`Season: ${seasons.join(", ")}`] : []),
    ...(terrains.length ? [`Terrain: ${terrains.join(", ")}`] : []),
    "",
    "## Available Sizes",
    ...sizes.map((s) => `- ${s}`),
    "",
    "## Specs",
    ...(loadRatings.length ? [`Load Ratings: ${loadRatings.join(", ")}`] : []),
    ...(speedRatings.length ? [`Speed Ratings: ${speedRatings.join(", ")}`] : []),
    ...(first.warranty ? [`Warranty: ${first.warranty}`] : []),
    ...(first.utqg ? [`UTQG: ${first.utqg}`] : []),
    "",
    "## How to Buy",
    `1. View all sizes at ${BASE}/tires/${brand}/${model}`,
    "2. Select your size and add to cart",
    "3. Free shipping on all orders",
    "4. Professional installation available nationwide",
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
