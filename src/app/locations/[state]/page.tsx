import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { states } from "@/data/locations";
import { getAllBrands, brandSummaryToBrand, getStats } from "@/lib/db";
import { toLocationSlug, getStateClimate } from "@/lib/location-seo";
import type { Metadata } from "next";

export const revalidate = 3600;



export async function generateMetadata({
  params,
}: {
  params: Promise<{ state: string }>;
}): Promise<Metadata> {
  const { state: stateSlug } = await params;
  const state = states.find((s) => s.slug === stateSlug);
  if (!state) return {};
  const stats = await getStats();
  return {
    title: `Buy Tires in ${state.name} — Free Shipping to ${state.cities.length}+ Cities`,
    description: `Shop tires online with free shipping to ${state.cities.length}+ cities in ${state.name}. ${stats.brandCount} brands including Michelin, Goodyear, Bridgestone. Delivered to your door or local ${state.abbreviation} installer.`,
    alternates: { canonical: `https://ship.tires/locations/${stateSlug}` },
  };
}

export default async function StatePage({
  params,
}: {
  params: Promise<{ state: string }>;
}) {
  const { state: stateSlug } = await params;
  const state = states.find((s) => s.slug === stateSlug);
  if (!state) notFound();

  const climate = getStateClimate(stateSlug);
  const brandRows = await getAllBrands();
  const dbBrands = brandRows.map(brandSummaryToBrand);
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
  const topBrands = [...dbBrands]
    .sort((a, b) => {
      const aR = priorityRank.get(a.name.toUpperCase()) ?? 999;
      const bR = priorityRank.get(b.name.toUpperCase()) ?? 999;
      if (aR !== bR) return aR - bR;
      return (b.tireCount ?? 0) - (a.tireCount ?? 0);
    })
    .slice(0, 40);

  return (
    <div className="bg-gray-50">
      <div className="bg-navy py-12 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Link href="/locations" className="hover:text-white">
              Locations
            </Link>
            <span>/</span>
            <span className="text-gray-300">{state.name}</span>
          </div>
          <h1 className="mt-4 text-3xl font-bold sm:text-4xl">
            Shop & Ship Car, Truck & SUV Tires to {state.name} — Free Delivery
          </h1>
          <p className="mt-3 text-lg text-gray-300">
            Free tire shipping to {state.cities.length}+ cities across{" "}
            {state.name}. {stats.brandCount} brands, {stats.tireCount.toLocaleString()}+ tires.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-12">
        <div className="rounded-xl bg-white border border-gray-200 p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900">
            Tire Delivery in {state.name}
          </h2>
          <p className="mt-4 text-gray-600 leading-relaxed">
            Ship.Tires delivers to every city in {state.name} — free of charge.
            {state.name} drivers face {climate}, making it critical to choose
            the right tires for safety and performance. Browse our selection of{" "}
            {stats.brandCount}+ tire brands with models for every vehicle and
            driving condition. We ship directly to your home or local{" "}
            {state.abbreviation} tire installer.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Cities We Serve in {state.name}
          </h2>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {state.cities
              .sort((a, b) => b.population - a.population)
              .map((city) => (
                <Link
                  key={city.slug}
                  href={`/locations/${stateSlug}/${toLocationSlug(city.slug)}`}
                  className="rounded-lg bg-white border border-gray-200 p-3 shadow-sm hover:shadow-md hover:border-blue transition-all"
                >
                  <h3 className="font-bold text-gray-900 text-sm">
                    {city.name}
                  </h3>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {city.population >= 1000000
                      ? `${(city.population / 1000000).toFixed(1)}M`
                      : `${Math.round(city.population / 1000)}K`}{" "}
                    pop.
                  </p>
                </Link>
              ))}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Brands Available in {state.name}
          </h2>
          <p className="mt-2 text-gray-600">
            Click any brand to browse their full tire catalog. All ship free to {state.name}.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {topBrands.map((brand) => (
              <Link
                key={brand.slug}
                href={`/tires/${brand.slug}`}
                className="group rounded-lg bg-white border border-gray-200 p-4 shadow-sm hover:shadow-md hover:border-blue transition-all flex flex-col items-center text-center"
              >
                {brand.logoUrl ? (
                  <Image
                    src={brand.logoUrl}
                    alt={brand.name}
                    width={80}
                    height={60}
                    className="h-10 w-auto object-contain mb-2"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                    <span className="text-xs font-bold text-gray-500">{brand.name.charAt(0)}</span>
                  </div>
                )}
                <h3 className="font-bold text-gray-900 text-sm group-hover:text-blue transition-colors">
                  {brand.name}
                </h3>
                <p className="mt-1 text-xs text-gray-500">
                  {brand.modelCount ?? 0} models · {brand.tireCount ?? 0} tires
                </p>
              </Link>
            ))}
          </div>
          {dbBrands.length > 40 && (
            <div className="mt-4 text-center">
              <Link href="/tires" className="text-blue hover:underline font-medium text-sm">
                View all {dbBrands.length} brands →
              </Link>
            </div>
          )}
        </div>

        <div className="rounded-xl bg-orange p-8 text-center text-white">
          <h2 className="text-2xl font-bold">
            Ready to Order Tires in {state.name}?
          </h2>
          <p className="mt-2 text-white/90">
            Free shipping to any {state.abbreviation} address. Fast delivery.
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
  );
}
