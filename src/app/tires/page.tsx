import Link from "next/link";
import Image from "next/image";
import { getAllBrands, brandSummaryToBrand } from "@/lib/db";
import { getLogoUrl } from "@/lib/api-helpers";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "All Tire Brands A-Z",
  description:
    "Browse 600+ tire brands including Michelin, Goodyear, Bridgestone, Continental, Pirelli and more. Free shipping nationwide on all orders.",
  alternates: { canonical: "https://ship.tires/tires" },
};

export default function TiresPage() {
  const brandRows = getAllBrands();
  const brands = brandRows.map(brandSummaryToBrand);

  return (
    <div className="bg-gray-50">
      {/* Header */}
      <div className="bg-navy py-12 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold sm:text-4xl">Shop & Ship Car, Truck & SUV Tires — Free Delivery</h1>
          <p className="mt-3 text-lg text-gray-300">
            Browse {brands.length} tire brands — all available with free shipping nationwide.
          </p>
        </div>
      </div>

      {/* Brand Grid */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {brands.map((brand) => {
            const logoSrc = brand.logoUrl || getLogoUrl(brand.domain);
            return (
              <Link
                key={brand.slug}
                href={`/tires/${brand.slug}`}
                className="group flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-blue"
              >
                <div className="flex-shrink-0">
                  <Image
                    src={logoSrc}
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
                    {brand.modelCount} models &middot; {brand.tireCount} tires
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
