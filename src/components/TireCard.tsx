import Link from "next/link";
import Image from "next/image";
import TireImage from "@/components/TireImage";
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

export default function TireCard({
  model,
  brandSlug,
  brandName,
  brandLogo,
}: {
  model: TireModel;
  brandSlug: string;
  brandName?: string;
  brandLogo?: string | null;
}) {
  const hasPrice = model.priceRange[0] > 0;
  const sizeCount = model.sizeCount ?? model.sizes.length;

  return (
    <Link
      href={`/tires/${brandSlug}/${model.slug}`}
      className="group flex flex-col sm:flex-row overflow-hidden rounded-xl border-2 border-gray-200 bg-white transition-all hover:shadow-lg hover:border-safety-orange/40"
    >
      {/* Left: Large tire image */}
      <div className="relative flex items-center justify-center bg-gradient-to-br from-gray-50 to-white p-6 sm:w-64 sm:min-h-[220px] flex-shrink-0">
        {model.image ? (
          <TireImage
            src={model.image}
            alt={`${brandName || brandSlug} ${model.name}`}
            width={220}
            height={220}
            className="h-44 w-44 sm:h-48 sm:w-48 object-contain group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex h-36 w-36 items-center justify-center rounded-full bg-gray-100">
            <svg className="h-20 w-20 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
              <circle cx="12" cy="12" r="9" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </div>
        )}
        {/* Free shipping badge */}
        <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-green-50 border border-green-200 px-2.5 py-1 text-[11px] font-bold text-green-700">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
          </svg>
          Free Ship
        </span>
      </div>

      {/* Right: Details */}
      <div className="flex flex-1 flex-col justify-between p-5 sm:p-6 border-t sm:border-t-0 sm:border-l border-gray-200">
        <div>
          {/* Brand + Model */}
          <div className="flex items-center gap-3 mb-2">
            {brandLogo && (
              <Image
                src={brandLogo}
                alt={brandName || brandSlug}
                width={36}
                height={36}
                className="h-8 w-8 object-contain"
              />
            )}
            <div>
              {brandName && (
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">{brandName}</p>
              )}
              <h3 className="font-display text-lg font-bold text-gray-900 group-hover:text-safety-orange transition-colors leading-tight">
                {model.name}
              </h3>
            </div>
          </div>

          {/* In Stock + Type */}
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
              <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
              </svg>
              In Stock
            </span>
            <span className="text-gray-300">|</span>
            <span className="text-xs font-medium text-gray-500">{typeLabels[model.type] || model.type}</span>
          </div>

          {/* Price */}
          <div className="mb-4">
            {hasPrice ? (
              <div>
                <span className="text-2xl font-bold text-gray-900">${model.priceRange[0]}</span>
                <span className="text-sm text-gray-500">/tire</span>
                {model.priceRange[1] > model.priceRange[0] && (
                  <span className="ml-2 text-sm text-gray-400">— ${model.priceRange[1]}</span>
                )}
              </div>
            ) : (
              <span className="text-lg font-bold text-safety-orange">Call for Pricing</span>
            )}
          </div>

          {/* Specs grid */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm border-t border-gray-100 pt-3">
            <div className="flex justify-between">
              <span className="text-gray-500">Sizes</span>
              <span className="font-medium text-gray-900">{sizeCount}</span>
            </div>
            {model.warranty && (
              <div className="flex justify-between">
                <span className="text-gray-500">Warranty</span>
                <span className="font-medium text-gray-900">{model.warranty}</span>
              </div>
            )}
            {model.speedRatings && model.speedRatings.length > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500">Speed</span>
                <span className="font-medium text-gray-900">{model.speedRatings.slice(0, 3).join(", ")}</span>
              </div>
            )}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-4">
          <span className="inline-flex items-center gap-2 rounded-full bg-safety-orange px-5 py-2.5 text-sm font-bold text-white group-hover:bg-safety-orange/90 transition-colors">
            Shop Sizes
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}
