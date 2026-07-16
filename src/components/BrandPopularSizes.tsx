"use client";

import { useState } from "react";
import Link from "next/link";

interface PopularSize {
  width: string;
  aspect_ratio: string;
  rim_size: string;
  count: number;
}

interface BrandPopularSizesProps {
  sizes: PopularSize[];
  brandSlug: string;
  brandName: string;
}

export default function BrandPopularSizes({ sizes, brandSlug, brandName }: BrandPopularSizesProps) {
  // Group by rim size
  const rimGroups = new Map<string, PopularSize[]>();
  for (const s of sizes) {
    const rim = s.rim_size;
    if (!rimGroups.has(rim)) rimGroups.set(rim, []);
    rimGroups.get(rim)!.push(s);
  }
  const rimSizes = [...rimGroups.keys()].sort((a, b) => parseInt(a) - parseInt(b));
  const [activeRim, setActiveRim] = useState<string | null>(null);

  const displayed = activeRim ? (rimGroups.get(activeRim) ?? []) : sizes.slice(0, 18);
  const totalForRim = activeRim ? rimGroups.get(activeRim)!.length : sizes.length;

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900">Popular {brandName} Sizes</h2>
      <p className="mt-1 text-sm text-gray-500">
        {sizes.length} sizes available — tap a wheel size to filter
      </p>

      {/* Wheel size tabs */}
      {rimSizes.length > 1 && (
        <div className="mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setActiveRim(null)}
            className={`flex-shrink-0 rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
              !activeRim
                ? "bg-navy text-white shadow-lg shadow-navy/25"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            All
          </button>
          {rimSizes.map((rim) => (
            <button
              key={rim}
              onClick={() => setActiveRim(activeRim === rim ? null : rim)}
              className={`flex-shrink-0 rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
                activeRim === rim
                  ? "bg-navy text-white shadow-lg shadow-navy/25"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {rim}&quot;
              <span className={`ml-1 text-xs ${activeRim === rim ? "text-white/70" : "text-gray-400"}`}>
                {rimGroups.get(rim)!.length}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Size grid */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {displayed.map((s) => {
          const display = `${s.width}/${s.aspect_ratio}R${s.rim_size}`;
          return (
            <Link
              key={display}
              href={`/tires/${brandSlug}/size/${s.width}-${s.aspect_ratio}r${s.rim_size}`.toLowerCase()}
              className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 hover:border-safety-orange/40 hover:shadow-md transition-all"
            >
              <span className="font-mono text-sm font-bold text-gray-900">{display}</span>
              <span className="text-xs text-gray-400">{s.count} tires</span>
            </Link>
          );
        })}
      </div>

      {/* Show count info when filtered */}
      {!activeRim && sizes.length > 18 && (
        <p className="mt-3 text-center text-xs text-gray-400">
          Showing 18 of {sizes.length} — use wheel size tabs above to see all
        </p>
      )}
      {activeRim && totalForRim > 0 && (
        <p className="mt-3 text-center text-xs text-gray-400">
          {totalForRim} size{totalForRim !== 1 ? "s" : ""} for {activeRim}&quot; wheels
        </p>
      )}
    </div>
  );
}
