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

// ── Shipping cost estimator ──────────────────────────────────

/**
 * Estimate ground shipping cost between two ZIP codes.
 * Uses distance tiers based on typical UPS/FedEx Ground rates for ~30lb packages.
 * Not exact — directionally correct for routing decisions.
 * Real carrier rate is fetched during fulfillment.
 */
export function estimateShippingCost(
  warehouseZip: string,
  customerZip: string,
  weightLbs?: number | null
): number {
  // Get distance in miles
  let miles: number;
  const dist = zipcodes.distance(warehouseZip, customerZip);
  if (dist != null) {
    miles = dist;
  } else {
    miles = estimateRegionDistance(warehouseZip, customerZip);
  }

  // Distance-based tiers
  let baseCost: number;
  if (miles <= 200) baseCost = 30;
  else if (miles <= 500) baseCost = 40;
  else if (miles <= 1000) baseCost = 55;
  else if (miles <= 1500) baseCost = 70;
  else baseCost = 85;

  // Adjust by weight: multiply by (weight / 30) clamped to [0.8, 1.5]
  if (weightLbs && weightLbs > 0) {
    const factor = Math.min(1.5, Math.max(0.8, weightLbs / 30));
    baseCost = Math.round(baseCost * factor * 100) / 100;
  }

  return baseCost;
}

// ── Smart warehouse routing (total landed cost) ─────────────

export interface BestWarehouseResult {
  warehouse: Warehouse;
  distance: number;
  stock: number;
  tireCost: number;
  estShipping: number;
  totalLandedCost: number;
  alternatives: Array<{
    warehouse: Warehouse;
    distance: number;
    stock: number;
    tireCost: number;
    estShipping: number;
    totalLandedCost: number;
  }>;
}

/**
 * Find the best warehouse for a tire order, optimized by total landed cost
 * (tire cost at warehouse + estimated shipping to customer ZIP).
 *
 * Unlike findNearestWarehouse (which only considers distance), this evaluates
 * every warehouse with stock and picks the one with the lowest total cost.
 * A farther warehouse with a cheaper tire can beat a closer one.
 */
export async function findBestWarehouse(
  customerZip: string,
  tireId: number,
  distributorSlug?: string
): Promise<BestWarehouseResult | null> {
  // 1. Get inventory items for this tire
  const { data: invItems } = await getSupabase()
    .from("distributor_inventory")
    .select("warehouse_quantities, location_costs, cost, distributor_id")
    .eq("tire_id", tireId)
    .eq("active", true)
    .gt("quantity", 0);

  if (!invItems || invItems.length === 0) return null;

  // Filter to the right distributor if specified
  let distItem = invItems[0];
  if (distributorSlug) {
    const { data: dist } = await getSupabase()
      .from("distributors")
      .select("id")
      .eq("slug", distributorSlug)
      .single();

    if (dist) {
      const found = invItems.find((i) => i.distributor_id === dist.id);
      if (found) distItem = found;
    }
  }

  const warehouseQtys: Record<string, number> = distItem.warehouse_quantities || {};
  const locationCosts: Record<string, number> = distItem.location_costs || {};
  const mainCost: number = distItem.cost || 0;

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

  // 4. Evaluate total landed cost for each warehouse
  const options: Array<{
    warehouse: Warehouse;
    distance: number;
    stock: number;
    tireCost: number;
    estShipping: number;
    totalLandedCost: number;
  }> = [];

  for (const row of warehouseRows) {
    const stock = warehouseQtys[row.location_code] || 0;
    if (stock <= 0) continue;

    // Tire cost: use per-warehouse cost if available, fall back to main cost
    const tireCost = locationCosts[row.location_code] ?? mainCost;
    if (tireCost <= 0) continue;

    // Distance
    const dist = zipcodes.distance(customerZip, row.postal_code);
    const distance = dist ?? estimateRegionDistance(customerZip, row.postal_code);

    // Estimated shipping
    const estShipping = estimateShippingCost(row.postal_code, customerZip);

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

    options.push({
      warehouse,
      distance,
      stock,
      tireCost,
      estShipping,
      totalLandedCost: tireCost + estShipping,
    });
  }

  if (options.length === 0) return null;

  // 5. Sort by total landed cost ascending
  options.sort((a, b) => a.totalLandedCost - b.totalLandedCost);

  const best = options[0];
  return {
    ...best,
    alternatives: options.slice(1),
  };
}

/**
 * Find the nearest warehouse that has a specific tire in stock.
 * Legacy function — now delegates to findBestWarehouse for consistent routing.
 */
export async function findNearestWarehouse(
  customerZip: string,
  tireId: number,
  distributorSlug?: string
): Promise<{ warehouse: Warehouse; distance: number; stock: number } | null> {
  const result = await findBestWarehouse(customerZip, tireId, distributorSlug);
  if (!result) return null;
  return {
    warehouse: result.warehouse,
    distance: result.distance,
    stock: result.stock,
  };
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
