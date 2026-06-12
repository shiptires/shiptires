import { getTiresBySize } from "@/lib/db";
import { slugToDisplaySize } from "@/lib/location-seo";

const BASE = "https://ship.tires";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ size: string }> }
) {
  const { size } = await params;

  // Parse size slug: "225-65r17" → width=225, aspect=65, rim=17
  const match = size.match(/^(\d+)-(\d+(?:\.\d+)?)r(\d+(?:\.\d+)?)$/i);
  if (!match) {
    return new Response("Not found", { status: 404 });
  }

  const [, width, aspect, rim] = match;
  const displaySize = slugToDisplaySize(size);

  const tires = await getTiresBySize(width, aspect, rim);
  if (!tires || tires.length === 0) {
    return new Response("Not found", { status: 404 });
  }

  // Group by brand
  const brandMap = new Map<string, string[]>();
  for (const t of tires) {
    const brand = t.make_name;
    if (!brandMap.has(brand)) brandMap.set(brand, []);
    const models = brandMap.get(brand)!;
    if (!models.includes(t.model_name)) models.push(t.model_name);
  }

  // Price range
  const prices = tires
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
    `# ${displaySize} Tires on Ship.Tires`,
    "",
    `> Structured data for AI agents and LLMs about ${displaySize} tires.`,
    "",
    `Size: ${displaySize}`,
    `Website: ${BASE}/tires/size/${size}`,
    `Total Options: ${tires.length}`,
    ...(minPrice && maxPrice ? [`Price Range: $${minPrice.toFixed(2)} – $${maxPrice.toFixed(2)}`] : []),
    "",
    "## Available Brands & Models",
    ...Array.from(brandMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([brand, models]) => `- ${brand}: ${models.slice(0, 5).join(", ")}${models.length > 5 ? ` (+${models.length - 5} more)` : ""}`),
    "",
    "## How to Buy",
    `1. Browse all ${displaySize} tires at ${BASE}/tires/size/${size}`,
    "2. Compare brands and prices",
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
