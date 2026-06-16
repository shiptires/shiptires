/**
 * Shared pricing logic for the site.
 *
 * Pricing priority:
 *   1. If a distributor has the tire → use distributor cost-based pricing
 *   2. Fallback → MAP * 1.15
 *
 * Each marketplace has its own fee structure:
 *   - Site/direct:  3% Stripe + 15% margin
 *   - eBay:        13.25% FVF + 2% misc + 15% margin
 */

import { getCheapestSource } from "@/lib/distributors";

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

/**
 * Get the best site price for a tire:
 *   - If a distributor has it → (cost + shipping) / (1 - 3% - 15%)
 *   - Otherwise → MAP * 1.15
 */
export async function getSitePrice(
  tireId: number,
  mapPrice: number | null | undefined
): Promise<number> {
  try {
    const source = await getCheapestSource(tireId);
    if (source) {
      return sitePriceFromCost(source.cost, source.shipping);
    }
  } catch {
    // Supabase unavailable — fall back to MAP
  }
  return sitePrice(mapPrice);
}
