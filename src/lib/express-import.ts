import { getSupabase } from "@/lib/supabase";
import { updateDistributorSyncTime } from "@/lib/distributors";

// ── Location mapping ────────────────────────────────────────

const LOCATION_MAP: Record<
  string,
  { code: string; name: string; city: string; state: string; zip: string }
> = {
  "ShipTiresAZ.csv": { code: "AZ", name: "Phoenix, AZ", city: "Phoenix", state: "AZ", zip: "85009" },
  "ShipTiresChicago.csv": { code: "CHI", name: "Chicago, IL", city: "Chicago", state: "IL", zip: "60632" },
  "ShipTiresFL.csv": { code: "FL", name: "Miami, FL", city: "Miami", state: "FL", zip: "33142" },
  "ShipTiresGA.csv": { code: "GA", name: "Atlanta, GA", city: "Atlanta", state: "GA", zip: "30301" },
  "ShipTiresNH.csv": { code: "NH", name: "North Highlands, CA", city: "North Highlands", state: "CA", zip: "95660" },
  "ShipTiresNY.csv": { code: "NY", name: "New York, NY", city: "New York", state: "NY", zip: "10001" },
  "ShipTiresOH.csv": { code: "OH", name: "Columbus, OH", city: "Columbus", state: "OH", zip: "43201" },
  "ShipTiresPA.csv": { code: "PA", name: "Philadelphia, PA", city: "Philadelphia", state: "PA", zip: "19101" },
  "ShipTiresTX.csv": { code: "TX", name: "Dallas, TX", city: "Dallas", state: "TX", zip: "75201" },
};

/** Get the location code for a filename, or null if unrecognized */
export function getLocationForFilename(filename: string) {
  return LOCATION_MAP[filename] ?? null;
}

/** All known Express Tire location filenames */
export const EXPECTED_FILENAMES = Object.keys(LOCATION_MAP);

// ── CSV parsing ─────────────────────────────────────────────

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

interface CsvRow {
  brand: string;
  partNumber: string;
  description: string;
  cost: number;
  quantity: number;
}

function parseCsv(content: string): CsvRow[] {
  const lines = content.split("\n").map((l) => l.replace(/\r$/, ""));
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]);
  const brandIdx = headers.findIndex((h) => h.trim().toLowerCase() === "brand");
  const itemIdx = headers.findIndex(
    (h) => h.trim().toLowerCase() === "item#" || h.trim().toLowerCase() === "item"
  );
  const descIdx = headers.findIndex((h) => h.trim().toLowerCase() === "description");
  const priceIdx = headers.findIndex((h) => h.trim().toLowerCase().includes("price"));
  const qtyIdx = headers.findIndex((h) => h.trim().toLowerCase() === "on hand");

  const rows: CsvRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = parseCSVLine(line);
    rows.push({
      brand: cols[brandIdx]?.trim() || "",
      partNumber: cols[itemIdx]?.trim() || "",
      description: cols[descIdx]?.trim() || "",
      cost: parseFloat(cols[priceIdx]) || 0,
      quantity: parseInt(cols[qtyIdx]) || 0,
    });
  }
  return rows;
}

// ── Main processing ─────────────────────────────────────────

export interface LocationResult {
  code: string;
  name: string;
  totalRows: number;
  matched: number;
  unmatched: number;
}

export interface ImportResult {
  locations: LocationResult[];
  totalMatched: number;
  totalUnmatched: number;
  inventoryUpdated: number;
  errors: number;
  errorMessages: string[];
}

const EXPRESS_DIST_ID = "24e3e080-6405-4096-b20a-a030b4809f12";

