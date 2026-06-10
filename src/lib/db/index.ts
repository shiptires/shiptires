/**
 * Database provider — Turso (libSQL) for Vercel deployment.
 *
 * Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in environment.
 * For local development with SQLite, set USE_LOCAL_SQLITE=1 and
 * TIRE_DB_PATH to use the local sqlite driver instead.
 */

const useTurso = !process.env.USE_LOCAL_SQLITE;

// Dynamically choose the driver. Both export the same function signatures.
// Turso functions are async; SQLite functions are sync.
// All callers should await the results regardless.

export {
  getAllBrands,
  getBrandBySlug,
  getManufacturer,
  getModelsByBrand,
  getModelBySlug,
  getTiresBySize,
  getTiresByBrandAndSize,
  getDistinctSizes,
  getDistinctSizesForBrand,
  searchTires,
  getStats,
  getTopBrandsForType,
  toSlug,
  getBrandSlugMap,
} from "./turso";

export {
  tireRowToSize,
  tiresToModel,
  brandSummaryToBrand,
  modelSummaryToModel,
} from "./mappers";

export type {
  TireRow,
  ManufacturerRow,
  BrandSummaryRow,
  ModelSummaryRow,
  SearchParams,
  SearchResult,
} from "./types";
