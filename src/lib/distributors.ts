import { getSupabase } from "@/lib/supabase";
import { estimateShippingCost } from "@/lib/warehouses";

// ── Types ───────────────────────────────────────────────────

export interface Distributor {
  id: string;
  name: string;
  slug: string;
  street1: string | null;
  street2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string;
  phone: string | null;
  fax: string | null;
  email: string | null;
  contact_name: string | null;
  website: string | null;
  notes: string | null;
  default_shipping_cost: number;
  active: boolean;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DistributorInventoryItem {
  id: string;
  distributor_id: string;
  tire_id: number;
  cost: number;
  quantity: number;
  part_number: string | null;
  brand: string;
  model: string;
  size: string;
  manufacturer: string | null;
  description: string | null;
  fet: number;
  map_pricing: number;
  active: boolean;
  ebay_item_id: string | null;
  ebay_listed_at: string | null;
  warehouse_quantities: Record<string, number>;
  location_costs: Record<string, number>;
  last_synced_at: string;
  created_at: string;
  updated_at: string;
}

export interface DistributorWithStats extends Distributor {
  inventory_count: number;
  total_skus: number;
}

// ── Distributor CRUD ────────────────────────────────────────

export async function listDistributors(): Promise<Distributor[]> {
  const { data, error } = await getSupabase()
    .from("distributors")
    .select("*")
    .order("name");

  if (error) throw new Error(`Failed to list distributors: ${error.message}`);
  return data ?? [];
}

export async function getDistributor(id: string): Promise<Distributor | null> {
  const { data, error } = await getSupabase()
    .from("distributors")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // not found
    throw new Error(`Failed to get distributor: ${error.message}`);
  }
  return data;
}

export async function getDistributorBySlug(slug: string): Promise<Distributor | null> {
  const { data, error } = await getSupabase()
    .from("distributors")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Failed to get distributor: ${error.message}`);
  }
  return data;
}

function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function createDistributor(input: {
  name: string;
  street1?: string;
  street2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  phone?: string;
  fax?: string;
  email?: string;
  contact_name?: string;
  website?: string;
  notes?: string;
  default_shipping_cost?: number;
}): Promise<Distributor> {
  const slug = toSlug(input.name);
  const { data, error } = await getSupabase()
    .from("distributors")
    .insert({ ...input, slug })
    .select()
    .single();

  if (error) throw new Error(`Failed to create distributor: ${error.message}`);
  return data;
}

export async function updateDistributor(
  id: string,
  updates: Partial<Omit<Distributor, "id" | "created_at" | "updated_at" | "slug">>
): Promise<Distributor> {
  const { data, error } = await getSupabase()
    .from("distributors")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`Failed to update distributor: ${error.message}`);
  return data;
}

// ── Inventory CRUD ──────────────────────────────────────────

export async function getInventory(
  distributorId: string,
  options?: { activeOnly?: boolean; limit?: number; offset?: number; search?: string; brand?: string }
): Promise<{ items: DistributorInventoryItem[]; total: number }> {
  let query = getSupabase()
    .from("distributor_inventory")
    .select("*", { count: "exact" })
    .eq("distributor_id", distributorId)
    .order("brand")
    .order("model")
    .order("size");

  if (options?.activeOnly !== false) {
    query = query.eq("active", true);
  }

  // Filter by specific brand
  if (options?.brand) {
    query = query.ilike("brand", options.brand);
  }

  // Search across brand, model, size, part_number
  if (options?.search) {
    const s = options.search.trim();
    query = query.or(`brand.ilike.%${s}%,model.ilike.%${s}%,size.ilike.%${s}%,part_number.ilike.%${s}%`);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }
  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit ?? 50) - 1);
  }

  const { data, error, count } = await query;
  if (error) throw new Error(`Failed to get inventory: ${error.message}`);
  return { items: data ?? [], total: count ?? 0 };
}

export async function getInventoryItem(
  distributorId: string,
  tireId: number
): Promise<DistributorInventoryItem | null> {
  const { data, error } = await getSupabase()
    .from("distributor_inventory")
    .select("*")
    .eq("distributor_id", distributorId)
    .eq("tire_id", tireId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Failed to get inventory item: ${error.message}`);
  }
  return data;
}

