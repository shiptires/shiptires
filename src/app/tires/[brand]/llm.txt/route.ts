import { getBrandBySlug, getModelsByBrand, getDistinctSizesForBrand, toSlug } from "@/lib/db";
import { CURATED_BRANDS } from "@/lib/curated-brands";
import { brands as staticBrands } from "@/data/brands";

const BASE = "https://ship.tires";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ brand: string }> }
) {
  const { brand } = await params;

  // Try DB first, fall back to static data
  const brandRow = await getBrandBySlug(brand);
  const staticBrand = staticBrands.find((b) => b.slug === brand);

  if (!brandRow && !staticBrand) {
    return new Response("Not found", { status: 404 });
  }

  const [modelRows, sizeRows] = await Promise.all([
    getModelsByBrand(brand),
    getDistinctSizesForBrand(brand),
  ]);

  const brandName = brandRow?.make_name ?? staticBrand?.name ?? brand;

  // Use DB models if available, otherwise fall back to static brand data
  let modelNames: string[];
  let popularSizes: string[];
  let tireCount: number | string;

  if (modelRows.length > 0) {
    modelNames = modelRows.map((m) => m.model_name).slice(0, 50);
    tireCount = brandRow?.tire_count || modelRows.reduce((sum, m) => sum + (m.tire_count ?? 1), 0);
  } else if (staticBrand) {
    modelNames = staticBrand.models.map((m) => m.name);
    tireCount = staticBrand.models.reduce((acc, m) => acc + m.sizes.length, 0) + "+";
  } else {
    modelNames = [];
    tireCount = 0;
  }

  if (sizeRows.length > 0) {
    popularSizes = sizeRows
      .sort((a, b) => b.count - a.count)
      .slice(0, 20)
      .map((s) => `${s.width}/${s.aspect_ratio}R${s.rim_size}`);
  } else if (staticBrand) {
    // Collect unique sizes from static data
    const sizeSet = new Set<string>();
    for (const model of staticBrand.models) {
      for (const s of model.sizes) {
        sizeSet.add(s.size);
      }
    }
    popularSizes = [...sizeSet].slice(0, 20);
  } else {
    popularSizes = [];
  }

  // Related brands (other curated brands)
  const relatedBrands = Array.from(CURATED_BRANDS.keys())
    .filter((b) => b !== brandName.toUpperCase())
    .slice(0, 10)
    .map((b) => {
      const slug = b.toLowerCase().replace(/\s+/g, "-");
      return `${b.replace(/\b\w/g, (c) => c.toUpperCase())} — ${BASE}/tires/${slug}`;
    });

  // Brand description from static data
  const description = staticBrand?.description ?? "";

  const lines = [
    `# ${brandName} Tires on Ship.Tires`,
    "",
    `> Shop ${brandName} tires with free shipping on every order at Ship.Tires.`,
    "",
    `Brand: ${brandName}`,
    `Website: ${BASE}/tires/${brand}`,
    ...(staticBrand ? [`Country: ${staticBrand.country}`, `Founded: ${staticBrand.founded}`] : []),
    `Total Models: ${modelNames.length}`,
    `Total Tires: ${tireCount}`,
    "",
    ...(description ? [`## About ${brandName}`, description, ""] : []),
    "## Models",
    ...modelNames.map((m) => `- ${m} — ${BASE}/tires/${brand}/${toSlug(m)}`),
    ...(modelRows.length > 50 ? [`- ... and ${modelRows.length - 50} more`] : []),
    "",
    "## Popular Sizes",
    ...popularSizes.map((s) => `- ${s}`),
    "",
    "## Related Brands",
    ...relatedBrands.map((b) => `- ${b}`),
    "",
    "## How to Buy",
    `1. Browse models at ${BASE}/tires/${brand}`,
    "2. Select your tire size",
    "3. Add to cart — free shipping on all orders",
    "4. Professional installation available nationwide",
    "5. Call/Text (279) 238-8473 for help",
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
