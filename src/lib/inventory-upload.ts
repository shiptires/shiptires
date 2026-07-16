import { getSupabase } from "@/lib/supabase";
import {
  bulkUpsertInventory,
  updateDistributorSyncTime,
} from "@/lib/distributors";
import { getTireLookupMaps } from "@/lib/db";

// ── Types ───────────────────────────────────────────────────

export interface UploadResult {
  totalRows: number;
  matched: number;
  unmatched: number;
  zeroed: number;
  errors: string[];
  duration: number;
}

interface GenericCsvRow {
  brand: string;
  model: string;
  size: string;
  partNumber: string;
  cost: number;
  quantity: number;
  description: string;
  manufacturer: string;
  fet: number;
  mapPricing: number;
  warehouseQuantities: Record<string, number>;
}

// ── Column Mapping ──────────────────────────────────────────

/**
 * Known column name aliases — maps various header labels to our standard fields.
 * Distributors use different names for the same thing; this normalizes them.
 */
const COLUMN_ALIASES: Record<string, string[]> = {
  manufacturer: ["manufacturer", "mfg", "mfr"],
  brand: ["brand", "make", "tire_brand", "tire brand"],
  model: ["model", "pattern", "product", "tire_model", "tire model", "line", "product_name", "product name", "tire_description", "tire description", "tire_name", "tire name", "tread", "tread_name", "tread name"],
  size: ["size", "tire_size", "tire size", "tiresize", "dimensions"],
  partNumber: ["part_number", "part number", "partnumber", "item#", "item_number", "item number", "sku", "item", "part#", "part_no", "partno", "upc", "mpn", "vendor_part", "vendor part", "mfr_part", "mfr part"],
  cost: ["cost", "price", "unit_price", "unit price", "unitprice", "wholesale", "dealer_price", "dealer price", "net_price", "net price", "dealer cost", "dealer_cost"],
  quantity: ["quantity", "qty", "stock", "available", "avail", "on_hand", "on hand", "total", "inventory", "count", "total qty", "total_qty"],
  description: ["description", "desc", "product_description", "product description", "name", "title", "item_description", "item description", "full_description", "full description"],
  fet: ["fet", "federal excise tax", "excise tax", "excise_tax"],
  mapPricing: ["map pricing", "map_pricing", "msrp"],
};

/**
 * Auto-detect column mapping from CSV headers.
 * Returns a map of our field name → column index.
 */
function detectColumns(headers: string[]): Map<string, number> {
  const mapping = new Map<string, number>();
  const normalizedHeaders = headers.map((h) => h.trim().toLowerCase().replace(/[^a-z0-9_ ]/g, ""));

  for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
    for (const alias of aliases) {
      const idx = normalizedHeaders.indexOf(alias);
      if (idx !== -1 && !mapping.has(field)) {
        mapping.set(field, idx);
        break;
      }
    }
  }

  return mapping;
}

/**
 * Detect warehouse/location columns in the CSV headers.
 *
 * Recognizes patterns like:
 *   - "TLC 100", "RDC 600" (TireHub style)
 *   - "WH 001", "WH-Atlanta", "Warehouse 5"
 *   - "LOC 100", "DC 200"
 *   - Any column header that isn't a known field and isn't "Total"/"FET"/"MAP Pricing"
 *     will be treated as a warehouse column if the first data row has a numeric value there.
 *
 * Returns array of { index, code } where code is the warehouse identifier.
 */
