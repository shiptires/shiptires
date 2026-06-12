import { tireRankings } from "@/data/tire-rankings";

function slug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export interface RankingAppearance {
  category: string;
  categorySlug: string;
  rank: number;
  score: number;
  racingConnection: string;
}

/**
 * Returns all ranking appearances for a specific tire model.
 */
export function getRankingsForModel(
  brandSlug: string,
  modelSlug: string,
): RankingAppearance[] {
  const results: RankingAppearance[] = [];
  for (const cat of tireRankings) {
    for (const tire of cat.tires) {
      if (slug(tire.brand) === brandSlug && slug(tire.model) === modelSlug) {
        results.push({
          category: cat.category,
          categorySlug: cat.slug,
          rank: tire.rank,
          score: tire.score,
          racingConnection: tire.racingConnection,
        });
      }
    }
  }
  return results;
}

export interface BrandRankingAppearance extends RankingAppearance {
  model: string;
  modelSlug: string;
}

/**
 * Returns all ranked tires from a specific brand.
 */
export function getRankingsForBrand(
  brandSlug: string,
): BrandRankingAppearance[] {
  const results: BrandRankingAppearance[] = [];
  for (const cat of tireRankings) {
    for (const tire of cat.tires) {
      if (slug(tire.brand) === brandSlug) {
        results.push({
          category: cat.category,
          categorySlug: cat.slug,
          rank: tire.rank,
          score: tire.score,
          racingConnection: tire.racingConnection,
          model: tire.model,
          modelSlug: slug(tire.model),
        });
      }
    }
  }
  return results;
}

export interface TopRankedTire {
  category: string;
  categorySlug: string;
  brand: string;
  brandSlug: string;
  model: string;
  modelSlug: string;
  score: number;
  racingConnection: string;
}

/**
 * Returns the #1 pick from each category (for homepage showcase).
 */
export function getTopRankedTires(): TopRankedTire[] {
  return tireRankings.map((cat) => {
    const top = cat.tires[0];
    return {
      category: cat.category,
      categorySlug: cat.slug,
      brand: top.brand,
      brandSlug: slug(top.brand),
      model: top.model,
      modelSlug: slug(top.model),
      score: top.score,
      racingConnection: top.racingConnection,
    };
  });
}
