import { isAdminRequest } from "@/lib/admin-auth";
import { getDistributor } from "@/lib/distributors";
import { processWarehouseUpload, logUpload } from "@/lib/inventory-upload";

export const maxDuration = 300;

/**
 * POST /api/admin/distributors/[id]/inventory/warehouse-upload
 *
 * Multi-file warehouse CSV upload endpoint.
 * Accepts multipart form with multiple CSV files.
 * Warehouse code is auto-detected from filename (e.g., ShipTiresAZ.csv → AZ).
 *
 * Each file represents a single warehouse's inventory with potentially
 * different costs. The system merges them into per-warehouse pricing.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminRequest())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Verify distributor exists
  const distributor = await getDistributor(id);
  if (!distributor) {
    return Response.json({ error: "Distributor not found" }, { status: 404 });
  }

  const contentType = req.headers.get("content-type") || "";
  if (!contentType.includes("multipart/form-data")) {
    return Response.json(
      { error: "Expected multipart/form-data with CSV files" },
      { status: 400 }
    );
  }

  const formData = await req.formData();
  const files: Array<{ warehouseCode: string; csvText: string }> = [];

  // Collect all files from the form
  for (const [key, value] of formData.entries()) {
    if (!(value instanceof File)) continue;

    const filename = value.name || key;
    const csvText = await value.text();
    if (!csvText.trim()) continue;

    // Auto-detect warehouse code from filename
    // Pattern: ShipTires{CODE}.csv or ShipTires_{CODE}.csv or just {CODE}.csv
    const warehouseCode = extractWarehouseCode(filename, key);

    files.push({ warehouseCode, csvText });
  }

  if (files.length === 0) {
    return Response.json(
      { error: "No CSV files found in upload" },
      { status: 400 }
    );
  }

  try {
    const result = await processWarehouseUpload(files, distributor.id);

    // Log the upload
    const fileSummary = files.map((f) => `${f.warehouseCode}`).join(", ");
    await logUpload(
      distributor.id,
      result,
      "admin" as "api" | "sftp",
      `warehouse-upload: ${fileSummary}`,
      "admin-ui"
    );

    return Response.json({
      ok: true,
      distributor: distributor.name,
      warehousesProcessed: files.map((f) => f.warehouseCode),
      ...result,
    });
  } catch (e) {
    console.error(`[warehouse-upload] Upload failed for ${distributor.slug}:`, e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Warehouse upload failed" },
      { status: 500 }
    );
  }
}

/**
 * Extract warehouse code from filename.
 *
 * Patterns recognized:
 *   ShipTiresAZ.csv → AZ
 *   ShipTires_AZ.csv → AZ
 *   ShipTiresCHI.csv → CHI
 *   AZ.csv → AZ
 *   warehouse_AZ.csv → AZ
 *
 * Falls back to form field key or cleaned filename.
 */
function extractWarehouseCode(filename: string, fieldKey: string): string {
  // Remove extension
  const base = filename.replace(/\.csv$/i, "").trim();

  // Pattern 1: ShipTires{CODE} or ShipTires_{CODE}
  const shipTiresMatch = base.match(/^ShipTires[_-]?(.+)$/i);
  if (shipTiresMatch) {
    return shipTiresMatch[1].toUpperCase();
  }

  // Pattern 2: warehouse_{CODE} or wh_{CODE}
  const whMatch = base.match(/^(?:warehouse|wh)[_-](.+)$/i);
  if (whMatch) {
    return whMatch[1].toUpperCase();
  }

  // Pattern 3: Just the code (short names like AZ, NH, CHI)
  if (/^[A-Za-z]{2,5}$/.test(base)) {
    return base.toUpperCase();
  }

  // Fallback: use the form field key if it looks like a warehouse code
  if (/^[A-Za-z]{2,5}$/.test(fieldKey)) {
    return fieldKey.toUpperCase();
  }

  // Last resort: use the cleaned filename
  return base.replace(/[^a-zA-Z0-9]/g, "").toUpperCase() || "UNKNOWN";
}
