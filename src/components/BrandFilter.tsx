"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

interface BrandItem {
  name: string;
  slug: string;
  logoUrl: string | null;
  modelCount: number;
  tireCount: number;
}

export default function BrandFilter({ brands }: { brands: BrandItem[] }) {
  const [query, setQuery] = useState("");
  const [activeLetter, setActiveLetter] = useState<string | null>(null);

  const filtered = brands.filter((b) => {
    const matchesQuery = !query || b.name.toLowerCase().includes(query.toLowerCase());
    const matchesLetter = !activeLetter || b.name[0].toUpperCase() === activeLetter;
    return matchesQuery && matchesLetter;
  });

  // Group by first letter
  const grouped = new Map<string, BrandItem[]>();
  for (const b of filtered) {
    const letter = b.name[0]?.toUpperCase() || "#";
    if (!grouped.has(letter)) grouped.set(letter, []);
    grouped.get(letter)!.push(b);
  }

  // All letters that exist in full brand list
  const allLetters = [...new Set(brands.map((b) => b.name[0]?.toUpperCase() || "#"))].sort();

  return (
    <div>
      {/* Search + Letter filter */}
      <div className="sticky top-0 z-10 bg-gray-50 pb-4 pt-1">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
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
            <input
              type="text"
              placeholder="Search brands..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveLetter(null);
              }}
              className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue focus:outline-none focus:ring-1 focus:ring-blue"
            />
          </div>
          <span className="text-sm text-gray-500">{filtered.length} brands</span>
        </div>

        {/* Letter bar */}
        <div className="mt-3 flex flex-wrap gap-1">
          <button
            onClick={() => setActiveLetter(null)}
            className={`rounded px-2 py-1 text-xs font-bold transition-colors ${
              !activeLetter
                ? "bg-navy text-white"
                : "bg-gray-200 text-gray-600 hover:bg-gray-300"
            }`}
          >
            All
          </button>
          {allLetters.map((letter) => (
            <button
              key={letter}
              onClick={() => setActiveLetter(activeLetter === letter ? null : letter)}
              className={`rounded px-2 py-1 text-xs font-bold transition-colors ${
                activeLetter === letter
                  ? "bg-navy text-white"
                  : "bg-gray-200 text-gray-600 hover:bg-gray-300"
              }`}
            >
              {letter}
            </button>
          ))}
        </div>
      </div>

      {/* Grouped brands */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
          <p className="text-lg font-bold text-gray-900">No brands found</p>
          <p className="mt-1 text-sm text-gray-500">
            Try a different search term or{" "}
            <button onClick={() => { setQuery(""); setActiveLetter(null); }} className="text-blue hover:underline">
              clear filters
            </button>
          </p>
        </div>
      ) : (
        [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([letter, items]) => (
          <div key={letter} className="mb-6" id={`letter-${letter}`}>
            <h3 className="mb-3 border-b border-gray-200 pb-1 text-lg font-black text-gray-900">
              {letter}
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map((brand) => (
                <Link
                  key={brand.slug}
                  href={`/tires/${brand.slug}`}
                  className="group flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-all hover:shadow-md hover:border-blue"
                >
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gray-50">
                    {brand.logoUrl ? (
                      <Image
                        src={brand.logoUrl}
                        alt={brand.name}
                        width={40}
                        height={40}
                        className="h-8 w-8 object-contain"
                      />
                    ) : (
                      <span className="text-sm font-black text-gray-400">
                        {brand.name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="truncate text-sm font-bold text-gray-900 group-hover:text-blue transition-colors">
                      {brand.name}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {brand.modelCount > 0 && brand.tireCount > 0
                        ? `${brand.modelCount} models · ${brand.tireCount.toLocaleString()} tires`
                        : brand.modelCount > 0
                        ? `${brand.modelCount} models`
                        : brand.tireCount > 0
                        ? `${brand.tireCount.toLocaleString()} tires`
                        : "Browse tires →"}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
