/**
 * Curated brand whitelist — only these brands are shown on the site.
 * The full 665-brand catalog from TireWebLibrary is filtered to this set.
 *
 * Brand names are stored UPPERCASED for case-insensitive matching against
 * the API's `make_name` field.
 */

/** Map of UPPERCASED API brand name → local logo filename in /brand-logos/ */
export const CURATED_BRANDS: Map<string, string> = new Map([
  ["ADVANTA", "argusAdvanta.avif"],
  ["BFGOODRICH", "bfgoodrich.png"],
  ["BRIDGESTONE", "bridgestone.png"],
  ["CONTINENTAL", "continental.png"],
  ["COOPER", "cooper.png"],
  ["DUNLOP", "dunlop.webp"],
  ["FALKEN", "falken.png"],
  ["FIRESTONE", "firestone.png"],
  ["GENERAL", "general.png"],
  ["GOODYEAR", "goodyear.png"],
  ["HANKOOK", "hankook.png"],
  ["HOOSIER", "hoosier.png"],
  ["KENDA", "kendaTires.png"],
  ["KUMHO", "kumho.png"],
  ["LAUFENN", "laufenn.png"],
  ["MAXXIS", "maxxis.png"],
  ["MICHELIN", "michelin.png"],
  ["MICKEY THOMPSON", "mickeyThompson.webp"],
  ["NANKANG", "nankang.png"],
  ["NEXEN", "nexen.png"],
  ["NITTO", "nitto.png"],
  ["NOKIAN", "nokianTyres.avif"],
  ["PIRELLI", "pirelli.png"],
  ["POWER KING", "powerKing.png"],
  ["RADAR", "radarTires.avif"],
  ["RANGE FINDER", ""],
  ["RIKEN", "riken.png"],
  ["SUMITOMO", "sumitomo.png"],
  ["TOYO", "toyo.png"],
  ["UNIROYAL", "uniroyal.png"],
  ["VITOUR", "vitour.png"],
  ["VOGUE", "vogue.png"],
  ["VREDESTEIN", "vredestein.webp"],
  ["YOKOHAMA", "yokohama.png"],
]);

/** Check if a brand name (any case) is in the curated set. */
export function isCuratedBrand(name: string): boolean {
  return CURATED_BRANDS.has(name.toUpperCase());
}

/** Get local logo path for a brand, or null if not mapped. */
export function getBrandLogo(name: string): string | null {
  const file = CURATED_BRANDS.get(name.toUpperCase());
  if (!file) return null;
  return `/brand-logos/${file}`;
}
