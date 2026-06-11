"use client";

import { useState } from "react";
import Link from "next/link";

interface BrandModel {
  name: string;
  slug: string;
  sizeCount?: number;
}

interface BrandModelDropdownProps {
  brandName: string;
  brandSlug: string;
  models: BrandModel[];
}

export default function BrandModelDropdown({
  brandName,
  brandSlug,
  models,
}: BrandModelDropdownProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-ink-grey/15 rounded-md overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-rubber bg-label-white hover:bg-white transition-colors"
      >
        <span>{brandName}</span>
        <svg
          className={`h-3.5 w-3.5 text-ink-grey transition-transform ${
            open ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 8.25l-7.5 7.5-7.5-7.5"
          />
        </svg>
      </button>
      {open && (
        <div className="border-t border-ink-grey/10 bg-white max-h-48 overflow-y-auto">
          <Link
            href={`/tires/${brandSlug}`}
            className="block px-3 py-1.5 text-xs font-bold text-safety-orange hover:bg-safety-orange/5 transition-colors"
          >
            All {brandName} Tires &rarr;
          </Link>
          {models.map((model) => (
            <Link
              key={model.slug}
              href={`/tires/${brandSlug}/${model.slug}`}
              className="block px-3 py-1.5 text-xs text-ink-grey hover:bg-label-white hover:text-rubber transition-colors"
            >
              {model.name}
              {model.sizeCount ? (
                <span className="ml-1 text-ink-grey/40">
                  ({model.sizeCount})
                </span>
              ) : null}
            </Link>
          ))}
          {models.length === 0 && (
            <div className="px-3 py-2 text-xs text-ink-grey/50">
              View brand page for models
            </div>
          )}
        </div>
      )}
    </div>
  );
}
