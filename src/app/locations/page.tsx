import Link from "next/link";
import { states } from "@/data/locations";
import { brands } from "@/data/brands";
import type { Metadata } from "next";
import { toLocationSlug } from "@/lib/location-seo";

export const metadata: Metadata = {
  title: "Shop Tires by Location — Ship Free to 1,000+ Cities Nationwide",
  description:
    "Shop tires online and ship free to 1,000+ cities across all 50 states. 34 brands including Michelin, Goodyear, Bridgestone, Continental, Pirelli. Tires for Honda, Toyota, Ford, BMW & all vehicles. Ship to your door or local installer.",
  alternates: { canonical: "https://ship.tires/locations" },
};

export default function LocationsIndex() {
  const totalCities = states.reduce((sum, s) => sum + s.cities.length, 0);

  return (
    <div className="bg-gray-50">
      <div className="bg-navy py-12 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold sm:text-4xl">
            Shop & Ship Car, Truck & SUV Tires — Free Delivery Nationwide
          </h1>
          <p className="mt-3 text-lg text-gray-300">
            Free tire shipping to {totalCities.toLocaleString()}+ cities across
            all 50 states. {brands.length} brands. 800+ sizes.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-12">
        <div className="rounded-xl bg-white border border-gray-200 p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900">
            Browse Tires by State
          </h2>
          <p className="mt-2 text-gray-600">
            Select your state to find tires shipped free to your city. Every
            order includes free delivery to your home or local installer.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {states.map((state) => (
            <Link
              key={state.slug}
              href={`/locations/${state.slug}`}
              className="rounded-lg bg-white border border-gray-200 p-4 shadow-sm hover:shadow-md hover:border-blue transition-all"
            >
              <h3 className="font-bold text-gray-900 text-sm">
                {state.name}
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                {state.cities.length} cities · {state.abbreviation}
              </p>
            </Link>
          ))}
        </div>

        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Top Tire Brands We Ship
          </h2>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-5">
            {brands.map((brand) => (
              <Link
                key={brand.slug}
                href={`/tires/${brand.slug}`}
                className="rounded-lg bg-white border border-gray-200 p-4 text-center shadow-sm hover:shadow-md hover:border-blue transition-all"
              >
                <h3 className="font-bold text-gray-900 text-sm">
                  {brand.name}
                </h3>
                <p className="mt-1 text-xs text-gray-500">
                  {brand.models.length} models
                </p>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-orange p-8 text-center text-white">
          <h2 className="text-2xl font-bold">
            Need Help Finding the Right Tires?
          </h2>
          <p className="mt-2 text-white/90">
            Free shipping. Expert advice. Every major brand.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/tires"
              className="rounded-lg bg-white px-6 py-3 text-sm font-bold text-orange hover:bg-gray-50 transition-colors"
            >
              Browse All Tires
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