function detectWarehouseColumns(
  headers: string[],
  mappedIndices: Set<number>,
  firstDataCols: string[]
): Array<{ index: number; code: string }> {
  const warehouseColumns: Array<{ index: number; code: string }> = [];

  // Headers to skip even if unmapped
  const skipHeaders = new Set(["total", "retail", "retail price"]);

  for (let i = 0; i < headers.length; i++) {
    // Skip already-mapped columns
    if (mappedIndices.has(i)) continue;

    const header = headers[i]?.trim() || "";
    const headerLower = header.toLowerCase();

    // Skip known non-warehouse headers
    if (!header || skipHeaders.has(headerLower)) continue;

    // Pattern 1: TLC/RDC/WH/DC/LOC + number (e.g. "TLC 100", "RDC 600", "WH 001")
    const locationMatch = header.match(/^(?:TLC|RDC|WH|DC|LOC|WHSE|WAREHOUSE)\s*[-_]?\s*(\w+)$/i);
    if (locationMatch) {
      warehouseColumns.push({ index: i, code: locationMatch[1] });
      continue;
    }

    // Pattern 2: Any unmapped column with numeric data in first row → treat as warehouse
    if (firstDataCols[i] !== undefined) {
      const val = firstDataCols[i].trim();
      if (/^\d+$/.test(val)) {
        // Use the header as the warehouse code, cleaned up
        const code = header.replace(/[^a-zA-Z0-9_-]/g, "_").replace(/^_+|_+$/g, "") || `col_${i}`;
        warehouseColumns.push({ index: i, code });
      }
    }
  }

  return warehouseColumns;
}

// ── CSV Parsing ─────────────────────────────────────────────

/** Parse a single CSV line handling quoted fields with commas inside */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

/**
 * Parse a generic distributor CSV into structured rows.
 * Auto-detects column mapping from headers + warehouse location columns.
 */
export function parseGenericCsv(csvText: string): { rows: GenericCsvRow[]; detectedColumns: Record<string, number>; warehouseColumnsDetected: string[]; warehouseColumns: Array<{ index: number; code: string }>; missingColumns: string[]; rawHeaders: string[] } {
  const lines = csvText.split("\n").map((l) => l.replace(/\r$/, ""));
  if (lines.length < 2) return { rows: [], detectedColumns: {}, warehouseColumnsDetected: [], warehouseColumns: [], missingColumns: [], rawHeaders: [] };

  const headers = parseCSVLine(lines[0]);
  const mapping = detectColumns(headers);

  // Fallback: if manufacturer detected but brand not → use manufacturer as brand
  if (mapping.has("manufacturer") && !mapping.has("brand")) {
    mapping.set("brand", mapping.get("manufacturer")!);
  }

  const detectedColumns: Record<string, number> = {};
  const mappedIndices = new Set<number>();
  mapping.forEach((idx, field) => { detectedColumns[field] = idx; mappedIndices.add(idx); });

  // Detect warehouse columns using first data row for type inference
  const firstDataLine = lines.find((l, i) => i > 0 && l.trim());
  const firstDataCols = firstDataLine ? parseCSVLine(firstDataLine) : [];
  const warehouseColumns = detectWarehouseColumns(headers, mappedIndices, firstDataCols);
  const warehouseColumnsDetected = warehouseColumns.map((wc) => `${headers[wc.index]?.trim()} → ${wc.code}`);

  // If we have warehouse columns, quantity becomes optional (we can sum warehouses)
  const required = warehouseColumns.length > 0
    ? ["brand", "size", "cost"]
    : ["brand", "size", "cost", "quantity"];
  const missingColumns = required.filter((f) => !mapping.has(f));

  if (missingColumns.length > 0) {
    return { rows: [], detectedColumns, warehouseColumnsDetected, warehouseColumns, missingColumns, rawHeaders: headers };
  }

  const rows: GenericCsvRow[] = [];

  for (let lineIdx = 1; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx].trim();
    if (!line) continue;

    const cols = parseCSVLine(line);

    const cost = parseFloat(cols[mapping.get("cost")!]) || 0;
    if (cost <= 0) continue;

    // Parse warehouse quantities
    const warehouseQuantities: Record<string, number> = {};
    let warehouseTotal = 0;
    for (const wc of warehouseColumns) {
      const qty = parseInt(cols[wc.index]) || 0;
      if (qty > 0) {
        warehouseQuantities[wc.code] = qty;
        warehouseTotal += qty;
      }
    }

    // Use explicit quantity column if present, otherwise sum warehouse quantities
    const quantity = mapping.has("quantity")
      ? (parseInt(cols[mapping.get("quantity")!]) || warehouseTotal)
      : warehouseTotal;

    rows.push({
      brand: cols[mapping.get("brand")!]?.trim() || "",
      model: mapping.has("model") ? (cols[mapping.get("model")!]?.trim() || "") : "",
      size: cols[mapping.get("size")!]?.trim() || "",
      partNumber: mapping.has("partNumber") ? (cols[mapping.get("partNumber")!]?.trim() || "") : "",
      cost,
      quantity,
      description: mapping.has("description") ? (cols[mapping.get("description")!]?.trim() || "") : "",
      manufacturer: mapping.has("manufacturer") ? (cols[mapping.get("manufacturer")!]?.trim() || "") : "",
      fet: mapping.has("fet") ? (parseFloat(cols[mapping.get("fet")!]) || 0) : 0,
      mapPricing: mapping.has("mapPricing") ? (parseFloat(cols[mapping.get("mapPricing")!]) || 0) : 0,
      warehouseQuantities,
    });
  }

  return { rows, detectedColumns, warehouseColumnsDetected, warehouseColumns, missingColumns, rawHeaders: headers };
}

