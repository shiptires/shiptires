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
          Shop All {brandName} Models ({filtered.length}) — Ship Free
        </h2>
        {/* Search input */}
        <input
          type="text"
          placeholder={`Search ${brandName} models...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue focus:outline-none sm:w-64"
        />
      </div>

      {/* Type filter tabs */}
      {types.length > 1 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium uppercase text-gray-500 mr-1">Type:</span>
          <button
            onClick={() => setActiveType(null)}
            className={`rounded-full px-3 py-1 text-xs font-bold transition-colors ${
              !activeType
                ? "bg-navy text-white"
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
                className={`rounded-full px-3 py-1 text-xs font-bold transition-colors ${
                  activeType === type
                    ? "bg-navy text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {typeLabels[type] || type} ({count})
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
        <div className="mt-8 text-center text-gray-500">
          No models match your filter. Try a different type or search term.
        </div>
      )}
    </div>
  );
}
