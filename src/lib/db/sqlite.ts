import Database from "better-sqlite3";
import path from "path";
import type {
  TireRow,
  ManufacturerRow,
  BrandSummaryRow,
  ModelSummaryRow,
  SearchParams,
  SearchResult,
} from "./types";

let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (_db) return _db;

  const dbPath =
    process.env.TIRE_DB_PATH ||
    path.join(process.cwd(), "ship_tires.db");

  _db = new Database(dbPath, { readonly: true });
  _db.pragma("journal_mode = WAL");
  _db.pragma("cache_size = -64000"); // 64MB cache
  return _db;
}

// ---------------------------------------------------------------------------
// Brand queries
// ---------------------------------------------------------------------------

export function getAllBrands(): BrandSummaryRow[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT
        make_name,
        MAX(make_image_url) as make_image_url,
        COUNT(*) as tire_count,
        COUNT(DISTINCT model_name) as model_count
      FROM tires
      WHERE make_name IS NOT NULL AND make_name != ''
      GROUP BY make_name
      ORDER BY make_name ASC`
    )
    .all() as BrandSummaryRow[];
}

export function getBrandBySlug(slug: string): BrandSummaryRow | null {
  const db = getDb();
  // Slug is lowercased + hyphenated brand name
  const brandName = slugToBrandName(db, slug);
  if (!brandName) return null;

  const row = db
    .prepare(
      `SELECT
        make_name,
        MAX(make_image_url) as make_image_url,
        COUNT(*) as tire_count,
        COUNT(DISTINCT model_name) as model_count
      FROM tires
      WHERE make_name = ?
      GROUP BY make_name`
    )
    .get(brandName) as BrandSummaryRow | undefined;

  return row ?? null;
}

export function getManufacturer(brandName: string): ManufacturerRow | null {
  const db = getDb();
  const row = db
    .prepare(`SELECT * FROM manufacturers WHERE UPPER(name) = UPPER(?)`)
    .get(brandName) as ManufacturerRow | undefined;
  return row ?? null;
}

// ---------------------------------------------------------------------------
// Model queries
// ---------------------------------------------------------------------------

export function getModelsByBrand(slug: string): ModelSummaryRow[] {
  const db = getDb();
  const brandName = slugToBrandName(db, slug);
  if (!brandName) return [];

  return db
    .prepare(
      `SELECT
        model_name,
        COUNT(*) as tire_count,
        MIN(CASE WHEN price_map > 0 THEN price_map END) as min_price,
        MAX(CASE WHEN price_map > 0 THEN price_map END) as max_price,
        MAX(season) as season,
        MAX(terrain) as terrain,
        MAX(category) as category,
        MAX(image_url_1) as image_url_1
      FROM tires
      WHERE make_name = ?
        AND model_name IS NOT NULL AND model_name != ''
      GROUP BY model_name
      ORDER BY model_name ASC`
    )
    .all(brandName) as ModelSummaryRow[];
}

export function getModelBySlug(
  brandSlug: string,
  modelSlug: string
): { brand: string; model: string; tires: TireRow[] } | null {
  const db = getDb();
  const brandName = slugToBrandName(db, brandSlug);
  if (!brandName) return null;

  const modelName = slugToModelName(db, brandName, modelSlug);
  if (!modelName) return null;

  const tires = db
    .prepare(
      `SELECT * FROM tires
      WHERE make_name = ? AND model_name = ?
      ORDER BY
        CAST(width AS INTEGER),
        CAST(aspect_ratio AS INTEGER),
        CAST(rim_size AS INTEGER)`
    )
    .all(brandName, modelName) as TireRow[];

  if (tires.length === 0) return null;

  return { brand: brandName, model: modelName, tires };
}

// ---------------------------------------------------------------------------
// Size queries
// ---------------------------------------------------------------------------

export function getTiresBySize(
  width: string,
  aspectRatio: string,
  rimSize: string
): TireRow[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT * FROM tires
      WHERE width = ? AND aspect_ratio = ? AND rim_size = ?
      ORDER BY make_name, model_name`
    )
    .all(width, aspectRatio, rimSize) as TireRow[];
}

