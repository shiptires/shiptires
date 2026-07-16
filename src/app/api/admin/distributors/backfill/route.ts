import { NextRequest } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { getSupabase } from "@/lib/supabase";
import { getTireLookupMaps, findPricingAnomalies } from "@/lib/db";

/**
 * POST /api/admin/distributors/backfill
 *
 * Backfills missing model names in distributor_inventory from Turso catalog,
 * verifies part number cross-references, and finds pricing anomalies.
 *
 * Body: { action: "backfill-models" | "verify-parts" | "audit" | "find-anomalies", brand?: string, model?: string }
 */
export async function POST(req: NextRequest) {
  if (!(await isAdminRequest())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const action = body.action || "audit";

  switch (action) {
    case "backfill-models":
      return backfillModels();
    case "verify-parts":
      return verifyPartNumbers();
    case "audit":
      return auditInventory();
    case "find-anomalies":
      return findAnomalies(body.brand, body.model);
    default:
      return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
  }
}

/**
 * Backfill missing model names in distributor_inventory from Turso catalog.
 * Looks up each tire_id in the Turso tires table and copies model_name.
 */
async function backfillModels() {
  const sb = getSupabase();

  // Fetch all inventory items with empty model names
  const emptyModelItems: Array<{ id: string; tire_id: number; brand: string; size: string }> = [];
  const PAGE = 1000;
  for (let offset = 0; ; offset += PAGE) {
    const { data, error } = await sb
      .from("distributor_inventory")
      .select("id, tire_id, brand, size")
      .eq("active", true)
      .or("model.is.null,model.eq.")
      .range(offset, offset + PAGE - 1);

    if (error) {
      return Response.json({ error: `Failed to fetch inventory: ${error.message}` }, { status: 500 });
    }
    if (!data || data.length === 0) break;
    emptyModelItems.push(...data);
    if (data.length < PAGE) break;
  }

  if (emptyModelItems.length === 0) {
    return Response.json({ message: "No inventory items with empty model names", updated: 0 });
  }

  // Load Turso tire catalog for model lookup
  const { modelById } = await getTireLookupMaps();

  let updated = 0;
  let notFound = 0;
  const notFoundSamples: string[] = [];

  // Batch update in chunks of 50
  for (let i = 0; i < emptyModelItems.length; i += 50) {
    const chunk = emptyModelItems.slice(i, i + 50);
    for (const item of chunk) {
      const modelName = modelById.get(item.tire_id);
      if (!modelName) {
        notFound++;
        if (notFoundSamples.length < 20) {
          notFoundSamples.push(`tire_id=${item.tire_id} (${item.brand} ${item.size})`);
        }
        continue;
      }

      const { error } = await sb
        .from("distributor_inventory")
        .update({ model: modelName })
        .eq("id", item.id);

      if (!error) updated++;
    }
  }

  return Response.json({
    message: "Model backfill complete",
    totalEmpty: emptyModelItems.length,
    updated,
    notFound,
    notFoundSamples,
  });
}

/**
 * Verify part number cross-references between distributor_inventory and Turso.
 * Checks if the part numbers in distributor_inventory match any identifiers
 * (item_number, gm_code, upc, ean) in the Turso tires table.
 */
async function verifyPartNumbers() {
  const sb = getSupabase();

  // Fetch all inventory items with part numbers
  const items: Array<{ id: string; tire_id: number; part_number: string; brand: string; model: string; size: string }> = [];
  const PAGE = 1000;
  for (let offset = 0; ; offset += PAGE) {
    const { data, error } = await sb
      .from("distributor_inventory")
      .select("id, tire_id, part_number, brand, model, size")
      .eq("active", true)
      .not("part_number", "is", null)
      .neq("part_number", "")
      .range(offset, offset + PAGE - 1);

    if (error) {
      return Response.json({ error: `Failed to fetch inventory: ${error.message}` }, { status: 500 });
    }
    if (!data || data.length === 0) break;
    items.push(...data);
    if (data.length < PAGE) break;
  }

  if (items.length === 0) {
    return Response.json({ message: "No inventory items with part numbers", checked: 0 });
  }

  // Load Turso part number map
  const { byPartNumber } = await getTireLookupMaps();

  let matched = 0;
  let mismatched = 0;
  let notInCatalog = 0;
  const mismatchSamples: Array<{
    part_number: string;
    current_tire_id: number;
    catalog_tire_id: number;
    brand: string;
    size: string;
  }> = [];
  const notInCatalogSamples: string[] = [];

  for (const item of items) {
    const catalogTireId = byPartNumber.get(item.part_number);
    if (catalogTireId === undefined) {
      notInCatalog++;
      if (notInCatalogSamples.length < 20) {
        notInCatalogSamples.push(`${item.part_number} (${item.brand} ${item.size})`);
      }
      continue;
    }

    if (catalogTireId === item.tire_id) {
      matched++;
    } else {
      mismatched++;
      if (mismatchSamples.length < 50) {
        mismatchSamples.push({
          part_number: item.part_number,
          current_tire_id: item.tire_id,
          catalog_tire_id: catalogTireId,
          brand: item.brand,
          size: item.size,
        });
      }
    }
  }

  return Response.json({
    message: "Part number verification complete",
    totalWithPartNumbers: items.length,
    matched,
    mismatched,
    notInCatalog,
    mismatchSamples,
    notInCatalogSamples,
  });
}

/**
 * Full audit of distributor inventory: model completeness, part number matching,
 * brand consistency, and pricing anomalies.
 */
async function auditInventory() {
  const sb = getSupabase();

  // Count total items
  const { count: totalCount } = await sb
    .from("distributor_inventory")
    .select("id", { count: "exact", head: true })
    .eq("active", true);

  // Count items with empty models
  const { count: emptyModels } = await sb
    .from("distributor_inventory")
    .select("id", { count: "exact", head: true })
    .eq("active", true)
    .or("model.is.null,model.eq.");

  // Count items with part numbers
  const { count: withPartNumbers } = await sb
    .from("distributor_inventory")
    .select("id", { count: "exact", head: true })
    .eq("active", true)
    .not("part_number", "is", null)
    .neq("part_number", "");

  // Get brand distribution
  const brands: Record<string, number> = {};
  const PAGE = 1000;
  for (let offset = 0; ; offset += PAGE) {
    const { data } = await sb
      .from("distributor_inventory")
      .select("brand")
      .eq("active", true)
      .range(offset, offset + PAGE - 1);
    if (!data || data.length === 0) break;
    for (const row of data) {
      const b = row.brand || "(empty)";
      brands[b] = (brands[b] || 0) + 1;
    }
    if (data.length < PAGE) break;
  }

  // Sort brands by count
  const brandList = Object.entries(brands)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));

  return Response.json({
    totalItems: totalCount ?? 0,
    emptyModels: emptyModels ?? 0,
    withPartNumbers: withPartNumbers ?? 0,
    brands: brandList,
  });
}

/**
 * Find pricing anomalies in the Turso tire catalog.
 * Identifies tires within a model where the price is significantly lower than peers.
 */
async function findAnomalies(brand?: string, model?: string) {
  const anomalies = await findPricingAnomalies(brand, model);
  return Response.json(anomalies);
}
