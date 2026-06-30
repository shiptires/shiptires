/**
 * Shared pricing logic for the site.
 *
 * Pricing priority:
 *   1. If a distributor has the tire → use distributor cost-based pricing
 *   2. If a competitor price exists  → competitor price + $50 markup / (1 - fees)
 *   3. Fallback → MAP * 1.10
 *
 * Site pricing formula (tiered margin, priced for BNPL worst-case 6%):
 *   Cost ≤ $50:  margin = $10 → $10 net profit (BNPL) / ~$13-14 (card)
 *   Cost $51-$200: margin = $15 → $15 net profit (BNPL) / ~$18-21 (card)
 *   Cost > $200: margin = $20 → $20 net profit (BNPL) / ~$26-32 (card)
 *   Price = (cost + shipping + margin) / 0.94
 *
 * Each marketplace has its own fee structure:
 *   - Site/direct:  tiered margin ($10/$15/$20) + 6% Stripe BNPL (worst-case)
 *   - eBay:         (cost + shipping×1.1325 + margin) / 0.8376 — tiered $10/$15/$20
 */

import { getCheapestSource, getCheapestSourceByLocation, getCheapestSourceBatch } from "@/lib/distributors";
import { getCompetitorPrice, getCompetitorPriceBatch } from "@/lib/competitors";
import type { TireSize } from "@/lib/types";

// ── Constants ───────────────────────────────────────────────
const MAP_MARKUP = 1.10;    // MAP fallback: 10% over MAP
const STRIPE_FEE = 0.06;    // 6% Stripe BNPL (worst-case; card is 3% → extra margin)

// Tiered margin baked into price (no separate handling fee)
const SITE_MARGIN_LOW = 10;         // cost ≤ $50 → $10 profit
const SITE_MARGIN_MID = 15;         // cost $51-$200 → $15 profit
const SITE_MARGIN_HIGH = 20;        // cost > $200 → $20 profit
const MARGIN_THRESHOLD_LOW = 50;    // low tier ceiling
const MARGIN_THRESHOLD_HIGH = 200;  // mid tier ceiling

function getSiteMargin(cost: number): number {
  if (cost <= MARGIN_THRESHOLD_LOW) return SITE_MARGIN_LOW;
  if (cost <= MARGIN_THRESHOLD_HIGH) return SITE_MARGIN_MID;
  return SITE_MARGIN_HIGH;
}

// ── Weight-based shipping tiers ─────────────────────────────
const SHIPPING_TIERS = [
  { maxWeight: 25, cost: 40 },    // under 25 lbs
  { maxWeight: 50, cost: 55 },    // 25-50 lbs
  { maxWeight: 75, cost: 72 },    // 50-75 lbs
  { maxWeight: Infinity, cost: 99 }, // over 75 lbs
];
const DEFAULT_SHIPPING = 55; // fallback when weight is unknown

/** Get shipping cost based on tire weight in lbs */
export function getShippingByWeight(weightLbs: number | null | undefined): number {
  if (!weightLbs || weightLbs <= 0) return DEFAULT_SHIPPING;
  for (const tier of SHIPPING_TIERS) {
    if (weightLbs <= tier.maxWeight) return tier.cost;
  }
  return SHIPPING_TIERS[SHIPPING_TIERS.length - 1].cost;
}

// ── MAP-based fallback ──────────────────────────────────────