export async function processExpressLocationCsvs(
  files: Array<{ filename: string; content: string }>
): Promise<ImportResult> {
  const startTime = Date.now();
  const supabase = getSupabase();
  const errorMessages: string[] = [];

  // 1. Create/update warehouse records for each location found in the files
  for (const { filename } of files) {
    const loc = LOCATION_MAP[filename];
    if (!loc) continue;

    const { data: existing } = await supabase
      .from("warehouses")
      .select("id")
      .eq("distributor_name", "Express Tire")
      .eq("location_code", loc.code)
      .limit(1);

    if (existing && existing.length > 0) {
      await supabase
        .from("warehouses")
        .update({
          city: loc.city,
          state: loc.state,
          postal_code: loc.zip,
          location_name: loc.name,
        })
        .eq("distributor_name", "Express Tire")
        .eq("location_code", loc.code);
    } else {
      const { error } = await supabase.from("warehouses").insert({
        distributor_name: "Express Tire",
        location_name: loc.name,
        location_code: loc.code,
        street1: "TBD",
        city: loc.city,
        state: loc.state,
        postal_code: loc.zip,
        country: "US",
        phone: "TBD",
        is_default: false,
        active: true,
      });
      if (error) {
        errorMessages.push(`Warehouse ${loc.code}: ${error.message}`);
      }
    }
  }

  // 2. Load existing Express Tire inventory from Supabase
  const inventoryByPart = new Map<string, { id: string; tire_id: string }>();
  const PAGE = 1000;
  for (let offset = 0; ; offset += PAGE) {
    const { data } = await supabase
      .from("distributor_inventory")
      .select("id, tire_id, part_number, brand, size, quantity, warehouse_quantities")
      .eq("distributor_id", EXPRESS_DIST_ID)
      .eq("active", true)
      .range(offset, offset + PAGE - 1);
    if (!data || data.length === 0) break;
    for (const item of data) {
      if (item.part_number) inventoryByPart.set(item.part_number, item);
    }
    if (data.length < PAGE) break;
  }

  // 3. Process each location CSV
  const allLocationQuantities = new Map<string, Record<string, number>>();
  const allLocationCosts = new Map<string, Record<string, number>>();
  let totalMatched = 0;
  let totalUnmatched = 0;
  const locationResults: LocationResult[] = [];

  for (const { filename, content } of files) {
    const loc = LOCATION_MAP[filename];
    if (!loc) {
      locationResults.push({
        code: "?",
        name: `Unknown: ${filename}`,
        totalRows: 0,
        matched: 0,
        unmatched: 0,
      });
      continue;
    }

    const rows = parseCsv(content);
    let matched = 0;
    let unmatched = 0;

    for (const row of rows) {
      if (row.quantity <= 0) continue;

      // Match by part number — try exact, then padded, then stripped
      let invItem = inventoryByPart.get(row.partNumber);
      if (!invItem) {
        const padded = row.partNumber.padStart(4, "0");
        invItem = inventoryByPart.get(padded);
      }
      if (!invItem && row.partNumber.length < 6) {
        const padded6 = row.partNumber.padStart(6, "0");
        invItem = inventoryByPart.get(padded6);
      }
      if (!invItem && row.partNumber.startsWith("0")) {
        const stripped = row.partNumber.replace(/^0+/, "");
        invItem = inventoryByPart.get(stripped);
      }
      if (!invItem) {
        unmatched++;
        continue;
      }

      matched++;

      // Accumulate warehouse quantities
      if (!allLocationQuantities.has(invItem.id)) {
        allLocationQuantities.set(invItem.id, {});
      }
      const wh = allLocationQuantities.get(invItem.id)!;
      wh[loc.code] = (wh[loc.code] || 0) + row.quantity;

      // Accumulate per-location costs
      if (row.cost > 0) {
        if (!allLocationCosts.has(invItem.id)) {
          allLocationCosts.set(invItem.id, {});
        }
        const costs = allLocationCosts.get(invItem.id)!;
        costs[loc.code] = row.cost;
      }
    }

    totalMatched += matched;
    totalUnmatched += unmatched;
    locationResults.push({
      code: loc.code,
      name: loc.name,
      totalRows: rows.length,
      matched,
      unmatched,
    });
  }

  // 4. Update warehouse_quantities and location_costs in Supabase
  //    Process in parallel batches of 20 to avoid timeout on large imports
  let updated = 0;
  let errors = 0;
  const entries = Array.from(allLocationQuantities.entries());
  const BATCH = 20;

  for (let i = 0; i < entries.length; i += BATCH) {
    const batch = entries.slice(i, i + BATCH);
    const results = await Promise.all(
      batch.map(([invId, warehouseQtys]) => {
        const totalQty = Object.values(warehouseQtys).reduce((a, b) => a + b, 0);
        const locationCosts = allLocationCosts.get(invId) || {};
        const costValues = Object.values(locationCosts).filter((c) => c > 0);
        const updateData: Record<string, unknown> = {
          warehouse_quantities: warehouseQtys,
          location_costs: locationCosts,
          quantity: totalQty,
          last_synced_at: new Date().toISOString(),
        };
        if (costValues.length > 0) {
          updateData.cost = Math.min(...costValues);
        }
        return supabase
          .from("distributor_inventory")
          .update(updateData)
          .eq("id", invId)
          .then(({ error }) => ({ invId, error }));
      })
    );

    for (const { invId, error } of results) {
      if (!error) {
        updated++;
      } else {
        errors++;
        if (errors <= 10) {
          errorMessages.push(`Update ${invId}: ${error.message}`);
        }
      }
    }
  }

  // 5. Update distributor sync time + log the upload
  await updateDistributorSyncTime(EXPRESS_DIST_ID);

  const locationCodes = files
    .map((f) => LOCATION_MAP[f.filename]?.code)
    .filter(Boolean)
    .join(", ");

  await supabase.from("distributor_uploads").insert({
    distributor_id: EXPRESS_DIST_ID,
    filename: `express-import: ${locationCodes}`,
    method: "admin",
    rows_total: locationResults.reduce((s, l) => s + l.totalRows, 0),
    rows_matched: totalMatched,
    rows_unmatched: totalUnmatched,
    rows_zeroed: 0,
    errors: errorMessages,
    duration_ms: Date.now() - startTime,
    ip_address: "admin-ui",
  }).then(({ error: logErr }) => {
    if (logErr) console.warn("[express-import] Failed to log upload:", logErr.message);
  });

  return {
    locations: locationResults,
    totalMatched,
    totalUnmatched,
    inventoryUpdated: updated,
    errors,
    errorMessages,
  };
}
