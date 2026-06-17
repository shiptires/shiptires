import Link from "next/link";
import { searchModels, getAllBrands, toSlug } from "@/lib/db";
import TireImage from "@/components/TireImage";
import { sitePrice } from "@/lib/pricing";
import type { Metadata } from "next";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Search Tires — Filter by Size, Brand & Type | Ship.Tires",
  description:
    "Search our catalog of 60,000+ tires. Filter by tire size, brand, season, and terrain. Free shipping on every order.",
  alternates: { canonical: "https://ship.tires/search" },
};

const seasonOptions = [
  { value: "All-Season", label: "All-Season" },
  { value: "All-Weather", label: "All-Weather" },
  { value: "Winter", label: "Winter" },
  { value: "Summer", label: "Summer" },
];

const terrainOptions = [
  { value: "All-Terrain (A/T)", label: "All-Terrain" },
  { value: "Highway Terrain(H/T)", label: "Highway" },
  { value: "Mud-Terrain (M/T)", label: "Mud-Terrain" },
  { value: "Rugged-Terrain (R/T)", label: "Rugged-Terrain" },
];

const popularSizes = [
  "225/65R17", "265/70R17", "275/55R20", "235/65R17",
  "245/75R16", "275/65R18", "225/60R18", "255/70R18",
];

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

