import SftpClient from "ssh2-sftp-client";
import { getSupabase } from "@/lib/supabase";
import {
  bulkUpsertInventory,
  updateDistributorSyncTime,
} from "@/lib/distributors";

// ── SFTP Download ───────────────────────────────────────────

/**
 * Connect to TireHub's SFTP server and download the inventory CSV.
 *
 * Env vars:
 *   TIREHUB_SFTP_HOST     — SFTP hostname
 *   TIREHUB_SFTP_PORT     — Port (default 22)
 *   TIREHUB_SFTP_USER     — Username
 *   TIREHUB_SFTP_PASSWORD — Password (or use TIREHUB_SFTP_KEY for private key)
 *   TIREHUB_SFTP_KEY      — Private key string (optional, alternative to password)
 *   TIREHUB_SFTP_PATH     — Remote path to CSV file (e.g., "/outgoing/TireHubInventory.csv")
 */
export async function downloadFromSftp(): Promise<string> {
  const host = process.env.TIREHUB_SFTP_HOST;
  const user = process.env.TIREHUB_SFTP_USER;
  const remotePath = process.env.TIREHUB_SFTP_PATH || "/TireHubInventory.csv";

  if (!host || !user) {
    throw new Error("TIREHUB_SFTP_HOST and TIREHUB_SFTP_USER are required");
  }

  const sftp = new SftpClient();

  try {
    const connectConfig: SftpClient.ConnectOptions = {
      host,
      port: parseInt(process.env.TIREHUB_SFTP_PORT || "22"),
      username: user,
      readyTimeout: 30_000,
      retries: 2,
      retry_minTimeout: 2_000,
    };

    // Support both password and private key auth
    if (process.env.TIREHUB_SFTP_KEY) {
      connectConfig.privateKey = process.env.TIREHUB_SFTP_KEY;
    } else if (process.env.TIREHUB_SFTP_PASSWORD) {
      connectConfig.password = process.env.TIREHUB_SFTP_PASSWORD;
    } else {
      throw new Error("TIREHUB_SFTP_PASSWORD or TIREHUB_SFTP_KEY is required");
    }

    await sftp.connect(connectConfig);

    // Download file as buffer, convert to string
    const buffer = await sftp.get(remotePath);
    const csvText = typeof buffer === "string" ? buffer : buffer.toString("utf-8");

    if (!csvText.trim()) {
      throw new Error(`Empty file at ${remotePath}`);
    }

    return csvText;
  } finally {
    await sftp.end().catch(() => {});
  }
}

// ── Types ───────────────────────────────────────────────────

export interface SyncResult {
  totalRows: number;
  matched: number;
  unmatched: number;
  zeroed: number;
  errors: string[];
  duration: number;
}

interface CsvRow {
  manufacturer: string;
  brand: string;
  pattern: string;
  itemNumber: string;
  description: string;
  size: string;
  price: number;
  fet: number;
  mapPricing: number;
  total: number;
  warehouseQuantities: Record<string, number>;
}

// ── CSV Parsing ─────────────────────────────────────────────

/**
 * Parse TireHub CSV inventory feed into structured rows.
 * CSV columns: MANUFACTURER, BRAND, PATTERN, ITEM#, DESCRIPTION, SIZE, PRICE, FET, MAP Pricing,
 * then TLC/RDC warehouse columns (e.g., "TLC 100", "TLC 101", ..., "RDC 600"),
 * then "Total" as the last column.
 */