/** Fallback site price from MAP (used when no distributor has the tire) */
export function sitePrice(mapPrice: number | null | undefined): number {
  const map = mapPrice ?? 0;
  if (map <= 0) return 0;
  return Math.round(map * MAP_MARKUP * 100) / 100;
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

const COMPETITOR_MARKUP = 50; // $50 flat markup over competitor price

/** Site price from competitor price: (competitor + $50) / 0.94 */
export function sitePriceFromCompetitor(competitorPrice: number): number {
  if (competitorPrice <= 0) return 0;
  return Math.round(((competitorPrice + COMPETITOR_MARKUP) / (1 - STRIPE_FEE)) * 100) / 100;
}

/**
 * Get the best site price for a tire:
 *   1. Distributor cost → (cost + shipping + margin) / 0.94
 *   2. Competitor price → (competitor + $50) / 0.94
 *   3. MAP fallback → MAP * 1.10
 */
export async function getSitePrice(
  tireId: number,
  mapPrice: number | null | undefined,
  weightLbs?: number | null
): Promise<number> {
  const mapBased = sitePrice(mapPrice);
  try {
    // 1. Distributor pricing (cheapest cost)
    const source = await getCheapestSource(tireId);
    if (source) {
      const shipping = getShippingByWeight(weightLbs);
      const distPrice = sitePriceFromCost(source.cost, shipping);
      // Sanity check: skip if distributor price is less than 20% of MAP price
      // (price_map is TireWebLibrary's catalog price, often inflated vs real wholesale — 50% was too aggressive)
      if (mapBased > 0 && distPrice < mapBased * 0.2) {
        console.warn(
          `[pricing] Skipping suspicious distributor price for tire ${tireId}: $${distPrice} vs MAP-based $${mapBased}`
        );
      } else {
        return distPrice;
      }
    }

    // 2. Competitor pricing
    const comp = await getCompetitorPrice(tireId);
    if (comp) {
      const compPrice = sitePriceFromCompetitor(comp.competitorPrice);
      if (compPrice > 0) return compPrice;
    }
  } catch {
    // Supabase unavailable — fall back to MAP
  }

  // 3. MAP fallback
  return mapBased;
}

/**
 * Batch version of getSitePrice — resolves prices for many tires in 2 Supabase
 * queries total instead of 2×N. Returns a Map<tireId, price>.
 */
export async function getSitePriceBatch(
  tires: Array<{ id: number; price_map: number | null | undefined; weight?: number | null }>
): Promise<Map<number, number>> {
  const result = new Map<number, number>();
  if (tires.length === 0) return result;

  const tireIds = tires.map((t) => t.id);

  // Two parallel batch queries instead of 2×N sequential ones
  let distMap = new Map<number, { cost: number; shipping: number }>();
  let compMap = new Map<number, { competitorPrice: number; source: string }>();
  try {
    [distMap, compMap] = await Promise.all([
      getCheapestSourceBatch(tireIds),
      getCompetitorPriceBatch(tireIds),
    ]);
  } catch {
    // Supabase unavailable — fall back to MAP for all
  }

  for (const t of tires) {
    const mapBased = sitePrice(t.price_map);

    // 1. Distributor pricing
    const dist = distMap.get(t.id);
    if (dist) {
      const shipping = getShippingByWeight(t.weight);
      const distPrice = sitePriceFromCost(dist.cost, shipping);
      if (mapBased <= 0 || distPrice >= mapBased * 0.2) {
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

    // 3. MAP fallback
    result.set(t.id, mapBased);
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
  mapPrice: number | null | undefined,
  customerZip: string,
  weightLbs?: number | null
): Promise<{ price: number; locationCode?: string; warehouseId?: string }> {
  const mapBased = sitePrice(mapPrice);

  try {
    const locSource = await getCheapestSourceByLocation(tireId, customerZip, weightLbs);
    if (locSource) {
      const distPrice = sitePriceFromCost(locSource.cost, locSource.shippingEstimate);
      // Sanity check: skip if price is less than 20% of MAP price
      if (mapBased > 0 && distPrice < mapBased * 0.2) {
        console.warn(
          `[pricing] Skipping suspicious location price for tire ${tireId}: $${distPrice} vs MAP-based $${mapBased}`
        );
      } else {
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
  const price = await getSitePrice(tireId, mapPrice, weightLbs);
  return { price };
}

// ── Batch pricing for model pages ───────────────────────────

/**
 * Apply distributor + competitor pricing to model sizes in bulk.
 * Priority: distributor cost → competitor price → MAP fallback.
 * Returns updated sizes with recalculated priceRange.
 * Price range only includes sizes with real (distributor/competitor) pricing,
 * not MAP fallbacks, to avoid misleading "from $X" displays.
 */
export async function applyDistributorPricing(
  sizes: TireSize[]
): Promise<{ sizes: TireSize[]; priceRange: [number, number] }> {
  const tireIds = sizes.map((s) => s.tireId).filter((id): id is number => !!id);
  if (tireIds.length === 0) {
    const prices = sizes.map((s) => s.price).filter((p) => p > 0);
    return {
      sizes,
      priceRange: [
        prices.length > 0 ? Math.min(...prices) : 0,
        prices.length > 0 ? Math.max(...prices) : 0,
      ],
    };
  }

  let distMap: Map<number, { cost: number; shipping: number }>;
  let compMap: Map<number, { competitorPrice: number; source: string }>;
  try {
    [distMap, compMap] = await Promise.all([
      getCheapestSourceBatch(tireIds),
      getCompetitorPriceBatch(tireIds),
    ]);
  } catch {
    // Supabase unavailable — keep MAP-based prices
    const prices = sizes.map((s) => s.price).filter((p) => p > 0);
    return {
      sizes,
      priceRange: [
        prices.length > 0 ? Math.min(...prices) : 0,
        prices.length > 0 ? Math.max(...prices) : 0,
      ],
    };
  }

  // Track which sizes got real pricing (not MAP fallback)
  const realPrices: number[] = [];

  const updated = sizes.map((s) => {
    if (!s.tireId) return s;

    // 1. Distributor pricing takes priority
    const dist = distMap.get(s.tireId);
    if (dist) {
      // Use weight-based shipping instead of distributor default
      const shipping = getShippingByWeight(s.weight);
      const distPrice = sitePriceFromCost(dist.cost, shipping);
      if (s.price > 0 && distPrice < s.price * 0.2) {
        console.warn(
          `[pricing] Skipping suspicious distributor price for tire ${s.tireId} (${s.size}): $${distPrice} vs MAP-based $${s.price}`
        );
      } else {
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

    // 3. Keep existing MAP-based price (not included in priceRange)
    return s;
  });

  // Use real prices for range if available, otherwise fall back to all prices
  const rangePrices = realPrices.length > 0
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
