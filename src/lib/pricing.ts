/**
 * Shared pricing logic for the site.
 *
 * Pricing priority:
 *   1. Express Tire has the exact tire → cost-based formula
 *   2. Competitor price (TireRack / America's Tire) → 5% above their price
 *   3. Express Tire has same brand + model → estimate from median cost
 *   4. Express Tire has same brand (any model) → estimate from median cost
 *
 * Express Tire formula (tiered margin, priced for BNPL worst-case 6%):
 *   Cost ≤ $50:  margin = $10
 *   Cost $51-$200: margin = $15
 *   Cost > $200: margin = $20
 *   Price = (cost + shipping + margin) / 0.94
 *
 * Competitor formula:
 *   Price = competitor_price × 1.05  (5% above TireRack / America's Tire)
 *
 * eBay fee structure:
 *   (cost + shipping×1.1325 + margin) / 0.8376 — tiered $10/$15/$20
 */

import {
  getCheapestSource,
  getCheapestSourceByLocation,
  getCheapestSourceBatch,
  getModelAverageCost,
  getBrandAverageCost,
} from "@/lib/distributors";
import { getCompetitorPrice, getCompetitorPriceBatch } from "@/lib/competitors";
import type { TireSize } from "@/lib/types";

// ── Timeout helper ──────────────────────────────────────────
// Prevents Supabase hangs from blocking page renders during outages
const PRICING_TIMEOUT_MS = 4000; // 4 seconds max for pricing queries

function withTimeout<T>(promise: Promise<T>, ms: number = PRICING_TIMEOUT_MS): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Pricing query timed out")), ms)
    ),
  ]);
}

// ── Constants ───────────────────────────────────────────────
const STRIPE_FEE = 0.06; // 6% Stripe BNPL (worst-case; card is 3% → extra margin)

// Tiered margin baked into price (no separate handling fee)
const SITE_MARGIN_LOW = 10; // cost ≤ $50 → $10 profit
const SITE_MARGIN_MID = 15; // cost $51-$200 → $15 profit
const SITE_MARGIN_HIGH = 20; // cost > $200 → $20 profit
const MARGIN_THRESHOLD_LOW = 50; // low tier ceiling
const MARGIN_THRESHOLD_HIGH = 200; // mid tier ceiling

function getSiteMargin(cost: number): number {
  if (cost <= MARGIN_THRESHOLD_LOW) return SITE_MARGIN_LOW;
  if (cost <= MARGIN_THRESHOLD_HIGH) return SITE_MARGIN_MID;
  return SITE_MARGIN_HIGH;
}

// ── Weight-based shipping tiers ─────────────────────────────
const SHIPPING_TIERS = [
  { maxWeight: 25, cost: 40 }, // under 25 lbs
  { maxWeight: 50, cost: 55 }, // 25-50 lbs
  { maxWeight: 75, cost: 72 }, // 50-75 lbs
  { maxWeight: Infinity, cost: 99 }, // over 75 lbs
];
const DEFAULT_SHIPPING = 55; // fallback when weight is unknown

/** Get shipping cost based on tire weight in lbs */
export function getShippingByWeight(
  weightLbs: number | null | undefined
): number {
  if (!weightLbs || weightLbs <= 0) return DEFAULT_SHIPPING;
  for (const tier of SHIPPING_TIERS) {
    if (weightLbs <= tier.maxWeight) return tier.cost;
  }
  return SHIPPING_TIERS[SHIPPING_TIERS.length - 1].cost;
}

// ── DEPRECATED: MAP-based fallback ──────────────────────────
// TireWeb MAP data is unreliable. This function now returns 0.
// All pricing must come from Express Tire or competitor data.

/** @deprecated — returns 0. Use getSitePrice() with brand+model estimation. */
export function sitePrice(_mapPrice: number | null | undefined): number {
  return 0;
}

