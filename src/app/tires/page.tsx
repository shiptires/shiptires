import Link from "next/link";
import Image from "next/image";
import { brands } from "@/data/brands";
import { getLogoUrl } from "@/lib/api-helpers";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "All Tire Brands A-Z",
  description:
    "Browse 20+ top tire brands including Michelin, Goodyear, Bridgestone, Continental, Pirelli and more. Free shipping nationwide on all orders.",
};

export default function TiresPage() {
  const sortedBrands = [...brands].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="bg-gray-50">
      {/* Header */}
      <div className="bg-navy py-12 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold sm:text-4xl">All Tire Brands</h1>
          <p className="mt-3 text-lg text-gray-300">
            Browse {brands.length} top tire brands — all available with free shipping nationwide.
          </p>
        </div>
      </div>

      {/* Brand Grid */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {sortedBrands.map((brand) => (
            <Link
              key={brand.slug}
              href={`/tires/${brand.slug}`}
              className="group flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-blue"
            >
              <div className="flex-shrink-0">
                <Image
                  src={getLogoUrl(brand.domain)}
                  alt={brand.name}
                  width={60}
                  height={60}
                  className="h-12 w-12 object-contain"
                  unoptimized
                />
              </div>
              <div className="min-w-0">
                <h2 className="font-semibold text-gray-900 group-hover:text-blue transition-colors">
                  {brand.name}
                </h2>
                <p className="mt-0.5 text-xs text-gray-500">
                  {brand.country} &middot; Est. {brand.founded}
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  {brand.models.length} models available
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
