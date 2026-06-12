"use client";

import { useState } from "react";
import TireCard from "./TireCard";
import type { TireModel } from "@/lib/types";

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

export default function BrandModelGrid({
  models,
  brandSlug,
  brandName,
  brandLogo,
}: {
  models: TireModel[];
  brandSlug: string;
  brandName: string;
  brandLogo: string;
}) {
  const [activeType, setActiveType] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Get unique types from models
  const types = [...new Set(models.map((m) => m.type))].sort();

  // Filter models
  const filtered = models.filter((m) => {
    if (activeType && m.type !== activeType) return false;
    if (search && !m.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          All {brandName} Tires ({filtered.length})
        </h2>
        {/* Search input */}
        <div className="relative sm:w-72">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            placeholder={`Search ${brandName} models...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 pl-10 pr-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-safety-orange focus:outline-none focus:ring-1 focus:ring-safety-orange/30"
          />
        </div>
      </div>

      {/* Type filter tabs */}
      {types.length > 1 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveType(null)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              !activeType
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            All ({models.length})
          </button>
          {types.map((type) => {
            const count = models.filter((m) => m.type === type).length;
            return (
              <button
                key={type}
                onClick={() => setActiveType(activeType === type ? null : type)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  activeType === type
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {typeLabels[type] || type} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Horizontal card list */}
      <div className="mt-6 space-y-4">
        {filtered.map((model) => (
          <TireCard
            key={model.slug}
            model={model}
            brandSlug={brandSlug}
            brandName={brandName}
            brandLogo={brandLogo}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="mt-8 rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
          <p className="text-gray-500">No models match your filter. Try a different type or search term.</p>
        </div>
      )}
    </div>
  );
}