// ── Tire Matching ───────────────────────────────────────────

async function buildLookupMaps(distributorId: string) {
  const byPartNumber = new Map<string, number>();
  const byBrandSize = new Map<string, number>();
  let modelById = new Map<number, string>();
  let sizeById = new Map<number, string>();

  // 1. Load existing distributor inventory (for repeat uploads)
  const { data: existingInv } = await getSupabase()
    .from("distributor_inventory")
    .select("tire_id, part_number, brand, size")
    .eq("distributor_id", distributorId)
    .eq("active", true);

  if (existingInv) {
    for (const inv of existingInv) {
      if (inv.part_number) {
        byPartNumber.set(inv.part_number, inv.tire_id);
      }
      const key = `${(inv.brand || "").toLowerCase()}|${(inv.size || "").toLowerCase()}`;
      byBrandSize.set(key, inv.tire_id);
    }
  }

  // 2. Also load the global tires catalog for matching (critical for first upload)
  try {
    const globalMaps = await getTireLookupMaps();
    // Merge global maps — existing inventory takes priority (don't overwrite)
    for (const [pn, tireId] of globalMaps.byPartNumber) {
      if (!byPartNumber.has(pn)) byPartNumber.set(pn, tireId);
    }
    for (const [key, tireId] of globalMaps.byBrandSize) {
      if (!byBrandSize.has(key)) byBrandSize.set(key, tireId);
    }
    modelById = globalMaps.modelById;
    sizeById = globalMaps.sizeById;
  } catch (e) {
    console.warn("[inventory-upload] Failed to load global tire catalog for matching:", e);
    // Continue with just distributor inventory maps
  }

  return { byPartNumber, byBrandSize, modelById, sizeById };
}

/**
 * Normalize a tire size string for matching.
 * Strips common prefixes (LT, P, ST) and suffixes (C, LT, E, XL)
 * so "LT225/75R16" matches "225/75R16" and "185/60R15C" matches "185/60R15".
 * Also handles flotation sizes like "35X12.50R20LT" → "35X12.50R20".
 */
function normalizeSize(size: string): string {
  return size
    .replace(/^(LT|P|ST)/i, "")       // strip prefix
    .replace(/(C|LT|E|XL)$/i, "")     // strip suffix
    .replace(/ZR/gi, "R")             // 245/35ZR20 → 245/35R20
    .trim();
}

/**
 * Normalize brand names from distributor CSVs to match our catalog.
 * Distributors may use different spellings/formats than TireWeb.
 */
const BRAND_ALIASES: Record<string, string> = {
  "bf goodrich": "bfgoodrich",
  "bf good rich": "bfgoodrich",
  "gt": "gt radial",
  "land golden": "landgolden",
};

function normalizeBrand(brand: string): string {
  const lower = brand.toLowerCase().trim();
  return BRAND_ALIASES[lower] || lower;
}

