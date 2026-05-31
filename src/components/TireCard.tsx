import Link from "next/link";
import Image from "next/image";
import type { TireModel } from "@/lib/types";

const typeColors: Record<string, string> = {
  "all-season": "bg-blue text-white",
  winter: "bg-sky-500 text-white",
  summer: "bg-amber-500 text-white",
  performance: "bg-orange text-white",
  "all-terrain": "bg-green-600 text-white",
  "mud-terrain": "bg-amber-800 text-white",
  highway: "bg-gray-600 text-white",
  touring: "bg-purple-600 text-white",
};

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

const typeImages: Record<string, string> = {
  "all-season": "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=400&q=70",
  winter: "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=400&q=70",
  summer: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=400&q=70",
  performance: "https://images.unsplash.com/photo-1684779343332-5a8f8d53b75f?w=400&q=70",
  "all-terrain": "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=400&q=70",
  "mud-terrain": "https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=400&q=70",
  highway: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&q=70",
  touring: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400&q=70",
};

export default function TireCard({
  model,
  brandSlug,
}: {
  model: TireModel;
  brandSlug: string;
}) {
  const imageUrl = typeImages[model.type] || typeImages["all-season"];

  return (
    <Link
      href={`/tires/${brandSlug}/${model.slug}`}
      className="group block overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-lg hover:border-orange/30"
    >
      {/* Tire type image */}
      <div className="relative h-36 overflow-hidden bg-navy">
        <Image
          src={imageUrl}
          alt={model.name}
          fill
          className="object-cover opacity-50 group-hover:opacity-40 group-hover:scale-105 transition-all duration-500"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/60 to-transparent" />
        <div className="absolute bottom-3 left-4 right-4">
          <h3 className="font-bold text-white text-sm group-hover:text-orange transition-colors">
            {model.name}
          </h3>
        </div>
        <div className="absolute top-3 right-3">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold ${typeColors[model.type] || "bg-gray-200 text-gray-700"}`}
          >
            {typeLabels[model.type] || model.type}
          </span>
        </div>
      </div>

      <div className="p-4">
        <p className="text-xs text-gray-500 line-clamp-2">
          {model.description}
        </p>

        <div className="mt-2.5 flex flex-wrap gap-1">
          {model.features.slice(0, 2).map((feature) => (
            <span
              key={feature}
              className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600"
            >
              {feature}
            </span>
          ))}
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
          <div>
            <span className="text-xs text-gray-500">From </span>
            <span className="text-base font-black text-gray-900">
              ${model.priceRange[0]}
            </span>
            <span className="text-xs text-gray-500"> /tire</span>
          </div>
          <div className="text-[10px] text-gray-400 font-medium">
            {model.sizes.length} sizes
          </div>
        </div>

        {model.warranty && (
          <div className="mt-1.5 text-[10px] text-gray-400">
            Warranty: {model.warranty}
          </div>
        )}
      </div>
    </Link>
  );
}
