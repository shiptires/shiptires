import Link from "next/link";
import Image from "next/image";
import type { TireModel } from "@/lib/types";
import { getLogoUrl } from "@/lib/api-helpers";
import { brands } from "@/data/brands";

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
}: {
  model: TireModel;
  brandSlug: string;
}) {
  const brand = brands.find((b) => b.slug === brandSlug);
  const logoUrl = brand ? getLogoUrl(brand.domain) : null;

  return (
    <Link
      href={`/tires/${brandSlug}/${model.slug}`}
      className="group block overflow-hidden rounded-lg border border-ink-grey/15 bg-white transition-all hover:shadow-md hover:border-safety-orange/30"
    >
      {/* Brand logo + type badge header */}
      <div className="relative flex items-center justify-between border-b border-ink-grey/10 bg-label-white px-4 py-3">
        {logoUrl && (
          <div className="flex h-8 w-8 items-center justify-center rounded bg-white p-0.5">
            <Image
              src={logoUrl}
              alt={brand?.name || brandSlug}
              width={28}
              height={28}
              className="h-7 w-7 object-contain"
              unoptimized
            />
          </div>
        )}
        <span className="inline-flex items-center rounded border border-ink-grey/20 px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider text-ink-grey">
          {typeLabels[model.type] || model.type}
        </span>
      </div>

      <div className="p-4">
        <h3 className="font-display text-base font-bold text-rubber group-hover:text-safety-orange transition-colors">
          {model.name}
        </h3>
        <p className="mt-1 text-xs text-ink-grey line-clamp-2">
          {model.description}
        </p>

        <div className="mt-2.5 flex flex-wrap gap-1">
          {model.features.slice(0, 2).map((feature) => (
            <span
              key={feature}
              className="inline-flex items-center rounded bg-kraft/30 px-2 py-0.5 text-[10px] text-rubber/70"
            >
              {feature}
            </span>
          ))}
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-ink-grey/10 pt-3">
          <div>
            <span className="text-xs text-ink-grey">From </span>
            <span className="text-base font-mono font-bold text-rubber">
              ${model.priceRange[0]}
            </span>
            <span className="text-xs text-ink-grey"> /tire</span>
          </div>
          <div className="text-[10px] font-mono text-ink-grey">
            {model.sizes.length} sizes
          </div>
        </div>

        {model.warranty && (
          <div className="mt-1.5 text-[10px] font-mono text-ink-grey">
            Warranty: {model.warranty}
          </div>
        )}
      </div>
    </Link>
  );
}
