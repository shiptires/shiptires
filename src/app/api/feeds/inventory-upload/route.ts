import { getSupabase } from "@/lib/supabase";
import { processInventoryUpload, processSingleWarehouseUpload, logUpload } from "@/lib/inventory-upload";

export const maxDuration = 300;

/**
 * POST /api/feeds/inventory-upload
 *
 * Endpoint for external distributors to push their inventory CSV to us.
 * Authenticated via API key in the Authorization header.
 *
 * Usage:
 *   curl -X POST https://ship.tires/api/feeds/inventory-upload \
 *     -H "Authorization: Bearer <api_key>" \
 *     -H "Content-Type: text/csv" \
 *     --data-binary @inventory.csv
 *
 * Or with multipart form:
 *   curl -X POST https://ship.tires/api/feeds/inventory-upload \
 *     -H "Authorization: Bearer <api_key>" \
 *     -F "file=@inventory.csv"
 *
 * CSV must have at minimum: brand, size, cost/price, quantity/qty columns.
 * Column names are auto-detected from the header row.
 *
 * Response:
 *   { ok: true, totalRows, matched, unmatched, zeroed, errors, duration }
 */
export async function POST(req: Request) {
  // 1. Authenticate via API key
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return Response.json(
      { error: "Missing Authorization: Bearer <api_key> header" },
      { status: 401 }
    );
  }

  const apiKey = authHeader.slice(7).trim();
  if (!apiKey) {
    return Response.json({ error: "Empty API key" }, { status: 401 });
  }

  // Hash the key and look up the distributor
  const keyHash = await hashApiKey(apiKey);
  const { data: distributor, error: dbError } = await getSupabase()
    .from("distributors")
    .select("id, name, slug, active")
    .eq("api_key_hash", keyHash)
    .single();

  if (dbError || !distributor) {
    return Response.json({ error: "Invalid API key" }, { status: 401 });
  }

  if (!distributor.active) {
    return Response.json({ error: "Distributor account is inactive" }, { status: 403 });
  }

  // 2. Extract CSV text from request
  let csvText: string;
  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    // Multipart file upload
    const formData = await req.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return Response.json(
        { error: 'No file found. Send a CSV file with field name "file".' },
        { status: 400 }
      );
    }
    csvText = await file.text();
  } else if (contentType.includes("text/csv") || contentType.includes("text/plain") || contentType.includes("application/octet-stream")) {
    // Raw CSV body
    csvText = await req.text();
  } else {
    // Try to read as text anyway
    try {
      csvText = await req.text();
    } catch {
      return Response.json(
        { error: "Could not read request body. Send CSV as text/csv or multipart form." },
        { status: 400 }
      );
    }
  }

  if (!csvText.trim()) {
    return Response.json({ error: "Empty CSV content" }, { status: 400 });
  }

  // 3. Check for warehouse parameter
  const url = new URL(req.url);
  const warehouseCode = url.searchParams.get("warehouse")?.toUpperCase() ||
    req.headers.get("x-warehouse-code")?.toUpperCase();

  // 4. Process the upload
  try {
    let result;
    if (warehouseCode) {
      // Per-warehouse upload: merge into location_costs and warehouse_quantities
      result = await processSingleWarehouseUpload(csvText, distributor.id, warehouseCode);
    } else {
      // Standard full-inventory upload
      result = await processInventoryUpload(csvText, distributor.id);
    }

    // 5. Log the upload
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
               req.headers.get("x-real-ip") ||
               "unknown";
    const filename = warehouseCode ? `warehouse-${warehouseCode}` : undefined;
    await logUpload(distributor.id, result, "api", filename, ip);

    return Response.json({
      ok: true,
      distributor: distributor.name,
      ...(warehouseCode && { warehouse: warehouseCode }),
      ...result,
    });
  } catch (e) {
    console.error(`[inventory-upload] Upload failed for ${distributor.slug}:`, e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Upload processing failed" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/feeds/inventory-upload
 *
 * Returns upload instructions and expected CSV format.
 */
export async function GET() {
  return Response.json({
    endpoint: "POST /api/feeds/inventory-upload",
    description: "Upload your inventory CSV to Ship.Tires",
    authentication: "Bearer token in Authorization header",
    formats: [
      {
        method: "Raw CSV",
        contentType: "text/csv",
        example: 'curl -X POST https://ship.tires/api/feeds/inventory-upload -H "Authorization: Bearer YOUR_KEY" -H "Content-Type: text/csv" --data-binary @inventory.csv',
      },
      {
        method: "Multipart form",
        contentType: "multipart/form-data",
        example: 'curl -X POST https://ship.tires/api/feeds/inventory-upload -H "Authorization: Bearer YOUR_KEY" -F "file=@inventory.csv"',
      },
    ],
    requiredColumns: ["brand", "size", "cost (or price)", "quantity (or qty — optional if warehouse columns present)"],
    optionalColumns: ["model (or pattern)", "part_number (or sku, item#)", "description"],
    perWarehouseUpload: {
      description: "Upload a single warehouse's inventory using the ?warehouse=CODE query parameter. This merges costs and quantities into per-warehouse data instead of overwriting everything.",
      example: 'curl -X POST "https://ship.tires/api/feeds/inventory-upload?warehouse=AZ" -H "Authorization: Bearer YOUR_KEY" -H "Content-Type: text/csv" --data-binary @ShipTiresAZ.csv',
      note: "cost is stored in location_costs[CODE], quantity in warehouse_quantities[CODE]. Main cost = MIN of all warehouse costs, total quantity = SUM of all warehouse quantities.",
      alternativeHeader: "You can also pass the warehouse code via the X-Warehouse-Code header.",
    },
    warehouseSupport: {
      description: "If your CSV has per-warehouse/location quantity columns, they are auto-detected and stored for nearest-warehouse routing",
      recognizedPatterns: ["TLC 100", "RDC 600", "WH 001", "DC 200", "LOC 100", "WAREHOUSE 5"],
      note: "Any column not matching a known field with numeric data is treated as a warehouse location. Total quantity is summed from warehouse columns if no explicit 'quantity' column.",
    },
    notes: [
      "Column names are auto-detected from the header row",
      "Common aliases are supported (e.g., 'manufacturer' for brand, 'sku' for part_number)",
      "Per-warehouse quantity columns (TLC/RDC/WH/DC/LOC) are auto-detected and stored",
      "Use ?warehouse=CODE to upload per-warehouse data with different costs",
      "Rows with cost <= 0 are skipped",
      "Items not in the new upload are zeroed out (marked out of stock)",
    ],
  });
}

// ── Helpers ─────────────────────────────────────────────────

async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
