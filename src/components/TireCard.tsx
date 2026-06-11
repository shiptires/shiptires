import Link from "next/link";
import Image from "next/image";
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

  return (
    <Link
      href={`/tires/${brandSlug}/${model.slug}`}
      className="group block overflow-hidden rounded-lg border border-ink-grey/15 bg-white transition-all hover:shadow-md hover:border-safety-orange/30"
    >
      {/* Tire image hero */}
      <div className="relative bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-4 h-48">
        {model.image ? (
          <Image
            src={model.image}
            alt={`${brandName || brandSlug} ${model.name}`}
            width={200}
            height={200}
            className="h-40 w-40 object-contain group-hover:scale-105 transition-transform"
          />
        ) : (
          <div className="flex h-32 w-32 items-center justify-center rounded-full bg-gray-100">
            <svg className="h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-4.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Z" />
            </svg>
          </div>
        )}
        {/* Type badge */}
        <span className="absolute top-3 right-3 inline-flex items-center rounded bg-white/90 border border-ink-grey/20 px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider text-ink-grey shadow-sm">
          {typeLabels[model.type] || model.type}
        </span>
        {/* Brand logo */}
        {brandLogo && (
          <div className="absolute top-3 left-3 flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-sm border border-gray-100 p-1">
            <Image
              src={brandLogo}
              alt={brandName || brandSlug}
              width={32}
              height={32}
              className="h-8 w-8 object-contain"
              />
          </div>
        )}
      </div>

      <div className="p-4 border-t border-ink-grey/10">
        {brandName && (
          <p className="text-[10px] font-mono uppercase tracking-wider text-ink-grey mb-0.5">{brandName}</p>
        )}
        <h3 className="font-display text-base font-bold text-rubber group-hover:text-safety-orange transition-colors">
          {model.name}
        </h3>

        {model.features.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {model.features.slice(0, 3).map((feature) => (
              <span
                key={feature}
                className="inline-flex items-center rounded bg-kraft/30 px-2 py-0.5 text-[10px] text-rubber/70"
              >
                {feature}
              </span>
            ))}
          </div>
        )}

        <div className="mt-3 flex items-center justify-between border-t border-ink-grey/10 pt-3">
          <div>
            {hasPrice ? (
              <>
                <span className="text-xs text-ink-grey">From </span>
                <span className="text-lg font-mono font-bold text-rubber">
                  ${model.priceRange[0]}
                </span>
                <span className="text-xs text-ink-grey"> /tire</span>
                <div className="text-[10px] font-mono text-ink-grey mt-0.5">
                  Set of 4: <span className="font-bold text-rubber">${model.priceRange[0] * 4}</span>
                </div>
              </>
            ) : (
              <span className="text-sm font-bold text-safety-orange">
                Call for Price
              </span>
            )}
          </div>
          <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-bold text-green-700">
            Free Ship
          </span>
        </div>

        <div className="mt-1.5 flex items-center justify-between text-[10px] font-mono text-ink-grey">
          <span>{model.sizeCount ?? model.sizes.length} sizes</span>
          {model.warranty && <span>{model.warranty}</span>}
        </div>
      </div>
    </Link>
  );
}
