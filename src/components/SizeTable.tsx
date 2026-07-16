"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { TireSize } from "@/lib/types";
import { parseUTQG } from "@/lib/utqg";
import AddToCartButton from "./AddToCartButton";
import TireImageLightbox from "./TireImageLightbox";

function sizeToSlug(size: string): string {
  // Extract just the tire size from strings that may include model names
  // e.g. "30x9.50R15LT C Dynapro AT-M RF10" → "30x9-50r15lt"
  // Standard: "255/75R17" → "255-75r17"
  const match = size.match(/^[\dPpLl][\dx.\\/]+R\d{2}(?:\.\d)?(?:LT)?/i);
  if (match) {
    return match[0].toLowerCase().replace(/\//g, "-").replace(/\./g, "-");
  }
  return size.toLowerCase().replace(/\//g, "-").replace(/\./g, "-");
}

function parseRim(sizeStr: string): string {
  const match = sizeStr.match(/R(\d+)/i);
  return match ? match[1] : "Other";
}

interface SizeTableProps {
  sizes: TireSize[];
  brand: string;
  brandSlug: string;
  modelName: string;
  modelSlug: string;
  tireImage?: string;
}

export default function SizeTable({
  sizes,
  brand,
  brandSlug,
  modelName,
  modelSlug,
  tireImage,
}: SizeTableProps) {
  // Group by rim size
  const rimGroups = new Map<string, TireSize[]>();
  for (const size of sizes) {
    const rim = parseRim(size.size);
    if (!rimGroups.has(rim)) rimGroups.set(rim, []);
    rimGroups.get(rim)!.push(size);
  }

  const rimSizes = [...rimGroups.keys()].sort((a, b) => parseInt(a) - parseInt(b));
  const [activeRim, setActiveRim] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Filter by search or rim tab, then sort prices first
  const searchTerm = search.trim().toLowerCase();
  const baseSizes = searchTerm
    ? sizes.filter((s) => s.size.toLowerCase().includes(searchTerm))
    : activeRim
      ? (rimGroups.get(activeRim) ?? [])
      : sizes;

  const displaySizes = baseSizes.slice().sort((a, b) => {
    if (a.price > 0 && b.price <= 0) return -1;
    if (a.price <= 0 && b.price > 0) return 1;
    return 0;
  });
  const hasUtqg = sizes.some((s) => parseUTQG(s.utqg) !== null);

  return (
    <div>
      {/* Size search */}
      <div className="mb-5">
        <div className="relative">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            placeholder="Search sizes (e.g. 205/50R17)..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setActiveRim(null); }}
            className="w-full rounded-xl border border-gray-300 pl-11 pr-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        {searchTerm && (
          <p className="mt-2 text-sm text-gray-500">
            {displaySizes.length} result{displaySizes.length !== 1 ? "s" : ""} for &ldquo;{search.trim()}&rdquo;
          </p>
        )}
      </div>

      {/* Wheel size tabs — big, tappable, app-like */}
      {!searchTerm && rimSizes.length > 1 && (
        <div className="mb-6">
          <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Wheel Size</div>
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
            <button
              onClick={() => setActiveRim(null)}
              className={`flex-shrink-0 rounded-xl px-5 py-3 text-sm font-bold transition-all ${
                !activeRim
                  ? "bg-navy text-white shadow-lg shadow-navy/25 scale-105"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              All
              <span className={`ml-1.5 text-xs ${!activeRim ? "text-white/70" : "text-gray-400"}`}>
                {sizes.length}
              </span>
            </button>
            {rimSizes.map((rim) => (
              <button
                key={rim}
                onClick={() => setActiveRim(activeRim === rim ? null : rim)}
                className={`flex-shrink-0 rounded-xl px-5 py-3 text-sm font-bold transition-all ${
                  activeRim === rim
                    ? "bg-navy text-white shadow-lg shadow-navy/25 scale-105"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {rim}&quot;
                <span className={`ml-1.5 text-xs ${activeRim === rim ? "text-white/70" : "text-gray-400"}`}>
                  {rimGroups.get(rim)!.length}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mobile: Card layout */}
      <div className="md:hidden space-y-3">
        {displaySizes.map((size, idx) => (
          <div
            key={`${size.size}-${size.tireId}`}
            className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-all"
            style={{ animationDelay: `${idx * 30}ms` }}
          >
            <div className="flex items-center gap-3">
              {/* Tire image */}
              <div className="flex-shrink-0">
                {(size.thumbnailUrl || tireImage) ? (
                  <TireImageLightbox
                    src={size.thumbnailUrl || tireImage!}
                    alt={`${brand} ${modelName} ${size.size}`}
                  >
                    <Image
                      src={size.thumbnailUrl || tireImage!}
                      alt={`${brand} ${modelName} ${size.size}`}
                      width={56}
                      height={56}
                      className="h-14 w-14 object-contain rounded-xl"
                    />
                  </TireImageLightbox>
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gray-100">
                    <svg className="h-7 w-7 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <circle cx="12" cy="12" r="9" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Size info + price */}
              <div className="flex-1 min-w-0">
                <Link
                  href={`/tires/${brandSlug}/${modelSlug}/${sizeToSlug(size.size)}`}
                  className="font-mono text-base font-bold text-gray-900 hover:text-safety-orange transition-colors"
                >
                  {size.size}
                </Link>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                  {size.loadIndex && <span>Load: {size.loadIndex}</span>}
                  {size.speedRating && <span>Speed: {size.speedRating}</span>}
                </div>
              </div>

              {/* Price */}
              <div className="text-right flex-shrink-0">
                {size.price > 0 ? (
                  <>
                    <div className="text-xl font-bold text-gray-900">${size.price.toFixed(2)}</div>
                    <div className="text-xs text-gray-400">/tire</div>
                  </>
                ) : (
                  <div className="text-sm font-bold text-safety-orange">Call</div>
                )}
              </div>
            </div>

            {/* Set of 4 + action */}
            <div className="mt-3 flex items-center justify-between gap-3">
              {size.price > 0 && (
                <div className="text-xs text-gray-500">
                  Set of 4: <span className="font-bold text-gray-700">${(size.price * 4).toFixed(2)}</span>
                  <span className="ml-1 text-green-600">Free shipping</span>
                </div>
              )}
              <div className="ml-auto">
                {size.price > 0 ? (
                  <AddToCartButton
                    brand={brand}
                    brandSlug={brandSlug}
                    model={modelName}
                    modelSlug={modelSlug}
                    size={size.size}
                    price={size.price}
                    loadIndex={size.loadIndex}
                    speedRating={size.speedRating}
                    image={tireImage}
                    tireId={size.tireId}
                  />
                ) : (
                  <Link
                    href={`/tires/${brandSlug}/${modelSlug}/${sizeToSlug(size.size)}`}
                    className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-200 transition-colors"
                  >
                    View
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: Table layout */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-gray-200 text-left text-xs font-bold uppercase text-gray-500">
              <th className="py-3 pr-2 w-10"></th>
              <th className="py-3 pr-4">Size</th>
              <th className="py-3 pr-4">Load</th>
              <th className="py-3 pr-4">Speed</th>
              {hasUtqg && <th className="py-3 pr-4">UTQG</th>}
              <th className="py-3 pr-4">Price</th>
              <th className="py-3 pr-4">Set of 4</th>
              <th className="py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {displaySizes.map((size) => (
              <tr key={`${size.size}-${size.tireId}`} className="hover:bg-gray-50 transition-colors">
                <td className="py-3 pr-2">
                  {(size.thumbnailUrl || tireImage) ? (
                    <TireImageLightbox
                      src={size.thumbnailUrl || tireImage!}
                      alt={`${brand} ${modelName} ${size.size}`}
                    >
                      <Image
                        src={size.thumbnailUrl || tireImage!}
                        alt={`${brand} ${modelName} ${size.size}`}
                        width={40}
                        height={40}
                        className="h-10 w-10 object-contain rounded-lg"
                      />
                    </TireImageLightbox>
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                      <svg className="h-5 w-5 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <circle cx="12" cy="12" r="9" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    </div>
                  )}
                </td>
                <td className="py-3 pr-4 font-mono font-bold text-gray-900">
                  <Link
                    href={`/tires/${brandSlug}/${modelSlug}/${sizeToSlug(size.size)}`}
                    className="text-navy hover:text-safety-orange transition-colors"
                  >
                    {size.size}
                  </Link>
                </td>
                <td className="py-3 pr-4 text-gray-600">{size.loadIndex || "—"}</td>
                <td className="py-3 pr-4 text-gray-600">{size.speedRating || "—"}</td>
                {hasUtqg && (
                  <td className="py-3 pr-4 text-gray-600 font-mono text-xs">
                    {(() => {
                      const parsed = parseUTQG(size.utqg);
                      return parsed ? `${parsed.treadwear} / ${parsed.traction} / ${parsed.temperature}` : "—";
                    })()}
                  </td>
                )}
                <td className="py-3 pr-4 text-lg font-bold text-gray-900">
                  {size.price > 0 ? `$${size.price.toFixed(2)}` : "—"}
                </td>
                <td className="py-3 pr-4 font-mono text-gray-500">
                  {size.price > 0 ? `$${(size.price * 4).toFixed(2)}` : "—"}
                </td>
                <td className="py-3">
                  {size.price > 0 ? (
                    <AddToCartButton
                      brand={brand}
                      brandSlug={brandSlug}
                      model={modelName}
                      modelSlug={modelSlug}
                      size={size.size}
                      price={size.price}
                      loadIndex={size.loadIndex}
                      speedRating={size.speedRating}
                      image={tireImage}
                      tireId={size.tireId}
                    />
                  ) : (
                    <Link
                      href={`/tires/${brandSlug}/${modelSlug}/${sizeToSlug(size.size)}`}
                      className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-200 transition-colors"
                    >
                      View Options
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
