import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { states } from "@/data/locations";
import { searchTires, toSlug } from "@/lib/db";
import type { TireRow } from "@/lib/db";
import { isCuratedBrand } from "@/lib/curated-brands";
import { buildBreadcrumbSchema } from "@/lib/breadcrumb-schema";
import { lookupTireSizes } from "@/data/tire-sizes";
import { vehicleMakes, getModelsForMake } from "@/data/vehicle-content";
import { findState, findCity, getStateClimate } from "@/lib/location-seo";
import type { Metadata } from "next";

export const revalidate = 300;

export function generateStaticParams() {
  const params: { state: string; city: string; make: string; model: string }[] = [];
  // Top 5 makes × top city per state → ~250 pre-built
  const topMakes = vehicleMakes.slice(0, 5);
  for (const state of states) {
    const topCity = state.cities.sort((a, b) => b.population - a.population)[0];
    if (!topCity) continue;
    for (const make of topMakes) {
      const models = getModelsForMake(make.slug).slice(0, 2);
      for (const model of models) {
        params.push({ state: state.slug, city: topCity.slug, make: make.slug, model: model.modelSlug });
      }
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ state: string; city: string; make: string; model: string }>;
}): Promise<Metadata> {
  const { state: stateSlug, city: citySlug, make, model } = await params;
  const state = findState(stateSlug);
  const city = state ? findCity(state, citySlug) : undefined;
  if (!state || !city) return {};

  const makeName = make.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const modelName = model.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    title: `${makeName} ${modelName} Tires in ${city.name}, ${state.abbreviation} — Ship Free`,
    description: `Shop ${makeName} ${modelName} tires in ${city.name}, ${state.abbreviation}. Find compatible sizes, compare brands, and ship free to your ${city.name} door or local installer. 34 brands available.`,
    alternates: { canonical: `https://ship.tires/locations/${stateSlug}/${citySlug}/vehicle/${make}/${model}` },
  };
}