export function getDistinctSizes(): { width: string; aspect_ratio: string; rim_size: string; count: number }[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT width, aspect_ratio, rim_size, COUNT(*) as count
      FROM tires
      WHERE width IS NOT NULL AND aspect_ratio IS NOT NULL AND rim_size IS NOT NULL
      GROUP BY width, aspect_ratio, rim_size
      ORDER BY count DESC
      LIMIT 500`
    )
    .all() as { width: string; aspect_ratio: string; rim_size: string; count: number }[];
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

export function searchTires(params: SearchParams): SearchResult {
  const db = getDb();
  const page = params.page ?? 1;
  const limit = Math.min(params.limit ?? 24, 100);
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const values: (string | number)[] = [];

  if (params.brand) {
    const brandName = slugToBrandName(db, params.brand);
    if (brandName) {
      conditions.push("make_name = ?");
      values.push(brandName);
    }
  }

  if (params.width) {
    conditions.push("width = ?");
    values.push(params.width);
  }
  if (params.aspectRatio) {
    conditions.push("aspect_ratio = ?");
    values.push(params.aspectRatio);
  }
  if (params.rimSize) {
    conditions.push("rim_size = ?");
    values.push(params.rimSize);
  }

  if (params.size) {
    // Parse size string like "225/65R17"
    const match = params.size.match(/^(\d{2,3})\/(\d{2,3})R(\d{2,3})$/i);
    if (match) {
      conditions.push("width = ? AND aspect_ratio = ? AND rim_size = ?");
      values.push(match[1], match[2], match[3]);
    }
  }

  if (params.season) {
    conditions.push("season = ?");
    values.push(params.season);
  }
  if (params.terrain) {
    conditions.push("terrain = ?");
    values.push(params.terrain);
  }
  if (params.category) {
    conditions.push("category LIKE ?");
    values.push(`%${params.category}%`);
  }

  if (params.minPrice != null) {
    conditions.push("price_map >= ?");
    values.push(params.minPrice);
  }
  if (params.maxPrice != null) {
    conditions.push("price_map <= ?");
    values.push(params.maxPrice);
  }

  if (params.query) {
    conditions.push("(name LIKE ? OR model_name LIKE ? OR make_name LIKE ?)");
    const q = `%${params.query}%`;
    values.push(q, q, q);
  }

  const where =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const countRow = db
    .prepare(`SELECT COUNT(*) as total FROM tires ${where}`)
    .get(...values) as { total: number };

  const tires = db
    .prepare(
      `SELECT * FROM tires ${where}
      ORDER BY make_name, model_name, CAST(width AS INTEGER)
      LIMIT ? OFFSET ?`
    )
    .all(...values, limit, offset) as TireRow[];

  return {
    tires,
    total: countRow.total,
    page,
    limit,
    totalPages: Math.ceil(countRow.total / limit),
  };
}

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

export function getStats(): {
  brandCount: number;
  modelCount: number;
  tireCount: number;
} {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT
        COUNT(DISTINCT make_name) as brandCount,
        COUNT(DISTINCT model_name) as modelCount,
        COUNT(*) as tireCount
      FROM tires`
    )
    .get() as { brandCount: number; modelCount: number; tireCount: number };
  return row;
}

// ---------------------------------------------------------------------------
// Helpers: slug <-> name resolution
// ---------------------------------------------------------------------------

function slugToBrandName(
  db: Database.Database,
  slug: string
): string | null {
  // First try exact match against lowercased make_name
  const rows = db
    .prepare(
      `SELECT DISTINCT make_name FROM tires
      WHERE make_name IS NOT NULL AND make_name != ''`
    )
    .all() as { make_name: string }[];

  for (const row of rows) {
    if (toSlug(row.make_name) === slug) {
      return row.make_name;
    }
  }
  return null;
}

function slugToModelName(
  db: Database.Database,
  brandName: string,
  slug: string
): string | null {
  const rows = db
    .prepare(
      `SELECT DISTINCT model_name FROM tires
      WHERE make_name = ? AND model_name IS NOT NULL AND model_name != ''`
    )
    .all(brandName) as { model_name: string }[];

  for (const row of rows) {
    if (toSlug(row.model_name) === slug) {
      return row.model_name;
    }
  }
  return null;
}

export function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// Cache for brand name lookups (populated lazily)
let _brandSlugCache: Map<string, string> | null = null;

export function getBrandSlugMap(): Map<string, string> {
  if (_brandSlugCache) return _brandSlugCache;
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT DISTINCT make_name FROM tires
      WHERE make_name IS NOT NULL AND make_name != ''
      ORDER BY make_name`
    )
    .all() as { make_name: string }[];

  _brandSlugCache = new Map();
  for (const row of rows) {
    _brandSlugCache.set(toSlug(row.make_name), row.make_name);
  }
  return _brandSlugCache;
}
