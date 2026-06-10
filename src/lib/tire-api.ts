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

// ---------------------------------------------------------------------------
// In-memory price cache — tire_size_id → MAP price, 1-hour TTL
// ---------------------------------------------------------------------------
const PRICE_CACHE_TTL = 60 * 60 * 1000; // 1 hour
const priceCache = new Map<number, { price: number; ts: number }>();

function getCachedPrice(id: number): number | undefined {
  const entry = priceCache.get(id);
  if (!entry) return undefined;
  if (Date.now() - entry.ts > PRICE_CACHE_TTL) {
    priceCache.delete(id);
    return undefined;
  }
  return entry.price;
}

function setCachedPrice(id: number, price: number): void {
  priceCache.set(id, { price, ts: Date.now() });
}

/** Fetch a single tire's MAP price, using cache when available */
async function fetchTirePrice(tireId: number): Promise<number> {
  const cached = getCachedPrice(tireId);
  if (cached !== undefined) return cached;

  const tire = await apiFetch<ApiTire>(`/tires/${tireId}`, 8000);
  const price = tire?.price ?? 0;
  if (price > 0) setCachedPrice(tireId, price);
  return price;
}

/** Batch-fetch prices for an array of tire IDs with concurrency limit */
async function batchFetchPrices(
  ids: number[],
  concurrency = 5
): Promise<Map<number, number>> {
  const results = new Map<number, number>();

  for (let i = 0; i < ids.length; i += concurrency) {
    const batch = ids.slice(i, i + concurrency);
    const prices = await Promise.allSettled(
      batch.map(async (id) => {
        const price = await fetchTirePrice(id);
        return { id, price };
      })
    );
    for (const r of prices) {
      if (r.status === "fulfilled" && r.value.price > 0) {
        results.set(r.value.id, r.value.price);
      }
    }
  }

  return results;
}

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
  make_image_url?: string | null;
  make_image?: string | null;
  price?: number | null;
}

/** Detail from /tire-patterns/{id} endpoint */
interface ApiPatternDetail {
  id: number;
  name: string;
  image_url: string | null;
  description: string | null;
  features: string | null;
  benefits: string | null;
  three_pmsf: boolean | null;
  manufacturer_url: string | null;
  tire_make: { id: number; name: string; image_url: string | null } | null;
  tire_sizes: ApiPatternTireSize[];
}

interface ApiPatternTireSize {
  id: number;
  name: string;
  item_number?: string;
  three_pmsf?: boolean | null;
  season?: string | null;
  terrain?: string | null;
  studdable?: boolean | null;
  category?: string | null;
  run_flat?: boolean | null;
  mud_and_snow?: boolean | null;
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

  // Fetch representative price per pattern:
  // Get each pattern's first tire_size via /tire-patterns/{id}, then fetch its price
  const patternIds = patterns.map((p) => p.id);
  const patternPrices = new Map<number, number>();

  // Batch fetch pattern details (5 concurrent) to get first tire_size_id
  const BATCH = 5;
  for (let i = 0; i < patternIds.length; i += BATCH) {
    const batch = patternIds.slice(i, i + BATCH);
    const details = await Promise.allSettled(
      batch.map((pid) => apiFetch<ApiPatternDetail>(`/tire-patterns/${pid}`, 8000))
    );

    // Collect first tire_size_id from each pattern
    const tireIdsToFetch: { patternId: number; tireId: number }[] = [];
    for (let j = 0; j < details.length; j++) {
      const result = details[j];
      if (result.status === "fulfilled" && result.value?.tire_sizes?.length) {
        tireIdsToFetch.push({
          patternId: batch[j],
          tireId: result.value.tire_sizes[0].id,
        });
      }
    }

    // Fetch prices for these tire IDs
    const priceResults = await Promise.allSettled(
      tireIdsToFetch.map(async ({ patternId, tireId }) => {
        const price = await fetchTirePrice(tireId);
        return { patternId, price };
      })
    );

    for (const r of priceResults) {
      if (r.status === "fulfilled" && r.value.price > 0) {
        patternPrices.set(r.value.patternId, r.value.price);
      }
    }
  }

