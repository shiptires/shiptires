import { getCheapestSource, getCheapestSourceBatch } from "@/lib/distributors";

/**
 * Dealer pricing formula:
 * distributor_cost * 1.10 / 0.94
 *
 * - 10% markup over distributor cost
 * - Divided by 0.94 to absorb the 6% Stripe processing fee
 */
function applyDealerMarkup(distributorCost: number): number {
  return Math.round(((distributorCost * 1.1) / 0.94) * 100) / 100;
}

/**
 * Get wholesale price for a single tire.
 * Returns null if no distributor has the tire in stock.
 */
export async function getDealerPrice(
  tireId: number
): Promise<{ wholesalePrice: number; distributorCost: number } | null> {
  const source = await getCheapestSource(tireId);
  if (!source) return null;

  return {
    wholesalePrice: applyDealerMarkup(source.cost),
    distributorCost: source.cost,
  };
}

/**
 * Batch-fetch wholesale prices for multiple tire IDs.
 * Returns a Map of tireId → wholesalePrice.
 */
export async function getDealerPriceBatch(
  tireIds: number[]
): Promise<Map<number, { wholesalePrice: number; distributorCost: number }>> {
  const result = new Map<number, { wholesalePrice: number; distributorCost: number }>();
  if (tireIds.length === 0) return result;

  const sources = await getCheapestSourceBatch(tireIds);

  for (const [tireId, source] of sources) {
    result.set(tireId, {
      wholesalePrice: applyDealerMarkup(source.cost),
      distributorCost: source.cost,
    });
  }

  return result;
}