/** Format price with always 2 decimal places: 86.2 → "86.20" */
export function formatPrice(price: number | null | undefined): string {
  const p = price ?? 0;
  if (p <= 0) return "0.00";
  return p.toFixed(2);
}

// ── Distributor-cost-based pricing ──────────────────────────

/** Site price from distributor cost + shipping + tiered margin: (cost+ship+margin) / 0.94 */
export function sitePriceFromCost(cost: number, shipping: number): number {
  if (cost <= 0) return 0;
  const margin = getSiteMargin(cost);
  return Math.round(((cost + shipping + margin) / (1 - STRIPE_FEE)) * 100) / 100;
}

// ── Competitor-based pricing ────────────────────────────────

const COMPETITOR_MARKUP = 1.05; // 5% above TireRack / America's Tire

/** Site price from competitor price: 5% above competitor (TireRack / America's Tire) */
export function sitePriceFromCompetitor(competitorPrice: number): number {
  if (competitorPrice <= 0) return 0;
  return Math.round(competitorPrice * COMPETITOR_MARKUP * 100) / 100;
}

// ── Estimation helpers ──────────────────────────────────────

/** Try to estimate a price from Express Tire data for the same brand+model,
 *  falling back to same-brand if no model match exists.
 *  Uses rim size to find tires of similar diameter for better estimates. */
async function estimateFromDistributor(
  brand: string,
  model: string,
  weightLbs?: number | null,
  rimSize?: number | null
): Promise<number> {
  // 1. Same brand + model median cost (filtered by similar rim size)
  const modelCost = await getModelAverageCost(brand, model, rimSize);
  if (modelCost && modelCost > 0) {
    const shipping = getShippingByWeight(weightLbs);
    return sitePriceFromCost(modelCost, shipping);
  }

  // 2. Same brand (any model) median cost (filtered by rim size bucket)
  const brandCost = await getBrandAverageCost(brand, rimSize);
  if (brandCost && brandCost > 0) {
    const shipping = getShippingByWeight(weightLbs);
    return sitePriceFromCost(brandCost, shipping);
  }

  return 0;
}

/**
 * Get the best site price for a tire:
 *   1. Distributor cost → (cost + shipping + margin) / 0.94
 *   2. Competitor price → (competitor + $50) / 0.94
 *   3. Estimate from same brand+model in distributor inventory
 *   4. Estimate from same brand (any model) in distributor inventory
 */
export async function getSitePrice(
  tireId: number,
  brand: string,
  model: string,
  weightLbs?: number | null,
  rimSize?: number | null
): Promise<number> {
  // Single 4s timeout for ALL pricing lookups combined
  return withTimeout(_getSitePriceInner(tireId, brand, model, weightLbs, rimSize), PRICING_TIMEOUT_MS)
    .catch(() => 0);
}

async function _getSitePriceInner(
  tireId: number,
  brand: string,
  model: string,
  weightLbs?: number | null,
  rimSize?: number | null
): Promise<number> {
  try {
    // 1. Distributor pricing (cheapest cost)
    const source = await getCheapestSource(tireId);
    if (source) {
      const shipping = getShippingByWeight(weightLbs);
      const distPrice = sitePriceFromCost(source.cost, shipping);
      if (distPrice > 0) return distPrice;
    }

    // 2. Competitor pricing
    const comp = await getCompetitorPrice(tireId);
    if (comp) {
      const compPrice = sitePriceFromCompetitor(comp.competitorPrice);
      if (compPrice > 0) return compPrice;
    }

    // 3-4. Estimate from Express Tire data (same brand+model → same brand)
    if (brand) {
      const estimated = await estimateFromDistributor(brand, model, weightLbs, rimSize);
      if (estimated > 0) return estimated;
    }
  } catch {
    // All sources failed
  }

  return 0;
}

/**
 * Batch version of getSitePrice — resolves prices for many tires in 2 Supabase
 * queries total (+ estimation queries for remaining tires).
 * Returns a Map<tireId, price>.
 */
