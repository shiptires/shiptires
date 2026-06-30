import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { searchTires, toSlug } from "@/lib/db";
import type { TireRow } from "@/lib/db";
import { isCuratedBrand } from "@/lib/curated-brands";
import { buildBreadcrumbSchema } from "@/lib/breadcrumb-schema";
import { lookupTireSizes } from "@/data/tire-sizes";
import { getMakeContent } from "@/data/vehicle-content";
import { sitePrice } from "@/lib/pricing";

export const revalidate = 300;
export const dynamicParams = true;

export async function generateStaticParams() {
  return [];
}

function parseSizeSlug(slug: string) {
  const match = slug.match(/^(\d{2,3})-(\d{2,3})r(\d{2,3}(?:\.\d)?)$/i);
  if (!match) return null;
  return { width: match[1], aspect: match[2], rim: match[3], display: `${match[1]}/${match[2]}R${match[3]}` };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ make: string; model: string; size: string }>;
}): Promise<Metadata> {
  const { make, model, size } = await params;
  const parsed = parseSizeSlug(size);
  if (!parsed) return {};

  const makeName = decodeURIComponent(make).replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const modelName = decodeURIComponent(model).replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    title: `${parsed.display} Tires for ${makeName} ${modelName} — Compare Brands | Ship.Tires`,
    description: `Shop ${parsed.display} tires for your ${makeName} ${modelName}. Compare brands like Michelin, Bridgestone, Goodyear. Free shipping on every order at Ship.Tires.`,
    alternates: { canonical: `https://ship.tires/tires/vehicle/${make}/${model}/size/${size}` },
  };
}

interface GroupedModel {
  brandName: string;
  brandSlug: string;
  modelName: string;
  modelSlug: string;
  season: string;
  price: number;
  speedRating: string;
  loadRating: string;
  imageUrl: string | null;
  tireCount: number;
}