  return patterns.map((p) => ({
    model_name: p.name,
    tire_count: p.size_count || 0,
    min_price: patternPrices.get(p.id) ?? null,
    max_price: patternPrices.get(p.id) ?? null,
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
  const encoded = encodeURIComponent(brandName);

  // Step 1: Find the pattern from the patterns endpoint
  let matchedPattern: ApiPattern | null = null;
  let page = 1;
  const maxPages = 10;

  while (page <= maxPages && !matchedPattern) {
    const raw = await apiFetch<ApiPatternsResponse>(
      `/tire-patterns/catalog?make_name=${encoded}&per_page=200&page=${page}`
    );
    if (!raw) break;
    const { patterns, lastPage } = unwrapPatterns(raw);
    if (patterns.length === 0) break;

    for (const p of patterns) {
      const pSlug = p.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      if (pSlug === modelSlug) {
        matchedPattern = p;
        break;
      }
    }

    if (page >= lastPage) break;
    page++;
  }

  if (!matchedPattern) return null;

  // Step 2: Get the pattern detail (includes tire_sizes list, image, description)
  const detail = await apiFetch<ApiPatternDetail>(
    `/tire-patterns/${matchedPattern.id}`,
    20000
  );

  if (!detail || !detail.tire_sizes || detail.tire_sizes.length === 0) {
    return null;
  }

  // Step 3: Fetch individual tire details in parallel batches
  const tireIds = detail.tire_sizes.map((ts) => ts.id);
  const BATCH_SIZE = 20;
  const allTireRows: TireRow[] = [];
  const patternImageUrl = detail.image_url;

  for (let i = 0; i < tireIds.length; i += BATCH_SIZE) {
    const batch = tireIds.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map((id) => apiFetch<ApiTire>(`/tires/${id}`, 10000))
    );

    for (const result of results) {
      if (result.status === "fulfilled" && result.value) {
        const row = apiTireToRow(result.value);
        // Cache the price for reuse across pages
        if (row.price_map && row.price_map > 0) {
          setCachedPrice(row.id, row.price_map);
        }
        // Use the pattern's high-quality image as thumbnail if tire has none
        if (!row.thumbnail_url && patternImageUrl) {
          row.thumbnail_url = patternImageUrl;
        }
        allTireRows.push(row);
      }
    }
  }

  // If individual fetches failed, fall back to creating rows from tire_sizes
  if (allTireRows.length === 0) {
    for (const ts of detail.tire_sizes) {
      const parsed = parseTireName(ts.name);
      allTireRows.push({
        id: ts.id,
        name: ts.name,
        item_number: ts.item_number || "",
        tire_model_id: detail.id,
        tire_make_id: detail.tire_make?.id ?? null,
        make_name: brandName,
        make_image_url: detail.tire_make?.image_url ?? null,
        model_name: detail.name,
        width: parsed.width,
        aspect_ratio: parsed.aspectRatio,
        rim_size: parsed.rimSize,
        section_width: null, diameter_overall: null,
        load_rating: null, speed_rating: null,
        ply_rating: null, load_range: null,
        load_capacity_single: null, load_capacity_dual: null,
        max_inflation_pressure: null, tread_depth: null,
        weight: null, utqg: null,
        season: ts.season ?? null, terrain: ts.terrain ?? null,
        category: ts.category ?? null,
        studdable: ts.studdable ? 1 : 0,
        three_pmsf: ts.three_pmsf ? 1 : 0,
        run_flat: ts.run_flat ? 1 : 0,
        mud_and_snow: ts.mud_and_snow ? 1 : 0,
        price_map: 0, warranty: null, gm_code: null,
        upc: null, ean: null, asin: null,
        image_0100_url: null, image_0200_url: null,
        image_0301_url: null, image_0302_url: null,
        thumbnail_url: patternImageUrl,
        angle_image_url: null, front_image_url: null,
        side_image_url: null, side2_image_url: null,
        local_thumbnail: null, local_angle: null,
        local_front: null, local_side: null, local_side2: null,
        has_detail: 0, updated_at: new Date().toISOString(),
      });
    }
  }

  return { brand: brandName, model: detail.name, tires: allTireRows };
}

/** Parse width/aspect_ratio/rim_size from tire name like "205/50R17 XL Crossclimate 2" */
function parseTireName(name: string): { width: string | null; aspectRatio: string | null; rimSize: string | null } {
  const m = name.match(/^(\d+)\/(\d+)R(\d+(?:\.\d+)?)/i);
  if (m) return { width: m[1], aspectRatio: m[2], rimSize: m[3] };
  return { width: null, aspectRatio: null, rimSize: null };
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
  // Filter to curated brands only
  const curatedTires = apiTires.filter((t) => isCuratedBrand(t.make_name));
  const tires = curatedTires.map(apiTireToRow);
  const totalPages = lastPage || Math.ceil(total / limit);

  // Enrich with MAP prices for tires missing price
  const needPrice = tires.filter((t) => !t.price_map || t.price_map === 0);
  if (needPrice.length > 0) {
    const idsToFetch = needPrice.map((t) => t.id);
    const prices = await batchFetchPrices(idsToFetch, 5);
    for (const tire of needPrice) {
      const price = prices.get(tire.id);
      if (price) tire.price_map = price;
    }
  }

  return { tires, total: tires.length, page, limit, totalPages };
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
    make_image_url: t.make_image_url ?? t.make_image ?? null,
    model_name: t.model_name ?? "",
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
    price_map: t.price ?? 0,
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