export function parseTireHubCsv(csvText: string): CsvRow[] {
  const lines = csvText.split("\n").map((l) => l.replace(/\r$/, ""));
  if (lines.length < 2) return [];

  // Parse header to find warehouse columns
  const headers = parseCSVLine(lines[0]);
  const fixedColumns = [
    "MANUFACTURER",
    "BRAND",
    "PATTERN",
    "ITEM#",
    "DESCRIPTION",
    "SIZE",
    "PRICE",
    "FET",
    "MAP PRICING",
  ];

  // Find warehouse column indices — anything between the fixed columns and "Total"
  const totalIndex = headers.findIndex(
    (h) => h.trim().toUpperCase() === "TOTAL"
  );
  const warehouseStartIndex = fixedColumns.length;
  const warehouseEndIndex =
    totalIndex > warehouseStartIndex ? totalIndex : headers.length;

  // Extract warehouse location codes from headers like "TLC 100", "RDC 600"
  const warehouseColumns: { index: number; code: string }[] = [];
  for (let i = warehouseStartIndex; i < warehouseEndIndex; i++) {
    const header = headers[i]?.trim() || "";
    // Match "TLC 100", "RDC 600" etc — extract the numeric code
    const match = header.match(/^(?:TLC|RDC)\s+(\d+)$/i);
    if (match) {
      warehouseColumns.push({ index: i, code: match[1] });
    }
  }

  const rows: CsvRow[] = [];

  for (let lineIdx = 1; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx].trim();
    if (!line) continue;

    const cols = parseCSVLine(line);
    if (cols.length < fixedColumns.length) continue;

    const price = parseFloat(cols[6]) || 0;
    if (price <= 0) continue; // Skip rows with no price

    const warehouseQuantities: Record<string, number> = {};
    let computedTotal = 0;

    for (const wc of warehouseColumns) {
      const qty = parseInt(cols[wc.index]) || 0;
      if (qty > 0) {
        warehouseQuantities[wc.code] = qty;
        computedTotal += qty;
      }
    }

    // Use CSV "Total" column if available, otherwise sum warehouse quantities
    const csvTotal =
      totalIndex >= 0 ? parseInt(cols[totalIndex]) || 0 : computedTotal;

    rows.push({
      manufacturer: cols[0]?.trim() || "",
      brand: cols[1]?.trim() || "",
      pattern: cols[2]?.trim() || "",
      itemNumber: cols[3]?.trim() || "",
      description: cols[4]?.trim() || "",
      size: cols[5]?.trim() || "",
      price,
      fet: parseFloat(cols[7]) || 0,
      mapPricing: parseFloat(cols[8]) || 0,
      total: csvTotal || computedTotal,
      warehouseQuantities,
    });
  }

  return rows;
}

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
        i++; // Skip escaped quote
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

// ── Tire Matching ───────────────────────────────────────────

/**
 * Attempt to match a CSV row to an existing tire in the Turso DB.
 * Returns tire_id if matched, null otherwise.
 *
 * Uses the Supabase `distributor_inventory` table to find existing matches
 * by part_number, or falls back to brand + size matching.
 */
async function findTireId(
  row: CsvRow,
  existingByPartNumber: Map<string, number>,
  existingByBrandSize: Map<string, number>
): Promise<number | null> {
  // 1. Try exact part number match from existing inventory
  if (row.itemNumber && existingByPartNumber.has(row.itemNumber)) {
    return existingByPartNumber.get(row.itemNumber)!;
  }

  // 2. Try brand + size match from existing inventory
  const key = `${row.brand.toLowerCase()}|${row.size.toLowerCase()}`;
  if (existingByBrandSize.has(key)) {
    return existingByBrandSize.get(key)!;
  }

  return null;
}

// ── Main Sync ───────────────────────────────────────────────

/**
 * Download TireHub inventory CSV from SFTP and sync to distributor_inventory.
 *
 * Since Vercel's edge/serverless runtime can't use native SSH/SFTP libraries,
 * this function accepts raw CSV text as input. The caller (cron route or manual trigger)
 * is responsible for fetching the file from SFTP — either via an SFTP-to-HTTP proxy,
 * a pre-uploaded file, or a Hetzner-hosted intermediary.
 */
