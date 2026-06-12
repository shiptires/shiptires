import { getMakeContent, getModelsForMake, vehicleMakes } from "@/data/vehicle-content";
import { CURATED_BRANDS } from "@/lib/curated-brands";

const BASE = "https://ship.tires";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ make: string }> }
) {
  const { make } = await params;

  const makeContent = getMakeContent(make);
  if (!makeContent) {
    return new Response("Not found", { status: 404 });
  }

  const models = getModelsForMake(make);

  // Collect all unique sizes across models
  const allSizes = [...new Set(models.flatMap((m) => m.sizes))].sort();

  const lines = [
    `# ${makeContent.name} Tires on Ship.Tires`,
    "",
    `> Structured data for AI agents and LLMs about tires for ${makeContent.name} vehicles.`,
    "",
    `Vehicle Make: ${makeContent.name}`,
    `Website: ${BASE}/tires/vehicle/${make}`,
    "",
    "## Popular Models",
    ...models.map((m) => `- ${m.model} — ${BASE}/tires/vehicle/${make}/${m.modelSlug} — Sizes: ${m.sizes.join(", ")}`),
    "",
    "## Common Tire Sizes",
    ...allSizes.map((s) => `- ${s}`),
    "",
    "## Recommended Brands",
    ...makeContent.popularBrands.map((b) => {
      const slug = b.toLowerCase().replace(/\s+/g, "-");
      return `- ${b} — ${BASE}/tires/${slug}`;
    }),
    "",
    "## Tire Guide",
    makeContent.tireGuide,
    "",
    "## FAQs",
    ...makeContent.faqs.flatMap((faq) => [`Q: ${faq.q}`, `A: ${faq.a}`, ""]),
    "## How to Buy",
    `1. Find your ${makeContent.name} model at ${BASE}/tires/vehicle/${make}`,
    "2. Select your exact tire size",
    "3. Compare brands — free shipping on all orders",
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