export default async function CityVehiclePage({
  params,
}: {
  params: Promise<{ state: string; city: string; make: string; model: string }>;
}) {
  const { state: stateSlug, city: citySlug, make, model } = await params;
  const state = findState(stateSlug);
  const city = state ? findCity(state, citySlug) : undefined;
  if (!state || !city) notFound();

  const makeName = make.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const modelName = model.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const compatibleSizes = lookupTireSizes(makeName, modelName);
  if (!compatibleSizes || compatibleSizes.length === 0) notFound();

  const climate = getStateClimate(stateSlug);

  // Search for tires matching this vehicle's sizes
  const allTires: TireRow[] = [];
  for (const sizeStr of compatibleSizes.slice(0, 5)) {
    const match = sizeStr.match(/^(\d{2,3})\/(\d{2,3})R(\d{2,3})$/i);
    if (match) {
      const result = await searchTires({
        width: match[1],
        aspectRatio: match[2],
        rimSize: match[3],
        limit: 50,
        page: 1,
      });
      allTires.push(...result.tires);
    }
  }

  const curatedTires = allTires.filter((t) => isCuratedBrand(t.make_name));

  // Deduplicate by brand+model, keep one per
  const seen = new Set<string>();
  const uniqueTires: TireRow[] = [];
  for (const tire of curatedTires) {
    const key = `${tire.make_name}|||${tire.model_name}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueTires.push(tire);
    }
  }

  // Climate-aware tire recommendation
  const seasonRec = climate === "cold" || climate === "mixed"
    ? "Winter or All-Season tires are recommended for drivers in"
    : "All-Season or Performance tires are popular with drivers in";

  const breadcrumb = buildBreadcrumbSchema([
    { name: "Home", url: "https://ship.tires" },
    { name: "Locations", url: "https://ship.tires/locations" },
    { name: state.name, url: `https://ship.tires/locations/${stateSlug}` },
    { name: city.name, url: `https://ship.tires/locations/${stateSlug}/${citySlug}` },
    { name: `${makeName} ${modelName}`, url: `https://ship.tires/locations/${stateSlug}/${citySlug}/vehicle/${make}/${model}` },
  ]);

  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${makeName} ${modelName} Tires in ${city.name}, ${state.abbreviation}`,
    description: `Shop ${makeName} ${modelName} tires shipped free to ${city.name}, ${state.abbreviation}.`,
    url: `https://ship.tires/locations/${stateSlug}/${citySlug}/vehicle/${make}/${model}`,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />

      <div className="bg-gray-50 min-h-screen">
        <div className="bg-navy py-12 text-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-400">
              <Link href="/locations" className="hover:text-white transition-colors">Locations</Link>
              <span>/</span>
              <Link href={`/locations/${stateSlug}`} className="hover:text-white transition-colors">{state.name}</Link>
              <span>/</span>
              <Link href={`/locations/${stateSlug}/${citySlug}`} className="hover:text-white transition-colors">{city.name}</Link>
              <span>/</span>
              <span className="text-gray-300">{makeName} {modelName}</span>
            </div>
            <h1 className="mt-4 text-3xl font-bold sm:text-4xl">
              {makeName} {modelName} Tires in {city.name}, {state.abbreviation}
            </h1>
            <p className="mt-2 text-lg text-gray-300">
              Shop tires for your {makeName} {modelName} — shipped free to {city.name} or a local installer near you
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          {/* Info Section */}
          <div className="mb-8 rounded-xl bg-white border border-gray-200 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900">
              Finding the Right Tires for Your {makeName} {modelName} in {city.name}
            </h2>
            <p className="mt-3 text-gray-600 leading-relaxed">
              {seasonRec} {city.name}, {state.abbreviation}. The {makeName} {modelName} uses{" "}
              {compatibleSizes.length === 1 ? `size ${compatibleSizes[0]}` : `sizes ${compatibleSizes.slice(0, 3).join(", ")}`}.
              All tires ship free directly to your {city.name} address or to any local tire installer.
            </p>
          </div>

          {/* Compatible Sizes */}
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-3">{makeName} {modelName} Tire Sizes</h2>
            <div className="flex flex-wrap gap-2">
              {compatibleSizes.map((size) => (
                <Link
                  key={size}
                  href={`/locations/${stateSlug}/${citySlug}/size/${size.toLowerCase().replace(/\//g, "-")}`}
                  className="rounded-full bg-white border border-gray-200 px-4 py-2 text-sm font-mono font-semibold text-gray-700 hover:border-safety-orange hover:text-safety-orange transition-colors"
                >
                  {size}
                </Link>
              ))}
            </div>
          </div>

          {/* Tire Results */}
          {uniqueTires.length > 0 ? (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 border-b border-gray-200 pb-3 mb-6">
                Available Tires ({uniqueTires.length})
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {uniqueTires.slice(0, 18).map((tire) => {
                  const bSlug = toSlug(tire.make_name);
                  const mSlug = toSlug(tire.model_name);
                  const imgSrc = tire.thumbnail_url ?? tire.image_0100_url;
                  return (
                    <Link
                      key={tire.id}
                      href={`/tires/${bSlug}/${mSlug}`}
                      className="group flex gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:border-safety-orange"
                    >
                      <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-gray-50 flex items-center justify-center overflow-hidden">
                        {imgSrc ? (
                          <Image src={imgSrc} alt={tire.name} width={64} height={64} className="object-contain" />
                        ) : (
                          <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
                            <circle cx="12" cy="12" r="3" strokeWidth="1.5" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold uppercase text-gray-500">{tire.make_name}</p>
                        <h3 className="text-sm font-bold text-gray-900 group-hover:text-safety-orange transition-colors truncate">{tire.model_name}</h3>
                        {tire.width && tire.aspect_ratio && tire.rim_size && (
                          <span className="text-xs font-mono text-gray-500">{tire.width}/{tire.aspect_ratio}R{tire.rim_size}</span>
                        )}
                        {tire.price_map && tire.price_map > 0 && (
                          <p className="mt-1 text-sm font-bold text-gray-900">From ${tire.price_map}<span className="text-xs text-gray-500"> /tire</span></p>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
              <h3 className="text-xl font-bold text-gray-900">Contact Us for {makeName} {modelName} Tires</h3>
              <p className="mt-2 text-gray-500">Call for personalized tire recommendations for your {makeName} {modelName} in {city.name}.</p>
              <a href="tel:+12792388473" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-safety-orange px-6 py-3 text-sm font-bold text-white">Call/Text (279) 238-TIRE</a>
            </div>
          )}

          {/* Related links */}
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm">
              <h3 className="font-bold text-gray-900">Other Vehicles in {city.name}</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {vehicleMakes.slice(0, 8).filter((m) => m.slug !== make).map((m) => {
                  const models = getModelsForMake(m.slug);
                  const topModel = models[0];
                  return topModel ? (
                    <Link key={m.slug} href={`/locations/${stateSlug}/${citySlug}/vehicle/${m.slug}/${topModel.modelSlug}`}
                      className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-700 hover:border-safety-orange hover:text-safety-orange transition-colors">
                      {m.name} {topModel.model}
                    </Link>
                  ) : null;
                })}
              </div>
            </div>
            <div className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm">
              <h3 className="font-bold text-gray-900">All Tires in {city.name}</h3>
              <p className="mt-2 text-sm text-gray-600">Browse all 34 brands with free shipping to {city.name}.</p>
              <Link href={`/locations/${stateSlug}/${citySlug}`}
                className="mt-3 inline-flex items-center text-sm font-bold text-safety-orange hover:underline">
                Shop All Brands &rarr;
              </Link>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-8 rounded-xl bg-navy p-8 text-center text-white">
            <h3 className="text-xl font-bold">Free Shipping on {makeName} {modelName} Tires to {city.name}</h3>
            <p className="mt-2 text-gray-400">Every tire ships free to your {city.name} address or local installer.</p>
            <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <a href="tel:+12792388473" className="inline-flex items-center gap-2 rounded-lg bg-safety-orange px-6 py-3 text-sm font-bold text-white hover:opacity-90 transition-opacity">
                Call/Text (279) 238-TIRE
              </a>
              <Link href={`/tires/vehicle/${make}/${model}`} className="inline-flex items-center gap-2 rounded-lg border border-gray-600 px-6 py-3 text-sm font-bold text-white hover:bg-white/10 transition-colors">
                All {makeName} {modelName} Tires
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
