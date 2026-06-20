import { getSupabase } from "@/lib/supabase";
import {
  bulkUpsertInventory,
  updateDistributorSyncTime,
} from "@/lib/distributors";

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
  warehouseQuantities: Record<string, number>;
}

// ── Column Mapping ──────────────────────────────────────────

/**
 * Known column name aliases — maps various header labels to our standard fields.
 * Distributors use different names for the same thing; this normalizes them.
 */
const COLUMN_ALIASES: Record<string, string[]> = {
  brand: ["brand", "manufacturer", "mfg", "make", "tire_brand", "tire brand"],
  model: ["model", "pattern", "product", "tire_model", "tire model", "line", "product_name", "product name"],
  size: ["size", "tire_size", "tire size", "tiresize", "dimensions"],
  partNumber: ["part_number", "part number", "partnumber", "item#", "item_number", "item number", "sku", "item", "part#", "part_no", "partno", "upc", "mpn"],
  cost: ["cost", "price", "unit_price", "unit price", "unitprice", "wholesale", "dealer_price", "dealer price", "net_price", "net price"],
  quantity: ["quantity", "qty", "stock", "available", "avail", "on_hand", "on hand", "total", "inventory", "count"],
  description: ["description", "desc", "product_description", "product description", "name", "title", "item_description", "item description"],
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
  const skipHeaders = new Set(["total", "fet", "map pricing", "map", "msrp", "retail", "retail price"]);

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
export function parseGenericCsv(csvText: string): { rows: GenericCsvRow[]; detectedColumns: Record<string, number>; warehouseColumnsDetected: string[]; missingColumns: string[] } {
  const lines = csvText.split("\n").map((l) => l.replace(/\r$/, ""));
  if (lines.length < 2) return { rows: [], detectedColumns: {}, warehouseColumnsDetected: [], missingColumns: [] };

  const headers = parseCSVLine(lines[0]);
  const mapping = detectColumns(headers);

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
    return { rows: [], detectedColumns, warehouseColumnsDetected, missingColumns };
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
      warehouseQuantities,
    });
  }

  return { rows, detectedColumns, warehouseColumnsDetected, missingColumns };
}

// ── Tire Matching ───────────────────────────────────────────

async function buildLookupMaps(distributorId: string) {
  const { data: existingInv } = await getSupabase()
    .from("distributor_inventory")
    .select("tire_id, part_number, brand, size")
    .eq("distributor_id", distributorId)
    .eq("active", true);

  const byPartNumber = new Map<string, number>();
  const byBrandSize = new Map<string, number>();

  if (existingInv) {
    for (const inv of existingInv) {
      if (inv.part_number) {
        byPartNumber.set(inv.part_number, inv.tire_id);
      }
      const key = `${(inv.brand || "").toLowerCase()}|${(inv.size || "").toLowerCase()}`;
      byBrandSize.set(key, inv.tire_id);
    }
  }

  return { byPartNumber, byBrandSize };
}

function findTireId(
  row: GenericCsvRow,
  byPartNumber: Map<string, number>,
  byBrandSize: Map<string, number>
): number | null {
  if (row.partNumber && byPartNumber.has(row.partNumber)) {
    return byPartNumber.get(row.partNumber)!;
  }
  const key = `${row.brand.toLowerCase()}|${row.size.toLowerCase()}`;
  if (byBrandSize.has(key)) {
    return byBrandSize.get(key)!;
  }
  return null;
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
  const { rows, detectedColumns, warehouseColumnsDetected, missingColumns } = parseGenericCsv(csvText);

  if (missingColumns.length > 0) {
    return {
      totalRows: 0,
      matched: 0,
      unmatched: 0,
      zeroed: 0,
      errors: [`Missing required columns: ${missingColumns.join(", ")}. Detected columns: ${JSON.stringify(detectedColumns)}`],
      duration: Date.now() - startTime,
    };
  }

  if (warehouseColumnsDetected.length > 0) {
    errors.push(`Detected ${warehouseColumnsDetected.length} warehouse columns: ${warehouseColumnsDetected.join(", ")}`);
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
  const { byPartNumber, byBrandSize } = await buildLookupMaps(distributorId);

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

    upsertBatch.push({
      distributor_id: distributorId,
      tire_id: tireId,
      cost: row.cost,
      quantity: row.quantity,
      part_number: row.partNumber,
      brand: row.brand,
      model: row.model || "",
      size: row.size,
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

  // Log unmatched summary
  if (unmatchedItems.length > 0) {
    const preview = unmatchedItems.slice(0, 20);
    errors.push(`${unmatched} unmatched items (first 20): ${preview.join("; ")}`);
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
