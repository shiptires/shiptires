import Link from "next/link";
import { searchModels, getAllBrands, getDistinctSizes, toSlug, resolveImage } from "@/lib/db";
import TireImage from "@/components/TireImage";
import { formatPrice } from "@/lib/pricing";
import { detectVehicle, parseFlexibleSize, parseRimSize } from "@/lib/vehicle-detection";
import type { Metadata } from "next";

export const revalidate = 3600;

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
  const sort = (sp.sort || "") as "" | "price-asc" | "price-desc" | "name-asc" | "sizes-desc";
  const page = parseInt(sp.page || "1") || 1;

  // Detect vehicle, flexible size, or rim size from the text query
  const vehicle = q ? detectVehicle(q) : null;
  let searchSize = size;
  let searchRimSize = rimSize;
  let searchQuery = q;

  if (q && !vehicle) {
    const parsedSize = parseFlexibleSize(q);
    if (parsedSize) {
      searchSize = searchSize || parsedSize;
      searchQuery = ""; // Don't also do text search
    } else {
      const parsedRim = parseRimSize(q);
      if (parsedRim) {
        searchRimSize = searchRimSize || parsedRim;
        searchQuery = "";
      }
    }
  }
  if (vehicle && vehicle.sizes.length > 0 && !searchSize) {
    searchSize = vehicle.sizes[0];
    searchQuery = ""; // Search by size, not text
  }

  const [result, brandRows, distinctSizes] = await Promise.all([
    searchModels({
      brand: brand || undefined,
      size: searchSize || undefined,
      width: width || undefined,
      aspectRatio: aspectRatio || undefined,
      rimSize: searchRimSize || undefined,
      season: season || undefined,
      terrain: terrain || undefined,
      category: category || undefined,
      query: searchQuery || undefined,
      sort: sort || undefined,
      page,
      limit: 24,
    }),
    getAllBrands(),
    getDistinctSizes(),
  ]);

  // Extract unique widths, aspect ratios, rim sizes from DB (sorted numerically)
  const widths = [...new Set(distinctSizes.map((s) => s.width))].sort((a, b) => Number(a) - Number(b));
  const aspects = [...new Set(distinctSizes.map((s) => s.aspect_ratio))].sort((a, b) => Number(a) - Number(b));
  const rims = [...new Set(distinctSizes.map((s) => s.rim_size))].sort((a, b) => Number(a) - Number(b));

  // Active filter chips
  const activeFilters: { label: string; param: string; value: string }[] = [];
  if (brand) {
    const matchedBrand = brandRows.find((b) => toSlug(b.make_name) === brand);
    activeFilters.push({ label: matchedBrand?.make_name || brand.toUpperCase(), param: "brand", value: brand });
  }
  if (size) activeFilters.push({ label: size, param: "size", value: size });
  if (width) activeFilters.push({ label: `Width: ${width}`, param: "width", value: width });
  if (aspectRatio) activeFilters.push({ label: `Aspect: ${aspectRatio}`, param: "aspectRatio", value: aspectRatio });
  if (rimSize) activeFilters.push({ label: `${rimSize}" Rim`, param: "rimSize", value: rimSize });
  if (season) activeFilters.push({ label: season, param: "season", value: season });
  if (terrain) activeFilters.push({ label: terrain.split("(")[0].trim(), param: "terrain", value: terrain });
  if (q) activeFilters.push({ label: `"${q}"`, param: "q", value: q });

  // Pagination query string builder
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
  if (sort) queryParts.push(`sort=${encodeURIComponent(sort)}`);
  const baseQuery = queryParts.length > 0 ? queryParts.join("&") + "&" : "";

  // Helper to build remove-filter URL
  function removeFilterHref(paramToRemove: string) {
    const remaining = queryParts.filter((p) => !p.startsWith(`${paramToRemove}=`));
    return `/search${remaining.length > 0 ? "?" + remaining.join("&") : ""}`;
  }

  // Combine width/aspect/rim into composite size string for display
  const compositeSize = width && aspectRatio && rimSize ? `${width}/${aspectRatio}R${rimSize}` : "";

  // Popular sizes for quick tap
  const popularSizes = [
    "225/65R17", "265/70R17", "275/55R20", "235/65R17",
    "245/75R16", "275/65R18", "225/60R18", "255/70R18",
    "235/55R19", "245/60R18", "285/70R17", "305/55R20",
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Compact Header */}
      <div className="bg-navy py-6 text-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-xl sm:text-2xl font-bold">
            {activeFilters.length > 0 ? "Filtered Results" : "Find Your Tires"}
          </h1>
          <p className="mt-0.5 text-sm text-gray-400">
            {result.total.toLocaleString()} model{result.total !== 1 ? "s" : ""} found
            {result.totalPages > 1 && ` — Page ${result.page} of ${result.totalPages}`}
            {" — Free shipping on every order"}
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-3">
          <form method="GET" action="/search">
            {/* Row 0: Text search */}
            <div className="mb-2">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
                <input
                  type="text"
                  name="q"
                  defaultValue={q}
                  placeholder="Search by brand, model, or size (e.g. Michelin Pilot Sport)..."
                  className="w-full rounded-lg border border-gray-200 bg-white pl-9 pr-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-safety-orange focus:outline-none focus:ring-1 focus:ring-safety-orange/30"
                />
              </div>
            </div>

            {/* Row 1: Size Picker — 3 dropdowns */}
            <div className="flex flex-wrap items-end gap-2">
              {/* Tire Width */}
              <div className="flex-1 min-w-[90px] max-w-[130px]">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Width</label>
                <select
                  name="width"
                  defaultValue={width}
                  className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-sm font-mono text-gray-900 focus:border-safety-orange focus:outline-none appearance-none"
                >
                  <option value="">Any</option>
                  {widths.map((w) => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </select>
              </div>

              <span className="pb-2.5 text-gray-300 font-bold">/</span>

              {/* Aspect Ratio */}
              <div className="flex-1 min-w-[80px] max-w-[120px]">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Aspect</label>
                <select
                  name="aspectRatio"
                  defaultValue={aspectRatio}
                  className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-sm font-mono text-gray-900 focus:border-safety-orange focus:outline-none appearance-none"
                >
                  <option value="">Any</option>
                  {aspects.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>

              <span className="pb-2.5 text-gray-300 font-bold">R</span>

              {/* Rim Size */}
              <div className="flex-1 min-w-[80px] max-w-[120px]">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Rim &quot;</label>
                <select
                  name="rimSize"
                  defaultValue={rimSize}
                  className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-sm font-mono text-gray-900 focus:border-safety-orange focus:outline-none appearance-none"
                >
                  <option value="">Any</option>
                  {rims.map((r) => (
                    <option key={r} value={r}>{r}&quot;</option>
                  ))}
                </select>
              </div>

              {/* Brand */}
              <div className="flex-1 min-w-[120px] max-w-[180px]">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Brand</label>
                <select
                  name="brand"
                  defaultValue={brand}
                  className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-sm text-gray-900 focus:border-safety-orange focus:outline-none"
                >
                  <option value="">All Brands</option>
                  {brandRows.map((b) => (
                    <option key={b.make_name} value={toSlug(b.make_name)}>{b.make_name}</option>
                  ))}
                </select>
              </div>

              {/* Season */}
              <div className="flex-1 min-w-[100px] max-w-[140px]">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Season</label>
                <select
                  name="season"
                  defaultValue={season}
                  className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-sm text-gray-900 focus:border-safety-orange focus:outline-none"
                >
                  <option value="">Any</option>
                  {seasonOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Terrain */}
              <div className="flex-1 min-w-[100px] max-w-[140px]">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Terrain</label>
                <select
                  name="terrain"
                  defaultValue={terrain}
                  className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-sm text-gray-900 focus:border-safety-orange focus:outline-none"
                >
                  <option value="">Any</option>
                  {terrainOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Search button */}
              <button
                type="submit"
                className="rounded-lg bg-safety-orange px-5 py-2 text-sm font-bold text-white hover:bg-safety-orange/90 transition-colors"
              >
                Search
              </button>
            </div>

            {/* Quick Size Chips — only show when no size is selected */}
            {!size && !width && !rimSize && (
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mr-1">Popular sizes:</span>
                {popularSizes.map((s) => (
                  <Link
                    key={s}
                    href={`/search?size=${s}`}
                    className="rounded-full bg-gray-100 px-3 py-1 text-xs font-mono text-gray-700 hover:bg-safety-orange/10 hover:text-safety-orange transition-colors"
                  >
                    {s}
                  </Link>
                ))}
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Active Filters + Sort Bar */}
      {(activeFilters.length > 0 || sort) && (
        <div className="bg-white border-b border-gray-100">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {activeFilters.map((f) => (
                <Link
                  key={f.param}
                  href={removeFilterHref(f.param)}
                  className="inline-flex items-center gap-1 rounded-full bg-safety-orange/10 border border-safety-orange/20 px-2.5 py-1 text-xs font-medium text-safety-orange hover:bg-safety-orange/20 transition-colors"
                >
                  {f.label}
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </Link>
              ))}
              {activeFilters.length > 1 && (
                <Link
                  href="/search"
                  className="text-xs text-gray-400 hover:text-gray-600 ml-1"
                >
                  Clear all
                </Link>
              )}
            </div>

            {/* Sort */}
            <div className="flex items-center gap-1.5">
              {([
                { value: "", label: "Best Match" },
                { value: "price-asc", label: "Price ↑" },
                { value: "price-desc", label: "Price ↓" },
                { value: "sizes-desc", label: "Most Sizes" },
                { value: "name-asc", label: "A-Z" },
              ] as const).map((opt) => {
                const sortParts = queryParts.filter((p) => !p.startsWith("sort=") && !p.startsWith("page="));
                if (opt.value) sortParts.push(`sort=${opt.value}`);
                const href = `/search${sortParts.length > 0 ? "?" + sortParts.join("&") : ""}`;
                const isActive = (sort || "") === opt.value;
                return (
                  <Link
                    key={opt.value}
                    href={href}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      isActive
                        ? "bg-gray-900 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {opt.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Vehicle Banner */}
      {vehicle && (
        <div className="bg-orange-50 border-b border-orange-200">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-4">
            <Link
              href={vehicle.url}
              className="flex items-center gap-3 group"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 flex-shrink-0">
                <svg className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0H21M3.375 14.25h3.053c.29 0 .574.074.826.213l2.396 1.325a2.25 2.25 0 0 0 1.1.287h4.5c.435 0 .858-.148 1.2-.42l1.95-1.56a1.5 1.5 0 0 1 .938-.33h1.787c.415 0 .816.146 1.133.413l.7.588A1.125 1.125 0 0 1 23.25 15.75V17.25a1.125 1.125 0 0 1-1.125 1.125H21M3.375 14.25V5.625A1.125 1.125 0 0 1 4.5 4.5h7.628a1.125 1.125 0 0 1 .897.448l1.95 2.6a1.125 1.125 0 0 0 .897.448H19.5a1.125 1.125 0 0 1 1.125 1.125v5.125" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-900 group-hover:text-orange-700 transition-colors">
                  Showing tires for {vehicle.year ? `${vehicle.year} ` : ""}{vehicle.makeDisplay} {vehicle.model.replace(/\b\w/g, (c: string) => c.toUpperCase())}
                </p>
                <p className="text-xs text-gray-600">
                  Fits sizes: {vehicle.sizes.join(", ")}
                </p>
              </div>
              <span className="text-xs font-medium text-orange-600 group-hover:text-orange-800 flex-shrink-0">
                View vehicle page &rarr;
              </span>
            </Link>
          </div>
        </div>
      )}

      {/* Results */}
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        {result.models.length === 0 ? (
          <div className="rounded-2xl bg-white border border-gray-200 p-12 text-center shadow-sm">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
              <svg className="h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                <circle cx="12" cy="12" r="9" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </div>
            <p className="mt-4 text-lg font-bold text-gray-900">No tires found</p>
            <p className="mt-1 text-sm text-gray-500">
              Try different filters or browse popular sizes below.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              {popularSizes.slice(0, 6).map((s) => (
                <Link
                  key={s}
                  href={`/search?size=${s}`}
                  className="rounded-full bg-gray-100 px-4 py-2 text-sm font-mono text-gray-700 hover:bg-safety-orange/10 hover:text-safety-orange transition-colors"
                >
                  {s}
                </Link>
              ))}
            </div>
            <Link href="/search" className="mt-4 inline-block rounded-lg bg-safety-orange px-6 py-2.5 text-sm font-bold text-white hover:bg-safety-orange/90 transition-colors">
              View All Tires
            </Link>
          </div>
        ) : (
          <>
            {compositeSize && (
              <p className="mb-4 text-sm text-gray-500">
                Showing tires for size <span className="font-mono font-bold text-gray-900">{compositeSize}</span>
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {result.models.filter((m) => m.min_price != null && m.min_price > 0 && !/retread/i.test(m.model_name) && resolveImage(m.thumbnail_url)).map((m) => {
                const brandSlug = toSlug(m.make_name);
                const modelSlug = toSlug(m.model_name);
                const tireType = mapType(m.season, m.terrain, m.category);
                const hasPrice = true;
                const speeds = m.speed_ratings?.split(",").filter(Boolean).slice(0, 3) ?? [];
                const sizeSlug = (size || compositeSize || "").toLowerCase().replace(/\//g, "-").replace(/\./g, "-");

                return (
                  <Link
                    key={`${brandSlug}-${modelSlug}`}
                    href={sizeSlug ? `/tires/${brandSlug}/${modelSlug}/${sizeSlug}` : `/tires/${brandSlug}/${modelSlug}`}
                    className="group flex flex-col rounded-2xl border border-gray-200 bg-white overflow-hidden transition-all hover:shadow-lg hover:border-safety-orange/30"
                  >
                    {/* Image */}
                    <div className="relative flex items-center justify-center bg-gradient-to-b from-gray-50 to-white p-5 h-48">
                      {resolveImage(m.thumbnail_url) ? (
                        <TireImage
                          src={resolveImage(m.thumbnail_url)!}
                          alt={`${m.make_name} ${m.model_name}`}
                          width={180}
                          height={180}
                          className="h-40 w-40 object-contain group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <svg className="h-24 w-24 text-gray-200" fill="none" viewBox="0 0 24 24" strokeWidth={0.5} stroke="currentColor">
                          <circle cx="12" cy="12" r="9" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                      <span className="absolute top-3 left-3 rounded-full bg-green-50 border border-green-200 px-2 py-0.5 text-[10px] font-bold text-green-700">
                        Free Ship
                      </span>
                      <span className="absolute top-3 right-3 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                        {typeLabels[tireType] || tireType}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="flex flex-1 flex-col p-4 border-t border-gray-100">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{m.make_name}</p>
                      <h3 className="text-base font-bold text-gray-900 group-hover:text-safety-orange transition-colors leading-tight mt-0.5">
                        {m.model_name}
                      </h3>

                      <div className="mt-3 flex items-baseline justify-between">
                        <div>
                          <span className="text-sm font-semibold text-gray-900">View Pricing</span>
                          <span className="text-xs text-green-600 ml-1">Free Shipping</span>
                        </div>
                        <span className="text-xs font-mono text-gray-400">{m.tire_count} size{m.tire_count !== 1 ? "s" : ""}</span>
                      </div>

                      {/* Quick specs */}
                      {(m.warranty || speeds.length > 0) && (
                        <div className="mt-3 flex items-center gap-3 text-[11px] text-gray-400 border-t border-gray-100 pt-3">
                          {m.warranty && <span>{m.warranty}</span>}
                          {speeds.length > 0 && <span>Speed: {speeds.join(", ")}</span>}
                        </div>
                      )}

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
                    className="rounded-full border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    Previous
                  </Link>
                )}
                <span className="px-4 py-2.5 text-sm text-gray-400 font-mono">
                  {page} / {result.totalPages}
                </span>
                {page < result.totalPages && (
                  <Link
                    href={`/search?${baseQuery}page=${page + 1}`}
                    className="rounded-full bg-safety-orange px-5 py-2.5 text-sm font-bold text-white hover:bg-safety-orange/90 transition-colors"
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