export async function syncTireHubInventory(
  csvText: string
): Promise<SyncResult> {
  const startTime = Date.now();
  const errors: string[] = [];

  // 1. Parse CSV
  const rows = parseTireHubCsv(csvText);
  if (rows.length === 0) {
    return {
      totalRows: 0,
      matched: 0,
      unmatched: 0,
      zeroed: 0,
      errors: ["No valid rows found in CSV"],
      duration: Date.now() - startTime,
    };
  }

  // 2. Get or create TireHub distributor
  const { data: distributor } = await getSupabase()
    .from("distributors")
    .select("id")
    .eq("slug", "tirehub")
    .single();

  if (!distributor) {
    return {
      totalRows: rows.length,
      matched: 0,
      unmatched: 0,
      zeroed: 0,
      errors: [
        'TireHub distributor not found. Create it first with slug "tirehub".',
      ],
      duration: Date.now() - startTime,
    };
  }

  const distributorId = distributor.id;

  // 3. Build lookup maps from existing inventory for matching
  const { data: existingInv } = await getSupabase()
    .from("distributor_inventory")
    .select("tire_id, part_number, brand, size")
    .eq("distributor_id", distributorId)
    .eq("active", true);

  const existingByPartNumber = new Map<string, number>();
  const existingByBrandSize = new Map<string, number>();

  if (existingInv) {
    for (const inv of existingInv) {
      if (inv.part_number) {
        existingByPartNumber.set(inv.part_number, inv.tire_id);
      }
      const key = `${(inv.brand || "").toLowerCase()}|${(inv.size || "").toLowerCase()}`;
      existingByBrandSize.set(key, inv.tire_id);
    }
  }

  // 4. Match rows and prepare upsert batch
  let matched = 0;
  let unmatched = 0;

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
    warehouse_quantities: Record<string, number>;
  }> = [];

  const processedTireIds = new Set<number>();
  const unmatchedItems: string[] = [];

  for (const row of rows) {
    const tireId = await findTireId(
      row,
      existingByPartNumber,
      existingByBrandSize
    );

    if (tireId === null) {
      unmatched++;
      unmatchedItems.push(
        `${row.brand} ${row.pattern} ${row.size} (ITEM# ${row.itemNumber})`
      );
      continue;
    }

    matched++;
    processedTireIds.add(tireId);

    upsertBatch.push({
      distributor_id: distributorId,
      tire_id: tireId,
      cost: row.price,
      quantity: row.total,
      part_number: row.itemNumber,
      brand: row.brand,
      model: row.pattern,
      size: row.size,
      manufacturer: row.manufacturer || undefined,
      description: row.description || undefined,
      fet: row.fet || undefined,
      map_pricing: row.mapPricing || undefined,
      warehouse_quantities: row.warehouseQuantities,
    });
  }

  // 5. Bulk upsert matched items
  if (upsertBatch.length > 0) {
    const result = await bulkUpsertInventory(upsertBatch);
    if (result.errors.length > 0) {
      errors.push(
        ...result.errors.map(
          (e) => `Upsert error tire_id=${e.tire_id}: ${e.error}`
        )
      );
    }
  }

  // 6. Zero out items NOT in the new feed (discontinued/out of stock)
  let zeroed = 0;
  if (processedTireIds.size > 0) {
    // Get all active inventory items for this distributor
    const { data: allActive } = await getSupabase()
      .from("distributor_inventory")
      .select("id, tire_id")
      .eq("distributor_id", distributorId)
      .eq("active", true)
      .gt("quantity", 0);

    if (allActive) {
      const toZero = allActive.filter(
        (item) => !processedTireIds.has(item.tire_id)
      );

      if (toZero.length > 0) {
        const zeroIds = toZero.map((item) => item.id);
        // Batch zero out in chunks
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

  // 7. Update distributor sync timestamp
  await updateDistributorSyncTime(distributorId);

  // Log unmatched items summary
  if (unmatchedItems.length > 0) {
    const preview = unmatchedItems.slice(0, 20);
    errors.push(
      `${unmatched} unmatched items (first 20): ${preview.join("; ")}`
    );
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
