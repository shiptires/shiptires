import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { searchTires, toSlug, getBrandBySlug, getAllBrands } from "@/lib/db";
import type { TireRow } from "@/lib/db";
import { isCuratedBrand } from "@/lib/curated-brands";
import { buildBreadcrumbSchema } from "@/lib/breadcrumb-schema";
import { lookupTireSizes } from "@/data/tire-sizes";
import { getMakeContent, getModelsForMake } from "@/data/vehicle-content";
import { getSitePriceBatch } from "@/lib/pricing";
import type { Metadata } from "next";

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ make: string; model: string; brand: string }>;
}): Promise<Metadata> {
  const { make, model, brand: brandSlug } = await params;
  const makeName = decodeURIComponent(make).replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const modelName = decodeURIComponent(model).replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const brandRow = await getBrandBySlug(brandSlug);
  if (!brandRow) return {};

  const sizes = lookupTireSizes(makeName, modelName);
  const sizeText = sizes.slice(0, 3).join(", ");

  return {
    title: `${brandRow.make_name} Tires for ${makeName} ${modelName} — Ship Free | Ship.Tires`,
    description: `Shop ${brandRow.make_name} tires for your ${makeName} ${modelName}. Compatible sizes: ${sizeText}. Free shipping on every order at Ship.Tires.`,
    alternates: { canonical: `https://ship.tires/tires/vehicle/${make}/${model}/brand/${brandSlug}` },
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

export default async function VehicleBrandPage({
  params,
}: {
  params: Promise<{ make: string; model: string; brand: string }>;
}) {
  const { make, model, brand: brandSlug } = await params;
  const makeName = decodeURIComponent(make).replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const modelName = decodeURIComponent(model).replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  // Resolve brand
  const brandRow = await getBrandBySlug(brandSlug);
  if (!brandRow) notFound();
  const brandName = brandRow.make_name;

  // Look up compatible tire sizes
  const compatibleSizes = lookupTireSizes(makeName, modelName);
  if (!compatibleSizes || compatibleSizes.length === 0) notFound();

  // Search for tires matching this vehicle's sizes
  const allTires: TireRow[] = [];
  for (const sizeStr of compatibleSizes) {
    const match = sizeStr.match(/^(\d{2,3})\/(\d{2,3})R(\d{2,3})$/i);
    if (match) {
      const result = await searchTires({
        width: match[1],
        aspectRatio: match[2],
        rimSize: match[3],
        limit: 100,
        page: 1,
      });
      allTires.push(...result.tires);
    }
  }

  // Filter to this brand only
  const brandTires = allTires.filter(
    (t) => toSlug(t.make_name) === brandSlug && isCuratedBrand(t.make_name),
  );

  if (brandTires.length === 0) notFound();

  // Get real pricing from distributor/competitor pipeline
  const priceMap = await getSitePriceBatch(
    brandTires.filter((t) => t.id).map((t) => ({
      id: t.id,
      brand: t.make_name,
      model: t.model_name,
      weight: t.weight ? parseFloat(t.weight) || null : null,
      rimSize: t.rim_size ? parseInt(t.rim_size) || null : null,
    }))
  );

  // Group by model name
  const grouped = new Map<string, GroupedTire>();
  for (const tire of brandTires) {
    const key = tire.model_name;
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
        imageUrl: tire.thumbnail_url ?? tire.image_0100_url,
        sizes: [],
      });
    }
    const g = grouped.get(key)!;
    g.tireCount++;
    const sp = priceMap.get(tire.id) ?? 0;
    if (sp > 0) {
      g.minPrice = Math.min(g.minPrice, sp);
      g.maxPrice = Math.max(g.maxPrice, sp);
    }
    const sizeStr =
      tire.width && tire.aspect_ratio && tire.rim_size
        ? `${tire.width}/${tire.aspect_ratio}R${tire.rim_size}`
        : "";
    if (sizeStr && !g.sizes.includes(sizeStr)) g.sizes.push(sizeStr);
  }

  const tireGroups = [...grouped.values()].sort((a, b) => {
    if (a.minPrice === Infinity && b.minPrice === Infinity) return a.modelName.localeCompare(b.modelName);
    if (a.minPrice === Infinity) return 1;
    if (b.minPrice === Infinity) return -1;
    return a.minPrice - b.minPrice;
  });

  // Group by season
  const bySeason = new Map<string, GroupedTire[]>();
  for (const g of tireGroups) {
    const key = g.season || "Other";
    if (!bySeason.has(key)) bySeason.set(key, []);
    bySeason.get(key)!.push(g);
  }

  // Other brands for cross-linking
  const curatedTires = allTires.filter((t) => isCuratedBrand(t.make_name));
  const otherBrandSlugs = new Map<string, string>();
  for (const t of curatedTires) {
    const s = toSlug(t.make_name);
    if (s !== brandSlug) otherBrandSlugs.set(s, t.make_name);
  }
  const otherBrands = [...otherBrandSlugs.entries()]
    .map(([slug, name]) => ({ slug, name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const makeContent = getMakeContent(make);

  const breadcrumb = buildBreadcrumbSchema([
    { name: "Home", url: "https://ship.tires" },
    { name: "Shop by Vehicle", url: "https://ship.tires/vehicle-lookup" },
    { name: makeName, url: `https://ship.tires/tires/vehicle/${make}` },
    { name: modelName, url: `https://ship.tires/tires/vehicle/${make}/${model}` },
    { name: brandName, url: `https://ship.tires/tires/vehicle/${make}/${model}/brand/${brandSlug}` },
  ]);

  const vehicleSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${brandName} Tires for ${makeName} ${modelName}`,
    description: `Shop ${brandName} tires for your ${makeName} ${modelName}. ${tireGroups.length} models across ${compatibleSizes.length} sizes. Free shipping.`,
    url: `https://ship.tires/tires/vehicle/${make}/${model}/brand/${brandSlug}`,
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
              <span className="text-gray-300">{brandName}</span>
            </div>
            <h1 className="mt-4 text-3xl font-bold sm:text-4xl lg:text-5xl">
              {brandName} Tires for {makeName} {modelName}
            </h1>
            <p className="mt-2 text-lg text-gray-300">
              {tireGroups.length} {brandName} models across {compatibleSizes.length} compatible sizes — Free shipping
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          {/* Intro */}
          <div className="mb-8 rounded-xl bg-white border border-gray-200 p-6 shadow-sm">
            <p className="text-gray-600 leading-relaxed">
              Browse {brandName} tires compatible with your {makeName} {modelName}. Available sizes include{" "}
              {compatibleSizes.map((s, i) => (
                <span key={s}>
                  <Link
                    href={`/tires/vehicle/${make}/${model}/size/${s.toLowerCase().replace(/\//g, "-")}`}
                    className="font-semibold text-blue hover:underline font-mono"
                  >
                    {s}
                  </Link>
                  {i < compatibleSizes.length - 2 ? ", " : i < compatibleSizes.length - 1 ? ", and " : ""}
                </span>
              ))}
              . Every {brandName} tire ships free at Ship.Tires.
            </p>
          </div>

          {/* Tire grid by season */}
          {[...bySeason.entries()].map(([season, tires]) => (
            <div key={season} className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 border-b border-gray-200 pb-3 mb-6">
                {brandName} {season} Tires for {makeName} {modelName} ({tires.length})
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {tires.map((tire) => {
                  const hasPrice = tire.minPrice !== Infinity;
                  return (
                    <Link
                      key={`${tire.brandSlug}-${tire.modelSlug}`}
                      href={`/tires/${tire.brandSlug}/${tire.modelSlug}`}
                      className="group flex gap-4 rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-safety-orange"
                    >
                      <div className="flex-shrink-0 w-20 h-20 rounded-lg bg-gray-50 flex items-center justify-center overflow-hidden">
                        {tire.imageUrl ? (
                          <Image
                            src={tire.imageUrl}
                            alt={`${tire.brandName} ${tire.modelName}`}
                            width={80}
                            height={80}
                            className="object-contain"
                          />
                        ) : (
                          <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
                            <circle cx="12" cy="12" r="3" strokeWidth="1.5" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-xs font-bold uppercase text-gray-500">{tire.brandName}</p>
                            <h3 className="text-base font-bold text-gray-900 group-hover:text-safety-orange transition-colors">
                              {tire.modelName}
                            </h3>
                          </div>
                          <span className="ml-2 flex-shrink-0 inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                            {tire.season}
                          </span>
                        </div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {tire.sizes.slice(0, 3).map((s) => (
                            <span key={s} className="rounded bg-gray-100 px-2 py-0.5 text-xs font-mono text-gray-600">{s}</span>
                          ))}
                          {tire.sizes.length > 3 && (
                            <span className="text-xs text-gray-400">+{tire.sizes.length - 3}</span>
                          )}
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          {hasPrice ? (
                            <span className="text-base font-bold text-gray-900">
                              From ${tire.minPrice}
                              <span className="text-xs text-gray-500"> /tire</span>
                            </span>
                          ) : (
                            <span className="text-sm font-bold text-safety-orange">Shop Tires &rarr;</span>
                          )}
                          <span className="text-xs text-gray-400">{tire.tireCount} sizes</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Other brands for this vehicle */}
          {otherBrands.length > 0 && (
            <div className="mt-8 rounded-xl bg-white border border-gray-200 p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Other Brands for {makeName} {modelName}
              </h2>
              <div className="flex flex-wrap gap-2">
                {otherBrands.map((b) => (
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

          {/* Shop brand in your size */}
          <div className="mt-8 rounded-xl bg-white border border-gray-200 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Shop {brandName} in Your Size
            </h2>
            <div className="flex flex-wrap gap-2">
              {compatibleSizes.map((size) => {
                const sizeSlug = size.toLowerCase().replace(/\//g, "-");
                return (
                  <Link
                    key={size}
                    href={`/tires/${brandSlug}/size/${sizeSlug}`}
                    className="rounded-full border border-gray-200 bg-gray-50 px-4 py-1.5 text-sm font-mono font-medium text-gray-700 hover:border-safety-orange hover:text-safety-orange transition-colors"
                  >
                    {brandName} {size}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* CTA */}
          <div className="mt-8 rounded-xl bg-navy p-8 text-center text-white">
            <h3 className="text-xl font-bold">Not sure which {brandName} tire is right for your {makeName} {modelName}?</h3>
            <p className="mt-2 text-gray-400">
              Our tire experts can help you choose the best {brandName} fit for your driving style and budget.
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
