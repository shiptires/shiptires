import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { searchTires, toSlug } from "@/lib/db";
import type { TireRow } from "@/lib/db";
import { isCuratedBrand } from "@/lib/curated-brands";
import { buildBreadcrumbSchema } from "@/lib/breadcrumb-schema";
import { lookupTireSizes } from "@/data/tire-sizes";
import { getMakeContent, getModelContent, getModelsForMake } from "@/data/vehicle-content";
import { sitePrice } from "@/lib/pricing";
import { getVehicleImage } from "@/lib/vehicle-image";
import type { Metadata } from "next";

export const revalidate = 300;
export const dynamicParams = true;

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ make: string; model: string }>;
}): Promise<Metadata> {
  const { make, model } = await params;
  const makeName = decodeURIComponent(make).replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const modelName = decodeURIComponent(model).replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const sizes = lookupTireSizes(makeName, modelName);
  const sizeText = sizes.slice(0, 3).join(", ");

  return {
    title: `${makeName} ${modelName} Tires | ${sizeText} | Free Shipping`,
    description: `Buy tires for your ${makeName} ${modelName}. Popular sizes: ${sizeText}. Compare brands like Michelin, Bridgestone, Goodyear. Free shipping on every order at Ship.Tires.`,
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

  // Fetch vehicle photo from Wikipedia
  const vehicleImage = await getVehicleImage(makeName, modelName);

  // Look up compatible tire sizes
  const compatibleSizes = lookupTireSizes(makeName, modelName);

  if (!compatibleSizes || compatibleSizes.length === 0) {
    notFound();
  }

  // Search API for tires matching this vehicle's sizes
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

  // Filter to curated brands only
  const curatedTires = allTires.filter((t) => isCuratedBrand(t.make_name));

  // Group by brand + model
  const grouped = new Map<string, GroupedTire>();
  for (const tire of curatedTires) {
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
        imageUrl: tire.thumbnail_url ?? tire.image_0100_url,
        sizes: [],
      });
    }
    const g = grouped.get(key)!;
    g.tireCount++;
    const sp = sitePrice(tire.price_map);
    if (sp > 0) {
      g.minPrice = Math.min(g.minPrice, sp);
      g.maxPrice = Math.max(g.maxPrice, sp);
    }
    const sizeStr = tire.width && tire.aspect_ratio && tire.rim_size
      ? `${tire.width}/${tire.aspect_ratio}R${tire.rim_size}`
      : "";
    if (sizeStr && !g.sizes.includes(sizeStr)) g.sizes.push(sizeStr);
  }

  const tireGroups = [...grouped.values()]
    .filter((g) => g.imageUrl && g.minPrice !== Infinity)
    .sort((a, b) => a.minPrice - b.minPrice);

  // Group by season/type for category sections
  const bySeason = new Map<string, GroupedTire[]>();
  for (const g of tireGroups) {
    const key = g.season || "Other";
    if (!bySeason.has(key)) bySeason.set(key, []);
    bySeason.get(key)!.push(g);
  }

  // Get SEO content
  const makeContent = getMakeContent(make);
  const modelContent = getModelContent(make, model);
  const otherModels = getModelsForMake(make).filter((m) => m.modelSlug !== model);

  const breadcrumb = buildBreadcrumbSchema([
    { name: "Home", url: "https://ship.tires" },
    { name: "Shop by Vehicle", url: "https://ship.tires/vehicle-lookup" },
    { name: makeName, url: `https://ship.tires/tires/vehicle/${make}` },
    { name: modelName, url: `https://ship.tires/tires/vehicle/${make}/${model}` },
  ]);

  const vehicleSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Tires for ${makeName} ${modelName}`,
    description: `Buy tires for your ${makeName} ${modelName}. ${tireGroups.length} tire options across ${compatibleSizes.length} sizes. Free shipping.`,
    url: `https://ship.tires/tires/vehicle/${make}/${model}`,
    about: {
      "@type": "Vehicle",
      manufacturer: makeName,
      model: modelName,
    },
  };

  // FAQ schema from vehicle content data
  const faqItems = makeContent?.faqs ?? [];
  const faqSchema = faqItems.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  } : null;

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
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}

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
              <span className="text-gray-300">{modelName}</span>
            </div>
            <div className="mt-4 flex items-center justify-between gap-8">
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl font-bold sm:text-4xl lg:text-5xl">
                  Find Tires for Your {makeName} {modelName}
                </h1>
                <p className="mt-2 text-lg text-gray-300">
                  {tireGroups.length} tire options across {compatibleSizes.length} compatible sizes — Free shipping
                </p>

                {/* Compatible sizes — clickable */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {compatibleSizes.map((size) => (
                    <Link
                      key={size}
                      href={`/tires/size/${size.toLowerCase().replace(/\//g, "-")}`}
                      className="inline-flex items-center rounded-full bg-white/10 px-4 py-1.5 text-sm font-mono font-semibold text-white hover:bg-safety-orange transition-colors"
                    >
                      {size}
                    </Link>
                  ))}
                </div>
              </div>
              {vehicleImage && (
                <div className="hidden md:block flex-shrink-0">
                  <Image
                    src={vehicleImage}
                    alt={`${makeName} ${modelName}`}
                    width={280}
                    height={180}
                    className="object-contain opacity-90"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          {/* SEO intro text */}
          {modelContent && (
            <div className="mb-8 rounded-xl bg-white border border-gray-200 p-6 shadow-sm">
              <p className="text-gray-600 leading-relaxed">
                {modelContent.intro}
              </p>
              <p className="mt-3 text-gray-600 leading-relaxed">
                Popular tire sizes for the {makeName} {modelName} include{" "}
                {compatibleSizes.slice(0, 3).map((s, i) => (
                  <span key={s}>
                    <Link href={`/tires/size/${s.toLowerCase().replace(/\//g, "-")}`} className="font-semibold text-blue hover:underline">{s}</Link>
                    {i < Math.min(compatibleSizes.length, 3) - 2 ? ", " : i < Math.min(compatibleSizes.length, 3) - 1 ? ", and " : ""}
                  </span>
                ))}
                , depending on your specific year and trim level. Choose from trusted brands including{" "}
                {(makeContent?.popularBrands ?? ["Michelin", "Bridgestone", "Goodyear", "Continental"]).slice(0, 4).map((b, i, arr) => (
                  <span key={b}>
                    <Link href={`/tires/${b.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`} className="font-semibold text-blue hover:underline">{b}</Link>
                    {i < arr.length - 2 ? ", " : i < arr.length - 1 ? ", and " : ""}
                  </span>
                ))}
                .
              </p>
              <p className="mt-3 text-sm text-gray-500">
                Every {makeName} {modelName} tire purchase includes FREE shipping to your home or a local installer and access to over 10,000 installation locations nationwide.
              </p>
            </div>
          )}

          {tireGroups.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
              <h2 className="text-xl font-bold text-gray-900">No Tires Found Yet</h2>
              <p className="mt-2 text-gray-500">
                We&apos;re loading tires for the {makeName} {modelName}. Contact us for availability.
              </p>
              <a
                href="tel:+12792388473"
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-safety-orange px-6 py-3 text-sm font-bold text-white"
              >
                Call/Text (279) 238-TIRE
              </a>
            </div>
          ) : (
            <>
              {[...bySeason.entries()].map(([season, tires]) => (
                <div key={season} className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 border-b border-gray-200 pb-3 mb-6">
                    {season} Tires for {makeName} {modelName} ({tires.length})
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
                          {/* Tire image */}
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
            </>
          )}

          {/* Shop by Brand */}
          {(() => {
            const brandSlugs = new Map<string, string>();
            for (const g of tireGroups) {
              if (!brandSlugs.has(g.brandSlug)) brandSlugs.set(g.brandSlug, g.brandName);
            }
            const brands = [...brandSlugs.entries()]
              .map(([slug, name]) => ({ slug, name }))
              .sort((a, b) => a.name.localeCompare(b.name));
            if (brands.length === 0) return null;
            return (
              <div className="mt-8 rounded-xl bg-white border border-gray-200 p-6 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Shop {makeName} {modelName} Tires by Brand
                </h2>
                <div className="flex flex-wrap gap-2">
                  {brands.map((b) => (
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
            );
          })()}

          {/* Shop by Size */}
          {compatibleSizes.length > 0 && (
            <div className="mt-8 rounded-xl bg-white border border-gray-200 p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Shop {makeName} {modelName} Tires by Size
              </h2>
              <div className="flex flex-wrap gap-2">
                {compatibleSizes.map((size) => {
                  const sizeSlug = size.toLowerCase().replace(/\//g, "-");
                  return (
                    <Link
                      key={size}
                      href={`/tires/vehicle/${make}/${model}/size/${sizeSlug}`}
                      className="rounded-full border border-gray-200 bg-gray-50 px-4 py-1.5 text-sm font-mono font-medium text-gray-700 hover:border-safety-orange hover:text-safety-orange transition-colors"
                    >
                      {size}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Other models from this make */}
          {otherModels.length > 0 && (
            <div className="mt-8 rounded-xl bg-white border border-gray-200 p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Other {makeName} Models
              </h2>
              <div className="flex flex-wrap gap-2">
                {otherModels.map((m) => (
                  <Link
                    key={m.modelSlug}
                    href={`/tires/vehicle/${make}/${m.modelSlug}`}
                    className="rounded-full border border-gray-200 bg-gray-50 px-4 py-1.5 text-sm font-medium text-gray-700 hover:border-safety-orange hover:text-safety-orange transition-colors"
                  >
                    {makeName} {m.model}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* FAQ */}
          {faqItems.length > 0 && (
            <div className="mt-8 rounded-xl bg-white border border-gray-200 p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Frequently Asked Questions — {makeName} {modelName} Tires
              </h2>
              <div className="space-y-3">
                {faqItems.map((item) => (
                  <details key={item.q} className="group rounded-lg border border-gray-200 bg-white">
                    <summary className="flex cursor-pointer items-center justify-between px-5 py-4 text-sm font-bold text-gray-900">
                      {item.q}
                      <svg className="h-4 w-4 flex-shrink-0 text-gray-400 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </summary>
                    <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed">{item.a}</div>
                  </details>
                ))}
              </div>
            </div>
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
