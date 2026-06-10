/**
 * Database provider — currently SQLite via better-sqlite3.
 *
 * When deploying to Vercel, swap this to Turso (@libsql/client) or
 * Supabase PostgreSQL. The rest of the app imports from this file only,
 * so the swap is a config change, not a rewrite.
 */

export {
  getAllBrands,
  getBrandBySlug,
  getManufacturer,
  getModelsByBrand,
  getModelBySlug,
  getTiresBySize,
  getDistinctSizes,
  searchTires,
  getStats,
  toSlug,
  getBrandSlugMap,
} from "./sqlite";

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