export async function getSitePriceBatch(
  tires: Array<{
    id: number;
    brand: string;
    model: string;
    weight?: number | null;
    rimSize?: number | null;
  }>
): Promise<Map<number, number>> {
  const result = new Map<number, number>();
  if (tires.length === 0) return result;

  const tireIds = tires.map((t) => t.id);

  // Two parallel batch queries instead of 2×N sequential ones
  let distMap = new Map<number, { cost: number; shipping: number }>();
  let compMap = new Map<number, { competitorPrice: number; source: string }>();
  try {
    [distMap, compMap] = await withTimeout(Promise.all([
      getCheapestSourceBatch(tireIds),
      getCompetitorPriceBatch(tireIds),
    ]));
  } catch {
    // Supabase unavailable or timed out
  }

  // Track tires needing estimation
  const needEstimation: Array<(typeof tires)[number]> = [];

  for (const t of tires) {
    // 1. Distributor pricing
    const dist = distMap.get(t.id);
    if (dist) {
      const shipping = getShippingByWeight(t.weight);
      const distPrice = sitePriceFromCost(dist.cost, shipping);
      if (distPrice > 0) {
        result.set(t.id, distPrice);
        continue;
      }
    }

    // 2. Competitor pricing
    const comp = compMap.get(t.id);
    if (comp) {
      const compPrice = sitePriceFromCompetitor(comp.competitorPrice);
      if (compPrice > 0) {
        result.set(t.id, compPrice);
        continue;
      }
    }

    // 3. Need estimation
    needEstimation.push(t);
  }

  // Batch estimate: group by brand+model, query once per unique combo
  // Wrapped in timeout to prevent hangs during Supabase outages
  if (needEstimation.length > 0) {
    try {
      await withTimeout((async () => {
        const groupKey = (t: { brand: string; model: string }) =>
          `${t.brand}|||${t.model}`;
        const groups = new Map<string, Array<(typeof tires)[number]>>();
        for (const t of needEstimation) {
          const key = groupKey(t);
          if (!groups.has(key)) groups.set(key, []);
          groups.get(key)!.push(t);
        }

        const estimations = await Promise.all(
          Array.from(groups.entries()).map(async ([key, groupTires]) => {
            const [brand, model] = key.split("|||");
            const results: Array<{ tire: (typeof tires)[number]; cost: number }> = [];

            for (const t of groupTires) {
              const rim = t.rimSize ?? null;
              let cost = await getModelAverageCost(brand, model, rim);
              if (!cost || cost <= 0) {
                cost = await getBrandAverageCost(brand, rim);
              }
              if (cost && cost > 0) {
                results.push({ tire: t, cost });
              }
            }
            return results;
          })
        );

        for (const group of estimations) {
          for (const { tire, cost } of group) {
            const shipping = getShippingByWeight(tire.weight);
            const estimated = sitePriceFromCost(cost, shipping);
            if (estimated > 0) {
              result.set(tire.id, estimated);
            }
          }
        }
      })());
    } catch {
      // Estimation timed out — proceed with whatever prices we have
    }
  }

  return result;
}

/**
 * Get site price using location-aware routing when customer ZIP is available.
 * Compares total landed cost (product + shipping) across all stocked locations.
 * Falls back to getSitePrice() when no location-based source is found.
 */
export async function getSitePriceForLocation(
  tireId: number,
  brand: string,
  model: string,
  customerZip: string,
  weightLbs?: number | null
): Promise<{ price: number; locationCode?: string; warehouseId?: string }> {
  try {
    const locSource = await withTimeout(getCheapestSourceByLocation(
      tireId,
      customerZip,
      weightLbs
    ));
    if (locSource) {
      const distPrice = sitePriceFromCost(
        locSource.cost,
        locSource.shippingEstimate
      );
      if (distPrice > 0) {
        return {
          price: distPrice,
          locationCode: locSource.locationCode || undefined,
          warehouseId: locSource.warehouseId || undefined,
        };
      }
    }
  } catch {
    // Fall through to standard pricing
  }

  // Fall back to standard getSitePrice (no location awareness)
  const price = await getSitePrice(tireId, brand, model, weightLbs);
  return { price };
}

