import { notFound } from "next/navigation";
import Link from "next/link";
import { states } from "@/data/locations";
import {
  getAllBrands,
  brandSummaryToBrand,
  getStats,
} from "@/lib/db";
import {
  toLocationSlug,
  findState,
  findCity,
  getStateClimate,
} from "@/lib/location-seo";
import { buildBreadcrumbSchema } from "@/lib/breadcrumb-schema";
import type { Metadata } from "next";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ state: string; city: string }>;
}): Promise<Metadata> {
  const { state: stateSlug, city: citySlug } = await params;
  const state = findState(stateSlug);
  const city = state ? findCity(state, citySlug) : undefined;
  if (!state || !city) return {};

  const stats = await getStats();

  return {
    title: `Shop Tires in ${city.name}, ${state.abbreviation} — ${stats.brandCount} Brands, Ship Free`,
    description: `Shop tires in ${city.name}, ${state.abbreviation}. ${stats.brandCount} brands including Michelin, Goodyear, Bridgestone, Continental & Pirelli. Ship free to your door or installer. Tires for Honda, Toyota, Ford, BMW & all vehicles. ${stats.modelCount}+ models available.`,
    alternates: { canonical: `https://ship.tires/locations/${stateSlug}/${citySlug}` },
  };
}

export default async function CityLocationsPage({
  params,
}: {
  params: Promise<{ state: string; city: string }>;
}) {
  const { state: stateSlug, city: citySlug } = await params;
  const state = findState(stateSlug);
  const city = state ? findCity(state, citySlug) : undefined;
  if (!state || !city) notFound();

  const climate = getStateClimate(stateSlug);
  const brandRows = await getAllBrands();
  const brands = brandRows.map(brandSummaryToBrand);
  const stats = await getStats();

  // Priority brands in exact display order (most recognizable first)
  const priorityOrder = [
    "MICHELIN", "GOODYEAR", "BRIDGESTONE", "CONTINENTAL", "PIRELLI",
    "COOPER", "HANKOOK", "YOKOHAMA", "TOYO", "FIRESTONE",
    "BFGOODRICH", "FALKEN", "GENERAL", "KUMHO", "NEXEN",
    "NITTO", "DUNLOP", "NOKIAN", "UNIROYAL", "KELLY",
  ];
  const priorityRank = new Map(priorityOrder.map((n, i) => [n, i + 1]));

  // Top brands: priority brands first (in explicit order), then by tire count
  const topBrands = [...brands]
    .sort((a, b) => {
      const aR = priorityRank.get(a.name.toUpperCase()) ?? 999;
      const bR = priorityRank.get(b.name.toUpperCase()) ?? 999;
      if (aR !== bR) return aR - bR;
      return (b.tireCount ?? 0) - (a.tireCount ?? 0);
    })
    .slice(0, 30);

  const breadcrumb = buildBreadcrumbSchema([
    { name: "Home", url: "https://ship.tires" },
    { name: "Locations", url: "https://ship.tires/locations" },
    { name: state.name, url: `https://ship.tires/locations/${stateSlug}` },
    { name: city.name, url: `https://ship.tires/locations/${stateSlug}/${citySlug}` },
  ]);

  const schemaData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Tires Near Me in ${city.name}, ${state.abbreviation}`,
    description: `Shop ${stats.brandCount} tire brands with free shipping to ${city.name}, ${state.abbreviation}`,
    url: `https://ship.tires/locations/${stateSlug}/${citySlug}`,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: brands.length,
      itemListElement: topBrands.slice(0, 10).map((brand, idx) => ({
        "@type": "ListItem",
        position: idx + 1,
        name: brand.name,
        url: `https://ship.tires/tires/${brand.slug}`,
      })),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />

      <div className="bg-gray-50">
        <div className="bg-navy py-12 text-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 text-sm text-gray-400">
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
              <span className="text-gray-300">{city.name}</span>
            </div>
            <h1 className="mt-4 text-3xl font-bold sm:text-4xl">
              Shop & Ship Car, Truck & SUV Tires to {city.name}, {state.abbreviation} — Free Delivery
            </h1>
            <p className="mt-3 text-lg text-gray-300">
              {stats.brandCount} brands · {stats.modelCount}+ models · {stats.tireCount.toLocaleString()}+ tires · Free shipping to{" "}
              {city.name}
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-12">
          <div className="rounded-xl bg-white border border-gray-200 p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900">
              Buy Tires Near Me in {city.name}, {state.abbreviation} — Free Shipping
            </h2>
            <p className="mt-4 text-gray-600 leading-relaxed">
              Looking for tires near me in {city.name}? Ship.Tires ships every major tire brand
              directly to {city.name}, {state.name} — with free shipping on every order.
              With {climate} to navigate, having the right tires is essential for {city.name} drivers.
              Choose from {stats.brandCount}+ brands including Michelin, Goodyear, Bridgestone,
              Continental, and more. Every tire is shipped free to your {city.name} address
              or to any local tire installer near you.
            </p>
          </div>

          {/* Find Local Installers */}
          <div className="rounded-xl bg-white border border-gray-200 p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900">
              Find Tire Installers Near {city.name}
            </h2>
            <p className="mt-2 text-gray-600">
              Ship your tires directly to a local installer in the {city.name} area.
              Enter your zip code to find rated tire shops near you.
            </p>
            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <Link
                href="/installers"
                className="inline-flex items-center justify-center rounded-lg bg-blue px-6 py-3 text-sm font-bold text-white hover:bg-blue/90 transition-colors"
              >
                Find Installers by Zip Code
              </Link>
              <Link
                href={`/tires`}
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-6 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Browse All {stats.brandCount} Brands
              </Link>
            </div>
          </div>

          {/* Popular Brands */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Popular Tire Brands in {city.name}
            </h2>
            <p className="mt-2 text-gray-600">
              Select a tire brand to see all available models and sizes shipped free to{" "}
              {city.name}.
            </p>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {topBrands.map((brand) => (
                <Link
                  key={brand.slug}
                  href={`/tires/${brand.slug}`}
                  className="rounded-xl bg-white border border-gray-200 p-5 shadow-sm hover:shadow-md hover:border-blue transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-900 group-hover:text-blue transition-colors">
                      {brand.name}
                    </h3>
                    {brand.logoUrl && (
                      <img
                        src={brand.logoUrl}
                        alt={brand.name}
                        className="h-6 w-auto object-contain"
                        loading="lazy"
                      />
                    )}
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                    <span>{brand.modelCount ?? 0} models</span>
                    <span>{brand.tireCount ?? 0} tires</span>
                    <span className="text-green-600 font-medium">Free Shipping</span>
                  </div>
                </Link>
              ))}
            </div>

            {/* Show all brands link if there are more */}
            {brands.length > 30 && (
              <div className="mt-6 text-center">
                <Link
                  href="/tires"
                  className="text-blue hover:underline font-medium"
                >
                  View all {brands.length} brands →
                </Link>
              </div>
            )}
          </div>

          {/* Other cities in same state */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Also Serving in {state.name}
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {state.cities
                .filter((c) => c.slug !== city.slug)
                .sort((a, b) => b.population - a.population)
                .slice(0, 20)
                .map((c) => (
                  <Link
                    key={c.slug}
                    href={`/locations/${stateSlug}/${toLocationSlug(c.slug)}`}
                    className="rounded-full bg-white border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-blue hover:text-white hover:border-blue transition-colors"
                  >
                    {c.name}
                  </Link>
                ))}
            </div>
          </div>

          {/* Popular Tire Sizes */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Popular Tire Sizes in {city.name}
            </h2>
            <p className="mt-1 text-sm text-gray-500">Shop these popular sizes and ship free to {city.name}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {["225-65r17","265-70r16","205-55r16","235-45r18","275-55r20","195-65r15","245-40r19","215-55r17","255-70r18","285-45r22","245-65r17","275-60r20","215-55r16","235-55r18","225-50r17","245-45r18"].map((s) => {
                const d = s.replace(/^(\d+)-(\d+)r(.+)$/i, "$1/$2R$3");
                return (
                  <Link key={s} href={`/locations/${stateSlug}/${citySlug}/size/${s}`} className="rounded-full bg-white border border-gray-200 px-4 py-2 text-sm font-mono text-gray-700 hover:bg-blue hover:text-white hover:border-blue transition-colors">
                    {d}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl bg-orange p-8 text-center text-white">
            <h2 className="text-2xl font-bold">
              Ready to Ship Tires to {city.name}?
            </h2>
            <p className="mt-2 text-white/90">
              Free shipping on every order. Tires shipped fast to {city.name}. Expert help available.
            </p>
            <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/tires"
                className="rounded-lg bg-white px-6 py-3 text-sm font-bold text-orange hover:bg-gray-50 transition-colors"
              >
                Browse Tires
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
