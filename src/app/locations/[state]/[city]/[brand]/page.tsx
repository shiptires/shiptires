import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { states } from "@/data/locations";
import {
  getBrandBySlug,
  getModelsByBrand,
  brandSummaryToBrand,
  modelSummaryToModel,
  getAllBrands,
} from "@/lib/db";
import {
  toLocationSlug,
  findState,
  findCity,
  getStateClimate,
  getTypeLabel,
} from "@/lib/location-seo";
import type { Metadata } from "next";

export const revalidate = 300;
export const dynamicParams = true;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ state: string; city: string; brand: string }>;
}): Promise<Metadata> {
  const { state: stateSlug, city: citySlug, brand: brandSlug } = await params;
  const state = findState(stateSlug);
  const city = state ? findCity(state, citySlug) : undefined;
  const brandRow = await getBrandBySlug(brandSlug);
  if (!state || !city || !brandRow) return {};

  const brand = brandSummaryToBrand(brandRow);
  const models = await getModelsByBrand(brandSlug);

  return {
    title: `Shop ${brand.name} Tires in ${city.name}, ${state.abbreviation} — ${models.length} Models, Ship Free`,
    description: `Shop ${brand.name} tires in ${city.name}, ${state.abbreviation}. ${models.length} models, ${brand.tireCount} sizes. Ship free to your door or installer near ${city.name}. ${brand.name} tires for Honda, Toyota, Ford, BMW & more. Free shipping on every order.`,
    alternates: { canonical: `https://ship.tires/locations/${stateSlug}/${citySlug}/${brandSlug}` },
  };
}

