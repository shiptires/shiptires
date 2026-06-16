import { getSupabase } from "@/lib/supabase";

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
  active: boolean;
  ebay_item_id: string | null;
  ebay_listed_at: string | null;
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
  options?: { activeOnly?: boolean; limit?: number; offset?: number; search?: string }
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
}): Promise<DistributorInventoryItem> {
  const { data, error } = await getSupabase()
    .from("distributor_inventory")
    .upsert(
      {
        ...input,
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
  }>
): Promise<{ inserted: number; errors: Array<{ tire_id: number; error: string }> }> {
  let inserted = 0;
  const errors: Array<{ tire_id: number; error: string }> = [];

  // Batch upsert in chunks of 50
  for (let i = 0; i < items.length; i += 50) {
    const chunk = items.slice(i, i + 50).map((item) => ({
      ...item,
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
 *  Used by the Google Merchant feed to show distributor pricing when available. */
export async function getDistributorPricingMap(): Promise<
  Map<number, { cost: number; shipping: number }>
> {
  const { data, error } = await getSupabase()
    .from("distributor_inventory")
    .select(`
      tire_id,
      cost,
      distributors!inner(default_shipping_cost, active)
    `)
    .eq("active", true)
    .gt("quantity", 0);

  if (error || !data) return new Map();

  const map = new Map<number, { cost: number; shipping: number }>();
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
  return map;
}

/** Get inventory summary stats for a distributor */
export async function getDistributorStats(
  distributorId: string
): Promise<{ totalItems: number; totalQuantity: number; avgCost: number; brands: string[] }> {
  const { data, error } = await getSupabase()
    .from("distributor_inventory")
    .select("quantity, cost, brand")
    .eq("distributor_id", distributorId)
    .eq("active", true);

  if (error) throw new Error(`Failed to get stats: ${error.message}`);
  if (!data || data.length === 0) {
    return { totalItems: 0, totalQuantity: 0, avgCost: 0, brands: [] };
  }

  const totalQuantity = data.reduce((sum, row) => sum + (row.quantity ?? 0), 0);
  const totalCost = data.reduce((sum, row) => sum + (row.cost ?? 0), 0);
  const brands = [...new Set(data.map((row) => row.brand))].sort();

  return {
    totalItems: data.length,
    totalQuantity,
    avgCost: Math.round((totalCost / data.length) * 100) / 100,
    brands,
  };
}
