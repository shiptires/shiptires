"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const STORAGE_KEY = "ship-tires-recently-viewed";
const MAX_ITEMS = 10;

interface RecentTire {
  id: number;
  brand: string;
  brandSlug: string;
  model: string;
  modelSlug: string;
  size: string;
  sizeSlug: string;
  price: number;
  image?: string;
}

export function trackRecentlyViewed(tire: RecentTire) {
  if (typeof window === "undefined") return;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    let items: RecentTire[] = stored ? JSON.parse(stored) : [];
    // Remove if already exists
    items = items.filter((t) => t.id !== tire.id);
    // Add to front
    items.unshift(tire);
    // Limit
    items = items.slice(0, MAX_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {}
}

export default function RecentlyViewed({
  currentTireId,
  brandSlug,
  modelSlug,
}: {
  currentTireId: number;
  brandSlug: string;
  modelSlug: string;
}) {
  const [items, setItems] = useState<RecentTire[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: RecentTire[] = JSON.parse(stored);
        // Filter out current tire
        setItems(parsed.filter((t) => t.id !== currentTireId).slice(0, 8));
      }
    } catch {}
  }, [currentTireId]);

  if (items.length === 0) return null;

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-4">Recently Viewed</h2>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
        {items.map((tire) => (
          <Link
            key={tire.id}
            href={`/tires/${tire.brandSlug}/${tire.modelSlug}/${tire.sizeSlug}`}
            className="flex-shrink-0 w-40 rounded-lg border border-gray-200 bg-white p-3 hover:border-safety-orange/40 transition-colors"
          >
            {tire.image ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={tire.image}
                alt={`${tire.brand} ${tire.model}`}
                className="h-24 w-full object-contain rounded"
              />
            ) : (
              <div className="flex h-24 items-center justify-center rounded bg-gray-100">
                <svg className="h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                  <circle cx="12" cy="12" r="9" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </div>
            )}
            <p className="mt-2 text-xs font-bold text-gray-900 truncate">
              {tire.brand} {tire.model}
            </p>
            <p className="text-xs text-gray-500 font-mono truncate">{tire.size}</p>
            {tire.price > 0 && (
              <p className="mt-1 text-sm font-bold text-safety-orange">
                ${tire.price.toFixed(2)}
              </p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