// ── Batch pricing for model pages ───────────────────────────

/**
 * Apply distributor + competitor pricing to model sizes in bulk.
 * Priority: distributor cost → competitor price → brand+model estimation.
 * Returns updated sizes with recalculated priceRange.
 * Price range only includes sizes with real (distributor/competitor) pricing,
 * not estimations, to avoid misleading "from $X" displays.
 */
export async function applyDistributorPricing(
  sizes: TireSize[],
  brand?: string,
  model?: string
): Promise<{ sizes: TireSize[]; priceRange: [number, number] }> {
  const tireIds = sizes
    .map((s) => s.tireId)
    .filter((id): id is number => !!id);
  if (tireIds.length === 0) {
    return { sizes, priceRange: [0, 0] };
  }

  let distMap: Map<number, { cost: number; shipping: number }>;
  let compMap: Map<number, { competitorPrice: number; source: string }>;
  try {
    [distMap, compMap] = await withTimeout(Promise.all([
      getCheapestSourceBatch(tireIds),
      getCompetitorPriceBatch(tireIds),
    ]));
  } catch {
    // Supabase unavailable or timed out — no pricing available
    return { sizes, priceRange: [0, 0] };
  }

  // Track which sizes got real pricing (not estimation)
  const realPrices: number[] = [];
  let needsEstimation = false;

  const updated = sizes.map((s) => {
    if (!s.tireId) return s;

    // 1. Distributor pricing takes priority
    const dist = distMap.get(s.tireId);
    if (dist) {
      const shipping = getShippingByWeight(s.weight);
      const distPrice = sitePriceFromCost(dist.cost, shipping);
      if (distPrice > 0) {
        realPrices.push(distPrice);
        return { ...s, price: distPrice };
      }
    }

    // 2. Competitor pricing
    const comp = compMap.get(s.tireId);
    if (comp) {
      const compPrice = sitePriceFromCompetitor(comp.competitorPrice);
      if (compPrice > 0) {
        realPrices.push(compPrice);
        return { ...s, price: compPrice };
      }
    }

    // 3. Mark for estimation
    needsEstimation = true;
    return s;
  });

  // Estimate prices for tires without distributor/competitor data
  // Uses rim size from the size string for better estimates per tire
  // Wrapped in timeout to prevent hangs during Supabase outages
  if (needsEstimation && brand) {
    try {
      await withTimeout((async () => {
        for (let i = 0; i < updated.length; i++) {
          if (updated[i].price <= 0 && updated[i].tireId) {
            const rimMatch = updated[i].size.match(/R(\d{2})/i);
            const rimSize = rimMatch ? parseInt(rimMatch[1]) : null;

            let cost = model
              ? await getModelAverageCost(brand, model, rimSize)
              : null;
            if (!cost || cost <= 0) {
              cost = await getBrandAverageCost(brand, rimSize);
            }

            if (cost && cost > 0) {
              const shipping = getShippingByWeight(updated[i].weight);
              const estimatedPrice = sitePriceFromCost(cost, shipping);
              if (estimatedPrice > 0) {
                realPrices.push(estimatedPrice);
                updated[i] = { ...updated[i], price: estimatedPrice };
              }
            }
          }
        }
      })());
    } catch {
      // Estimation timed out — proceed with whatever prices we have
    }
  }

  // Use real prices for range if available, otherwise fall back to all prices
  const rangePrices =
    realPrices.length > 0
      ? realPrices
      : updated.map((s) => s.price).filter((p) => p > 0);

  return {
    sizes: updated,
    priceRange: [
      rangePrices.length > 0 ? Math.min(...rangePrices) : 0,
      rangePrices.length > 0 ? Math.max(...rangePrices) : 0,
    ],
  };
}