export default async function VehicleSizePage({
  params,
}: {
  params: Promise<{ make: string; model: string; size: string }>;
}) {
  const { make, model, size } = await params;
  const parsed = parseSizeSlug(size);
  if (!parsed) notFound();

  const makeName = decodeURIComponent(make).replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const modelName = decodeURIComponent(model).replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  // Validate this size is compatible with this vehicle
  const compatibleSizes = lookupTireSizes(makeName, modelName);
  if (!compatibleSizes || compatibleSizes.length === 0) notFound();

  const sizeMatch = compatibleSizes.find(
    (s) => s.toLowerCase().replace(/\//g, "-") === size.toLowerCase(),
  );
  if (!sizeMatch) notFound();

  // Search for tires in this specific size
  const result = await searchTires({
    width: parsed.width,
    aspectRatio: parsed.aspect,
    rimSize: parsed.rim,
    limit: 100,
    page: 1,
  });

  // Filter to curated brands
  const curatedTires = result.tires.filter((t) => isCuratedBrand(t.make_name));

  // Group by brand + model
  const grouped = new Map<string, GroupedModel>();
  for (const tire of curatedTires) {
    const key = `${tire.make_name}|||${tire.model_name}`;
    if (!grouped.has(key)) {
      grouped.set(key, {
        brandName: tire.make_name,
        brandSlug: toSlug(tire.make_name),
        modelName: tire.model_name,
        modelSlug: toSlug(tire.model_name),
        season: tire.season || "",
        price: sitePrice(tire.price_map),
        speedRating: tire.speed_rating ?? "",
        loadRating: tire.load_rating ?? "",
        imageUrl: tire.thumbnail_url ?? tire.image_0100_url ?? null,
        tireCount: 0,
      });
    }
    const g = grouped.get(key)!;
    g.tireCount++;
    const sp = sitePrice(tire.price_map);
    if (sp > 0 && (g.price === 0 || sp < g.price)) {
      g.price = sp;
    }
  }

  const models = [...grouped.values()].sort((a, b) => {
    if (a.price === 0 && b.price === 0) return a.brandName.localeCompare(b.brandName);
    if (a.price === 0) return 1;
    if (b.price === 0) return -1;
    return a.price - b.price;
  });

  if (models.length === 0) notFound();

  // Other sizes for cross-links
  const otherSizes = compatibleSizes.filter(
    (s) => s.toLowerCase().replace(/\//g, "-") !== size.toLowerCase(),
  );

  // Top brands in results for cross-links
  const topBrandSlugs = new Map<string, string>();
  for (const m of models) {
    if (!topBrandSlugs.has(m.brandSlug)) topBrandSlugs.set(m.brandSlug, m.brandName);
  }
  const topBrands = [...topBrandSlugs.entries()]
    .map(([slug, name]) => ({ slug, name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Count unique brands for intro
  const brandCount = topBrands.length;

  const breadcrumb = buildBreadcrumbSchema([
    { name: "Home", url: "https://ship.tires" },
    { name: "Shop by Vehicle", url: "https://ship.tires/vehicle-lookup" },
    { name: makeName, url: `https://ship.tires/tires/vehicle/${make}` },
    { name: modelName, url: `https://ship.tires/tires/vehicle/${make}/${model}` },
    { name: parsed.display, url: `https://ship.tires/tires/vehicle/${make}/${model}/size/${size}` },
  ]);

  const vehicleSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${parsed.display} Tires for ${makeName} ${modelName}`,
    description: `${models.length} tire models in ${parsed.display} for ${makeName} ${modelName}. Compare brands. Free shipping.`,
    url: `https://ship.tires/tires/vehicle/${make}/${model}/size/${size}`,
    about: {
      "@type": "Vehicle",
      manufacturer: makeName,
      model: modelName,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(vehicleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />

      <div className="bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="bg-navy py-12 text-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Link href="/tires" className="hover:text-white transition-colors">All Brands</Link>
              <span>/</span>
              <Link href="/vehicle-lookup" className="hover:text-white transition-colors">Shop by Vehicle</Link>
              <span>/</span>
              <Link href={`/tires/vehicle/${make}`} className="hover:text-white transition-colors">{makeName}</Link>
              <span>/</span>
              <Link href={`/tires/vehicle/${make}/${model}`} className="hover:text-white transition-colors">{modelName}</Link>
              <span>/</span>
              <span className="text-gray-300">{parsed.display}</span>
            </div>
            <h1 className="mt-4 text-3xl font-bold sm:text-4xl lg:text-5xl">
              {parsed.display} Tires for {makeName} {modelName}
            </h1>
            <p className="mt-2 text-lg text-gray-300">
              {models.length} models from {brandCount} brands — Free shipping
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-12">
          {/* Intro */}
          <div className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm">
            <p className="text-gray-600 leading-relaxed">
              Compare {parsed.display} tires for your {makeName} {modelName} from {brandCount} brands including{" "}
              {topBrands.slice(0, 4).map((b, i, arr) => (
                <span key={b.slug}>
                  <Link href={`/tires/${b.slug}`} className="font-semibold text-blue hover:underline">{b.name}</Link>
                  {i < arr.length - 2 ? ", " : i < arr.length - 1 ? ", and " : ""}
                </span>
              ))}
              . Every tire ships free at Ship.Tires.
            </p>
          </div>

          {/* Tire table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200 text-left text-xs font-medium uppercase text-gray-500">
                  <th className="py-3 pr-4">Brand</th>
                  <th className="py-3 pr-4">Model</th>
                  <th className="py-3 pr-4">Season</th>
                  <th className="py-3 pr-4">Speed</th>
                  <th className="py-3 pr-4">Load</th>
                  <th className="py-3 pr-4">From</th>
                  <th className="py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {models.map((m) => (
                  <tr key={`${m.brandSlug}-${m.modelSlug}`} className="hover:bg-gray-50">
                    <td className="py-4 pr-4 font-medium text-gray-900">{m.brandName}</td>
                    <td className="py-4 pr-4">
                      <Link href={`/tires/${m.brandSlug}/${m.modelSlug}`} className="font-bold text-blue-600 hover:text-blue-800 hover:underline">
                        {m.modelName}
                      </Link>
                    </td>
                    <td className="py-4 pr-4 text-gray-600">{m.season || "\u2014"}</td>
                    <td className="py-4 pr-4 text-gray-600">{m.speedRating || "\u2014"}</td>
                    <td className="py-4 pr-4 text-gray-600">{m.loadRating || "\u2014"}</td>
                    <td className="py-4 pr-4 font-bold text-gray-900">{m.price > 0 ? `$${m.price}` : "\u2014"}</td>
                    <td className="py-4">
                      <Link href={`/tires/${m.brandSlug}/${m.modelSlug}`} className="inline-flex items-center rounded-md bg-navy px-3 py-1.5 text-xs font-bold text-white hover:bg-navy-light transition-colors">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Other sizes for this vehicle */}
          {otherSizes.length > 0 && (
            <div className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Other Sizes for {makeName} {modelName}
              </h2>
              <div className="flex flex-wrap gap-2">
                {otherSizes.map((s) => {
                  const sSlug = s.toLowerCase().replace(/\//g, "-");
                  return (
                    <Link
                      key={s}
                      href={`/tires/vehicle/${make}/${model}/size/${sSlug}`}
                      className="rounded-full border border-gray-200 bg-gray-50 px-4 py-1.5 text-sm font-mono font-medium text-gray-700 hover:border-safety-orange hover:text-safety-orange transition-colors"
                    >
                      {s}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Shop this size from all brands */}
          <div className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Shop {parsed.display} from All Brands
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              See every {parsed.display} tire available at Ship.Tires, not just those for {makeName} {modelName}.
            </p>
            <Link
              href={`/tires/size/${size}`}
              className="inline-flex items-center rounded-lg bg-navy px-6 py-3 text-sm font-bold text-white hover:bg-navy-light transition-colors"
            >
              All {parsed.display} Tires
            </Link>
          </div>

          {/* Brand-specific links */}
          {topBrands.length > 0 && (
            <div className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Shop {makeName} {modelName} by Brand
              </h2>
              <div className="flex flex-wrap gap-2">
                {topBrands.map((b) => (
                  <Link
                    key={b.slug}
                    href={`/tires/vehicle/${make}/${model}/brand/${b.slug}`}
                    className="rounded-full border border-gray-200 bg-gray-50 px-4 py-1.5 text-sm font-medium text-gray-700 hover:border-safety-orange hover:text-safety-orange transition-colors"
                  >
                    {b.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="rounded-xl bg-navy p-8 text-center text-white">
            <h3 className="text-xl font-bold">Need Help Choosing a {parsed.display} Tire for Your {makeName} {modelName}?</h3>
            <p className="mt-2 text-gray-400">
              Our tire experts can help you compare brands and find the best {parsed.display} tire for your driving needs.
            </p>
            <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <a
                href="tel:+12792388473"
                className="inline-flex items-center gap-2 rounded-lg bg-safety-orange px-6 py-3 text-sm font-bold text-white hover:opacity-90 transition-opacity"
              >
                Call/Text (279) 238-TIRE
              </a>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-lg border border-gray-600 px-6 py-3 text-sm font-bold text-white hover:bg-white/10 transition-colors"
              >
                Request a Quote
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