export async function upsertInventoryItem(input: {
  distributor_id: string;
  tire_id: number;
  cost: number;
  quantity: number;
  part_number?: string;
  brand: string;
  model: string;
  size: string;
  manufacturer?: string | null;
  description?: string | null;
  fet?: number;
  map_pricing?: number;
  warehouse_quantities?: Record<string, number>;
}): Promise<DistributorInventoryItem> {
  const { data, error } = await getSupabase()
    .from("distributor_inventory")
    .upsert(
      {
        ...input,
        manufacturer: input.manufacturer ?? null,
        description: input.description ?? null,
        fet: input.fet ?? 0,
        map_pricing: input.map_pricing ?? 0,
        warehouse_quantities: input.warehouse_quantities ?? {},
        active: true,
        last_synced_at: new Date().toISOString(),
      },
      { onConflict: "distributor_id,tire_id" }
    )
    .select()
    .single();

  if (error) throw new Error(`Failed to upsert inventory: ${error.message}`);
  return data;
}

export async function bulkUpsertInventory(
  items: Array<{
    distributor_id: string;
    tire_id: number;
    cost: number;
    quantity: number;
    part_number?: string;
    brand: string;
    model: string;
    size: string;
    manufacturer?: string;
    description?: string;
    fet?: number;
    map_pricing?: number;
    warehouse_quantities?: Record<string, number>;
    location_costs?: Record<string, number>;
  }>
): Promise<{ inserted: number; errors: Array<{ tire_id: number; error: string }> }> {
  let inserted = 0;
  const errors: Array<{ tire_id: number; error: string }> = [];

  // Batch upsert in chunks of 50
  for (let i = 0; i < items.length; i += 50) {
    const chunk = items.slice(i, i + 50).map((item) => ({
      ...item,
      manufacturer: item.manufacturer ?? null,
      description: item.description ?? null,
      fet: item.fet ?? 0,
      map_pricing: item.map_pricing ?? 0,
      warehouse_quantities: item.warehouse_quantities ?? {},
      location_costs: item.location_costs ?? {},
      active: true,
      last_synced_at: new Date().toISOString(),
    }));

    const { error } = await getSupabase()
      .from("distributor_inventory")
      .upsert(chunk, { onConflict: "distributor_id,tire_id" });

    if (error) {
      // Fall back to individual inserts for this chunk
      for (const item of chunk) {
        try {
          await upsertInventoryItem(item);
          inserted++;
        } catch (e) {
          errors.push({
            tire_id: item.tire_id,
            error: e instanceof Error ? e.message : String(e),
          });
        }
      }
    } else {
      inserted += chunk.length;
    }
  }

  return { inserted, errors };
}

export async function deleteInventoryItem(id: string): Promise<void> {
  const { error } = await getSupabase()
    .from("distributor_inventory")
    .delete()
    .eq("id", id);

  if (error) throw new Error(`Failed to delete inventory item: ${error.message}`);
}

// ── Order Routing ───────────────────────────────────────────

/** Find all distributors that have a specific tire in stock, sorted by cheapest */
export async function findDistributorsForTire(
  tireId: number
): Promise<Array<DistributorInventoryItem & { distributor_name: string; distributor_shipping: number }>> {
  const { data, error } = await getSupabase()
    .from("distributor_inventory")
    .select(`
      *,
      distributors!inner(name, default_shipping_cost, active)
    `)
    .eq("tire_id", tireId)
    .eq("active", true)
    .gt("quantity", 0);

  if (error) throw new Error(`Failed to find distributors: ${error.message}`);
  if (!data) return [];

  return (data as Array<DistributorInventoryItem & { distributors: { name: string; default_shipping_cost: number; active: boolean } }>)
    .filter((row) => row.distributors.active)
    .map((row) => ({
      ...row,
      distributor_name: row.distributors.name,
      distributor_shipping: row.distributors.default_shipping_cost,
    }))
    .sort((a, b) => a.cost - b.cost);
}

/** Find the cheapest distributor for a tire — returns cost + shipping or null */
export async function getCheapestSource(
  tireId: number
): Promise<{ distributorId: string; distributorName: string; cost: number; shipping: number; quantity: number } | null> {
  const sources = await findDistributorsForTire(tireId);
  if (sources.length === 0) return null;

  const cheapest = sources[0];
  return {
    distributorId: cheapest.distributor_id,
    distributorName: cheapest.distributor_name,
    cost: cheapest.cost,
    shipping: cheapest.distributor_shipping,
    quantity: cheapest.quantity,
  };
}

