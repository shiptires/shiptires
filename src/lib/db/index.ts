/**
 * Database provider — always uses Turso.
 *
 * Local SQLite was attempted but Turbopack doesn't handle dynamic require()
 * correctly, causing build failures on Vercel. Since Turso is on a paid tier,
 * it's fast and reliable for both builds and runtime.
 */

export {
  getAllBrands,
  getBrandBySlug,
  getManufacturer,
  getModelsByBrand,
  getModelBySlug,
  getTireModelDetails,
  getTiresBySize,
  getTiresByBrandAndSize,
  getDistinctSizes,
  getDistinctSizesForBrand,
  searchTires,
  searchModels,
  getStats,
  getTopBrandsForType,
  getShowcaseModelsForType,
  getTireById,
  getTireBySize,
  getTiresForFeed,
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
  TireModelDetailsRow,
} from "./types";
