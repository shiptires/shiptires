import { notFound } from "next/navigation";
import Link from "next/link";
import { getTiresBySize, toSlug, tireRowToSize } from "@/lib/db";
import type { TireRow } from "@/lib/db";
import { lookupTireSizes } from "@/data/tire-sizes";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ make: string; model: string }>;
}): Promise<Metadata> {
  const { make, model } = await params;
  const makeName = decodeURIComponent(make).replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const modelName = decodeURIComponent(model).replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    title: `Best Tires for ${makeName} ${modelName} — All Sizes & Prices`,
    description: `Find the best tires for your ${makeName} ${modelName}. Compare prices, sizes, and brands. Free shipping nationwide on all tire orders.`,
    alternates: { canonical: `https://ship.tires/tires/vehicle/${make}/${model}` },
  };
}

interface GroupedTire {
  brandName: string;
  brandSlug: string;
  modelName: string;
  modelSlug: string;
  season: string;
  tireCount: number;
  minPrice: number;
  maxPrice: number;
  imageUrl: string | null;
  sizes: string[];
}

export default async function VehicleTiresPage({
  params,
}: {
  params: Promise<{ make: string; model: string }>;
}) {
  const { make, model } = await params;
  const makeName = decodeURIComponent(make).replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const modelName = decodeURIComponent(model).replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  // Look up compatible tire sizes
  const compatibleSizes = lookupTireSizes(makeName, modelName);

  if (!compatibleSizes || compatibleSizes.length === 0) {
    notFound();
  }

  // Query DB for all tires matching those sizes
  const allTires: TireRow[] = [];
  for (const sizeStr of compatibleSizes) {
    const match = sizeStr.match(/^(\d{2,3})\/(\d{2,3})R(\d{2,3})$/i);
    if (match) {
      const tires = getTiresBySize(match[1], match[2], match[3]);
      allTires.push(...tires);
    }
  }

  // Group by brand + model
  const grouped = new Map<string, GroupedTire>();
  for (const tire of allTires) {
    const key = `${tire.make_name}|||${tire.model_name}`;
    if (!grouped.has(key)) {
      grouped.set(key, {
        brandName: tire.make_name,
        brandSlug: toSlug(tire.make_name),
        modelName: tire.model_name,
        modelSlug: toSlug(tire.model_name),
        season: tire.season || "All-Season",
        tireCount: 0,
        minPrice: Infinity,
        maxPrice: 0,
        imageUrl: tire.image_url_1,
        sizes: [],
      });
    }
    const g = grouped.get(key)!;
    g.tireCount++;
    if (tire.price_map && tire.price_map > 0) {
      g.minPrice = Math.min(g.minPrice, tire.price_map);
      g.maxPrice = Math.max(g.maxPrice, tire.price_map);
    }
    const sizeStr = tire.width && tire.aspect_ratio && tire.rim_size
      ? `${tire.width}/${tire.aspect_ratio}R${tire.rim_size}`
      : "";
    if (sizeStr && !g.sizes.includes(sizeStr)) g.sizes.push(sizeStr);
  }

  const tireGroups = [...grouped.values()].sort((a, b) => {
    if (a.minPrice === Infinity && b.minPrice === Infinity) return a.brandName.localeCompare(b.brandName);
    if (a.minPrice === Infinity) return 1;
    if (b.minPrice === Infinity) return -1;
    return a.minPrice - b.minPrice;
  });

  // Group by season/type for category sections
  const bySeason = new Map<string, GroupedTire[]>();
  for (const g of tireGroups) {
    const key = g.season || "Other";
    if (!bySeason.has(key)) bySeason.set(key, []);
    bySeason.get(key)!.push(g);
  }

  const vehicleSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Tires for ${makeName} ${modelName}`,
    description: `Find and compare tires for your ${makeName} ${modelName}. ${tireGroups.length} tire options available.`,
    url: `https://ship.tires/tires/vehicle/${make}/${model}`,
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

      <div className="bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="bg-navy py-12 text-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Link href="/tires" className="hover:text-white">All Brands</Link>
              <span>/</span>
              <Link href="/vehicle-lookup" className="hover:text-white">Vehicle Lookup</Link>
              <span>/</span>
              <span className="text-gray-300">{makeName} {modelName}</span>
            </div>
            <h1 className="mt-4 text-3xl font-bold sm:text-4xl">
              Tires for {makeName} {modelName}
            </h1>
            <p className="mt-2 text-gray-400">
              {tireGroups.length} tire options across {compatibleSizes.length} compatible sizes — Free shipping
            </p>

            {/* Compatible sizes */}
            <div className="mt-4 flex flex-wrap gap-2">
              {compatibleSizes.map((size) => (
                <Link
                  key={size}
                  href={`/tires/size/${size.toLowerCase().replace(/\//g, "-")}`}
                  className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-sm font-mono text-white hover:bg-white/20 transition-colors"
                >
                  {size}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          {tireGroups.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
              <h2 className="text-xl font-bold text-gray-900">No Tires Found Yet</h2>
              <p className="mt-2 text-gray-500">
                We&apos;re loading tires for the {makeName} {modelName}. Contact us for availability.
              </p>
              <a
                href="tel:+12792388473"
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-orange px-6 py-3 text-sm font-bold text-white"
              >
                Call/Text (279) 238-8473
              </a>
            </div>
          ) : (
            <>
              {[...bySeason.entries()].map(([season, tires]) => (
                <div key={season} className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 border-b border-gray-200 pb-3 mb-6">
                    {season} Tires ({tires.length})
                  </h2>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {tires.map((tire) => {
                      const hasPrice = tire.minPrice !== Infinity;
                      return (
                        <Link
                          key={`${tire.brandSlug}-${tire.modelSlug}`}
                          href={`/tires/${tire.brandSlug}/${tire.modelSlug}`}
                          className="group block rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-blue"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-xs font-bold uppercase text-gray-500">{tire.brandName}</p>
                              <h3 className="mt-1 text-lg font-bold text-gray-900 group-hover:text-blue transition-colors">
                                {tire.modelName}
                              </h3>
                            </div>
                            <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                              {tire.season}
                            </span>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-1">
                            {tire.sizes.slice(0, 3).map((s) => (
                              <span key={s} className="rounded bg-gray-100 px-2 py-0.5 text-xs font-mono text-gray-600">{s}</span>
                            ))}
                            {tire.sizes.length > 3 && (
                              <span className="text-xs text-gray-400">+{tire.sizes.length - 3} more</span>
                            )}
                          </div>
                          <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
                            {hasPrice ? (
                              <span className="text-lg font-bold text-gray-900">
                                From ${tire.minPrice}
                                <span className="text-xs text-gray-500"> /tire</span>
                              </span>
                            ) : (
                              <span className="text-sm font-bold text-safety-orange">Request Quote</span>
                            )}
                            <span className="text-xs text-gray-400">{tire.tireCount} sizes</span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </>
          )}

          {/* CTA */}
          <div className="mt-8 rounded-xl bg-navy p-8 text-center text-white">
            <h3 className="text-xl font-bold">Not sure which tire is right for your {makeName} {modelName}?</h3>
            <p className="mt-2 text-gray-400">
              Our tire experts can help you choose the best fit for your driving style and budget.
            </p>
            <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <a
                href="tel:+12792388473"
                className="inline-flex items-center gap-2 rounded-lg bg-orange px-6 py-3 text-sm font-bold text-white hover:bg-orange-light transition-colors"
              >
                Call/Text (279) 238-8473 (TIRE)
              </a>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-lg border border-gray-600 px-6 py-3 text-sm font-bold text-white hover:bg-navy-light transition-colors"
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
