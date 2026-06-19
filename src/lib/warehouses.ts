import { getSupabase } from "./supabase";
import zipcodes from "zipcodes";

export interface Warehouse {
  id: string;
  label: string;
  distributorName: string;
  name: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  contactName?: string;
  locationCode?: string;
  isDefault: boolean;
}

// ── Fallback warehouse (used when DB is empty or unavailable) ──
const FALLBACK_WAREHOUSE: Warehouse = {
  id: "sacramento",
  label: "Sacramento, CA",
  distributorName: "Ship.Tires",
  name: "Ship.Tires",
  street1: "1831 K Street",
  city: "Sacramento",
  state: "CA",
  postalCode: "95811",
  country: "US",
  phone: "2792388473",
  isDefault: true,
};

// ── In-memory cache ────────────────────────────────────────────
let _cache: Warehouse[] | null = null;
let _cacheTime = 0;
const CACHE_TTL = 60_000; // 1 minute

export function invalidateWarehouseCache() {
  _cache = null;
  _cacheTime = 0;
}

// ── Fetch from Supabase ────────────────────────────────────────
export async function getWarehouses(): Promise<Warehouse[]> {
  if (_cache && Date.now() - _cacheTime < CACHE_TTL) return _cache;

  try {
    const { data, error } = await getSupabase()
      .from("warehouses")
      .select("*")
      .eq("active", true)
      .order("is_default", { ascending: false })
      .order("distributor_name")
      .order("location_name");

    if (error || !data || data.length === 0) {
      _cache = [FALLBACK_WAREHOUSE];
      _cacheTime = Date.now();
      return _cache;
    }

    _cache = data.map((row) => ({
      id: row.id,
      label: `${row.distributor_name} — ${row.location_name}`,
      distributorName: row.distributor_name,
      name: row.contact_name || row.distributor_name,
      street1: row.street1,
      street2: row.street2 || undefined,
      city: row.city,
      state: row.state,
      postalCode: row.postal_code,
      country: row.country,
      phone: row.phone || "",
      contactName: row.contact_name || undefined,
      locationCode: row.location_code || undefined,
      isDefault: row.is_default,
    }));
    _cacheTime = Date.now();
    return _cache;
  } catch {
    return [FALLBACK_WAREHOUSE];
  }
}

export async function getWarehouse(
  id: string
): Promise<Warehouse | undefined> {
  const warehouses = await getWarehouses();
  return warehouses.find((w) => w.id === id);
}

export async function getDefaultWarehouse(): Promise<Warehouse> {
  const warehouses = await getWarehouses();
  return warehouses.find((w) => w.isDefault) || warehouses[0] || FALLBACK_WAREHOUSE;
}

// ── Nearest warehouse routing ────────────────────────────────

/**
 * Find the nearest warehouse that has a specific tire in stock.
 *
 * Uses ZIP code distance via the `zipcodes` package for proximity ranking.
 * Falls back to 3-digit ZIP prefix region matching if exact ZIP lookup fails.
 */
export async function findNearestWarehouse(
  customerZip: string,
  tireId: number,
  distributorSlug = "tirehub"
): Promise<{ warehouse: Warehouse; distance: number; stock: number } | null> {
  // 1. Get warehouse quantities for this tire
  const { data: invItem } = await getSupabase()
    .from("distributor_inventory")
    .select("warehouse_quantities, distributor_id")
    .eq("tire_id", tireId)
    .eq("active", true)
    .gt("quantity", 0);

  if (!invItem || invItem.length === 0) return null;

  // Filter to the right distributor
  const { data: dist } = await getSupabase()
    .from("distributors")
    .select("id")
    .eq("slug", distributorSlug)
    .single();

  const distItem = dist
    ? invItem.find((i) => i.distributor_id === dist.id)
    : invItem[0];

  if (!distItem) return null;

  const warehouseQtys: Record<string, number> =
    distItem.warehouse_quantities || {};

  // 2. Get all warehouses with stock > 0
  const stockedCodes = Object.entries(warehouseQtys)
    .filter(([, qty]) => qty > 0)
    .map(([code]) => code);

  if (stockedCodes.length === 0) return null;

  // 3. Get warehouse records for stocked locations
  const { data: warehouseRows } = await getSupabase()
    .from("warehouses")
    .select("*")
    .in("location_code", stockedCodes)
    .eq("active", true);

  if (!warehouseRows || warehouseRows.length === 0) return null;

  // 4. Calculate distance from customer ZIP to each warehouse
  const customerLookup = zipcodes.lookup(customerZip);

  let best: { warehouse: Warehouse; distance: number; stock: number } | null =
    null;

  for (const row of warehouseRows) {
    const stock = warehouseQtys[row.location_code] || 0;
    if (stock <= 0) continue;

    let distance: number;

    if (customerLookup) {
      // Use precise ZIP distance
      const dist = zipcodes.distance(customerZip, row.postal_code);
      distance = dist ?? estimateRegionDistance(customerZip, row.postal_code);
    } else {
      // Fallback: 3-digit prefix distance estimate
      distance = estimateRegionDistance(customerZip, row.postal_code);
    }

    const warehouse: Warehouse = {
      id: row.id,
      label: `${row.distributor_name} — ${row.location_name}`,
      distributorName: row.distributor_name,
      name: row.contact_name || row.distributor_name,
      street1: row.street1,
      street2: row.street2 || undefined,
      city: row.city,
      state: row.state,
      postalCode: row.postal_code,
      country: row.country,
      phone: row.phone || "",
      contactName: row.contact_name || undefined,
      locationCode: row.location_code || undefined,
      isDefault: row.is_default,
    };

    if (!best || distance < best.distance) {
      best = { warehouse, distance, stock };
    }
  }

  return best;
}

/**
 * Rough distance estimate based on 3-digit ZIP prefix.
 * Same prefix = ~50 miles, adjacent = ~200 miles, far = ~1000+ miles.
 */
function estimateRegionDistance(zip1: string, zip2: string): number {
  const prefix1 = parseInt(zip1.substring(0, 3));
  const prefix2 = parseInt(zip2.substring(0, 3));
  const diff = Math.abs(prefix1 - prefix2);

  if (diff === 0) return 25;
  if (diff <= 5) return 100;
  if (diff <= 20) return 300;
  if (diff <= 50) return 600;
  return 1000 + diff * 3;
}

// ── Legacy exports for client components that import statically ─
// These are kept so the QuoteCalculator and OrderShipping client
// components can still import WAREHOUSES and DEFAULT_WAREHOUSE_ID
// at module scope. They'll be replaced by API-fetched data.
export const WAREHOUSES: Warehouse[] = [FALLBACK_WAREHOUSE];
export const DEFAULT_WAREHOUSE_ID = "sacramento";
