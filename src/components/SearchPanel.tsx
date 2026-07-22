"use client";

import { useState } from "react";
import Link from "next/link";
import VehicleLookup from "@/components/VehicleLookup";
import SizeSearch from "@/components/SizeSearch";
import BrandModelDropdown from "@/components/BrandModelDropdown";
import { brands as curatedBrands } from "@/data/brands";

const topBrandSlugs = [
  "michelin", "goodyear", "bridgestone", "continental", "pirelli",
  "cooper", "yokohama", "toyo", "firestone",
  "bfgoodrich", "falken", "radar", "nitto", "kumho", "nexen",
];

function BrandPicker() {
  const brandData = topBrandSlugs
    .map((slug) => curatedBrands.find((b) => b.slug === slug))
    .filter(Boolean) as typeof curatedBrands;

  return (
    <div className="grid grid-cols-2 gap-2">
      {brandData.map((brand) => (
        <BrandModelDropdown
          key={brand.slug}
          brandName={brand.name}
          brandSlug={brand.slug}
          models={brand.models.map((m) => ({
            name: m.name,
            slug: m.slug,
            sizeCount: m.sizes.length,
          }))}
        />
      ))}
    </div>
  );
}

export default function SearchPanel() {
  const [tab, setTab] = useState<"vehicle" | "size" | "brand">("vehicle");

  return (
    <div className="rounded-lg bg-white border-2 border-dashed border-ink-grey/30 p-3 sm:p-5">
      <div className="mb-1 text-[10px] font-display uppercase tracking-[0.2em] text-ink-grey">
        Contents Lookup
      </div>
      <div className="mb-5">
        <div className="flex rounded-md border border-ink-grey/20 p-0.5">
          <button
            type="button"
            onClick={() => setTab("vehicle")}
            className={`flex-1 rounded-[5px] py-2 text-center text-xs sm:text-sm font-bold transition-all ${
              tab === "vehicle"
                ? "bg-rubber text-label-white"
                : "text-ink-grey hover:text-rubber"
            }`}
          >
            By Vehicle
          </button>
          <button
            type="button"
            onClick={() => setTab("brand")}
            className={`flex-1 rounded-[5px] py-2 text-center text-xs sm:text-sm font-bold transition-all ${
              tab === "brand"
                ? "bg-rubber text-label-white"
                : "text-ink-grey hover:text-rubber"
            }`}
          >
            By Brand
          </button>
          <button
            type="button"
            onClick={() => setTab("size")}
            className={`flex-1 rounded-[5px] py-2 text-center text-xs sm:text-sm font-bold transition-all ${
              tab === "size"
                ? "bg-rubber text-label-white"
                : "text-ink-grey hover:text-rubber"
            }`}
          >
            By Size
          </button>
        </div>
      </div>
      {tab === "vehicle" ? <VehicleLookup /> : tab === "brand" ? <BrandPicker /> : <SizeSearch />}
    </div>
  );
}