function findTireId(
  row: GenericCsvRow,
  byPartNumber: Map<string, number>,
  byBrandSize: Map<string, number>
): number | null {
  // 1. Try part number match
  if (row.partNumber && byPartNumber.has(row.partNumber)) {
    return byPartNumber.get(row.partNumber)!;
  }

  const brand = normalizeBrand(row.brand);
  const size = row.size.toLowerCase();

  // 2. Try exact brand|size match
  const key = `${brand}|${size}`;
  if (byBrandSize.has(key)) {
    return byBrandSize.get(key)!;
  }

  // 3. Try with normalized size (strip LT/P/ST prefix, C/LT/E/XL suffix)
  const normalized = normalizeSize(size);
  if (normalized !== size) {
    const normKey = `${brand}|${normalized}`;
    if (byBrandSize.has(normKey)) {
      return byBrandSize.get(normKey)!;
    }
  }

  return null;
}

// ── Auto-create Warehouse Records ───────────────────────────

/**
 * Ensure warehouse records exist for detected warehouse columns.
 * Creates stub entries with "TBD" addresses that the admin fills in later.
 */
async function ensureWarehouseRecords(
  distributorName: string,
  warehouseColumns: Array<{ index: number; code: string }>,
  headers: string[]
): Promise<void> {
  if (warehouseColumns.length === 0) return;

  for (const wc of warehouseColumns) {
    const headerText = headers[wc.index]?.trim() || wc.code;

    // Check if a warehouse with this location_code already exists for this distributor
    const { data: existing } = await getSupabase()
      .from("warehouses")
      .select("id")
      .eq("distributor_name", distributorName)
      .eq("location_code", wc.code)
      .limit(1);

    if (existing && existing.length > 0) continue;

    // Create stub warehouse record
    const { error } = await getSupabase()
      .from("warehouses")
      .insert({
        distributor_name: distributorName,
        location_name: headerText,
        location_code: wc.code,
        street1: "TBD",
        city: "TBD",
        state: "TBD",
        postal_code: "00000",
        country: "US",
        phone: "TBD",
        is_default: false,
        active: true,
      });

    if (error) {
      console.warn(`[inventory-upload] Failed to create warehouse record for ${headerText}: ${error.message}`);
    }
  }
}

// ── Main Sync ───────────────────────────────────────────────

/**
 * Process a distributor's inventory CSV upload and sync to distributor_inventory.
 * Generic — works with any distributor's CSV format as long as it has brand, size, cost, quantity columns.
 */
