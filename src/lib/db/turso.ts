import { createClient, type Client } from "@libsql/client";
import type {
  TireRow,
  ManufacturerRow,
  BrandSummaryRow,
  ModelSummaryRow,
  SearchParams,
  SearchResult,
} from "./types";
import {
  apiGetAllBrands,
  apiGetModelsByBrand,
  apiGetModelBySlug,
  apiGetStats,
  apiSearchTires,
  apiGetDistinctSizesForBrand,
} from "../tire-api";
import { isCuratedBrand, CURATED_BRANDS, getBrandLogo } from "../curated-brands";
import { brands as staticBrands } from "@/data/brands";

let _client: Client | null = null;

function getDb(): Client {
  if (_client) return _client;

  const url = process.env.TURSO_DATABASE_URL || "";
  const authToken = process.env.TURSO_AUTH_TOKEN || "";

  if (!url) throw new Error("TURSO_DATABASE_URL is required");

  _client = createClient({ url, authToken });
  return _client;
}

// ---------------------------------------------------------------------------
// Build-phase detection
// ---------------------------------------------------------------------------

const IS_BUILD = process.env.NEXT_PHASE === "phase-production-build";
const DEFAULT_TIMEOUT = IS_BUILD ? 30_000 : 20_000;

// ---------------------------------------------------------------------------
// Concurrency semaphore — prevents thundering herd against Turso
// ---------------------------------------------------------------------------

const MAX_CONCURRENT = 6;
let _running = 0;
const _queue: (() => void)[] = [];

function semAcquire(): Promise<void> {
  if (_running < MAX_CONCURRENT) {
    _running++;
    return Promise.resolve();
  }
  return new Promise<void>((resolve) => {
    _queue.push(() => { _running++; resolve(); });
  });
}

function semRelease(): void {
  _running--;
  if (_queue.length > 0) {
    const next = _queue.shift()!;
    next();
  }
}

