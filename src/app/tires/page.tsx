import Link from "next/link";
import Image from "next/image";
import { getAllBrands, brandSummaryToBrand, getStats } from "@/lib/db";
import { getLogoUrl } from "@/lib/api-helpers";
import { getBrandLogo } from "@/lib/curated-brands";
import BrandFilter from "@/components/BrandFilter";
import type { Metadata } from "next";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Shop All Tire Brands A-Z — Ship Free Nationwide",
  description:
    "Shop 34 tire brands including Michelin, Goodyear, Bridgestone, Continental, Pirelli, BFGoodrich, Yokohama, Cooper, Toyo & more. Find tires for Honda, Toyota, Ford, Chevrolet, BMW & all vehicles. Free shipping to Los Angeles, New York, Houston, Chicago & nationwide.",
  alternates: { canonical: "https://ship.tires/tires" },
};

export default async function TiresPage() {
  const brandRows = await getAllBrands();
  const brands = brandRows.map(brandSummaryToBrand);
  const stats = await getStats();

  // Priority brands in explicit order
  const priorityOrder = [
    "MICHELIN", "GOODYEAR", "BRIDGESTONE", "CONTINENTAL", "PIRELLI",
    "COOPER", "YOKOHAMA", "TOYO", "FIRESTONE", "BFGOODRICH",
    "FALKEN", "GENERAL", "KUMHO", "NEXEN", "NITTO",
    "DUNLOP", "NOKIAN", "UNIROYAL", "KELLY",
  ];
  const priorityRank = new Map(priorityOrder.map((n, i) => [n, i + 1]));

  // Top 12 brands: priority first, then by tire count
  const topBrands = [...brands]
    .sort((a, b) => {
      const aR = priorityRank.get(a.name.toUpperCase()) ?? 999;
      const bR = priorityRank.get(b.name.toUpperCase()) ?? 999;
      if (aR !== bR) return aR - bR;
      return (b.tireCount ?? 0) - (a.tireCount ?? 0);
    })
    .slice(0, 12);

  // Serialize brands for the client filter component
  const brandItems = brands.map((b) => ({
    name: b.name,
    slug: b.slug,
    logoUrl: b.logoUrl || null,
    modelCount: b.modelCount ?? 0,
    tireCount: b.tireCount ?? 0,
  }));

  return (
    <div className="bg-gray-50">
      {/* Header */}
      <div className="bg-navy py-12 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold sm:text-4xl">
            Shop Hundreds of Tire Brands — Ship Free
          </h1>
          <p className="mt-3 text-lg text-gray-300">
            Hundreds of top brands &middot; Thousands of tires &middot; Ship free on
            every order &middot; Tires for Honda, Toyota, Ford, BMW & all vehicles
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/search"
              className="inline-flex items-center gap-2 rounded-lg bg-orange px-4 py-2 text-sm font-bold text-white hover:bg-orange-light transition-colors"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                />
              </svg>
              Search by Size, Season & More
            </Link>
            <Link
              href="/vehicle-lookup"
              className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-4 py-2 text-sm font-bold text-white hover:bg-white/10 transition-colors"
            >
              Find Tires by Vehicle
            </Link>
          </div>
        </div>
      </div>

      {/* Top Brands */}
      <div>
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900">Shop Top Tire Brands</h2>
          <p className="mt-1 text-sm text-gray-500">
            Shop the most popular tire brands — ship free nationwide
          </p>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {topBrands.map((brand) => {
              const logo = brand.logoUrl || getBrandLogo(brand.name) || getLogoUrl(brand.domain);
              return (
                <Link
                  key={brand.slug}
                  href={`/tires/${brand.slug}`}
                  className="group flex flex-col items-center rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:border-safety-orange text-center"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gray-50 mb-3">
                    <Image
                      src={logo}
                      alt={brand.name}
                      width={64}
                      height={64}
                      className="h-12 w-12 object-contain"
                    />
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 group-hover:text-safety-orange transition-colors">
                    {brand.name}
                  </h3>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {brand.modelCount ?? 0} models
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* All Brands with filter */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-gray-900">Shop All {brands.length} Brands A-Z</h2>
        <p className="mt-1 mb-4 text-sm text-gray-500">
          Shop all {brands.length} tire brands. Find tires for Honda, Toyota, Ford, Chevrolet, BMW & every vehicle. Ship free.
        </p>
        <BrandFilter brands={brandItems} />
      </div>
    </div>
  );
}