export async function processInventoryUpload(
  csvText: string,
  distributorId: string
): Promise<UploadResult> {
  const startTime = Date.now();
  const errors: string[] = [];

  // 1. Parse CSV
  const { rows, detectedColumns, warehouseColumnsDetected, warehouseColumns, missingColumns, rawHeaders } = parseGenericCsv(csvText);

  // Log raw CSV headers and detected column mapping for debugging
  errors.push(`CSV headers (${rawHeaders.length} cols): ${rawHeaders.join(" | ")}`);
  errors.push(`Detected mapping: ${JSON.stringify(detectedColumns)}`);

  if (missingColumns.length > 0) {
    return {
      totalRows: 0,
      matched: 0,
      unmatched: 0,
      zeroed: 0,
      errors: [`Missing required columns: ${missingColumns.join(", ")}. Detected columns: ${JSON.stringify(detectedColumns)}`, ...errors],
      duration: Date.now() - startTime,
    };
  }

  if (warehouseColumnsDetected.length > 0) {
    errors.push(`Detected ${warehouseColumnsDetected.length} warehouse columns: ${warehouseColumnsDetected.join(", ")}`);

    // Auto-create warehouse stub records for any new location codes
    const { data: dist } = await getSupabase()
      .from("distributors")
      .select("name")
      .eq("id", distributorId)
      .single();

    if (dist?.name) {
      await ensureWarehouseRecords(dist.name, warehouseColumns, rawHeaders);
    }
  }

  // Log first 3 parsed rows as samples
  if (rows.length > 0) {
    const samples = rows.slice(0, 3).map((r) =>
      `brand="${r.brand}" model="${r.model}" size="${r.size}" pn="${r.partNumber}" cost=${r.cost} qty=${r.quantity} wh=${JSON.stringify(r.warehouseQuantities)}`
    );
    errors.push(`Sample rows: ${samples.join(" | ")}`);
  }

  if (rows.length === 0) {
    return {
      totalRows: 0,
      matched: 0,
      unmatched: 0,
      zeroed: 0,
      errors: ["No valid rows found in CSV (rows need a price > 0)"],
      duration: Date.now() - startTime,
    };
  }

  // 2. Build lookup maps
  const { byPartNumber, byBrandSize, modelById, sizeById } = await buildLookupMaps(distributorId);

  // 3. Match rows
  let matched = 0;
  let unmatched = 0;
  const processedTireIds = new Set<number>();
  const unmatchedItems: string[] = [];

  const upsertBatch: Array<{
    distributor_id: string;
    tire_id: number;
    cost: number;
    quantity: number;
    part_number: string;
    brand: string;
    model: string;
    size: string;
    manufacturer?: string;
    description?: string;
    fet?: number;
    map_pricing?: number;
    warehouse_quantities?: Record<string, number>;
  }> = [];

  for (const row of rows) {
    const tireId = findTireId(row, byPartNumber, byBrandSize);

    if (tireId === null) {
      unmatched++;
      unmatchedItems.push(`${row.brand} ${row.model} ${row.size} (${row.partNumber || "no PN"})`);
      continue;
    }

    matched++;
    processedTireIds.add(tireId);

    // Backfill model and size from catalog if CSV doesn't provide valid ones
    const model = row.model || modelById.get(tireId) || "";
    const looksLikeSize = /\d.*[rR]\d/.test(row.size);
    const size = (looksLikeSize ? row.size : null) || sizeById.get(tireId) || row.size;

    upsertBatch.push({
      distributor_id: distributorId,
      tire_id: tireId,
      cost: row.cost,
      quantity: row.quantity,
      part_number: row.partNumber,
      brand: row.brand,
      model,
      size,
      manufacturer: row.manufacturer || undefined,
      description: row.description || undefined,
      fet: row.fet || undefined,
      map_pricing: row.mapPricing || undefined,
      warehouse_quantities: Object.keys(row.warehouseQuantities).length > 0
        ? row.warehouseQuantities
        : undefined,
    });
  }

  // 4. Bulk upsert
  if (upsertBatch.length > 0) {
    const result = await bulkUpsertInventory(upsertBatch);
    if (result.errors.length > 0) {
      errors.push(...result.errors.map((e) => `Upsert error tire_id=${e.tire_id}: ${e.error}`));
    }
  }

  // 5. Zero out items not in the new feed
  let zeroed = 0;
  if (processedTireIds.size > 0) {
    const { data: allActive } = await getSupabase()
      .from("distributor_inventory")
      .select("id, tire_id")
      .eq("distributor_id", distributorId)
      .eq("active", true)
      .gt("quantity", 0);

    if (allActive) {
      const toZero = allActive.filter((item) => !processedTireIds.has(item.tire_id));
      if (toZero.length > 0) {
        const zeroIds = toZero.map((item) => item.id);
        for (let i = 0; i < zeroIds.length; i += 100) {
          const chunk = zeroIds.slice(i, i + 100);
          const { error } = await getSupabase()
            .from("distributor_inventory")
            .update({
              quantity: 0,
              warehouse_quantities: {},
              last_synced_at: new Date().toISOString(),
            })
            .in("id", chunk);

          if (error) {
            errors.push(`Failed to zero out ${chunk.length} items: ${error.message}`);
          } else {
            zeroed += chunk.length;
          }
        }
      }
    }
  }

  // 6. Update sync timestamp
  await updateDistributorSyncTime(distributorId);

  // Log ALL unmatched items (not just 20)
  if (unmatchedItems.length > 0) {
    errors.push(`${unmatched} unmatched items: ${unmatchedItems.join("; ")}`);
  }

  return {
    totalRows: rows.length,
    matched,
    unmatched,
    zeroed,
    errors,
    duration: Date.now() - startTime,
  };
}

/**
 * Process multiple warehouse CSV files and merge into per-warehouse inventory.
 *
 * Each file is tagged with a warehouse code (e.g., "AZ", "NH", "PA").
 * The same tire can have different costs at different warehouses.
 *
 * Merges by part_number into:
 *   - warehouse_quantities[code] = qty
 *   - location_costs[code] = cost
 *   - cost = MIN(all warehouse costs) — best price wins
 *   - quantity = SUM(all warehouse quantities)
 */
