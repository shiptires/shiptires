"use client";

import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { brands } from "@/data/brands";
import TireCard from "@/components/TireCard";
import type { TireType } from "@/lib/types";
import { Suspense } from "react";

const typeLabels: Record<string, string> = {
  "all-season": "All-Season",
  winter: "Winter",
  summer: "Summer",
  performance: "Performance",
  "all-terrain": "All-Terrain",
  "mud-terrain": "Mud-Terrain",
  highway: "Highway",
  touring: "Touring",
};

const allTypes: TireType[] = [
  "all-season", "winter", "summer", "performance",
  "all-terrain", "mud-terrain", "highway", "touring",
];

function SearchContent() {
  const searchParams = useSearchParams();
  const initialType = searchParams.get("type") || "";
  const initialSize = searchParams.get("size") || "";
  const initialBrand = searchParams.get("brand") || "";
  const initialQ = searchParams.get("q") || "";

  const [filterType, setFilterType] = useState(initialType);
  const [filterBrand, setFilterBrand] = useState(initialBrand);
  const [filterSize, setFilterSize] = useState(initialSize);
  const [query, setQuery] = useState(initialQ);

  const results = useMemo(() => {
    const items: { brandSlug: string; brandName: string; model: (typeof brands)[0]["models"][0] }[] = [];

    for (const brand of brands) {
      if (filterBrand && brand.slug !== filterBrand) continue;

      for (const model of brand.models) {
        if (filterType && model.type !== filterType) continue;
        if (filterSize && !model.sizes.some((s) => s.size === filterSize.toUpperCase())) continue;
        if (query) {
          const q = query.toLowerCase();
          const match =
            model.name.toLowerCase().includes(q) ||
            brand.name.toLowerCase().includes(q) ||
            model.type.includes(q) ||
            model.features.some((f) => f.toLowerCase().includes(q));
          if (!match) continue;
        }

        items.push({ brandSlug: brand.slug, brandName: brand.name, model });
      }
    }

    return items;
  }, [filterType, filterBrand, filterSize, query]);

  return (
    <div className="bg-navy min-h-screen">
      <div className="bg-navy-dark py-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 racing-grid" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-orange mb-2">Tire Catalog</p>
          <h1 className="text-2xl font-black sm:text-3xl">Search Tires</h1>
          <p className="mt-1 text-gray-400">{results.length} tires found</p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="rounded-xl bg-navy-light border border-white/10 p-5 shadow-sm space-y-5">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-2">Search</label>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Tire name, brand..."
                  className="w-full rounded-lg border border-white/10 bg-navy px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-orange/50 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-2">Brand</label>
                <select
                  value={filterBrand}
                  onChange={(e) => setFilterBrand(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-navy px-3 py-2 text-sm text-white focus:border-orange/50 focus:outline-none"
                >
                  <option value="">All Brands</option>
                  {brands.map((b) => (
                    <option key={b.slug} value={b.slug}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-2">Type</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-navy px-3 py-2 text-sm text-white focus:border-orange/50 focus:outline-none"
                >
                  <option value="">All Types</option>
                  {allTypes.map((t) => (
                    <option key={t} value={t}>{typeLabels[t]}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-2">Tire Size</label>
                <input
                  type="text"
                  value={filterSize}
                  onChange={(e) => setFilterSize(e.target.value)}
                  placeholder="e.g. 225/65R17"
                  className="w-full rounded-lg border border-white/10 bg-navy px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-orange/50 focus:outline-none"
                />
              </div>

              <button
                onClick={() => {
                  setFilterType("");
                  setFilterBrand("");
                  setFilterSize("");
                  setQuery("");
                }}
                className="w-full rounded-lg border border-orange/30 bg-orange/10 px-3 py-2 text-sm font-bold text-orange hover:bg-orange/20 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-3">
            {results.length === 0 ? (
              <div className="rounded-xl bg-navy-light border border-white/10 p-12 text-center">
                <p className="text-lg font-bold text-white">No tires found</p>
                <p className="mt-2 text-sm text-gray-500">
                  Try adjusting your filters or{" "}
                  <a href="tel:+19164767689" className="text-orange hover:underline">call us</a> for help.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {results.map(({ brandSlug, model }) => (
                  <TireCard key={`${brandSlug}-${model.slug}`} model={model} brandSlug={brandSlug} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-navy" />}>
      <SearchContent />
    </Suspense>
  );
}