/**
 * Batch-fetch cheapest distributor cost+shipping for a set of tire IDs.
 * Single Supabase query instead of N individual calls.
 */
export async function getCheapestSourceBatch(
  tireIds: number[]
): Promise<Map<number, { cost: number; shipping: number }>> {
  const map = new Map<number, { cost: number; shipping: number }>();
  if (tireIds.length === 0) return map;

  const { data, error } = await getSupabase()
    .from("distributor_inventory")
    .select(`
      tire_id,
      cost,
      distributors!inner(default_shipping_cost, active)
    `)
    .in("tire_id", tireIds)
    .eq("active", true)
    .gt("quantity", 0);

  if (error || !data) return map;

  for (const row of data as unknown as Array<{
    tire_id: number;
    cost: number;
    distributors: { default_shipping_cost: number; active: boolean };
  }>) {
    if (!row.distributors.active) continue;
    const existing = map.get(row.tire_id);
    if (!existing || row.cost < existing.cost) {
      map.set(row.tire_id, {
        cost: row.cost,
        shipping: row.distributors.default_shipping_cost,
      });
    }
  }

  return map;
}

/**
 * Find the cheapest source by total landed cost (product cost + estimated shipping).
 * Compares all locations with stock across all distributors.
 * Used at checkout when customer ZIP is available.
 */
export async function getCheapestSourceByLocation(
  tireId: number,
  customerZip: string,
  weightLbs?: number | null
): Promise<{
  distributorId: string;
  distributorName: string;
  cost: number;
  shippingEstimate: number;
  totalLandedCost: number;
  locationCode: string;
  warehouseId: string;
} | null> {
  // 1. Get all active inventory records for this tire with stock
  const { data: invItems, error } = await getSupabase()
    .from("distributor_inventory")
    .select(`
      *,
      distributors!inner(id, name, slug, postal_code, default_shipping_cost, active)
    `)
    .eq("tire_id", tireId)
    .eq("active", true)
    .gt("quantity", 0);

  if (error || !invItems || invItems.length === 0) return null;

  type InvRow = typeof invItems[number] & {
    distributors: {
      id: string;
      name: string;
      slug: string;
      postal_code: string | null;
      default_shipping_cost: number;
      active: boolean;
    };
  };

  const activeItems = (invItems as InvRow[]).filter((row) => row.distributors.active);
  if (activeItems.length === 0) return null;

  // 2. Collect all location codes that have stock to look up warehouse ZIPs
  const locationCodesSet = new Set<string>();
  for (const item of activeItems) {
    const wqty: Record<string, number> = item.warehouse_quantities || {};
    for (const [code, qty] of Object.entries(wqty)) {
      if (qty > 0) locationCodesSet.add(code);
    }
  }

  // 3. Fetch warehouse records for ZIP codes
  let warehouseMap = new Map<string, { id: string; postalCode: string }>();
  if (locationCodesSet.size > 0) {
    const { data: warehouseRows } = await getSupabase()
      .from("warehouses")
      .select("id, location_code, postal_code")
      .in("location_code", Array.from(locationCodesSet))
      .eq("active", true);

    if (warehouseRows) {
      for (const wh of warehouseRows) {
        warehouseMap.set(wh.location_code, {
          id: wh.id,
          postalCode: wh.postal_code,
        });
      }
    }
  }

  // 4. Evaluate total landed cost for each location
  let best: {
    distributorId: string;
    distributorName: string;
    cost: number;
    shippingEstimate: number;
    totalLandedCost: number;
    locationCode: string;
    warehouseId: string;
  } | null = null;

  for (const item of activeItems) {
    const locationCosts: Record<string, number> = item.location_costs || {};
    const warehouseQtys: Record<string, number> = item.warehouse_quantities || {};
    const hasLocationData = Object.keys(locationCosts).length > 0 && Object.keys(warehouseQtys).length > 0;

    if (hasLocationData) {
      // Multi-location distributor: evaluate each location
      for (const [code, qty] of Object.entries(warehouseQtys)) {
        if (qty <= 0) continue;
        const locCost = locationCosts[code];
        if (!locCost || locCost <= 0) continue;

        const wh = warehouseMap.get(code);
        if (!wh) continue;

        const shipping = estimateShippingCost(wh.postalCode, customerZip, weightLbs);
        const total = locCost + shipping;

        if (!best || total < best.totalLandedCost) {
          best = {
            distributorId: item.distributor_id,
            distributorName: item.distributors.name,
            cost: locCost,
            shippingEstimate: shipping,
            totalLandedCost: total,
            locationCode: code,
            warehouseId: wh.id,
          };
        }
      }
    } else {
      // Single-location distributor: use main cost + distributor ZIP
      const distZip = item.distributors.postal_code;
      if (!distZip) continue;

      const shipping = estimateShippingCost(distZip, customerZip, weightLbs);
      const total = item.cost + shipping;

      if (!best || total < best.totalLandedCost) {
        best = {
          distributorId: item.distributor_id,
          distributorName: item.distributors.name,
          cost: item.cost,
          shippingEstimate: shipping,
          totalLandedCost: total,
          locationCode: "",
          warehouseId: "",
        };
      }
    }
  }

  return best;
}