export async function processWarehouseUpload(
  files: Array<{ warehouseCode: string; csvText: string }>,
  distributorId: string
): Promise<UploadResult> {
  const startTime = Date.now();
  const errors: string[] = [];

  // Merged inventory keyed by part_number (or brand|size as fallback)
  const merged = new Map<
    string,
    {
      row: GenericCsvRow;
      warehouseQuantities: Record<string, number>;
      locationCosts: Record<string, number>;
      minCost: number;
      totalQuantity: number;
    }
  >();

  let totalRowsParsed = 0;

  for (const file of files) {
    const { warehouseCode, csvText } = file;
    const { rows, detectedColumns, missingColumns, rawHeaders } = parseGenericCsv(csvText);

    errors.push(`[${warehouseCode}] CSV headers (${rawHeaders.length} cols): ${rawHeaders.join(" | ")}`);
    errors.push(`[${warehouseCode}] Detected mapping: ${JSON.stringify(detectedColumns)}`);

    if (missingColumns.length > 0) {
      errors.push(`[${warehouseCode}] Missing required columns: ${missingColumns.join(", ")}. Skipping file.`);
      continue;
    }

    errors.push(`[${warehouseCode}] Parsed ${rows.length} rows`);
    totalRowsParsed += rows.length;

    for (const row of rows) {
      // Key by part_number if available, else brand|size
      const key = row.partNumber
        ? row.partNumber.toUpperCase()
        : `${row.brand.toUpperCase()}|${row.size.toUpperCase()}`;

      const existing = merged.get(key);
      if (existing) {
        existing.warehouseQuantities[warehouseCode] = row.quantity;
        existing.locationCosts[warehouseCode] = row.cost;
        existing.totalQuantity += row.quantity;
        if (row.cost < existing.minCost) {
          existing.minCost = row.cost;
          // Update the row reference to the cheapest source for metadata
          existing.row = row;
        }
      } else {
        merged.set(key, {
          row,
          warehouseQuantities: { [warehouseCode]: row.quantity },
          locationCosts: { [warehouseCode]: row.cost },
          minCost: row.cost,
          totalQuantity: row.quantity,
        });
      }
    }
  }

  errors.push(`Merged ${merged.size} unique items from ${files.length} warehouse files (${totalRowsParsed} total rows)`);

  if (merged.size === 0) {
    return {
      totalRows: totalRowsParsed,
      matched: 0,
      unmatched: 0,
      zeroed: 0,
      errors: ["No valid rows found across all warehouse files", ...errors],
      duration: Date.now() - startTime,
    };
  }

  // Build lookup maps for tire matching
  const { byPartNumber, byBrandSize, modelById, sizeById } = await buildLookupMaps(distributorId);

  let matched = 0;
  let unmatched = 0;
  const processedTireIds = new Set<number>();
  const unmatchedItems: string[] = [];

  const upsertBatch: Array<{
    distributor_id: string;
    tire_id: number;
    cost: number;
    quantity: number;
    part_number: string;
    brand: string;
    model: string;
    size: string;
    manufacturer?: string;
    description?: string;
    fet?: number;
    map_pricing?: number;
    warehouse_quantities?: Record<string, number>;
    location_costs?: Record<string, number>;
  }> = [];

  for (const [, entry] of merged) {
    const { row, warehouseQuantities, locationCosts, minCost, totalQuantity } = entry;

    const tireId = findTireId(row, byPartNumber, byBrandSize);
    if (tireId === null) {
      unmatched++;
      unmatchedItems.push(`${row.brand} ${row.model} ${row.size} (${row.partNumber || "no PN"})`);
      continue;
    }

    matched++;
    processedTireIds.add(tireId);

    const model = row.model || modelById.get(tireId) || "";
    const looksLikeSize = /\d.*[rR]\d/.test(row.size);
    const size = (looksLikeSize ? row.size : null) || sizeById.get(tireId) || row.size;

    upsertBatch.push({
      distributor_id: distributorId,
      tire_id: tireId,
      cost: minCost,
      quantity: totalQuantity,
      part_number: row.partNumber,
      brand: row.brand,
      model,
      size,
      manufacturer: row.manufacturer || undefined,
      description: row.description || undefined,
      fet: row.fet || undefined,
      map_pricing: row.mapPricing || undefined,
      warehouse_quantities: warehouseQuantities,
      location_costs: locationCosts,
    });
  }

  // Bulk upsert
  if (upsertBatch.length > 0) {
    const result = await bulkUpsertInventory(upsertBatch);
    if (result.errors.length > 0) {
      errors.push(...result.errors.map((e) => `Upsert error tire_id=${e.tire_id}: ${e.error}`));
    }
  }

  // Zero out items not in any of the warehouse files
  let zeroed = 0;
  if (processedTireIds.size > 0) {
    const { data: allActive } = await getSupabase()
      .from("distributor_inventory")
      .select("id, tire_id")
      .eq("distributor_id", distributorId)
      .eq("active", true)
      .gt("quantity", 0);

    if (allActive) {
      const toZero = allActive.filter((item) => !processedTireIds.has(item.tire_id));
      if (toZero.length > 0) {
        const zeroIds = toZero.map((item) => item.id);
        for (let i = 0; i < zeroIds.length; i += 100) {
          const chunk = zeroIds.slice(i, i + 100);
          const { error } = await getSupabase()
            .from("distributor_inventory")
            .update({
              quantity: 0,
              warehouse_quantities: {},
              location_costs: {},
              last_synced_at: new Date().toISOString(),
            })
            .in("id", chunk);

          if (error) {
            errors.push(`Failed to zero out ${chunk.length} items: ${error.message}`);
          } else {
            zeroed += chunk.length;
          }
        }
      }
    }
  }

  // Update sync timestamp
  await updateDistributorSyncTime(distributorId);

  if (unmatchedItems.length > 0) {
    errors.push(`${unmatched} unmatched items: ${unmatchedItems.join("; ")}`);
  }

  return {
    totalRows: totalRowsParsed,
    matched,
    unmatched,
    zeroed,
    errors,
    duration: Date.now() - startTime,
  };
}

