/**
 * Shared pricing logic for the site.
 *
 * Pricing priority:
 *   1. If a distributor has the tire → use distributor cost-based pricing
 *   2. If a competitor price exists  → competitor price + $50 markup / (1 - fees)
 *   3. Fallback → MAP * 1.15
 *
 * Each marketplace has its own fee structure:
 *   - Site/direct:  3% Stripe + 15% margin
 *   - eBay:        13.25% FVF + 2% misc + 15% margin
 */

import { getCheapestSource, getDistributorPricingMap } from "@/lib/distributors";
import { getCompetitorPrice, getCompetitorPricingMap } from "@/lib/competitors";
import type { TireSize } from "@/lib/types";

// ── Constants ───────────────────────────────────────────────
const MAP_MARKUP = 1.15;
const STRIPE_FEE = 0.03;
const SITE_MARGIN = 0.15;

// ── MAP-based fallback ──────────────────────────────────────

/** Fallback site price from MAP (used when no distributor has the tire) */
export function sitePrice(mapPrice: number | null | undefined): number {
  const map = mapPrice ?? 0;
  if (map <= 0) return 0;
  return Math.round(map * MAP_MARKUP * 100) / 100;
}

// ── Distributor-cost-based pricing ──────────────────────────

/** Site price from distributor cost + shipping */
export function sitePriceFromCost(cost: number, shipping: number): number {
  if (cost <= 0) return 0;
  return Math.round(((cost + shipping) / (1 - STRIPE_FEE - SITE_MARGIN)) * 100) / 100;
}

// ── Competitor-based pricing ────────────────────────────────

const COMPETITOR_MARKUP = 50; // $50 flat markup over competitor price

/** Site price from competitor price: (competitor + $50) / (1 - 3% - 15%) */
export function sitePriceFromCompetitor(competitorPrice: number): number {
  if (competitorPrice <= 0) return 0;
  return Math.round(((competitorPrice + COMPETITOR_MARKUP) / (1 - STRIPE_FEE - SITE_MARGIN)) * 100) / 100;
}

/**
 * Get the best site price for a tire:
 *   1. Distributor cost → (cost + shipping) / (1 - 3% - 15%)
 *   2. Competitor price → (competitor + $50) / (1 - 3% - 15%)
 *   3. MAP fallback → MAP * 1.15
 */
export async function getSitePrice(
  tireId: number,
  mapPrice: number | null | undefined
): Promise<number> {
  const mapBased = sitePrice(mapPrice);
  try {
    // 1. Distributor pricing (cheapest cost)
    const source = await getCheapestSource(tireId);
    if (source) {
      const distPrice = sitePriceFromCost(source.cost, source.shipping);
      // Sanity check: skip if distributor price is less than 50% of MAP price
      if (mapBased > 0 && distPrice < mapBased * 0.5) {
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

// ── Batch pricing for model pages ───────────────────────────

/**
 * Apply distributor + competitor pricing to model sizes in bulk.
 * Priority: distributor cost → competitor price → MAP fallback.
 * Returns updated sizes with recalculated priceRange.
 */
export async function applyDistributorPricing(
  sizes: TireSize[]
): Promise<{ sizes: TireSize[]; priceRange: [number, number] }> {
  let distMap: Map<number, { cost: number; shipping: number }>;
  let compMap: Map<number, { competitorPrice: number; source: string }>;
  try {
    [distMap, compMap] = await Promise.all([
      getDistributorPricingMap(),
      getCompetitorPricingMap(),
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

  const updated = sizes.map((s) => {
    if (!s.tireId) return s;

    // 1. Distributor pricing takes priority
    const dist = distMap.get(s.tireId);
    if (dist) {
      const distPrice = sitePriceFromCost(dist.cost, dist.shipping);
      if (s.price > 0 && distPrice < s.price * 0.5) {
        console.warn(
          `[pricing] Skipping suspicious distributor price for tire ${s.tireId} (${s.size}): $${distPrice} vs MAP-based $${s.price}`
        );
      } else {
        return { ...s, price: distPrice };
      }
    }

    // 2. Competitor pricing
    const comp = compMap.get(s.tireId);
    if (comp) {
      const compPrice = sitePriceFromCompetitor(comp.competitorPrice);
      if (compPrice > 0) return { ...s, price: compPrice };
    }

    // 3. Keep existing MAP-based price
    return s;
  });

  const prices = updated.map((s) => s.price).filter((p) => p > 0);
  return {
    sizes: updated,
    priceRange: [
      prices.length > 0 ? Math.min(...prices) : 0,
      prices.length > 0 ? Math.max(...prices) : 0,
    ],
  };
}