/** Get warehouse-level stock for a tire from a specific distributor */
export async function getWarehouseStock(
  distributorId: string,
  tireId: number
): Promise<Record<string, number>> {
  const item = await getInventoryItem(distributorId, tireId);
  if (!item) return {};
  return item.warehouse_quantities ?? {};
}

/** Update the last_synced_at timestamp on a distributor */
export async function updateDistributorSyncTime(distributorId: string): Promise<void> {
  const { error } = await getSupabase()
    .from("distributors")
    .update({ last_synced_at: new Date().toISOString() })
    .eq("id", distributorId);

  if (error) console.warn(`Failed to update sync time: ${error.message}`);
}

/** Update eBay listing status for an inventory item */
export async function updateEbayStatus(
  distributorId: string,
  tireId: number,
  ebayItemId: string
): Promise<void> {
  const { error } = await getSupabase()
    .from("distributor_inventory")
    .update({
      ebay_item_id: ebayItemId,
      ebay_listed_at: new Date().toISOString(),
    })
    .eq("distributor_id", distributorId)
    .eq("tire_id", tireId);

  if (error) console.warn(`Failed to update eBay status: ${error.message}`);
}

/** Get a map of tire_id → { cost, shipping } for all active distributor inventory.
 *  Used by the Google Merchant feed to show distributor pricing when available.
 *  Paginates to avoid Supabase's default 1000-row limit. */
export async function getDistributorPricingMap(): Promise<
  Map<number, { cost: number; shipping: number }>
> {
  const map = new Map<number, { cost: number; shipping: number }>();
  const PAGE = 1000;

  for (let offset = 0; ; offset += PAGE) {
    const { data, error } = await getSupabase()
      .from("distributor_inventory")
      .select(`
        tire_id,
        cost,
        distributors!inner(default_shipping_cost, active)
      `)
      .eq("active", true)
      .gt("quantity", 0)
      .range(offset, offset + PAGE - 1);

    if (error || !data || data.length === 0) break;

    for (const row of data as unknown as Array<{
      tire_id: number;
      cost: number;
      distributors: { default_shipping_cost: number; active: boolean };
    }>) {
      if (!row.distributors.active) continue;
      const existing = map.get(row.tire_id);
      // Keep cheapest cost per tire
      if (!existing || row.cost < existing.cost) {
        map.set(row.tire_id, {
          cost: row.cost,
          shipping: row.distributors.default_shipping_cost,
        });
      }
    }

    if (data.length < PAGE) break;
  }

  return map;
}

/** Extract rim diameter from a size string like "245/40R19" → 19 */
function extractRimSize(size: string): number | null {
  const m = size.match(/R(\d{2})/i);
  return m ? parseInt(m[1]) : null;
}

