"use client";

import { useState } from "react";
import Image from "next/image";
import type { TireSize } from "@/lib/types";
import AddToCartButton from "./AddToCartButton";
import TireImageLightbox from "./TireImageLightbox";

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

  const displaySizes = activeRim ? (rimGroups.get(activeRim) ?? []) : sizes;

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
              <th className="py-3 pr-4">Price</th>
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
                        unoptimized
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
                <td className="py-3 pr-4 font-mono font-medium text-gray-900">{size.size}</td>
                <td className="py-3 pr-4 text-gray-600">{size.loadIndex || "—"}</td>
                <td className="py-3 pr-4 text-gray-600">{size.speedRating || "—"}</td>
                <td className="py-3 pr-4 font-bold text-gray-900">
                  {size.price > 0 ? `$${size.price}` : "—"}
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
                    />
                  ) : (
                    <a
                      href="tel:+12792388473"
                      className="inline-flex items-center gap-1 rounded-md bg-safety-orange px-3 py-1.5 text-xs font-bold text-white hover:bg-safety-orange/90 transition-colors"
                    >
                      Call for Price
                    </a>
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