function mapType(season: string | null, terrain: string | null, category: string | null): string {
  const t = terrain?.toLowerCase() ?? "";
  const s = season?.toLowerCase() ?? "";
  const c = category?.toLowerCase() ?? "";
  if (t.includes("mud")) return "mud-terrain";
  if (t.includes("all-terrain")) return "all-terrain";
  if (t.includes("highway")) return "highway";
  if (s.includes("winter")) return "winter";
  if (s.includes("summer")) return "summer";
  if (c.includes("performance") || c.includes("uhp")) return "performance";
  if (c.includes("touring")) return "touring";
  return "all-season";
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const sp = await searchParams;
  const brand = sp.brand || "";
  const size = sp.size || "";
  const width = sp.width || "";
  const aspectRatio = sp.aspectRatio || "";
  const rimSize = sp.rimSize || "";
  const season = sp.season || "";
  const terrain = sp.terrain || "";
  const category = sp.category || "";
  const q = sp.q || "";
  const page = parseInt(sp.page || "1") || 1;

  const result = await searchModels({
    brand: brand || undefined,
    size: size || undefined,
    width: width || undefined,
    aspectRatio: aspectRatio || undefined,
    rimSize: rimSize || undefined,
    season: season || undefined,
    terrain: terrain || undefined,
    category: category || undefined,
    query: q || undefined,
    page,
    limit: 24,
  });

  const brandRows = await getAllBrands();

  // Active filter description
  const activeFilters: string[] = [];
  if (brand) activeFilters.push(brand.toUpperCase());
  if (size) activeFilters.push(size);
  if (width && aspectRatio && rimSize) activeFilters.push(`${width}/${aspectRatio}R${rimSize}`);
  if (season) activeFilters.push(season);
  if (terrain) activeFilters.push(terrain.split("(")[0].trim());
  if (q) activeFilters.push(`"${q}"`);

  // Pagination query string
  const queryParts: string[] = [];
  if (brand) queryParts.push(`brand=${encodeURIComponent(brand)}`);
  if (size) queryParts.push(`size=${encodeURIComponent(size)}`);
  if (width) queryParts.push(`width=${encodeURIComponent(width)}`);
  if (aspectRatio) queryParts.push(`aspectRatio=${encodeURIComponent(aspectRatio)}`);
  if (rimSize) queryParts.push(`rimSize=${encodeURIComponent(rimSize)}`);
  if (season) queryParts.push(`season=${encodeURIComponent(season)}`);
  if (terrain) queryParts.push(`terrain=${encodeURIComponent(terrain)}`);
  if (category) queryParts.push(`category=${encodeURIComponent(category)}`);
  if (q) queryParts.push(`q=${encodeURIComponent(q)}`);
  const baseQuery = queryParts.length > 0 ? queryParts.join("&") + "&" : "";

  return (
    <div className="min-h-screen bg-label-white">
      {/* Hero */}
      <div className="bg-rubber py-8 sm:py-10 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{ backgroundImage: "repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(255,255,255,0.1) 40px, rgba(255,255,255,0.1) 41px)" }} />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-safety-orange mb-1">Tire Catalog</p>
          <h1 className="font-display text-2xl sm:text-3xl tracking-tight">
            {activeFilters.length > 0 ? `Tires: ${activeFilters.join(" + ")}` : "Search All Tires"}
          </h1>
          <p className="mt-1 text-sm text-white/60">
            {result.total.toLocaleString()} model{result.total !== 1 ? "s" : ""} found
            {result.totalPages > 1 && ` — Page ${result.page} of ${result.totalPages}`}
            {" — Free shipping on every order"}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="border-b border-ink-grey/10 bg-white shadow-sm">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-4">
          <form method="GET" action="/search" className="space-y-3">
            {/* Row 1: Search + Brand */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-ink-grey/60 mb-1">Search</label>
                <input
                  type="text"
                  name="q"
                  defaultValue={q}
                  placeholder="Tire name or brand..."
                  className="w-full rounded-lg border border-ink-grey/20 bg-white px-3 py-2 text-sm text-rubber placeholder:text-ink-grey/40 focus:border-safety-orange focus:ring-1 focus:ring-safety-orange/30 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-ink-grey/60 mb-1">Brand</label>
                <select
                  name="brand"
                  defaultValue={brand}
                  className="w-full rounded-lg border border-ink-grey/20 bg-white px-3 py-2 text-sm text-rubber focus:border-safety-orange focus:outline-none"
                >
                  <option value="">All Brands</option>
                  {brandRows.map((b) => (
                    <option key={b.make_name} value={toSlug(b.make_name)}>{b.make_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-ink-grey/60 mb-1">Season</label>
                <select
                  name="season"
                  defaultValue={season}
                  className="w-full rounded-lg border border-ink-grey/20 bg-white px-3 py-2 text-sm text-rubber focus:border-safety-orange focus:outline-none"
                >
                  <option value="">All Seasons</option>
                  {seasonOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-ink-grey/60 mb-1">Terrain</label>
                <select
                  name="terrain"
                  defaultValue={terrain}
                  className="w-full rounded-lg border border-ink-grey/20 bg-white px-3 py-2 text-sm text-rubber focus:border-safety-orange focus:outline-none"
                >
                  <option value="">All Terrains</option>
                  {terrainOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 2: Size + Actions */}
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-ink-grey/60 mb-1">Tire Size</label>
                <input
                  type="text"
                  name="size"
                  defaultValue={size}
                  placeholder="e.g. 225/65R17"
                  className="w-full rounded-lg border border-ink-grey/20 bg-white px-3 py-2 text-sm text-rubber placeholder:text-ink-grey/40 focus:border-safety-orange focus:ring-1 focus:ring-safety-orange/30 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="rounded-lg bg-safety-orange px-6 py-2 text-sm font-bold text-white hover:bg-safety-orange/90 transition-colors"
              >
                Search
              </button>
              {activeFilters.length > 0 && (
                <Link
                  href="/search"
                  className="rounded-lg border border-ink-grey/20 px-4 py-2 text-sm font-medium text-ink-grey hover:bg-ink-grey/5 transition-colors"
                >
                  Clear All
                </Link>
              )}
            </div>

            {/* Popular Sizes */}
            {!size && !width && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-ink-grey/40">Popular:</span>
                {popularSizes.map((s) => (
                  <Link
                    key={s}
                    href={`/search?size=${s}`}
                    className="rounded-full border border-ink-grey/15 bg-label-white px-3 py-1 text-xs font-mono text-ink-grey hover:border-safety-orange/40 hover:text-safety-orange transition-colors"
                  >
                    {s}
                  </Link>
                ))}
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Results */}
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        {result.models.length === 0 ? (
          <div className="rounded-xl border border-ink-grey/15 bg-white p-12 text-center">
            <svg className="mx-auto h-16 w-16 text-ink-grey/20" fill="none" viewBox="0 0 24 24" strokeWidth={0.5} stroke="currentColor">
              <circle cx="12" cy="12" r="9" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <p className="mt-4 text-lg font-display text-rubber">No tires found</p>
            <p className="mt-1 text-sm text-ink-grey">
              Try adjusting your filters or{" "}
              <a href="tel:+12792388473" className="text-safety-orange hover:underline font-medium">call (279) 238-8473</a> for help.
            </p>
            <Link href="/search" className="mt-4 inline-block rounded-lg bg-safety-orange px-6 py-2 text-sm font-bold text-white hover:bg-safety-orange/90 transition-colors">
              View All Tires
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {result.models.map((m) => {
                const brandSlug = toSlug(m.make_name);
                const modelSlug = toSlug(m.model_name);
                const tireType = mapType(m.season, m.terrain, m.category);
                const hasPrice = m.min_price != null && m.min_price > 0;
                const speeds = m.speed_ratings?.split(",").filter(Boolean).slice(0, 3) ?? [];

                return (
                  <Link
                    key={`${brandSlug}-${modelSlug}`}
                    href={`/tires/${brandSlug}/${modelSlug}`}
                    className="group flex flex-col rounded-xl border border-ink-grey/12 bg-white overflow-hidden transition-all hover:shadow-lg hover:border-safety-orange/30"
                  >
                    {/* Image */}
                    <div className="relative flex items-center justify-center bg-gradient-to-b from-gray-50 to-white p-5 h-48">
                      {m.thumbnail_url ? (
                        <TireImage
                          src={m.thumbnail_url}
                          alt={`${m.make_name} ${m.model_name}`}
                          width={180}
                          height={180}
                          className="h-40 w-40 object-contain group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <svg className="h-24 w-24 text-ink-grey/15" fill="none" viewBox="0 0 24 24" strokeWidth={0.5} stroke="currentColor">
                          <circle cx="12" cy="12" r="9" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                      <span className="absolute top-2.5 left-2.5 rounded-full bg-green-50 border border-green-200 px-2 py-0.5 text-[10px] font-bold text-green-700">
                        Free Ship
                      </span>
                      <span className="absolute top-2.5 right-2.5 rounded-full bg-rubber/5 border border-ink-grey/10 px-2 py-0.5 text-[10px] font-medium text-ink-grey">
                        {typeLabels[tireType] || tireType}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="flex flex-1 flex-col p-4 border-t border-ink-grey/8">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-ink-grey/50">{m.make_name}</p>
                      <h3 className="font-display text-base text-rubber group-hover:text-safety-orange transition-colors leading-tight mt-0.5">
                        {m.model_name}
                      </h3>

                      <div className="mt-3 flex items-baseline justify-between">
                        {hasPrice ? (
                          <div>
                            <span className="text-xl font-bold text-rubber">${sitePrice(m.min_price)}</span>
                            <span className="text-xs text-ink-grey/50">/tire</span>
                            {m.max_price && m.max_price > (m.min_price ?? 0) && (
                              <span className="ml-1 text-xs text-ink-grey/40">— ${sitePrice(m.max_price)}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm font-bold text-safety-orange">Call for Price</span>
                        )}
                        <span className="text-xs font-mono text-ink-grey/40">{m.tire_count} size{m.tire_count !== 1 ? "s" : ""}</span>
                      </div>

                      {/* Quick specs */}
                      <div className="mt-3 flex items-center gap-3 text-[11px] text-ink-grey/50 border-t border-ink-grey/8 pt-3">
                        {m.warranty && (
                          <span>{m.warranty}</span>
                        )}
                        {speeds.length > 0 && (
                          <span>Speed: {speeds.join(", ")}</span>
                        )}
                      </div>

                      <div className="mt-3">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-safety-orange px-4 py-2 text-xs font-bold text-white group-hover:bg-safety-orange/90 transition-colors">
                          Shop Sizes
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                          </svg>
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Pagination */}
            {result.totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-3">
                {page > 1 && (
                  <Link
                    href={`/search?${baseQuery}page=${page - 1}`}
                    className="rounded-lg border border-ink-grey/20 px-5 py-2.5 text-sm font-medium text-rubber hover:bg-ink-grey/5 transition-colors"
                  >
                    Previous
                  </Link>
                )}
                <span className="px-4 py-2.5 text-sm text-ink-grey/60 font-mono">
                  {page} / {result.totalPages}
                </span>
                {page < result.totalPages && (
                  <Link
                    href={`/search?${baseQuery}page=${page + 1}`}
                    className="rounded-lg bg-rubber px-5 py-2.5 text-sm font-bold text-white hover:bg-rubber/90 transition-colors"
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
  );
}