export default async function CityBrandPage({
  params,
}: {
  params: Promise<{ state: string; city: string; brand: string }>;
}) {
  const { state: stateSlug, city: citySlug, brand: brandSlug } = await params;
  const state = findState(stateSlug);
  const city = state ? findCity(state, citySlug) : undefined;
  const brandRow = await getBrandBySlug(brandSlug);
  if (!state || !city || !brandRow) notFound();

  const brand = brandSummaryToBrand(brandRow);
  const modelRows = await getModelsByBrand(brandSlug);
  const models = modelRows.map(modelSummaryToModel);
  const climate = getStateClimate(stateSlug);

  // Priority brands in explicit order for cross-linking
  const priorityOrder = [
    "MICHELIN", "GOODYEAR", "BRIDGESTONE", "CONTINENTAL", "PIRELLI",
    "COOPER", "HANKOOK", "YOKOHAMA", "TOYO", "FIRESTONE",
    "BFGOODRICH", "FALKEN", "GENERAL", "KUMHO", "NEXEN",
    "NITTO", "DUNLOP", "NOKIAN", "UNIROYAL", "KELLY",
  ];
  const priorityRank = new Map(priorityOrder.map((n, i) => [n, i + 1]));

  // Get other top brands for cross-linking
  const allBrandRows = await getAllBrands();
  const otherBrands = allBrandRows
    .filter((b) => b.make_name !== brandRow.make_name)
    .sort((a, b) => {
      const aR = priorityRank.get(a.make_name.toUpperCase()) ?? 999;
      const bR = priorityRank.get(b.make_name.toUpperCase()) ?? 999;
      if (aR !== bR) return aR - bR;
      return b.tire_count - a.tire_count;
    })
    .slice(0, 20)
    .map(brandSummaryToBrand);

  // Price range from models
  const allMinPrices = models
    .map((m) => m.priceRange[0])
    .filter((p) => p > 0);
  const lowestPrice = allMinPrices.length > 0 ? Math.min(...allMinPrices) : 0;

  const schemaData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${brand.name} Tires in ${city.name}, ${state.abbreviation}`,
    description: `${brand.name} tires available for free shipping to ${city.name}, ${state.abbreviation}`,
    numberOfItems: models.length,
    itemListElement: models.slice(0, 20).map((model, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: `${brand.name} ${model.name}`,
      url: `https://ship.tires/tires/${brandSlug}/${model.slug}`,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />

      <div className="bg-gray-50">
        <div className="bg-navy py-12 text-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 text-sm text-gray-400 flex-wrap">
              <Link href="/locations" className="hover:text-white">
                Locations
              </Link>
              <span>/</span>
              <Link
                href={`/locations/${stateSlug}`}
                className="hover:text-white"
              >
                {state.name}
              </Link>
              <span>/</span>
              <Link
                href={`/locations/${stateSlug}/${citySlug}`}
                className="hover:text-white"
              >
                {city.name}
              </Link>
              <span>/</span>
              <span className="text-gray-300">{brand.name}</span>
            </div>
            <h1 className="mt-4 text-3xl font-bold sm:text-4xl">
              Shop & Ship {brand.name} Car, Truck & SUV Tires to {city.name}, {state.abbreviation}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-gray-300">
              <span>
                {models.length} models · {brand.tireCount} sizes
              </span>
              {lowestPrice > 0 && (
                <>
                  <span className="text-gray-500">|</span>
                  <span>
                    From{" "}
                    <span className="text-xl font-bold text-white">
                      ${lowestPrice}
                    </span>
                    /tire
                  </span>
                </>
              )}
              <span className="text-gray-500">|</span>
              <span className="text-green-400">Free Shipping</span>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-12">
          <div className="rounded-xl bg-white border border-gray-200 p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900">
              {brand.name} Tires Shipped Free to {city.name} — Find {brand.name} Near Me
            </h2>
            <p className="mt-4 text-gray-600 leading-relaxed">
              Looking for {brand.name} tires near me in {city.name}, {state.abbreviation}?
              Ship.Tires ships the full {brand.name} lineup — {models.length} models across{" "}
              {brand.tireCount} sizes — directly to {city.name} with free shipping on every order.
              {city.name} drivers face {climate}, and {brand.name} tires are engineered to
              handle exactly these conditions. Every tire ships free to your door or any
              installer near {city.name}.
            </p>
          </div>

          {/* Find Installer CTA */}
          <div className="rounded-xl bg-blue/5 border border-blue/20 p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-gray-900">Ship to a Local Installer</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Find rated tire installers near {city.name} and ship your {brand.name} tires directly to them.
                </p>
              </div>
              <Link
                href="/installers"
                className="rounded-lg bg-blue px-5 py-2.5 text-sm font-bold text-white hover:bg-blue/90 transition-colors whitespace-nowrap"
              >
                Find Installers
              </Link>
            </div>
          </div>

          {/* Models Overview */}
          {models.length > 0 ? (
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {brand.name} Tire Lineup
              </h2>
              <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {models.map((model) => (
                  <Link
                    key={model.slug}
                    href={`/tires/${brandSlug}/${model.slug}`}
                    className="rounded-xl bg-white border border-gray-200 overflow-hidden shadow-sm hover:shadow-md hover:border-blue transition-all group"
                  >
                    <div className="relative bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-4 h-44">
                      {model.image ? (
                        <Image
                          src={model.image}
                          alt={`${brand.name} ${model.name}`}
                          width={160}
                          height={160}
                          className="h-36 w-36 object-contain group-hover:scale-105 transition-transform"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gray-100">
                          <svg className="h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-4.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Z" />
                          </svg>
                        </div>
                      )}
                      <span className="absolute top-2 right-2 rounded bg-white/90 border border-gray-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gray-600">
                        {getTypeLabel(model.type)}
                      </span>
                    </div>
                    <div className="p-4 border-t border-gray-100">
                      <p className="text-[10px] font-mono uppercase tracking-wider text-gray-400 mb-0.5">{brand.name}</p>
                      <h3 className="font-bold text-gray-900 group-hover:text-blue transition-colors">
                        {model.name}
                      </h3>
                      <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                        <span>{model.sizes.length > 0 ? `${model.sizes.length} sizes` : "Sizes available"}</span>
                        {model.priceRange[0] > 0 ? (
                          <span className="font-bold text-gray-900">
                            From ${model.priceRange[0]}
                          </span>
                        ) : (
                          <span className="text-orange font-medium">Call for Price</span>
                        )}
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-bold text-green-700">Free Ship</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-xl bg-white border border-gray-200 p-8 shadow-sm text-center">
              <h2 className="text-2xl font-bold text-gray-900">Catalog Loading</h2>
              <p className="mt-2 text-gray-600">
                {brand.name} tire data is being synced. Check back soon or contact us for availability.
              </p>
            </div>
          )}

          {/* Other brands in this city */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Other Brands in {city.name}
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {otherBrands.map((b) => (
                <Link
                  key={b.slug}
                  href={`/locations/${stateSlug}/${citySlug}/${b.slug}`}
                  className="rounded-full bg-white border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-blue hover:text-white hover:border-blue transition-colors"
                >
                  {b.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-xl bg-orange p-8 text-center text-white">
            <h2 className="text-2xl font-bold">
              Ship {brand.name} Tires to {city.name} — Free
            </h2>
            <p className="mt-2 text-white/90">
              Free shipping on every {brand.name} tire. Shipped to your door or installer near {city.name}.
            </p>
            <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href={`/tires/${brandSlug}`}
                className="rounded-lg bg-white px-6 py-3 text-sm font-bold text-orange hover:bg-gray-50 transition-colors"
              >
                View All {brand.name} Tires
              </Link>
              <a
                href="tel:+12792388473"
                className="rounded-lg border-2 border-white px-6 py-3 text-sm font-bold text-white hover:bg-white/10 transition-colors"
              >
                Call/Text (279) 238-8473 (TIRE)
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