/** Compute median of a sorted array of numbers */
function median(sorted: number[]): number {
  if (sorted.length === 0) return 0;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** Get median distributor cost for tires with the same brand + model.
 *  Optionally filter by rim size (±1") for more accurate estimates.
 *  Used to estimate pricing when the exact tire isn't in distributor inventory. */
export async function getModelAverageCost(
  brand: string,
  model: string,
  rimSize?: number | null,
): Promise<number | null> {
  if (!brand || !model) return null;

  const { data, error } = await getSupabase()
    .from("distributor_inventory")
    .select("cost, size")
    .ilike("brand", brand)
    .ilike("model", model)
    .eq("active", true)
    .gt("quantity", 0)
    .gt("cost", 0);

  if (error || !data || data.length === 0) return null;

  // If rim size provided, prefer tires with similar rim size (±1")
  if (rimSize && rimSize > 0) {
    const nearby = data
      .filter((r) => {
        const rim = extractRimSize(r.size || "");
        return rim !== null && Math.abs(rim - rimSize) <= 1;
      })
      .map((r) => Number(r.cost))
      .filter((c) => c > 0)
      .sort((a, b) => a - b);

    if (nearby.length >= 2) return median(nearby);
  }

  // Fall back to all sizes
  const costs = data.map((r) => Number(r.cost)).filter((c) => c > 0);
  if (costs.length === 0) return null;

  costs.sort((a, b) => a - b);
  return median(costs);
}

/** Broader fallback: median cost for a brand, filtered by rim size bucket.
 *  Groups by rim diameter so a 15" tire estimate differs from a 20" tire.
 *  Used when no tires of the specific model are stocked. */
export async function getBrandAverageCost(
  brand: string,
  rimSize?: number | null,
): Promise<number | null> {
  if (!brand) return null;

  const { data, error } = await getSupabase()
    .from("distributor_inventory")
    .select("cost, size")
    .ilike("brand", brand)
    .eq("active", true)
    .gt("quantity", 0)
    .gt("cost", 0)
    .limit(1000);

  if (error || !data || data.length === 0) return null;

  // If rim size provided, filter to similar sizes (±2")
  if (rimSize && rimSize > 0) {
    const nearby = data
      .filter((r) => {
        const rim = extractRimSize(r.size || "");
        return rim !== null && Math.abs(rim - rimSize) <= 2;
      })
      .map((r) => Number(r.cost))
      .filter((c) => c > 0)
      .sort((a, b) => a - b);

    if (nearby.length >= 3) return median(nearby);
  }

  // Fall back to all sizes
  const costs = data.map((r) => Number(r.cost)).filter((c) => c > 0);
  if (costs.length === 0) return null;

  costs.sort((a, b) => a - b);
  return median(costs);
}

/** Get inventory summary stats for a distributor */
export async function getDistributorStats(
  distributorId: string
): Promise<{ totalItems: number; totalQuantity: number; avgCost: number; brands: string[] }> {
  // Use count for accurate total (Supabase defaults to 1000 row limit)
  const { count, error: countError } = await getSupabase()
    .from("distributor_inventory")
    .select("id", { count: "exact", head: true })
    .eq("distributor_id", distributorId)
    .eq("active", true)
    .gt("quantity", 0);

  if (countError) throw new Error(`Failed to get stats: ${countError.message}`);

  const totalItems = count ?? 0;
  if (totalItems === 0) {
    return { totalItems: 0, totalQuantity: 0, avgCost: 0, brands: [] };
  }

  // Fetch all rows in pages to get accurate aggregates
  const allData: Array<{ quantity: number; cost: number; brand: string }> = [];
  const PAGE = 1000;
  for (let offset = 0; ; offset += PAGE) {
    const { data: page } = await getSupabase()
      .from("distributor_inventory")
      .select("quantity, cost, brand")
      .eq("distributor_id", distributorId)
      .eq("active", true)
      .gt("quantity", 0)
      .range(offset, offset + PAGE - 1);

    if (!page || page.length === 0) break;
    allData.push(...page);
    if (page.length < PAGE) break;
  }

  const totalQuantity = allData.reduce((sum, row) => sum + (row.quantity ?? 0), 0);
  const totalCost = allData.reduce((sum, row) => sum + (row.cost ?? 0), 0);
  const brands = [...new Set(allData.map((row) => row.brand).filter(Boolean))].sort();

  return {
    totalItems,
    totalQuantity,
    avgCost: allData.length > 0 ? Math.round((totalCost / allData.length) * 100) / 100 : 0,
    brands,
  };
}
