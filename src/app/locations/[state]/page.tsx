import { notFound } from "next/navigation";
import Link from "next/link";
import { states } from "@/data/locations";
import { brands } from "@/data/brands";
import { toLocationSlug, getStateClimate } from "@/lib/location-seo";
import type { Metadata } from "next";

export async function generateStaticParams() {
  return states.map((s) => ({ state: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ state: string }>;
}): Promise<Metadata> {
  const { state: stateSlug } = await params;
  const state = states.find((s) => s.slug === stateSlug);
  if (!state) return {};
  return {
    title: `Buy Tires in ${state.name} — Free Shipping to ${state.cities.length}+ Cities`,
    description: `Shop tires online with free shipping to ${state.cities.length}+ cities in ${state.name}. ${brands.length} brands including Michelin, Goodyear, Bridgestone. Delivered to your door or local ${state.abbreviation} installer.`,
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
            {state.name}. {brands.length} brands, 800+ sizes.
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
            {brands.length}+ tire brands with models for every vehicle and
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
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-5">
            {brands.map((brand) => (
              <div
                key={brand.slug}
                className="rounded-lg bg-white border border-gray-200 p-4 text-center shadow-sm"
              >
                <h3 className="font-bold text-gray-900 text-sm">
                  {brand.name}
                </h3>
                <p className="mt-1 text-xs text-gray-500">
                  {brand.models.length} models ·{" "}
                  {brand.models.reduce((s, m) => s + m.sizes.length, 0)} sizes
                </p>
              </div>
            ))}
          </div>
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