/** Execute a query with semaphore, retry, timeout + error fallback. Returns empty rows on failure. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function safeExecute(stmt: any, timeoutMs = DEFAULT_TIMEOUT) {
  const db = getDb();
  const emptyResult = { rows: [] as any[], columns: [] as string[], columnTypes: [] as string[], rowsAffected: 0, lastInsertRowid: undefined };

  const attempt = async () => {
    const timeout = new Promise<never>((_, rej) => setTimeout(() => rej(new Error("DB_TIMEOUT")), timeoutMs));
    return Promise.race([db.execute(stmt), timeout]);
  };

  await semAcquire();
  try {
    return await attempt();
  } catch (e) {
    console.warn(`[turso] query attempt 1 failed: ${e instanceof Error ? e.message : e}, retrying in 1s…`);
  } finally {
    semRelease();
  }

  // Retry once with 1s backoff
  await new Promise((r) => setTimeout(r, 1000));
  await semAcquire();
  try {
    return await attempt();
  } catch (e) {
    console.warn(`[turso] query attempt 2 failed: ${e instanceof Error ? e.message : e}`);
    return emptyResult;
  } finally {
    semRelease();
  }
}

// ---------------------------------------------------------------------------
// Build-time caches — prevents 29 Vercel workers from each hitting Turso
// ---------------------------------------------------------------------------

let _allBrandsCache: { data: BrandSummaryRow[]; ts: number } | null = null;
let _allBrandsPromise: Promise<BrandSummaryRow[]> | null = null;
let _statsCache: { data: { brandCount: number; modelCount: number; tireCount: number }; ts: number } | null = null;
let _statsPromise: Promise<{ brandCount: number; modelCount: number; tireCount: number }> | null = null;
const CACHE_TTL = IS_BUILD ? 1_800_000 : 300_000; // Build: 30 min, Runtime: 5 min

// ---------------------------------------------------------------------------
// Brand queries
// ---------------------------------------------------------------------------

export async function getAllBrands(): Promise<BrandSummaryRow[]> {
  // Return cached if fresh
  if (_allBrandsCache && Date.now() - _allBrandsCache.ts < CACHE_TTL) {
    return _allBrandsCache.data;
  }
  // Deduplicate concurrent calls (29 workers hitting at once)
  if (_allBrandsPromise) return _allBrandsPromise;

  _allBrandsPromise = _fetchAllBrands().finally(() => { _allBrandsPromise = null; });
  return _allBrandsPromise;
}

async function _fetchAllBrands(): Promise<BrandSummaryRow[]> {
  // DB-primary: try Turso first, filter to curated brands
  const result = await safeExecute(
    `SELECT
      make_name,
      MAX(make_image_url) as make_image_url,
      NULL as local_logo,
      COUNT(*) as tire_count,
      COUNT(DISTINCT model_name) as model_count
    FROM tires
    WHERE make_name IS NOT NULL AND make_name != ''
    GROUP BY make_name
    ORDER BY make_name ASC`
  );
  const dbRows = (result.rows as unknown as BrandSummaryRow[]).filter(
    (r) => isCuratedBrand(r.make_name)
  );
  if (dbRows.length > 0) {
    _allBrandsCache = { data: dbRows, ts: Date.now() };
    return dbRows;
  }

  // DB empty/failed — fall back to API
  const apiRows = await apiGetAllBrands();
  if (apiRows.length > 0) {
    _allBrandsCache = { data: apiRows, ts: Date.now() };
    return apiRows;
  }

  // API also failed — use static brand data as last resort
  console.log("[turso] Both DB and API failed — using static brand data");
  const staticRows: BrandSummaryRow[] = staticBrands.map((b) => ({
    make_name: b.name.toUpperCase(),
    make_image_url: getBrandLogo(b.name.toUpperCase()) || "",
    local_logo: getBrandLogo(b.name.toUpperCase()) || "",
    tire_count: b.models.reduce((acc, m) => acc + m.sizes.length, 0),
    model_count: b.models.length,
  }));
  _allBrandsCache = { data: staticRows, ts: Date.now() };
  return staticRows;
}

export async function getBrandBySlug(slug: string): Promise<BrandSummaryRow | null> {
  // API-primary: find brand from API brands list
  const apiBrands = await getAllBrands(); // Uses cached API result
  const apiMatch = apiBrands.find((b) => toSlug(b.make_name) === slug);
  return apiMatch ?? null;
}

export async function getManufacturer(brandName: string): Promise<ManufacturerRow | null> {
  const db = getDb();
  const result = await safeExecute({
    sql: `SELECT * FROM manufacturers WHERE UPPER(name) = UPPER(?)`,
    args: [brandName],
  });
  return (result.rows[0] as unknown as ManufacturerRow) ?? null;
}

// ---------------------------------------------------------------------------
// Model queries
// ---------------------------------------------------------------------------

const _modelsByBrandCache = new Map<string, { data: ModelSummaryRow[]; ts: number }>();
const _modelsByBrandPromise = new Map<string, Promise<ModelSummaryRow[]>>();

export async function getModelsByBrand(slug: string): Promise<ModelSummaryRow[]> {
  // Return cached if fresh
  const cached = _modelsByBrandCache.get(slug);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return cached.data;
  }
  // Deduplicate concurrent calls for the same slug
  const pending = _modelsByBrandPromise.get(slug);
  if (pending) return pending;

  const promise = _fetchModelsByBrand(slug).finally(() => {
    _modelsByBrandPromise.delete(slug);
  });
  _modelsByBrandPromise.set(slug, promise);
  return promise;
}

async function _fetchModelsByBrand(slug: string): Promise<ModelSummaryRow[]> {
  // Resolve brand name from slug
  let brandName: string | null = null;
  const slugMap = await getBrandSlugMap();
  brandName = slugMap.get(slug) ?? null;
  if (!brandName) {
    const apiBrands = await apiGetAllBrands();
    const match = apiBrands.find((b) => toSlug(b.make_name) === slug);
    if (match) brandName = match.make_name;
    else return [];
  }

  // DB-primary: try Turso first
  const result = await safeExecute({
    sql: `SELECT
      model_name,
      COUNT(*) as tire_count,
      MIN(CASE WHEN price_map > 0 THEN price_map END) as min_price,
      MAX(CASE WHEN price_map > 0 THEN price_map END) as max_price,
      MAX(season) as season,
      MAX(terrain) as terrain,
      MAX(category) as category,
      MAX(thumbnail_url) as thumbnail_url
    FROM tires
    WHERE make_name = ?
      AND model_name IS NOT NULL AND model_name != ''
    GROUP BY model_name
    ORDER BY model_name ASC`,
    args: [brandName],
  });
  const rows = result.rows as unknown as ModelSummaryRow[];
  if (rows.length > 0) {
    _modelsByBrandCache.set(slug, { data: rows, ts: Date.now() });
    return rows;
  }

  // DB empty — fall back to API
  const apiRows = await apiGetModelsByBrand(brandName);
  if (apiRows.length > 0) {
    _modelsByBrandCache.set(slug, { data: apiRows, ts: Date.now() });
    return apiRows;
  }

  // Both failed — use static brand data
  const staticBrand = staticBrands.find(
    (b) => b.name.toUpperCase() === brandName!.toUpperCase()
  );
  if (staticBrand) {
    const staticRows = staticBrand.models.map((m) => ({
      model_name: m.name,
      tire_count: m.sizes.length,
      min_price: m.priceRange?.[0] ?? null,
      max_price: m.priceRange?.[1] ?? null,
      season: m.type === "all-season" ? "All-Season" : m.type === "winter" ? "Winter" : m.type === "performance" ? "Summer" : null,
      terrain: null,
      category: m.type,
      thumbnail_url: null,
    })) as ModelSummaryRow[];
    _modelsByBrandCache.set(slug, { data: staticRows, ts: Date.now() });
    return staticRows;
  }
  return [];
}

export async function getModelBySlug(
  brandSlug: string,
  modelSlug: string
): Promise<{ brand: string; model: string; tires: TireRow[] } | null> {
  // Resolve brand name
  let brandName: string | null = null;
  const slugMap = await getBrandSlugMap();
  brandName = slugMap.get(brandSlug) ?? null;
  if (!brandName) {
    const apiBrands = await apiGetAllBrands();
    const match = apiBrands.find((b) => toSlug(b.make_name) === brandSlug);
    brandName = match?.make_name ?? null;
  }
  if (!brandName) return null;

  // DB-primary: try Turso first
  const modelName = await slugToModelName(brandName, modelSlug);
  if (modelName) {
    const result = await safeExecute({
      sql: `SELECT * FROM tires
      WHERE make_name = ? AND model_name = ?
      ORDER BY
        CAST(width AS INTEGER),
        CAST(aspect_ratio AS INTEGER),
        CAST(rim_size AS INTEGER)`,
      args: [brandName, modelName],
    });
    const tires = result.rows as unknown as TireRow[];
    if (tires.length > 0) return { brand: brandName, model: modelName, tires };
  }

  // DB empty — fall back to API
  return apiGetModelBySlug(brandName, modelSlug);
}

// ---------------------------------------------------------------------------
// Size queries
// ---------------------------------------------------------------------------

export async function getTiresBySize(
  width: string,
  aspectRatio: string,
  rimSize: string
): Promise<TireRow[]> {
  const db = getDb();
  const result = await safeExecute({
    sql: `SELECT * FROM tires
    WHERE width = ? AND aspect_ratio = ? AND rim_size = ?
    ORDER BY make_name, model_name`,
    args: [width, aspectRatio, rimSize],
  });
  return result.rows as unknown as TireRow[];
}

export async function getTiresByBrandAndSize(
  brandSlug: string,
  width: string,
  aspectRatio: string,
  rimSize: string
): Promise<TireRow[]> {
  const brandName = await slugToBrandName(brandSlug);
  if (!brandName) return [];
  const db = getDb();
  const result = await safeExecute({
    sql: `SELECT * FROM tires
    WHERE make_name = ? AND width = ? AND aspect_ratio = ? AND rim_size = ?
    ORDER BY model_name`,
    args: [brandName, width, aspectRatio, rimSize],
  });
  return result.rows as unknown as TireRow[];
}

export async function getDistinctSizesForBrand(
  brandSlug: string
): Promise<{ width: string; aspect_ratio: string; rim_size: string; count: number }[]> {
  const brandName = await slugToBrandName(brandSlug);
  if (!brandName) return [];

  // DB-primary: try Turso first
  const result = await safeExecute({
    sql: `SELECT width, aspect_ratio, rim_size, COUNT(*) as count
    FROM tires
    WHERE make_name = ? AND width IS NOT NULL AND aspect_ratio IS NOT NULL AND rim_size IS NOT NULL
    GROUP BY width, aspect_ratio, rim_size
    ORDER BY count DESC
    LIMIT 100`,
    args: [brandName],
  });
  const rows = result.rows as unknown as { width: string; aspect_ratio: string; rim_size: string; count: number }[];
  if (rows.length > 0) return rows;

  // DB empty — fall back to API
  return apiGetDistinctSizesForBrand(brandName);
}

export async function getDistinctSizes(): Promise<{ width: string; aspect_ratio: string; rim_size: string; count: number }[]> {
  const db = getDb();
  const result = await safeExecute(
    `SELECT width, aspect_ratio, rim_size, COUNT(*) as count
    FROM tires
    WHERE width IS NOT NULL AND aspect_ratio IS NOT NULL AND rim_size IS NOT NULL
    GROUP BY width, aspect_ratio, rim_size
    ORDER BY count DESC
    LIMIT 500`
  );
  return result.rows as unknown as { width: string; aspect_ratio: string; rim_size: string; count: number }[];
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

export async function searchTires(params: SearchParams): Promise<SearchResult> {
  // DB-primary: try Turso first
  const page = params.page ?? 1;
  const limit = Math.min(params.limit ?? 24, 100);
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const values: (string | number)[] = [];

  if (params.brand) {
    const brandName = await slugToBrandName(params.brand);
    if (brandName) {
      conditions.push("make_name = ?");
      values.push(brandName);
    }
  } else {
    // No specific brand — filter to curated brands only
    const brands = Array.from(CURATED_BRANDS.keys());
    conditions.push(`make_name IN (${brands.map(() => "?").join(", ")})`);
    values.push(...brands);
  }

  if (params.width) { conditions.push("width = ?"); values.push(params.width); }
  if (params.aspectRatio) { conditions.push("aspect_ratio = ?"); values.push(params.aspectRatio); }
  if (params.rimSize) { conditions.push("rim_size = ?"); values.push(params.rimSize); }

  if (params.size) {
    const match = params.size.match(/^(\d{2,3})\/(\d{2,3})R(\d{2,3})$/i);
    if (match) {
      conditions.push("width = ? AND aspect_ratio = ? AND rim_size = ?");
      values.push(match[1], match[2], match[3]);
    }
  }

  if (params.season) { conditions.push("season = ?"); values.push(params.season); }
  if (params.terrain) { conditions.push("terrain = ?"); values.push(params.terrain); }
  if (params.category) { conditions.push("category LIKE ?"); values.push(`%${params.category}%`); }
  if (params.minPrice != null) { conditions.push("price_map >= ?"); values.push(params.minPrice); }
  if (params.maxPrice != null) { conditions.push("price_map <= ?"); values.push(params.maxPrice); }

  if (params.query) {
    conditions.push("(name LIKE ? OR model_name LIKE ? OR make_name LIKE ?)");
    const q = `%${params.query}%`;
    values.push(q, q, q);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const countResult = await safeExecute({ sql: `SELECT COUNT(*) as total FROM tires ${where}`, args: values });
  const total = Number((countResult.rows[0] as unknown as { total: number })?.total ?? 0);

  if (total > 0) {
    const tiresResult = await safeExecute({
      sql: `SELECT * FROM tires ${where}
      ORDER BY make_name, model_name, CAST(width AS INTEGER)
      LIMIT ? OFFSET ?`,
      args: [...values, limit, offset],
    });

    return {
      tires: tiresResult.rows as unknown as TireRow[],
      total,
      page,
      limit,
      totalPages: Math.min(Math.ceil(total / limit), 50),
    };
  }

  // DB returned nothing — fall back to API
  return apiSearchTires(params);
}

// ---------------------------------------------------------------------------
// Model-level search (for search page)
// ---------------------------------------------------------------------------

export interface ModelSearchRow {
  make_name: string;
  model_name: string;
  tire_count: number;
  min_price: number | null;
  max_price: number | null;
  thumbnail_url: string | null;
  make_image_url: string | null;
  season: string | null;
  terrain: string | null;
  category: string | null;
  warranty: string | null;
  speed_ratings: string | null;
}

export interface ModelSearchResult {
  models: ModelSearchRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function searchModels(params: SearchParams): Promise<ModelSearchResult> {
  const page = params.page ?? 1;
  const limit = Math.min(params.limit ?? 24, 100);
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const values: (string | number)[] = [];

  if (params.brand) {
    const brandName = await slugToBrandName(params.brand);
    if (brandName) {
      conditions.push("make_name = ?");
      values.push(brandName);
    }
  } else {
    const brands = Array.from(CURATED_BRANDS.keys());
    conditions.push(`make_name IN (${brands.map(() => "?").join(", ")})`);
    values.push(...brands);
  }

  if (params.width) { conditions.push("width = ?"); values.push(params.width); }
  if (params.aspectRatio) { conditions.push("aspect_ratio = ?"); values.push(params.aspectRatio); }
  if (params.rimSize) { conditions.push("rim_size = ?"); values.push(params.rimSize); }

  if (params.size) {
    const match = params.size.match(/^(\d{2,3})\/(\d{2,3})R(\d{2,3})$/i);
    if (match) {
      conditions.push("width = ? AND aspect_ratio = ? AND rim_size = ?");
      values.push(match[1], match[2], match[3]);
    }
  }

  if (params.season) { conditions.push("season = ?"); values.push(params.season); }
  if (params.terrain) { conditions.push("terrain = ?"); values.push(params.terrain); }
  if (params.category) { conditions.push("category LIKE ?"); values.push(`%${params.category}%`); }
  if (params.minPrice != null) { conditions.push("price_map >= ?"); values.push(params.minPrice); }
  if (params.maxPrice != null) { conditions.push("price_map <= ?"); values.push(params.maxPrice); }

  if (params.query) {
    conditions.push("(name LIKE ? OR model_name LIKE ? OR make_name LIKE ?)");
    const q = `%${params.query}%`;
    values.push(q, q, q);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const countResult = await safeExecute({
    sql: `SELECT COUNT(*) as total FROM (SELECT 1 FROM tires ${where} GROUP BY make_name, model_name)`,
    args: values,
  });
  const total = Number((countResult.rows[0] as unknown as { total: number })?.total ?? 0);

  if (total > 0) {
    const modelsResult = await safeExecute({
      sql: `SELECT
        make_name,
        model_name,
        COUNT(*) as tire_count,
        MIN(CASE WHEN price_map > 0 THEN price_map END) as min_price,
        MAX(price_map) as max_price,
        MAX(thumbnail_url) as thumbnail_url,
        MAX(make_image_url) as make_image_url,
        MAX(season) as season,
        MAX(terrain) as terrain,
        MAX(category) as category,
        MAX(warranty) as warranty,
        GROUP_CONCAT(DISTINCT speed_rating) as speed_ratings
      FROM tires ${where}
      GROUP BY make_name, model_name
      ORDER BY tire_count DESC
      LIMIT ? OFFSET ?`,
      args: [...values, limit, offset],
    });

    return {
      models: modelsResult.rows as unknown as ModelSearchRow[],
      total,
      page,
      limit,
      totalPages: Math.min(Math.ceil(total / limit), 50),
    };
  }

  return { models: [], total: 0, page, limit, totalPages: 0 };
}

// ---------------------------------------------------------------------------
// Top brands by tire type
// ---------------------------------------------------------------------------

export async function getTopBrandsForType(type: string): Promise<BrandSummaryRow[]> {
  const db = getDb();

  let condition = "";
  switch (type) {
    case "all-season": condition = "season IN ('All-Season', 'All-Weather')"; break;
    case "winter": condition = "season = 'Winter'"; break;
    case "summer": condition = "season = 'Summer'"; break;
    case "performance": condition = "(category LIKE '%performance%' OR category LIKE '%uhp%')"; break;
    case "all-terrain": condition = "terrain = 'All-Terrain (A/T)'"; break;
    case "mud-terrain": condition = "terrain = 'Mud-Terrain (M/T)'"; break;
    case "highway": condition = "terrain = 'Highway Terrain(H/T)'"; break;
    case "touring": condition = "category LIKE '%touring%'"; break;
    default: return [];
  }

  const result = await safeExecute(
    `SELECT
      t.make_name,
      MAX(t.make_image_url) as make_image_url,
      MAX(m.local_logo) as local_logo,
      COUNT(*) as tire_count,
      COUNT(DISTINCT t.model_name) as model_count
    FROM tires t
    LEFT JOIN manufacturers m ON UPPER(m.name) = UPPER(t.make_name)
    WHERE ${condition}
      AND t.make_name IS NOT NULL AND t.make_name != ''
    GROUP BY t.make_name
    ORDER BY tire_count DESC
    LIMIT 6`
  );
  return result.rows as unknown as BrandSummaryRow[];
}

// ---------------------------------------------------------------------------
// Showcase models per tire type (for homepage category section)
// ---------------------------------------------------------------------------

export interface ShowcaseModel {
  make_name: string;
  model_name: string;
  min_price: number;
  max_price: number;
  tire_count: number;
  thumbnail_url: string | null;
  make_image_url: string | null;
}

export async function getShowcaseModelsForType(type: string, limit = 2): Promise<ShowcaseModel[]> {
  const db = getDb();

  let condition = "";
  switch (type) {
    case "all-season": condition = "season IN ('All-Season', 'All-Weather')"; break;
    case "winter": condition = "season = 'Winter'"; break;
    case "summer": condition = "season = 'Summer'"; break;
    case "performance": condition = "(category LIKE '%performance%' OR category LIKE '%uhp%')"; break;
    case "all-terrain": condition = "terrain = 'All-Terrain (A/T)'"; break;
    case "mud-terrain": condition = "terrain = 'Mud-Terrain (M/T)'"; break;
    case "highway": condition = "terrain = 'Highway Terrain(H/T)'"; break;
    case "touring": condition = "category LIKE '%touring%'"; break;
    default: return [];
  }

  const result = await safeExecute(
    `SELECT
      make_name,
      model_name,
      MIN(price_map) as min_price,
      MAX(price_map) as max_price,
      COUNT(*) as tire_count,
      MAX(thumbnail_url) as thumbnail_url,
      MAX(make_image_url) as make_image_url
    FROM tires
    WHERE ${condition}
      AND price_map > 0
      AND thumbnail_url IS NOT NULL
      AND model_name NOT LIKE '%Retread%'
      AND model_name NOT LIKE '%Pre-Mold%'
    GROUP BY make_name, model_name
    ORDER BY tire_count DESC
    LIMIT ${limit}`
  );
  return result.rows as unknown as ShowcaseModel[];
}

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

export async function getStats(): Promise<{
  brandCount: number;
  modelCount: number;
  tireCount: number;
}> {
  // Return cached if fresh
  if (_statsCache && Date.now() - _statsCache.ts < CACHE_TTL) {
    return _statsCache.data;
  }
  // Deduplicate concurrent calls
  if (_statsPromise) return _statsPromise;

  _statsPromise = _fetchStats().finally(() => { _statsPromise = null; });
  return _statsPromise;
}

async function _fetchStats(): Promise<{
  brandCount: number;
  modelCount: number;
  tireCount: number;
}> {
  // DB-primary: try Turso first, filtered to curated brands
  const brands = Array.from(CURATED_BRANDS.keys());
  const placeholders = brands.map(() => "?").join(", ");
  const result = await safeExecute({
    sql: `SELECT
      COUNT(DISTINCT make_name) as brandCount,
      COUNT(DISTINCT model_name) as modelCount,
      COUNT(*) as tireCount
    FROM tires
    WHERE make_name IN (${placeholders})`,
    args: brands,
  });
  const row = result.rows[0] as unknown as { brandCount: number; modelCount: number; tireCount: number } | undefined;
  const stats = {
    brandCount: Number(row?.brandCount ?? 0),
    modelCount: Number(row?.modelCount ?? 0),
    tireCount: Number(row?.tireCount ?? 0),
  };

  if (stats.brandCount > 0) {
    _statsCache = { data: stats, ts: Date.now() };
    return stats;
  }

  // DB empty — fall back to API
  const apiStats = await apiGetStats();
  if (apiStats.brandCount > 0) {
    _statsCache = { data: apiStats, ts: Date.now() };
    return apiStats;
  }

  // Both failed — use static data
  const fallback = { brandCount: 34, modelCount: 800, tireCount: 307000 };
  _statsCache = { data: fallback, ts: Date.now() };
  return fallback;
}

// ---------------------------------------------------------------------------
// Single tire lookup by ID — used by /buy/[id] for Google Shopping checkout
// ---------------------------------------------------------------------------

export async function getTireById(id: number): Promise<TireRow | null> {
  const result = await safeExecute({
    sql: `SELECT * FROM tires WHERE id = ?`,
    args: [id],
  });
  if (result.rows.length === 0) return null;
  return result.rows[0] as unknown as TireRow;
}

// ---------------------------------------------------------------------------
// Feed export — large-batch query for Google Merchant Center / product feeds
// ---------------------------------------------------------------------------

export async function getTiresForFeed(
  offset: number,
  limit: number,
  filterBrands?: string[]
): Promise<{ tires: TireRow[]; total: number }> {
  // Use specific brands if provided, otherwise all curated brands
  const brands = filterBrands && filterBrands.length > 0
    ? filterBrands.map((b) => b.toUpperCase())
    : Array.from(CURATED_BRANDS.keys());
  const placeholders = brands.map(() => "?").join(", ");

  const countResult = await safeExecute({
    sql: `SELECT COUNT(*) as total FROM tires WHERE make_name IN (${placeholders}) AND price_map > 0`,
    args: brands,
  });
  const total = Number(
    (countResult.rows[0] as unknown as { total: number })?.total ?? 0
  );

  const result = await safeExecute(
    {
      sql: `SELECT * FROM tires
      WHERE make_name IN (${placeholders}) AND price_map > 0
      ORDER BY make_name, model_name, CAST(width AS INTEGER)
      LIMIT ? OFFSET ?`,
      args: [...brands, limit, offset],
    },
    60000
  );

  return { tires: result.rows as unknown as TireRow[], total };
}

// ---------------------------------------------------------------------------
// Helpers: slug <-> name resolution
// ---------------------------------------------------------------------------

let _brandSlugCache: Map<string, string> | null = null;

async function slugToBrandName(slug: string): Promise<string | null> {
  const map = await getBrandSlugMap();
  return map.get(slug) ?? null;
}

const _modelSlugCaches = new Map<string, Map<string, string>>();

async function slugToModelName(brandName: string, slug: string): Promise<string | null> {
  let cache = _modelSlugCaches.get(brandName);
  if (!cache) {
    cache = new Map();
    const db = getDb();
    const result = await safeExecute({
      sql: `SELECT DISTINCT model_name FROM tires
      WHERE make_name = ? AND model_name IS NOT NULL AND model_name != ''`,
      args: [brandName],
    });
    for (const row of result.rows) {
      const name = (row as unknown as { model_name: string }).model_name;
      cache.set(toSlug(name), name);
    }
    _modelSlugCaches.set(brandName, cache);
  }
  return cache.get(slug) ?? null;
}

export function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function getBrandSlugMap(): Promise<Map<string, string>> {
  if (_brandSlugCache) return _brandSlugCache;
  const db = getDb();
  const result = await safeExecute(
    `SELECT DISTINCT make_name FROM tires
    WHERE make_name IS NOT NULL AND make_name != ''
    ORDER BY make_name`
  );

  _brandSlugCache = new Map();
  for (const row of result.rows) {
    const name = (row as unknown as { make_name: string }).make_name;
    _brandSlugCache.set(toSlug(name), name);
  }

  // If DB returned nothing (timeout/empty), populate cache from API
  if (_brandSlugCache.size === 0) {
    console.log("[turso] getBrandSlugMap empty — populating from API");
    const apiBrands = await apiGetAllBrands();
    for (const b of apiBrands) {
      _brandSlugCache.set(toSlug(b.make_name), b.make_name);
    }
  }

  return _brandSlugCache;
}
