/**
 * TireWebLibrary API client — server-side fallback when Turso DB is empty/down.
 *
 * Base: https://app.tireweblibrary.com/api/v1/
 * Auth: x-api-key header (env var TIRE_API_KEY)
 * Rate limit: 200 req/min
 */

import type { BrandSummaryRow, ModelSummaryRow, TireRow } from "./db/types";
import { isCuratedBrand, getBrandLogo } from "./curated-brands";

const API_BASE = "https://app.tireweblibrary.com/api/v1";

function getApiKey(): string {
  return process.env.TIRE_API_KEY || "";
}

async function apiFetch<T>(path: string, timeout = 10000): Promise<T | null> {
  const key = getApiKey();
  if (!key || key === "your-tire-web-library-api-key") {
    console.warn("[tire-api] TIRE_API_KEY not configured");
    return null;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { "x-api-key": key, Accept: "application/json" },
      signal: controller.signal,
      next: { revalidate: 300 },
    });
    if (!res.ok) {
      console.warn(`[tire-api] ${path} returned ${res.status}`);
      return null;
    }
    return (await res.json()) as T;
  } catch (e) {
    console.warn(`[tire-api] fetch failed: ${e instanceof Error ? e.message : e}`);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// API response shapes
// ---------------------------------------------------------------------------

interface ApiMake {
  id: number;
  name: string;
  image_url: string | null;
  tire_count?: number;
  model_count?: number;
}

interface ApiPattern {
  id: number;
  name: string;
  make_name: string;
  description: string | null;
  image_url: string | null;
  size_count: number;
  season?: string | null;
  terrain?: string | null;
  category?: string | null;
}

interface ApiTire {
  id: number;
  name: string;
  item_number: string;
  make_name: string;
  model_name: string;
  width: string | null;
  aspect_ratio: string | null;
  rim_size: string | null;
  load_rating: string | null;
  speed_rating: string | null;
  thumbnail_url?: string | null;
  thumbnail_image?: string | null;
  image_0100_url?: string | null;
  image_0100?: string | null;
  season: string | null;
  terrain: string | null;
  category: string | null;
  section_width: string | null;
  diameter_overall: string | null;
  ply_rating: string | null;
  load_range: string | null;
  load_capacity_single: string | null;
  load_capacity_dual: string | null;
  max_inflation_pressure: string | null;
  tread_depth: string | null;
  weight: string | null;
  utqg: string | null;
  studdable: boolean | null;
  three_pmsf: boolean | null;
  run_flat: boolean | null;
  mud_and_snow: boolean | null;
  warranty: string | null;
  upc: string | null;
  ean: string | null;
  asin: string | null;
  make_image_url: string | null;
}

interface ApiCatalogResponse {
  data?: ApiTire[];
  results?: { data: ApiTire[]; total: number; per_page: number; current_page: number; last_page: number; from: number; to: number };
  meta?: { total: number; per_page: number; current_page: number; last_page: number };
}

interface ApiPatternsResponse {
  data?: ApiPattern[];
  results?: { data: ApiPattern[]; total: number; last_page: number; per_page: number };
  meta?: { total: number };
}

/** Unwrap API response — handles both {results: {data: [...]}} and {data: [...]} formats */
function unwrapCatalog(raw: ApiCatalogResponse): { tires: ApiTire[]; total: number; lastPage: number } {
  if (raw.results?.data) {
    return { tires: raw.results.data, total: raw.results.total, lastPage: raw.results.last_page };
  }
  if (raw.data) {
    return { tires: raw.data, total: raw.meta?.total ?? raw.data.length, lastPage: raw.meta?.last_page ?? 1 };
  }
  return { tires: [], total: 0, lastPage: 0 };
}

function unwrapPatterns(raw: ApiPatternsResponse): { patterns: ApiPattern[]; total: number; lastPage: number } {
  if (raw.results?.data) {
    return { patterns: raw.results.data, total: raw.results.total, lastPage: raw.results.last_page };
  }
  if (raw.data) {
    return { patterns: raw.data, total: raw.meta?.total ?? raw.data.length, lastPage: 1 };
  }
  return { patterns: [], total: 0, lastPage: 0 };
}

// ---------------------------------------------------------------------------
// Public fallback functions — match the turso.ts interface
// ---------------------------------------------------------------------------

export async function apiGetAllBrands(): Promise<BrandSummaryRow[]> {
  const data = await apiFetch<ApiMake[] | { data: ApiMake[] }>("/tire-makes");
  if (!data) return [];

  const makes: ApiMake[] = Array.isArray(data) ? data : (data as { data: ApiMake[] }).data;
  if (!makes || makes.length === 0) return [];

  return makes
    .filter((m) => isCuratedBrand(m.name))
    .map((m) => ({
      make_name: m.name,
      make_image_url: getBrandLogo(m.name) || m.image_url,
      local_logo: getBrandLogo(m.name),
      tire_count: m.tire_count ?? 0,
      model_count: m.model_count ?? 0,
    }));
}

export async function apiGetModelsByBrand(brandName: string): Promise<ModelSummaryRow[]> {
  const encoded = encodeURIComponent(brandName);
  const raw = await apiFetch<ApiPatternsResponse>(
    `/tire-patterns/catalog?make_name=${encoded}&per_page=200`
  );
  if (!raw) return [];

  const { patterns } = unwrapPatterns(raw as ApiPatternsResponse);
  if (patterns.length === 0) return [];

  return patterns.map((p) => ({
    model_name: p.name,
    tire_count: p.size_count || 0,
    min_price: null,
    max_price: null,
    season: p.season ?? null,
    terrain: p.terrain ?? null,
    category: p.category ?? null,
    thumbnail_url: p.image_url ?? null,
  }));
}

/** Get model count for a brand (from patterns endpoint total) */
export async function apiGetBrandModelCount(brandName: string): Promise<number> {
  const encoded = encodeURIComponent(brandName);
  const raw = await apiFetch<ApiPatternsResponse>(
    `/tire-patterns/catalog?make_name=${encoded}&per_page=1`
  );
  if (!raw) return 0;
  const { total } = unwrapPatterns(raw as ApiPatternsResponse);
  return total;
}

export async function apiGetModelBySlug(
  brandName: string,
  modelSlug: string
): Promise<{ brand: string; model: string; tires: TireRow[] } | null> {
  // Fetch tires for the brand, then filter by model slug match
  const encoded = encodeURIComponent(brandName);
  let allTires: ApiTire[] = [];
  let page = 1;
  const maxPages = 30;

  while (page <= maxPages) {
    const raw = await apiFetch<ApiCatalogResponse>(
      `/tires/catalog?make_name=${encoded}&per_page=100&page=${page}`
    );
    if (!raw) break;
    const { tires, lastPage } = unwrapCatalog(raw);
    if (tires.length === 0) break;
    allTires = allTires.concat(tires);

    if (page >= lastPage) break;
    page++;
  }

  if (allTires.length === 0) return null;

  // Find tires matching this model slug
  const matchingTires = allTires.filter((t) => {
    const slug = t.model_name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    return slug === modelSlug;
  });

  if (matchingTires.length === 0) return null;

  const modelName = matchingTires[0].model_name;
  const tireRows: TireRow[] = matchingTires.map(apiTireToRow);

  return { brand: brandName, model: modelName, tires: tireRows };
}

export async function apiGetStats(): Promise<{
  brandCount: number;
  modelCount: number;
  tireCount: number;
}> {
  const data = await apiFetch<ApiMake[] | { data: ApiMake[] }>("/tire-makes");
  if (!data) return { brandCount: 34, modelCount: 1000, tireCount: 100000 };

  const makes: ApiMake[] = Array.isArray(data) ? data : (data as { data: ApiMake[] }).data;
  const curated = makes.filter((m) => isCuratedBrand(m.name));
  return {
    brandCount: curated.length || 34,
    modelCount: curated.reduce((sum, m) => sum + (m.model_count ?? 0), 0) || 1000,
    tireCount: curated.reduce((sum, m) => sum + (m.tire_count ?? 0), 0) || 100000,
  };
}

// ---------------------------------------------------------------------------
// Search via API — used as primary until extraction script completes
// ---------------------------------------------------------------------------

import type { SearchParams, SearchResult } from "./db/types";

export async function apiSearchTires(params: SearchParams): Promise<SearchResult> {
  const page = params.page ?? 1;
  const limit = Math.min(params.limit ?? 24, 100);

  // Build API query params
  const qp = new URLSearchParams();
  qp.set("per_page", String(limit));
  qp.set("page", String(page));

  if (params.brand) {
    // Resolve slug to brand name from API brands
    const brands = await apiGetAllBrands();
    const match = brands.find((b) => b.make_name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") === params.brand);
    if (match) qp.set("make_name", match.make_name);
  }
  if (params.season) qp.set("season", params.season);
  if (params.terrain) qp.set("terrain", params.terrain);
  if (params.size) {
    const m = params.size.match(/^(\d{2,3})\/(\d{2,3})R(\d{2,3})$/i);
    if (m) {
      qp.set("width", m[1]);
      qp.set("aspect_ratio", m[2]);
      qp.set("rim_size", m[3]);
    }
  }
  if (params.width) qp.set("width", params.width);
  if (params.aspectRatio) qp.set("aspect_ratio", params.aspectRatio);
  if (params.rimSize) qp.set("rim_size", params.rimSize);
  if (params.query) qp.set("search", params.query);

  const raw = await apiFetch<ApiCatalogResponse>(
    `/tires/catalog?${qp.toString()}`,
    15000
  );

  if (!raw) {
    return { tires: [], total: 0, page, limit, totalPages: 0 };
  }

  const { tires: apiTires, total, lastPage } = unwrapCatalog(raw);
  const tires = apiTires.map(apiTireToRow);
  const totalPages = lastPage || Math.ceil(total / limit);

  return { tires, total, page, limit, totalPages };
}

// ---------------------------------------------------------------------------
// Distinct sizes for a brand (API-primary)
// ---------------------------------------------------------------------------

export async function apiGetDistinctSizesForBrand(
  brandName: string
): Promise<{ width: string; aspect_ratio: string; rim_size: string; count: number }[]> {
  const encoded = encodeURIComponent(brandName);
  const sizeMap = new Map<string, { width: string; aspect_ratio: string; rim_size: string; count: number }>();

  let page = 1;
  const maxPages = 10;

  while (page <= maxPages) {
    const raw = await apiFetch<ApiCatalogResponse>(
      `/tires/catalog?make_name=${encoded}&per_page=100&page=${page}`
    );
    if (!raw) break;
    const { tires: catalogTires, lastPage } = unwrapCatalog(raw);
    if (catalogTires.length === 0) break;

    for (const t of catalogTires) {
      if (!t.width || !t.aspect_ratio || !t.rim_size) continue;
      const key = `${t.width}|${t.aspect_ratio}|${t.rim_size}`;
      const existing = sizeMap.get(key);
      if (existing) {
        existing.count++;
      } else {
        sizeMap.set(key, { width: t.width, aspect_ratio: t.aspect_ratio, rim_size: t.rim_size, count: 1 });
      }
    }

    if (page >= lastPage) break;
    page++;
  }

  return [...sizeMap.values()].sort((a, b) => b.count - a.count);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function apiTireToRow(t: ApiTire): TireRow {
  return {
    id: t.id,
    name: t.name,
    item_number: t.item_number || "",
    tire_model_id: null,
    tire_make_id: null,
    make_name: t.make_name,
    make_image_url: t.make_image_url ?? null,
    model_name: t.model_name,
    width: t.width,
    aspect_ratio: t.aspect_ratio,
    rim_size: t.rim_size,
    section_width: t.section_width ?? null,
    diameter_overall: t.diameter_overall ?? null,
    load_rating: t.load_rating,
    speed_rating: t.speed_rating,
    ply_rating: t.ply_rating ?? null,
    load_range: t.load_range ?? null,
    load_capacity_single: t.load_capacity_single ?? null,
    load_capacity_dual: t.load_capacity_dual ?? null,
    max_inflation_pressure: t.max_inflation_pressure ?? null,
    tread_depth: t.tread_depth ?? null,
    weight: t.weight ?? null,
    utqg: t.utqg ?? null,
    season: t.season,
    terrain: t.terrain,
    category: t.category,
    studdable: t.studdable ? 1 : 0,
    three_pmsf: t.three_pmsf ? 1 : 0,
    run_flat: t.run_flat ? 1 : 0,
    mud_and_snow: t.mud_and_snow ? 1 : 0,
    price_map: 0, // API doesn't provide prices
    warranty: t.warranty ?? null,
    gm_code: null,
    upc: t.upc ?? null,
    ean: t.ean ?? null,
    asin: t.asin ?? null,
    image_0100_url: t.image_0100_url ?? t.image_0100 ?? null,
    image_0200_url: null,
    image_0301_url: null,
    image_0302_url: null,
    thumbnail_url: t.thumbnail_url ?? t.thumbnail_image ?? null,
    angle_image_url: null,
    front_image_url: null,
    side_image_url: null,
    side2_image_url: null,
    local_thumbnail: null,
    local_angle: null,
    local_front: null,
    local_side: null,
    local_side2: null,
    has_detail: 0,
    updated_at: new Date().toISOString(),
  };
}
