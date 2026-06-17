"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { TireSize } from "@/lib/types";
import { parseUTQG } from "@/lib/utqg";
import AddToCartButton from "./AddToCartButton";
import TireImageLightbox from "./TireImageLightbox";

function sizeToSlug(size: string): string {
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

  // Always show sizes with prices first, then no-price sizes
  const sortedSizes = (activeRim ? (rimGroups.get(activeRim) ?? []) : sizes)
    .slice()
    .sort((a, b) => {
      if (a.price > 0 && b.price <= 0) return -1;
      if (a.price <= 0 && b.price > 0) return 1;
      return 0;
    });
  const displaySizes = sortedSizes;
  const hasUtqg = sizes.some((s) => parseUTQG(s.utqg) !== null);

  return (
    <div>
      {/* Rim size tabs */}
      {rimSizes.length > 1 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium uppercase text-gray-500 mr-1">Wheel Size:</span>
          <button
            onClick={() => setActiveRim(null)}
            className={`rounded-full px-3 py-1 text-xs font-bold transition-colors ${
              !activeRim
                ? "bg-navy text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            All ({sizes.length})
          </button>
          {rimSizes.map((rim) => (
            <button
              key={rim}
              onClick={() => setActiveRim(activeRim === rim ? null : rim)}
              className={`rounded-full px-3 py-1 text-xs font-bold transition-colors ${
                activeRim === rim
                  ? "bg-navy text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {rim}&quot; ({rimGroups.get(rim)!.length})
            </button>
          ))}
        </div>
      )}

      {/* Size table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase text-gray-500">
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
              <tr key={`${size.size}-${size.tireId}`} className="hover:bg-gray-50">
                <td className="py-2 pr-2">
                  {(size.thumbnailUrl || tireImage) ? (
                    <TireImageLightbox
                      src={size.thumbnailUrl || tireImage!}
                      alt={`${brand} ${modelName} ${size.size}`}
                    >
                      <Image
                        src={size.thumbnailUrl || tireImage!}
                        alt={`${brand} ${modelName} ${size.size}`}
                        width={36}
                        height={36}
                        className="h-9 w-9 object-contain rounded"
                      />
                    </TireImageLightbox>
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded bg-gray-100">
                      <svg className="h-5 w-5 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <circle cx="12" cy="12" r="9" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    </div>
                  )}
                </td>
                <td className="py-3 pr-4 font-mono font-medium text-gray-900">
                  <Link
                    href={`/tires/${brandSlug}/${modelSlug}/${sizeToSlug(size.size)}`}
                    className="text-navy hover:text-safety-orange transition-colors underline decoration-gray-300 underline-offset-2 hover:decoration-safety-orange"
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
                <td className="py-3 pr-4 font-bold text-gray-900">
                  {size.price > 0 ? `$${size.price}` : "—"}
                </td>
                <td className="py-3 pr-4 font-mono text-gray-600">
                  {size.price > 0 ? `$${size.price * 4}` : "—"}
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
                    />
                  ) : (
                    <Link
                      href={`/tires/${brandSlug}/${modelSlug}/${sizeToSlug(size.size)}`}
                      className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-200 transition-colors"
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