/**
 * Process a single-warehouse CSV upload by merging into the existing
 * per-warehouse data for a specific warehouse code.
 *
 * Instead of overwriting the entire inventory, this merges the CSV data
 * into location_costs[warehouseCode] and warehouse_quantities[warehouseCode],
 * then recalculates cost = MIN(location_costs) and quantity = SUM(warehouse_quantities).
 */
export async function processSingleWarehouseUpload(
  csvText: string,
  distributorId: string,
  warehouseCode: string
): Promise<UploadResult> {
  const startTime = Date.now();
  const errors: string[] = [];

  // 1. Parse the CSV
  const { rows, detectedColumns, missingColumns, rawHeaders } = parseGenericCsv(csvText);

  errors.push(`[${warehouseCode}] CSV headers (${rawHeaders.length} cols): ${rawHeaders.join(" | ")}`);
  errors.push(`[${warehouseCode}] Detected mapping: ${JSON.stringify(detectedColumns)}`);

  if (missingColumns.length > 0) {
    return {
      totalRows: 0,
      matched: 0,
      unmatched: 0,
      zeroed: 0,
      errors: [`Missing required columns: ${missingColumns.join(", ")}`, ...errors],
      duration: Date.now() - startTime,
    };
  }

  if (rows.length === 0) {
    return {
      totalRows: 0,
      matched: 0,
      unmatched: 0,
      zeroed: 0,
      errors: ["No valid rows found in CSV", ...errors],
      duration: Date.now() - startTime,
    };
  }

  // 2. Build lookup maps
  const { byPartNumber, byBrandSize, modelById, sizeById } = await buildLookupMaps(distributorId);

  // 3. Match rows and collect tire IDs with their warehouse data
  let matched = 0;
  let unmatched = 0;
  const matchedTires = new Map<number, { row: GenericCsvRow }>();

  for (const row of rows) {
    const tireId = findTireId(row, byPartNumber, byBrandSize);
    if (tireId === null) {
      unmatched++;
      continue;
    }
    matched++;
    // If same tire appears multiple times, keep the one with lower cost
    const existing = matchedTires.get(tireId);
    if (!existing || row.cost < existing.row.cost) {
      matchedTires.set(tireId, { row });
    }
  }

  // 4. For each matched tire, fetch existing inventory and merge warehouse data
  const tireIds = Array.from(matchedTires.keys());
  let zeroed = 0;

  // Fetch existing inventory for these tires in batches
  const existingMap = new Map<number, { id: string; location_costs: Record<string, number>; warehouse_quantities: Record<string, number> }>();
  for (let i = 0; i < tireIds.length; i += 100) {
    const chunk = tireIds.slice(i, i + 100);
    const { data } = await getSupabase()
      .from("distributor_inventory")
      .select("id, tire_id, location_costs, warehouse_quantities")
      .eq("distributor_id", distributorId)
      .in("tire_id", chunk);

    if (data) {
      for (const row of data) {
        existingMap.set(row.tire_id, {
          id: row.id,
          location_costs: row.location_costs || {},
          warehouse_quantities: row.warehouse_quantities || {},
        });
      }
    }
  }

  // 5. Build upsert batch with merged data
  const upsertBatch: Array<{
    distributor_id: string;
    tire_id: number;
    cost: number;
    quantity: number;
    part_number: string;
    brand: string;
    model: string;
    size: string;
    manufacturer?: string;
    description?: string;
    fet?: number;
    map_pricing?: number;
    warehouse_quantities?: Record<string, number>;
    location_costs?: Record<string, number>;
  }> = [];

  for (const [tireId, { row }] of matchedTires) {
    const existing = existingMap.get(tireId);

    // Merge location_costs: keep all existing, update this warehouse
    const locationCosts = { ...(existing?.location_costs || {}) };
    locationCosts[warehouseCode] = row.cost;

    // Merge warehouse_quantities: keep all existing, update this warehouse
    const warehouseQuantities = { ...(existing?.warehouse_quantities || {}) };
    warehouseQuantities[warehouseCode] = row.quantity;

    // Recalculate aggregates
    const costValues = Object.values(locationCosts).filter((c) => c > 0);
    const minCost = costValues.length > 0 ? Math.min(...costValues) : row.cost;
    const totalQty = Object.values(warehouseQuantities).reduce((s, q) => s + q, 0);

    const model = row.model || modelById.get(tireId) || "";
    const looksLikeSize = /\d.*[rR]\d/.test(row.size);
    const size = (looksLikeSize ? row.size : null) || sizeById.get(tireId) || row.size;

    upsertBatch.push({
      distributor_id: distributorId,
      tire_id: tireId,
      cost: minCost,
      quantity: totalQty,
      part_number: row.partNumber,
      brand: row.brand,
      model,
      size,
      manufacturer: row.manufacturer || undefined,
      description: row.description || undefined,
      fet: row.fet || undefined,
      map_pricing: row.mapPricing || undefined,
      warehouse_quantities: warehouseQuantities,
      location_costs: locationCosts,
    });
  }

  // 6. Bulk upsert
  if (upsertBatch.length > 0) {
    const result = await bulkUpsertInventory(upsertBatch);
    if (result.errors.length > 0) {
      errors.push(...result.errors.map((e) => `Upsert error tire_id=${e.tire_id}: ${e.error}`));
    }
  }

  // 7. Update sync timestamp
  await updateDistributorSyncTime(distributorId);

  return {
    totalRows: rows.length,
    matched,
    unmatched,
    zeroed,
    errors,
    duration: Date.now() - startTime,
  };
}

/**
 * Log an upload attempt to the distributor_uploads table.
 */
export async function logUpload(
  distributorId: string,
  result: UploadResult,
  method: "api" | "sftp",
  filename?: string,
  ipAddress?: string
): Promise<void> {
  await getSupabase()
    .from("distributor_uploads")
    .insert({
      distributor_id: distributorId,
      filename,
      method,
      rows_total: result.totalRows,
      rows_matched: result.matched,
      rows_unmatched: result.unmatched,
      rows_zeroed: result.zeroed,
      errors: result.errors,
      duration_ms: result.duration,
      ip_address: ipAddress,
    })
    .then(({ error }) => {
      if (error) console.warn("[inventory-upload] Failed to log upload:", error.message);
    });
}
