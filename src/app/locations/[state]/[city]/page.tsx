import { notFound } from "next/navigation";
import Link from "next/link";
import { states } from "@/data/locations";
import { brands } from "@/data/brands";
import {
  toLocationSlug,
  findState,
  findCity,
  getStateClimate,
  getBrandUniqueSizes,
} from "@/lib/location-seo";
import type { Metadata } from "next";

export const dynamicParams = true;

export async function generateStaticParams() {
  const params: { state: string; city: string }[] = [];
  for (const state of states) {
    for (const city of state.cities) {
      params.push({ state: state.slug, city: toLocationSlug(city.slug) });
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ state: string; city: string }>;
}): Promise<Metadata> {
  const { state: stateSlug, city: citySlug } = await params;
  const state = findState(stateSlug);
  const city = state ? findCity(state, citySlug) : undefined;
  if (!state || !city) return {};

  return {
    title: `Tires Near Me in ${city.name}, ${state.abbreviation} — ${brands.length} Brands Shipped Free`,
    description: `Find tires near me in ${city.name}, ${state.abbreviation}. ${brands.length} brands shipped free to your door. Michelin, Goodyear, Bridgestone & more — 800+ sizes. Free shipping on every order. Shop tires near ${city.name} today.`,
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

  return (
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
            Tires Near Me in {city.name}, {state.abbreviation} — Shipped Free
          </h1>
          <p className="mt-3 text-lg text-gray-300">
            {brands.length} brands · 800+ sizes · Free shipping to{" "}
            {city.name} · Ship to your door or installer
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
            Choose from {brands.length}+ brands including Michelin, Goodyear, Bridgestone,
            Continental, and more. Every tire is shipped free to your {city.name} address
            or to any local tire installer near you. No hidden fees — just tires shipped
            directly to your door with free delivery.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Shop Tire Brands Near Me in {city.name}
          </h2>
          <p className="mt-2 text-gray-600">
            Select a tire brand to see all available sizes shipped free to{" "}
            {city.name}. Every brand ships with free shipping to your door.
          </p>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {brands.map((brand) => {
              const uniqueSizes = getBrandUniqueSizes(brand);
              const priceMin = Math.min(
                ...brand.models.map((m) => m.priceRange[0])
              );
              return (
                <Link
                  key={brand.slug}
                  href={`/locations/${stateSlug}/${citySlug}/${brand.slug}`}
                  className="rounded-xl bg-white border border-gray-200 p-5 shadow-sm hover:shadow-md hover:border-blue transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-900 group-hover:text-blue transition-colors">
                      {brand.name}
                    </h3>
                    <span className="text-xs text-gray-400">
                      {brand.country}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                    {brand.description.slice(0, 120)}...
                  </p>
                  <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                    <span>{brand.models.length} models</span>
                    <span>{uniqueSizes.length} sizes</span>
                    <span className="font-bold text-gray-900">
                      from ${priceMin}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
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
              href="tel:+19164767689"
              className="rounded-lg border-2 border-white px-6 py-3 text-sm font-bold text-white hover:bg-white/10 transition-colors"
            >
              Call (916) 476-7689
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
