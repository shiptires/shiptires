/**
 * Competitor pricing from Supabase competitor_prices table.
 * Used in the pricing waterfall: distributor cost → competitor price → MAP fallback.
 */
import { getSupabase } from "@/lib/supabase";

export interface CompetitorPrice {
  competitorPrice: number;
  source: string;
}

/**
 * Get the lowest active competitor price for a single tire.
 * Returns the cheapest across all sources (simpletire, easytires, gigatires).
 */
export async function getCompetitorPrice(
  tireId: number
): Promise<CompetitorPrice | null> {
  const { data, error } = await getSupabase()
    .from("competitor_prices")
    .select("competitor_price, source")
    .eq("tire_id", tireId)
    .eq("active", true)
    .order("competitor_price", { ascending: true })
    .limit(1);

  if (error || !data || data.length === 0) return null;

  return {
    competitorPrice: Number(data[0].competitor_price),
    source: data[0].source,
  };
}

/**
 * Bulk-fetch competitor pricing for all active tires.
 * Returns a map of tire_id → cheapest competitor price + source.
 * Used by the Google Merchant feed and batch pricing.
 */
export async function getCompetitorPricingMap(): Promise<
  Map<number, CompetitorPrice>
> {
  const { data, error } = await getSupabase()
    .from("competitor_prices")
    .select("tire_id, competitor_price, source")
    .eq("active", true);

  if (error || !data) return new Map();

  const map = new Map<number, CompetitorPrice>();
  for (const row of data) {
    const tireId = row.tire_id as number;
    const price = Number(row.competitor_price);
    const existing = map.get(tireId);
    // Keep cheapest price per tire
    if (!existing || price < existing.competitorPrice) {
      map.set(tireId, { competitorPrice: price, source: row.source as string });
    }
  }

  return map;
}
