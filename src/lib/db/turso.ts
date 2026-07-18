import { createClient, type Client } from "@libsql/client";
import type {
  TireRow,
  ManufacturerRow,
  BrandSummaryRow,
  ModelSummaryRow,
  SearchParams,
  SearchResult,
  TireModelDetailsRow,
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
import brandSummaries from "@/data/generated/brand-summaries.json";
import modelSummaries from "@/data/generated/model-summaries.json";

// ---------------------------------------------------------------------------
// Per-brand tire data loader (reads from JSON files exported from SQLite)
// ---------------------------------------------------------------------------

interface CompactTire extends Array<unknown> {
  0: number;   // id
  1: string;   // width
  2: string;   // aspect_ratio
  3: string;   // rim_size
  4: string;   // load_rating
  5: string;   // speed_rating
  6: number;   // price_map
  7: string;   // name
  8?: { wt?: string; td?: string; utqg?: string; lr?: string; pr?: string }; // extras
}

interface BrandModelData {
  mn: string;   // model_name
  bn: string;   // brand_name
  sn: string | null;  // season
  tr: string | null;  // terrain
  ct: string | null;  // category
  wr: string | null;  // warranty
  pmsf: number;
  rf: number;
  ms: number;
  st: number;
  img: string | null;
  imgs?: { side?: string; angle?: string; front?: string; side2?: string; i100?: string };
  desc?: string;
  feat?: string;
  ben?: string;
  murl?: string;
  t: CompactTire[];
}

type BrandTireData = Record<string, BrandModelData>;

const _tireDataCache = new Map<string, BrandTireData | null>();

async function loadBrandTireData(brandSlug: string): Promise<BrandTireData | null> {
  const cached = _tireDataCache.get(brandSlug);
  if (cached !== undefined) return cached;
  try {
    let data: BrandTireData;
    if (process.env.VERCEL) {
      // On Vercel: fetch from CDN (public directory serves static files)
      const host = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
      const url = `https://${host}/tire-data/${brandSlug}.json`;
      const res = await fetch(url, { next: { revalidate: 86400 } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      data = await res.json();
    } else {
      // Locally: read from filesystem
      const { readFileSync } = await import("fs");
      const { join } = await import("path");
      const json = readFileSync(join(process.cwd(), "public", "tire-data", `${brandSlug}.json`), "utf8");
      data = JSON.parse(json);
    }
    _tireDataCache.set(brandSlug, data);
    return data;
  } catch (e) {
    console.warn(`[tire-data] Failed to load brand ${brandSlug}:`, e instanceof Error ? e.message : e);
    _tireDataCache.set(brandSlug, null);
    return null;
  }
}

/** Convert compact tire array to full TireRow */
function compactToTireRow(compact: CompactTire, model: BrandModelData): TireRow {
  const extras = (compact.length > 8 ? compact[8] : {}) as { wt?: string; td?: string; utqg?: string; lr?: string; pr?: string } | undefined;
  return {
    id: compact[0] as number,
    name: compact[7] as string,
    item_number: "",
    tire_model_id: null,
    tire_make_id: null,
    make_name: model.bn,
    make_image_url: null,
    model_name: model.mn,
    width: (compact[1] as string) || null,
    aspect_ratio: (compact[2] as string) || null,
    rim_size: (compact[3] as string) || null,
    section_width: null,
    diameter_overall: null,
    load_rating: (compact[4] as string) || null,
    speed_rating: (compact[5] as string) || null,
    ply_rating: extras?.pr ?? null,
    load_range: extras?.lr ?? null,
    load_capacity_single: null,
    load_capacity_dual: null,
    max_inflation_pressure: null,
    tread_depth: extras?.td ?? null,
    weight: extras?.wt ?? null,
    utqg: extras?.utqg ?? null,
    season: model.sn,
    terrain: model.tr,
    category: model.ct,
    studdable: model.st || null,
    three_pmsf: model.pmsf || null,
    run_flat: model.rf || null,
    mud_and_snow: model.ms || null,
    price_map: Number(compact[6]) || null,
    warranty: model.wr,
    gm_code: null,
    upc: null,
    ean: null,
    asin: null,
    image_0100_url: model.imgs?.i100 ?? null,
    image_0200_url: null,
    image_0301_url: null,
    image_0302_url: null,
    thumbnail_url: model.img,
    angle_image_url: model.imgs?.angle ?? null,
    front_image_url: model.imgs?.front ?? null,
    side_image_url: model.imgs?.side ?? null,
    side2_image_url: model.imgs?.side2 ?? null,
    local_thumbnail: null,
    local_angle: null,
    local_front: null,
    local_side: null,
    local_side2: null,
    has_detail: 0,
    updated_at: "",
  };
}

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

// ---------------------------------------------------------------------------
// Turso — primary tire catalog database (352K+ tires)
// Set TURSO_DISABLED=1 env var to force-disable and fall through to API.
// ---------------------------------------------------------------------------

const TURSO_FORCE_DISABLED = (process.env.TURSO_DISABLED || "").trim() === "1";

/** Execute a query against Turso with a timeout. Falls back to empty on failure. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function safeExecute(stmt: any, _timeoutMs?: number) {
  const emptyResult = { rows: [] as any[], columns: [] as string[], columnTypes: [] as string[], rowsAffected: 0, lastInsertRowid: undefined };

  if (TURSO_FORCE_DISABLED) return emptyResult;

  const db = getDb();
  const timeoutMs = _timeoutMs ?? 15_000;
  try {
    const timeout = new Promise<never>((_, rej) => setTimeout(() => rej(new Error("DB_TIMEOUT")), timeoutMs));
    return await Promise.race([db.execute(stmt), timeout]);
  } catch (e) {
    console.warn(`[turso] query failed: ${e instanceof Error ? e.message : e}`);
    return emptyResult;
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
  // Primary: use bundled JSON data (always available, no DB dependency)
  if (brandSummaries && brandSummaries.length > 0) {
    const jsonRows: BrandSummaryRow[] = (brandSummaries as Array<{ make_name: string; make_image_url: string | null; tire_count: number; model_count: number }>)
      .filter((r) => isCuratedBrand(r.make_name))
      .map((r) => ({
        make_name: r.make_name,
        make_image_url: r.make_image_url || "",
        local_logo: getBrandLogo(r.make_name) || "",
        tire_count: r.tire_count,
        model_count: r.model_count,
      }));
    if (jsonRows.length > 0) {
      _allBrandsCache = { data: jsonRows, ts: Date.now() };
      return jsonRows;
    }
  }

  // Fallback: try Turso summary table
  const result = await safeExecute(
    `SELECT
      make_name,
      make_image_url,
      NULL as local_logo,
      tire_count,
      model_count
    FROM brand_summary
    ORDER BY make_name ASC`
  );
  const dbRows = (result.rows as unknown as BrandSummaryRow[]).filter(
    (r) => isCuratedBrand(r.make_name)
  );
  if (dbRows.length > 0) {
    _allBrandsCache = { data: dbRows, ts: Date.now() };
    return dbRows;
  }

  // Fallback: API
  const apiRows = await apiGetAllBrands();
  if (apiRows.length > 0) {
    _allBrandsCache = { data: apiRows, ts: Date.now() };
    return apiRows;
  }

  // Last resort: static brand data
  console.log("[turso] All sources failed — using static brand data");
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
  // Primary: use bundled JSON data (always available, no DB dependency)
  const jsonModels = (modelSummaries as Record<string, Array<{ model_name: string; tire_count: number; min_price: number | null; max_price: number | null; season: string | null; terrain: string | null; category: string | null; thumbnail_url: string | null }>>)[slug];
  if (jsonModels && jsonModels.length > 0) {
    const rows: ModelSummaryRow[] = jsonModels.map((m) => fixOutlierMinPrice({
      model_name: m.model_name,
      tire_count: m.tire_count,
      min_price: m.min_price,
      max_price: m.max_price,
      season: m.season,
      terrain: m.terrain,
      category: m.category,
      thumbnail_url: m.thumbnail_url,
    }));
    // Sort: priced models first (by price ascending), then unpriced alphabetically
    rows.sort((a, b) => {
      const aHasPrice = a.min_price != null && a.min_price > 0;
      const bHasPrice = b.min_price != null && b.min_price > 0;
      if (aHasPrice && !bHasPrice) return -1;
      if (!aHasPrice && bHasPrice) return 1;
      if (aHasPrice && bHasPrice) return (a.min_price ?? 0) - (b.min_price ?? 0);
      return (a.model_name ?? "").localeCompare(b.model_name ?? "");
    });
    _modelsByBrandCache.set(slug, { data: rows, ts: Date.now() });
    return rows;
  }

  // Fallback: resolve brand name and try Turso
  let brandName: string | null = null;
  const slugMap = await getBrandSlugMap();
  brandName = slugMap.get(slug) ?? null;
  if (!brandName) {
    const apiBrands = await apiGetAllBrands();
    const match = apiBrands.find((b) => toSlug(b.make_name) === slug);
    if (match) brandName = match.make_name;
    else return [];
  }

  // Try model_summary table on Turso
  const result = await safeExecute({
    sql: `SELECT
      model_name,
      tire_count,
      min_price,
      max_price,
      season,
      terrain,
      category,
      thumbnail_url
    FROM model_summary
    WHERE make_name = ?
    ORDER BY model_name ASC`,
    args: [brandName],
  });
  const summaryRows = (result.rows as unknown as ModelSummaryRow[]).map(fixOutlierMinPrice);

  // Supplement with tires table GROUP BY
  const tiresResult = await safeExecute({
    sql: `SELECT
      model_name,
      COUNT(DISTINCT width || '/' || aspect_ratio || 'R' || rim_size) as tire_count,
      MIN(CASE WHEN price_map > 0 THEN price_map END) as min_price,
      MAX(price_map) as max_price,
      MAX(season) as season,
      MAX(terrain) as terrain,
      MAX(category) as category,
      MAX(thumbnail_url) as thumbnail_url
    FROM tires
    WHERE make_name = ?
    GROUP BY model_name
    ORDER BY model_name ASC`,
    args: [brandName],
  });
  const tiresRows = (tiresResult.rows as unknown as ModelSummaryRow[]).map(fixOutlierMinPrice);

  // Merge
  const seen = new Set(summaryRows.map((r) => r.model_name));
  const merged = [...summaryRows];
  for (const row of tiresRows) {
    if (!seen.has(row.model_name)) {
      merged.push(row);
      seen.add(row.model_name);
    }
  }
  merged.sort((a, b) => {
    const aHasPrice = a.min_price != null && a.min_price > 0;
    const bHasPrice = b.min_price != null && b.min_price > 0;
    if (aHasPrice && !bHasPrice) return -1;
    if (!aHasPrice && bHasPrice) return 1;
    if (aHasPrice && bHasPrice) return (a.min_price ?? 0) - (b.min_price ?? 0);
    return (a.model_name ?? "").localeCompare(b.model_name ?? "");
  });

  if (merged.length > 0) {
    _modelsByBrandCache.set(slug, { data: merged, ts: Date.now() });
    return merged;
  }

  // API fallback
  const apiRows = await apiGetModelsByBrand(brandName);
  if (apiRows.length > 0) {
    _modelsByBrandCache.set(slug, { data: apiRows, ts: Date.now() });
    return apiRows;
  }

  // Static brand data fallback
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
): Promise<{ brand: string; model: string; tires: TireRow[]; modelDetails?: TireModelDetailsRow } | null> {
  // 1. Try per-brand JSON tire data (primary source — exported from SQLite)
  const brandData = await loadBrandTireData(brandSlug);
  if (brandData) {
    const modelData = brandData[modelSlug];
    if (modelData) {
      const tires = modelData.t.map((ct) => compactToTireRow(ct, modelData));
      // Build model details from JSON data
      const modelDetails: TireModelDetailsRow | undefined = modelData.desc
        ? {
            id: 0,
            name: modelData.mn,
            description: modelData.desc || null,
            features: modelData.feat || null,
            benefits: modelData.ben || null,
            image_url: modelData.img,
            image_360_url: null,
            video_url: null,
            manufacturer_url: modelData.murl || null,
            three_pmsf: modelData.pmsf || null,
          }
        : undefined;
      return { brand: modelData.bn, model: modelData.mn, tires, modelDetails };
    }
  }

  // 2. Resolve brand name for Turso/API fallback
  let brandName: string | null = null;
  const slugMap = await getBrandSlugMap();
  brandName = slugMap.get(brandSlug) ?? null;
  if (!brandName) {
    const apiBrands = await apiGetAllBrands();
    const match = apiBrands.find((b) => toSlug(b.make_name) === brandSlug);
    brandName = match?.make_name ?? null;
  }
  if (!brandName) return null;

  // 3. Turso fallback
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
    if (tires.length > 0) {
      const modelId = tires[0].tire_model_id;
      const modelDetails = modelId ? await getTireModelDetails(modelId) : null;
      return { brand: brandName, model: modelName, tires, modelDetails: modelDetails ?? undefined };
    }
  }

  // 4. API fallback (last resort)
  return apiGetModelBySlug(brandName, modelSlug);
}

// ---------------------------------------------------------------------------
// Tire model details (from tire_models table — descriptions, features, benefits)
// ---------------------------------------------------------------------------

export async function getTireModelDetails(modelId: number): Promise<TireModelDetailsRow | null> {
  const result = await safeExecute({
    sql: `SELECT id, name, description, features, benefits, image_url, image_360_url, video_url, manufacturer_url, three_pmsf
          FROM tire_models WHERE id = ?`,
    args: [modelId],
  });
  return (result.rows[0] as unknown as TireModelDetailsRow) ?? null;
}

// ---------------------------------------------------------------------------
// Size queries
// ---------------------------------------------------------------------------

export async function getTiresBySize(
  width: string,
  aspectRatio: string,
  rimSize: string
): Promise<TireRow[]> {
  // 1. Try Turso first
  const result = await safeExecute({
    sql: `SELECT * FROM tires
    WHERE width = ? AND aspect_ratio = ? AND rim_size = ?
    ORDER BY make_name, model_name`,
    args: [width, aspectRatio, rimSize],
  });
  const tursoRows = result.rows as unknown as TireRow[];
  if (tursoRows.length > 0) return tursoRows;

  // 2. JSON data fallback — search key brands (batched to avoid overwhelming self-fetches)
  const KEY_BRAND_SLUGS = [
    "michelin", "bridgestone", "continental", "goodyear", "pirelli",
    "cooper", "hankook", "yokohama", "falken", "toyo",
    "firestone", "kumho", "nexen", "nitto", "dunlop",
    "bfgoodrich", "uniroyal", "general-tire", "nokian",
    "radar", "advanta", "kenda", "arroyo",
  ];

  const tires: TireRow[] = [];
  // Batch fetches: 5 at a time to avoid overwhelming the deployment
  for (let i = 0; i < KEY_BRAND_SLUGS.length; i += 5) {
    const batch = KEY_BRAND_SLUGS.slice(i, i + 5);
    const results = await Promise.all(batch.map((slug) => loadBrandTireData(slug)));
    for (const data of results) {
      if (!data) continue;
      for (const modelSlug of Object.keys(data)) {
        const model = data[modelSlug];
        for (const ct of model.t) {
          if (
            String(ct[1]) === width &&
            String(ct[2]) === aspectRatio &&
            String(ct[3]) === rimSize
          ) {
            tires.push(compactToTireRow(ct, model));
          }
        }
      }
    }
  }
  return tires;
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

  // Detect brand from explicit param or from query words (fast path)
  let brandDetected = false;
  if (params.brand) {
    const brandName = await slugToBrandName(params.brand);
    if (brandName) {
      conditions.push("make_name = ?");
      values.push(brandName);
      brandDetected = true;
    }
  }

  // If query looks like a part number / SKU (numeric or short alphanumeric), search identifiers first
  if (params.query) {
    const trimmed = params.query.trim();
    const looksLikePartNumber = /^[A-Za-z0-9\-]{3,20}$/.test(trimmed) && /\d/.test(trimmed) && !/\//.test(trimmed);
    if (looksLikePartNumber) {
      // Try direct part number lookup in Turso — skip brand filtering
      const pnResult = await safeExecute({
        sql: `SELECT * FROM tires WHERE item_number = ? OR gm_code = ? OR upc = ? OR ean = ? LIMIT ?`,
        args: [trimmed, trimmed, trimmed, trimmed, limit],
      });
      if (pnResult.rows.length > 0) {
        return {
          tires: pnResult.rows as unknown as TireRow[],
          total: pnResult.rows.length,
          page: 1,
          limit,
          totalPages: 1,
        };
      }

      // Fallback: check distributor_inventory part_number in Supabase
      const distResult = await lookupByDistributorPartNumber(trimmed, limit);
      if (distResult && distResult.length > 0) {
        return {
          tires: distResult,
          total: distResult.length,
          page: 1,
          limit,
          totalPages: 1,
        };
      }
    }
  }

  // If query is provided, check if any word matches a curated brand name for fast exact match
  let queryModelWords: string[] = [];
  if (params.query) {
    const words = params.query.trim().split(/\s+/).filter(Boolean);
    for (const word of words) {
      if (!brandDetected && CURATED_BRANDS.has(word.toUpperCase())) {
        conditions.push("make_name = ?");
        values.push(word.toUpperCase());
        brandDetected = true;
      } else {
        queryModelWords.push(word);
      }
    }
  }

  if (!brandDetected) {
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

  // Remaining query words — match against model_name (brand already filtered above)
  for (const word of queryModelWords) {
    if (brandDetected) {
      conditions.push("model_name LIKE ?");
      values.push(`%${word}%`);
    } else {
      conditions.push("(make_name LIKE ? OR model_name LIKE ? OR name LIKE ?)");
      const w = `%${word}%`;
      values.push(w, w, w);
    }
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
  local_thumbnail: string | null;
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

  // If query looks like a part number / SKU, search identifiers first
  if (params.query) {
    const trimmed = params.query.trim();
    const looksLikePartNumber = /^[A-Za-z0-9\-]{3,20}$/.test(trimmed) && /\d/.test(trimmed) && !/\//.test(trimmed);
    if (looksLikePartNumber) {
      const pnResult = await safeExecute({
        sql: `SELECT
          make_name,
          model_name,
          COUNT(DISTINCT width || '/' || aspect_ratio || 'R' || rim_size) as tire_count,
          MIN(CASE WHEN price_map > 0 THEN price_map END) as min_price,
          MAX(price_map) as max_price,
          MAX(local_thumbnail) as local_thumbnail,
          MAX(thumbnail_url) as thumbnail_url,
          MAX(make_image_url) as make_image_url,
          MAX(season) as season,
          MAX(terrain) as terrain,
          MAX(category) as category,
          MAX(warranty) as warranty,
          GROUP_CONCAT(DISTINCT speed_rating) as speed_ratings
        FROM tires
        WHERE item_number = ? OR gm_code = ? OR upc = ? OR ean = ?
        GROUP BY make_name, model_name`,
        args: [trimmed, trimmed, trimmed, trimmed],
      });
      if (pnResult.rows.length > 0) {
        return {
          models: pnResult.rows as unknown as ModelSearchRow[],
          total: pnResult.rows.length,
          page: 1,
          limit,
          totalPages: 1,
        };
      }

      // Fallback: check distributor_inventory part_number in Supabase
      const distTires = await lookupByDistributorPartNumber(trimmed, limit);
      if (distTires && distTires.length > 0) {
        // Group into model-level results
        const modelMap = new Map<string, ModelSearchRow>();
        for (const tire of distTires) {
          const key = `${tire.make_name}|${tire.model_name}`;
          const existing = modelMap.get(key);
          const size = `${tire.width}/${tire.aspect_ratio}R${tire.rim_size}`;
          if (!existing) {
            modelMap.set(key, {
              make_name: tire.make_name,
              model_name: tire.model_name,
              tire_count: 1,
              min_price: (tire.price_map ?? 0) > 0 ? tire.price_map : null,
              max_price: (tire.price_map ?? 0) > 0 ? tire.price_map : null,
              local_thumbnail: tire.local_thumbnail ?? null,
              thumbnail_url: tire.thumbnail_url ?? null,
              make_image_url: tire.make_image_url ?? null,
              season: tire.season ?? null,
              terrain: tire.terrain ?? null,
              category: tire.category ?? null,
              warranty: tire.warranty ?? null,
              speed_ratings: tire.speed_rating ?? null,
            });
          } else {
            existing.tire_count++;
            const pm = tire.price_map ?? 0;
            if (pm > 0) {
              if (existing.min_price === null || pm < existing.min_price) existing.min_price = pm;
              if (existing.max_price === null || pm > existing.max_price) existing.max_price = pm;
            }
          }
        }
        const models = Array.from(modelMap.values());
        return {
          models,
          total: models.length,
          page: 1,
          limit,
          totalPages: 1,
        };
      }
    }
  }

  // Detect brand from explicit param or from query words (fast path)
  let brandDetected = false;
  if (params.brand) {
    const brandName = await slugToBrandName(params.brand);
    if (brandName) {
      conditions.push("make_name = ?");
      values.push(brandName);
      brandDetected = true;
    }
  }

  // If query is provided, check if any word matches a curated brand name for fast exact match
  let queryModelWords: string[] = [];
  if (params.query) {
    const words = params.query.trim().split(/\s+/).filter(Boolean);
    for (const word of words) {
      if (!brandDetected && CURATED_BRANDS.has(word.toUpperCase())) {
        conditions.push("make_name = ?");
        values.push(word.toUpperCase());
        brandDetected = true;
      } else {
        queryModelWords.push(word);
      }
    }
  }

  if (!brandDetected) {
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

  // Remaining query words — match against model_name (brand already filtered above)
  for (const word of queryModelWords) {
    if (brandDetected) {
      conditions.push("model_name LIKE ?");
      values.push(`%${word}%`);
    } else {
      conditions.push("(make_name LIKE ? OR model_name LIKE ? OR name LIKE ?)");
      const w = `%${word}%`;
      values.push(w, w, w);
    }
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const countResult = await safeExecute({
    sql: `SELECT COUNT(*) as total FROM (SELECT 1 FROM tires ${where} GROUP BY make_name, model_name)`,
    args: values,
  });
  const total = Number((countResult.rows[0] as unknown as { total: number })?.total ?? 0);

  if (total > 0) {
    // Default: priced tires first (cheap → expensive), unpriced at end
    let orderBy = "CASE WHEN min_price IS NOT NULL THEN 0 ELSE 1 END, min_price ASC NULLS LAST, tire_count DESC";
    switch (params.sort) {
      case "price-asc":
        orderBy = "CASE WHEN min_price IS NOT NULL THEN 0 ELSE 1 END, min_price ASC NULLS LAST";
        break;
      case "price-desc":
        orderBy = "CASE WHEN max_price IS NOT NULL THEN 0 ELSE 1 END, max_price DESC NULLS LAST";
        break;
      case "name-asc":
        orderBy = "model_name ASC";
        break;
      case "sizes-desc":
        orderBy = "tire_count DESC";
        break;
    }

    const modelsResult = await safeExecute({
      sql: `SELECT
        make_name,
        model_name,
        COUNT(DISTINCT width || '/' || aspect_ratio || 'R' || rim_size) as tire_count,
        MIN(CASE WHEN price_map > 0 THEN price_map END) as min_price,
        MAX(price_map) as max_price,
        MAX(local_thumbnail) as local_thumbnail,
        MAX(thumbnail_url) as thumbnail_url,
        MAX(make_image_url) as make_image_url,
        MAX(season) as season,
        MAX(terrain) as terrain,
        MAX(category) as category,
        MAX(warranty) as warranty,
        GROUP_CONCAT(DISTINCT speed_rating) as speed_ratings
      FROM tires ${where}
      GROUP BY make_name, model_name
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?`,
      args: [...values, limit, offset],
    });

    return {
      models: (modelsResult.rows as unknown as ModelSearchRow[]).map(fixOutlierMinPrice),
      total,
      page,
      limit,
      totalPages: Math.min(Math.ceil(total / limit), 50),
    };
  }

  // Turso returned nothing — fall back to JSON-based model search
  const allModelEntries = modelSummaries as Record<string, Array<{ model_name: string; tire_count: number; min_price: number | null; max_price: number | null; season: string | null; terrain: string | null; category: string | null; thumbnail_url: string | null }>>;
  const jsonResults: ModelSearchRow[] = [];
  const brandMapForSearch = new Map((brandSummaries as Array<{ make_name: string; make_image_url: string | null }>).map(b => [toSlug(b.make_name), b]));

  for (const [slug, models] of Object.entries(allModelEntries)) {
    const brand = brandMapForSearch.get(slug);
    if (!brand) continue;

    // Brand filter
    if (params.brand && slug !== params.brand) continue;
    if (brandDetected && !conditions.some(c => c.includes("make_name"))) continue;
    if (brandDetected) {
      const brandVal = values.find((v, i) => conditions[i]?.includes("make_name") && typeof v === "string");
      if (brandVal && brand.make_name !== brandVal) continue;
    }

    for (const m of models) {
      // Season filter
      if (params.season && m.season !== params.season) continue;
      // Terrain filter
      if (params.terrain && m.terrain !== params.terrain) continue;
      // Category filter
      if (params.category && !(m.category ?? "").toLowerCase().includes(params.category.toLowerCase())) continue;
      // Query words match
      if (queryModelWords.length > 0) {
        const searchStr = `${brand.make_name} ${m.model_name}`.toLowerCase();
        if (!queryModelWords.every(w => searchStr.includes(w.toLowerCase()))) continue;
      }

      jsonResults.push({
        make_name: brand.make_name,
        model_name: m.model_name,
        tire_count: m.tire_count ?? 0,
        min_price: m.min_price,
        max_price: m.max_price,
        local_thumbnail: null,
        thumbnail_url: m.thumbnail_url,
        make_image_url: brand.make_image_url || null,
        season: m.season,
        terrain: m.terrain,
        category: m.category,
        warranty: null,
        speed_ratings: null,
      });
    }
  }

  if (jsonResults.length > 0) {
    // Sort by tire_count DESC (most popular first)
    jsonResults.sort((a, b) => (b.tire_count ?? 0) - (a.tire_count ?? 0));
    const jsonTotal = jsonResults.length;
    const paged = jsonResults.slice(offset, offset + limit);
    return {
      models: paged,
      total: jsonTotal,
      page,
      limit,
      totalPages: Math.min(Math.ceil(jsonTotal / limit), 50),
    };
  }

  return { models: [], total: 0, page, limit, totalPages: 0 };
}

// ---------------------------------------------------------------------------
// Type matching helper for JSON-based filtering
// ---------------------------------------------------------------------------

type ModelFields = { season: string | null; terrain: string | null; category: string | null };

function _typeMatchFn(type: string): ((m: ModelFields) => boolean) | null {
  switch (type) {
    case "all-season": return (m) => m.season === "All-Season" || m.season === "All-Weather";
    case "winter": return (m) => m.season === "Winter";
    case "summer": return (m) => m.season === "Summer";
    case "performance": return (m) => /performance|uhp/i.test(m.category ?? "");
    case "all-terrain": return (m) => m.terrain === "All-Terrain (A/T)";
    case "mud-terrain": return (m) => m.terrain === "Mud-Terrain (M/T)";
    case "highway": return (m) => m.terrain === "Highway Terrain(H/T)";
    case "touring": return (m) => /touring/i.test(m.category ?? "");
    default: return null;
  }
}

// ---------------------------------------------------------------------------
// Top brands by tire type
// ---------------------------------------------------------------------------

export async function getTopBrandsForType(type: string): Promise<BrandSummaryRow[]> {
  const matchFn = _typeMatchFn(type);
  if (!matchFn) return [];

  // Primary: use bundled JSON data
  const allModelEntries = modelSummaries as Record<string, Array<{ model_name: string; tire_count: number; min_price: number | null; max_price: number | null; season: string | null; terrain: string | null; category: string | null; thumbnail_url: string | null }>>;
  const brandTotals = new Map<string, number>();
  for (const [slug, models] of Object.entries(allModelEntries)) {
    for (const m of models) {
      if (matchFn(m)) {
        brandTotals.set(slug, (brandTotals.get(slug) ?? 0) + (m.tire_count ?? 0));
      }
    }
  }

  if (brandTotals.size > 0) {
    const brandMap = new Map((brandSummaries as Array<{ make_name: string; make_image_url: string | null; tire_count: number; model_count: number }>).map(b => [toSlug(b.make_name), b]));
    const sorted = [...brandTotals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
    return sorted
      .map(([slug, tireCount]) => {
        const b = brandMap.get(slug);
        if (!b) return null;
        return {
          make_name: b.make_name,
          make_image_url: b.make_image_url || "",
          local_logo: getBrandLogo(b.make_name) || "",
          tire_count: tireCount,
          model_count: 0,
        } as BrandSummaryRow;
      })
      .filter((x): x is BrandSummaryRow => x !== null);
  }

  const allBrands = await getAllBrands();
  return allBrands.slice(0, 6);
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
  const matchFn = _typeMatchFn(type);
  if (!matchFn) return [];

  // Primary: use bundled JSON data
  const allModelEntries = modelSummaries as Record<string, Array<{ model_name: string; tire_count: number; min_price: number | null; max_price: number | null; season: string | null; terrain: string | null; category: string | null; thumbnail_url: string | null }>>;
  const brandMap = new Map((brandSummaries as Array<{ make_name: string; make_image_url: string | null }>).map(b => [toSlug(b.make_name), b]));

  const candidates: ShowcaseModel[] = [];
  for (const [slug, models] of Object.entries(allModelEntries)) {
    const brand = brandMap.get(slug);
    if (!brand) continue;
    for (const m of models) {
      if (
        matchFn(m) &&
        m.min_price != null && m.min_price > 0 &&
        m.thumbnail_url &&
        !/retread/i.test(m.model_name) &&
        !/pre-mold/i.test(m.model_name)
      ) {
        candidates.push({
          make_name: brand.make_name,
          model_name: m.model_name,
          min_price: m.min_price,
          max_price: m.max_price ?? 0,
          tire_count: m.tire_count ?? 0,
          thumbnail_url: m.thumbnail_url,
          make_image_url: brand.make_image_url || null,
        });
      }
    }
  }

  if (candidates.length > 0) {
    // Sort by tire_count DESC, pick top ones from different brands for variety
    candidates.sort((a, b) => (b.tire_count ?? 0) - (a.tire_count ?? 0));
    const result: ShowcaseModel[] = [];
    const usedBrands = new Set<string>();
    for (const c of candidates) {
      if (result.length >= limit) break;
      if (!usedBrands.has(c.make_name)) {
        result.push(c);
        usedBrands.add(c.make_name);
      }
    }
    // If we still need more, allow same brand
    if (result.length < limit) {
      for (const c of candidates) {
        if (result.length >= limit) break;
        if (!result.includes(c)) result.push(c);
      }
    }
    return result;
  }

  return [];
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
  // Primary: compute from bundled JSON data
  if (brandSummaries && brandSummaries.length > 0) {
    const brands = brandSummaries as Array<{ make_name: string; tire_count: number; model_count: number }>;
    const stats = {
      brandCount: brands.length,
      modelCount: brands.reduce((acc, b) => acc + (b.model_count ?? 0), 0),
      tireCount: brands.reduce((acc, b) => acc + (b.tire_count ?? 0), 0),
    };
    _statsCache = { data: stats, ts: Date.now() };
    return stats;
  }

  // Fallback: try Turso
  const result = await safeExecute(
    `SELECT
      COUNT(*) as brandCount,
      SUM(model_count) as modelCount,
      SUM(tire_count) as tireCount
    FROM brand_summary`
  );
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

  // API fallback
  const apiStats = await apiGetStats();
  if (apiStats.brandCount > 0) {
    _statsCache = { data: apiStats, ts: Date.now() };
    return apiStats;
  }

  // Static fallback
  const fallback = { brandCount: 665, modelCount: 19403, tireCount: 301483 };
  _statsCache = { data: fallback, ts: Date.now() };
  return fallback;
}

// ---------------------------------------------------------------------------
// Single tire lookup by ID — used by /buy/[id] for Google Shopping checkout
// ---------------------------------------------------------------------------

export async function getTireById(id: number): Promise<TireRow | null> {
  // Try Turso first
  const result = await safeExecute({
    sql: `SELECT * FROM tires WHERE id = ?`,
    args: [id],
  });
  if (result.rows.length > 0) {
    return result.rows[0] as unknown as TireRow;
  }

  // Fallback: search via API by ID (fetches single tire detail)
  try {
    const { apiFetch, apiTireToRow } = await import("../tire-api");
    const raw = await apiFetch<Record<string, unknown>>(`/tires/${id}`, 10000);
    if (raw) return apiTireToRow(raw as never);
  } catch {
    // API unavailable
  }
  return null;
}

/** Find a tire by brand slug + model slug + size components (width, aspect, rim). */
export async function getTireBySize(
  brandSlug: string,
  modelSlug: string,
  width: string,
  aspectRatio: string,
  rimSize: string
): Promise<TireRow | null> {
  // Resolve brand name for targeted query
  const brandName = await slugToBrandName(brandSlug);

  // Strategy 1: Query by brand + size (precise, avoids LIMIT issues on popular sizes)
  if (brandName) {
    const isFullProfile = !aspectRatio;
    const result = await safeExecute({
      sql: isFullProfile
        ? `SELECT * FROM tires
            WHERE make_name = ? AND width = ? AND (aspect_ratio IS NULL OR aspect_ratio = '') AND rim_size = ?
            ORDER BY price_map DESC
            LIMIT 50`
        : `SELECT * FROM tires
            WHERE make_name = ? AND width = ? AND aspect_ratio = ? AND rim_size = ?
            ORDER BY price_map DESC
            LIMIT 50`,
      args: isFullProfile ? [brandName, width, rimSize] : [brandName, width, aspectRatio, rimSize],
    });
    if (result.rows.length > 0) {
      const match = (result.rows as unknown as TireRow[]).find((row) => {
        return toSlug(row.model_name) === modelSlug;
      });
      if (match) return match;
    }
  }

  // Strategy 2: Query by size only (brand name resolution may have failed)
  const isFullProfile = !aspectRatio;
  const result = await safeExecute({
    sql: isFullProfile
      ? `SELECT * FROM tires
          WHERE width = ? AND (aspect_ratio IS NULL OR aspect_ratio = '') AND rim_size = ?
          ORDER BY price_map DESC
          LIMIT 100`
      : `SELECT * FROM tires
          WHERE width = ? AND aspect_ratio = ? AND rim_size = ?
          ORDER BY price_map DESC
          LIMIT 100`,
    args: isFullProfile ? [width, rimSize] : [width, aspectRatio, rimSize],
  });
  if (result.rows.length > 0) {
    const match = (result.rows as unknown as TireRow[]).find((row) => {
      return toSlug(row.make_name) === brandSlug && toSlug(row.model_name) === modelSlug;
    });
    if (match) return match;
  }

  // Fallback: search via API
  try {
    const apiResult = await apiSearchTires({
      brand: brandSlug,
      width,
      aspectRatio,
      rimSize,
      limit: 50,
    });
    const match = apiResult.tires.find(
      (row) => toSlug(row.model_name) === modelSlug
    );
    if (match) return match;
  } catch {
    // API unavailable
  }
  return null;
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

  // Skip the COUNT query — it times out on Vercel for large tables.
  // Use a known estimate for total (only used for feed description text).
  // The actual item count on each page is derived from the fetched rows.

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

  const tires = result.rows as unknown as TireRow[];

  // Estimate total: if we got a full page, there are likely more rows.
  // If this is the first page and we got a full batch, use a reasonable estimate.
  // Otherwise, offset + actual count gives us the minimum total.
  let total: number;
  if (tires.length === limit) {
    // Full page returned — estimate conservatively. The feed description will
    // show this number but Google doesn't rely on it for crawling.
    total = Math.max(offset + limit + limit, 75000);
  } else {
    total = offset + tires.length;
  }

  return { tires, total };
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

    // Primary: use bundled JSON data
    const brandSlug = toSlug(brandName);
    const jsonModels = (modelSummaries as Record<string, Array<{ model_name: string }>>)[brandSlug];
    if (jsonModels && jsonModels.length > 0) {
      for (const m of jsonModels) {
        cache.set(toSlug(m.model_name), m.model_name);
      }
    }

    // Supplement from Turso if JSON was empty
    if (cache.size === 0) {
      const result = await safeExecute({
        sql: `SELECT model_name FROM model_summary WHERE make_name = ?`,
        args: [brandName],
      });
      for (const row of result.rows) {
        const name = (row as unknown as { model_name: string }).model_name;
        cache.set(toSlug(name), name);
      }
    }

    // Fallback: models-by-brand cache (also uses JSON primary)
    if (cache.size === 0) {
      const modelRows = await getModelsByBrand(brandSlug);
      for (const m of modelRows) {
        cache.set(toSlug(m.model_name), m.model_name);
      }
    }
    _modelSlugCaches.set(brandName, cache);
  }

  return cache.get(slug) ?? null;
}

/**
 * Fix outlier min_price values caused by bad data in the TireWeb catalog.
 * Some tires have MAP prices that are clearly wrong (e.g., $115 for a tire
 * that should be $400+). If min_price < 30% of max_price and max_price > $100,
 * replace min_price with a reasonable estimate (max_price * 0.4) so the
 * "Starting at" display doesn't show the bad value.
 *
 * This preserves the model as "priced" rather than showing "Call for Price".
 * Individual tire prices on the model page are unaffected — they come from
 * the tires table directly.
 */
function fixOutlierMinPrice<T extends { min_price: number | null; max_price: number | null }>(row: T): T {
  if (
    row.min_price != null &&
    row.max_price != null &&
    row.max_price > 100 &&
    row.min_price < row.max_price * 0.3
  ) {
    return { ...row, min_price: Math.round(row.max_price * 0.4 * 100) / 100 };
  }
  return row;
}

export function toSlug(name: string | null | undefined): string {
  if (!name) return "";
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function getBrandSlugMap(): Promise<Map<string, string>> {
  if (_brandSlugCache) return _brandSlugCache;

  _brandSlugCache = new Map();

  // Primary: populate from bundled JSON data
  if (brandSummaries && brandSummaries.length > 0) {
    for (const b of brandSummaries as Array<{ make_name: string }>) {
      _brandSlugCache.set(toSlug(b.make_name), b.make_name);
    }
  }

  // If JSON was empty, try Turso
  if (_brandSlugCache.size === 0) {
    const result = await safeExecute(
      `SELECT make_name FROM brand_summary ORDER BY make_name`
    );
    for (const row of result.rows) {
      const name = (row as unknown as { make_name: string }).make_name;
      _brandSlugCache.set(toSlug(name), name);
    }
  }

  // If still empty, fall back to API
  if (_brandSlugCache.size === 0) {
    console.log("[turso] getBrandSlugMap empty — populating from API");
    const apiBrands = await apiGetAllBrands();
    for (const b of apiBrands) {
      _brandSlugCache.set(toSlug(b.make_name), b.make_name);
    }
  }

  return _brandSlugCache;
}

/**
 * Build tire lookup maps from the global tires catalog for inventory matching.
 * Returns maps keyed by part number and by brand|size for matching distributor CSV rows
 * against the full tire catalog (not just existing distributor inventory).
 */
export async function getTireLookupMaps(): Promise<{
  byPartNumber: Map<string, number>;
  byBrandSize: Map<string, number>;
  modelById: Map<number, string>;
  sizeById: Map<number, string>;
}> {
  const byPartNumber = new Map<string, number>();
  const byBrandSize = new Map<string, number>();
  const modelById = new Map<number, string>();
  const sizeById = new Map<number, string>();

  const result = await safeExecute(
    {
      sql: `SELECT id, item_number, gm_code, upc, ean, make_name, model_name, width, aspect_ratio, rim_size
            FROM tires`,
      args: [],
    },
    90000
  );

  for (const raw of result.rows) {
    const row = raw as unknown as {
      id: number;
      item_number: string | null;
      gm_code: string | null;
      upc: string | null;
      ean: string | null;
      make_name: string;
      model_name: string;
      width: string | null;
      aspect_ratio: string | null;
      rim_size: string | null;
    };

    // Map by part numbers (item_number, gm_code, upc, ean)
    if (row.item_number) byPartNumber.set(row.item_number, row.id);
    if (row.gm_code) byPartNumber.set(row.gm_code, row.id);
    if (row.upc) byPartNumber.set(row.upc, row.id);
    if (row.ean) byPartNumber.set(row.ean, row.id);

    // Map by brand|size (e.g. "goodyear|225/45r17")
    if (row.width && row.aspect_ratio && row.rim_size) {
      const size = `${row.width}/${row.aspect_ratio}R${row.rim_size}`.toLowerCase();
      const key = `${row.make_name.toLowerCase()}|${size}`;
      byBrandSize.set(key, row.id);
    }

    // Map tire_id → model_name for backfilling empty model fields
    if (row.model_name) {
      modelById.set(row.id, row.model_name);
    }

    // Map tire_id → canonical size string for backfilling bad/missing size fields
    if (row.width && row.rim_size) {
      const canonicalSize = row.aspect_ratio
        ? `${row.width}/${row.aspect_ratio}R${row.rim_size}`
        : `${row.width}R${row.rim_size}`;
      sizeById.set(row.id, canonicalSize);
    }
  }

  return { byPartNumber, byBrandSize, modelById, sizeById };
}

// ---------------------------------------------------------------------------
// Distributor part number lookup (Supabase fallback for search)
// ---------------------------------------------------------------------------

/**
 * Look up tires by distributor part number when Turso identifiers don't match.
 * Queries Supabase distributor_inventory for the part_number, gets the tire_id(s),
 * then fetches those tires from Turso.
 */
async function lookupByDistributorPartNumber(
  partNumber: string,
  limit: number
): Promise<TireRow[] | null> {
  try {
    const { getSupabase } = await import("../supabase");
    const sb = getSupabase();

    const { data, error } = await sb
      .from("distributor_inventory")
      .select("tire_id")
      .eq("active", true)
      .ilike("part_number", partNumber)
      .limit(limit);

    if (error || !data || data.length === 0) return null;

    // Deduplicate tire_ids
    const tireIds = [...new Set(data.map((d) => d.tire_id))];
    if (tireIds.length === 0) return null;

    // Fetch those tires from Turso
    const placeholders = tireIds.map(() => "?").join(", ");
    const result = await safeExecute({
      sql: `SELECT * FROM tires WHERE id IN (${placeholders})`,
      args: tireIds,
    });

    if (result.rows.length === 0) return null;
    return result.rows as unknown as TireRow[];
  } catch (e) {
    console.warn("[turso] distributor part number lookup failed:", e);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Pricing anomaly detection
// ---------------------------------------------------------------------------

/**
 * Find tires with anomalous pricing within their model.
 * A tire is flagged if its price_map is less than 50% of the model's median price.
 * Optionally filter by brand and/or model name.
 */
export async function findPricingAnomalies(
  brandFilter?: string,
  modelFilter?: string
): Promise<{
  anomalies: Array<{
    id: number;
    make_name: string;
    model_name: string;
    size: string;
    price_map: number;
    model_min: number;
    model_avg: number;
    model_max: number;
    model_count: number;
  }>;
  modelsChecked: number;
}> {
  // Build WHERE clause
  const conditions: string[] = ["price_map > 0"];
  const args: (string | number)[] = [];
  if (brandFilter) {
    conditions.push("make_name = ?");
    args.push(brandFilter.toUpperCase());
  }
  if (modelFilter) {
    conditions.push("model_name LIKE ?");
    args.push(`%${modelFilter}%`);
  }
  const where = conditions.join(" AND ");

  // Get model-level stats
  const statsResult = await safeExecute({
    sql: `SELECT
      make_name,
      model_name,
      MIN(price_map) as model_min,
      AVG(price_map) as model_avg,
      MAX(price_map) as model_max,
      COUNT(*) as model_count
    FROM tires
    WHERE ${where}
    GROUP BY make_name, model_name
    HAVING COUNT(*) >= 3 AND (MAX(price_map) / MIN(price_map)) > 2.0
    ORDER BY (MAX(price_map) / MIN(price_map)) DESC
    LIMIT 50`,
    args,
  }, 30000);

  const modelStats = statsResult.rows as unknown as Array<{
    make_name: string;
    model_name: string;
    model_min: number;
    model_avg: number;
    model_max: number;
    model_count: number;
  }>;

  const anomalies: Array<{
    id: number;
    make_name: string;
    model_name: string;
    size: string;
    price_map: number;
    model_min: number;
    model_avg: number;
    model_max: number;
    model_count: number;
  }> = [];

  // For each model with high price variance, find the outlier tires
  for (const stat of modelStats) {
    const threshold = stat.model_avg * 0.5; // tires priced at less than 50% of average
    const outlierResult = await safeExecute({
      sql: `SELECT id, make_name, model_name, width, aspect_ratio, rim_size, price_map
            FROM tires
            WHERE make_name = ? AND model_name = ? AND price_map > 0 AND price_map < ?
            ORDER BY price_map ASC
            LIMIT 10`,
      args: [stat.make_name, stat.model_name, threshold],
    });

    for (const raw of outlierResult.rows) {
      const row = raw as unknown as {
        id: number;
        make_name: string;
        model_name: string;
        width: string;
        aspect_ratio: string;
        rim_size: string;
        price_map: number;
      };
      anomalies.push({
        id: row.id,
        make_name: row.make_name,
        model_name: row.model_name,
        size: `${row.width}/${row.aspect_ratio}R${row.rim_size}`,
        price_map: row.price_map,
        model_min: stat.model_min,
        model_avg: Math.round(stat.model_avg * 100) / 100,
        model_max: stat.model_max,
        model_count: stat.model_count,
      });
    }
  }

  return {
    anomalies,
    modelsChecked: modelStats.length,
  };
}
