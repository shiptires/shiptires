import Link from "next/link";
import { searchTires, getAllBrands, tireRowToSize, toSlug } from "@/lib/db";
import type { TireModel, TireType } from "@/lib/types";
import TireCard from "@/components/TireCard";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Search Tires — Filter by Size, Brand & Type",
  description:
    "Search our catalog of 60,000+ tires. Filter by tire size, brand, season, and more. Free shipping on every order.",
  alternates: { canonical: "https://ship.tires/search" },
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

const seasonOptions = [
  { value: "All-Season", label: "All-Season" },
  { value: "All-Weather", label: "All-Weather" },
  { value: "Winter", label: "Winter" },
  { value: "Summer", label: "Summer" },
];

const terrainOptions = [
  { value: "All-Terrain (A/T)", label: "All-Terrain" },
  { value: "Highway Terrain (H/T)", label: "Highway" },
  { value: "Mud-Terrain (M/T)", label: "Mud-Terrain" },
  { value: "Rugged-Terrain (R/T)", label: "Rugged-Terrain" },
];

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const sp = await searchParams;
  const brand = sp.brand || "";
  const size = sp.size || "";
  const season = sp.season || "";
  const terrain = sp.terrain || "";
  const q = sp.q || "";
  const page = parseInt(sp.page || "1") || 1;

  const result = searchTires({
    brand: brand || undefined,
    size: size || undefined,
    season: season || undefined,
    terrain: terrain || undefined,
    query: q || undefined,
    page,
    limit: 24,
  });

  // Group tires by brand+model for TireCard display
  const grouped = new Map<
    string,
    { brandName: string; brandSlug: string; brandLogo: string | null; modelName: string; tires: typeof result.tires }
  >();

  for (const tire of result.tires) {
    const key = `${tire.make_name}|||${tire.model_name}`;
    if (!grouped.has(key)) {
      grouped.set(key, {
        brandName: tire.make_name,
        brandSlug: toSlug(tire.make_name),
        brandLogo: tire.make_image_url,
        modelName: tire.model_name,
        tires: [],
      });
    }
    grouped.get(key)!.tires.push(tire);
  }

  const models: {
    model: TireModel;
    brandSlug: string;
    brandName: string;
    brandLogo: string | null;
  }[] = [];

  for (const [, group] of grouped) {
    const sizes = group.tires.map(tireRowToSize);
    const pricesWithValue = sizes.map((s) => s.price).filter((p) => p > 0);
    const minPrice = pricesWithValue.length > 0 ? Math.min(...pricesWithValue) : 0;
    const maxPrice = pricesWithValue.length > 0 ? Math.max(...pricesWithValue) : 0;

    const first = group.tires[0];
    const tireType = mapSeason(first.season, first.terrain, first.category);

    models.push({
      model: {
        name: group.modelName,
        slug: toSlug(group.modelName),
        type: tireType,
        sizes,
        features: [],
        warranty: first.warranty ?? "",
        speedRatings: [...new Set(group.tires.map((t) => t.speed_rating).filter(Boolean) as string[])],
        priceRange: [minPrice, maxPrice],
        description: `${group.brandName} ${group.modelName} — ${sizes.length} size${sizes.length !== 1 ? "s" : ""} available.`,
        image: first.image_url_1 ?? undefined,
      },
      brandSlug: group.brandSlug,
      brandName: group.brandName,
      brandLogo: group.brandLogo,
    });
  }

  const brandRows = getAllBrands();

  // Build current search query for pagination links
  const queryParts: string[] = [];
  if (brand) queryParts.push(`brand=${encodeURIComponent(brand)}`);
  if (size) queryParts.push(`size=${encodeURIComponent(size)}`);
  if (season) queryParts.push(`season=${encodeURIComponent(season)}`);
  if (terrain) queryParts.push(`terrain=${encodeURIComponent(terrain)}`);
  if (q) queryParts.push(`q=${encodeURIComponent(q)}`);
  const baseQuery = queryParts.length > 0 ? queryParts.join("&") + "&" : "";

  return (
    <div className="bg-navy min-h-screen">
      <div className="bg-navy-dark py-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 racing-grid" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-orange mb-2">Tire Catalog</p>
          <h1 className="text-2xl font-black sm:text-3xl">Search Tires</h1>
          <p className="mt-1 text-gray-400">
            {result.total.toLocaleString()} tires found
            {result.totalPages > 1 && ` — Page ${result.page} of ${result.totalPages}`}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <form method="GET" action="/search" className="rounded-xl bg-navy-light border border-white/10 p-5 shadow-sm space-y-5">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-2">Search</label>
                <input
                  type="text"
                  name="q"
                  defaultValue={q}
                  placeholder="Tire name, brand..."
                  className="w-full rounded-lg border border-white/10 bg-navy px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-orange/50 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-2">Brand</label>
                <select
                  name="brand"
                  defaultValue={brand}
                  className="w-full rounded-lg border border-white/10 bg-navy px-3 py-2 text-sm text-white focus:border-orange/50 focus:outline-none"
                >
                  <option value="">All Brands</option>
                  {brandRows.map((b) => (
                    <option key={b.make_name} value={toSlug(b.make_name)}>{b.make_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-2">Season</label>
                <select
                  name="season"
                  defaultValue={season}
                  className="w-full rounded-lg border border-white/10 bg-navy px-3 py-2 text-sm text-white focus:border-orange/50 focus:outline-none"
                >
                  <option value="">All Seasons</option>
                  {seasonOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-2">Terrain</label>
                <select
                  name="terrain"
                  defaultValue={terrain}
                  className="w-full rounded-lg border border-white/10 bg-navy px-3 py-2 text-sm text-white focus:border-orange/50 focus:outline-none"
                >
                  <option value="">All Terrains</option>
                  {terrainOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-2">Tire Size</label>
                <input
                  type="text"
                  name="size"
                  defaultValue={size}
                  placeholder="e.g. 225/65R17"
                  className="w-full rounded-lg border border-white/10 bg-navy px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-orange/50 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-orange px-3 py-2 text-sm font-bold text-white hover:bg-orange-light transition-colors"
              >
                Search
              </button>

              <Link
                href="/search"
                className="block w-full rounded-lg border border-orange/30 bg-orange/10 px-3 py-2 text-center text-sm font-bold text-orange hover:bg-orange/20 transition-colors"
              >
                Clear Filters
              </Link>
            </form>
          </div>

          {/* Results */}
          <div className="lg:col-span-3">
            {models.length === 0 ? (
              <div className="rounded-xl bg-navy-light border border-white/10 p-12 text-center">
                <p className="text-lg font-bold text-white">No tires found</p>
                <p className="mt-2 text-sm text-gray-500">
                  Try adjusting your filters or{" "}
                  <a href="tel:+12792388473" className="text-orange hover:underline">call or text us</a> for help.
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {models.map(({ model, brandSlug: bs, brandName: bn, brandLogo: bl }) => (
                    <TireCard
                      key={`${bs}-${model.slug}`}
                      model={model}
                      brandSlug={bs}
                      brandName={bn}
                      brandLogo={bl}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {result.totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-2">
                    {page > 1 && (
                      <Link
                        href={`/search?${baseQuery}page=${page - 1}`}
                        className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors"
                      >
                        Previous
                      </Link>
                    )}
                    <span className="px-4 py-2 text-sm text-gray-400">
                      Page {page} of {result.totalPages}
                    </span>
                    {page < result.totalPages && (
                      <Link
                        href={`/search?${baseQuery}page=${page + 1}`}
                        className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors"
                      >
                        Next
                      </Link>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function mapSeason(
  season: string | null,
  terrain: string | null,
  category: string | null
): TireType {
  const s = season?.toLowerCase() ?? "";
  const t = terrain?.toLowerCase() ?? "";
  const c = category?.toLowerCase() ?? "";
  if (t.includes("mud")) return "mud-terrain";
  if (t.includes("all-terrain")) return "all-terrain";
  if (t.includes("highway")) return "highway";
  if (s.includes("winter")) return "winter";
  if (s.includes("summer")) return "summer";
  if (c.includes("performance") || c.includes("uhp")) return "performance";
  if (c.includes("touring")) return "touring";
  if (s.includes("all-season") || s.includes("all-weather")) return "all-season";
  return "all-season";
}
