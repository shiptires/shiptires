import type { Brand, TireModel, TireSize, TireType } from "@/lib/types";
import type { TireRow, BrandSummaryRow, ModelSummaryRow, TireModelDetailsRow } from "./types";
import { toSlug } from "./sqlite";
// sitePrice import removed — all pricing now comes from Express Tire / competitors, not TireWeb MAP
import { getBrandLogo } from "../curated-brands";

// ---------------------------------------------------------------------------
// Map DB season/terrain/category to UI TireType
// ---------------------------------------------------------------------------

function mapTireType(row: {
  season?: string | null;
  terrain?: string | null;
  category?: string | null;
}): TireType {
  const season = row.season?.toLowerCase() ?? "";
  const terrain = row.terrain?.toLowerCase() ?? "";
  const category = row.category?.toLowerCase() ?? "";

  if (terrain.includes("mud")) return "mud-terrain";
  if (terrain.includes("all-terrain")) return "all-terrain";
  if (terrain.includes("highway")) return "highway";
  if (season.includes("winter")) return "winter";
  if (season.includes("summer")) return "summer";
  if (category.includes("performance") || category.includes("uhp"))
    return "performance";
  if (category.includes("touring")) return "touring";
  if (season.includes("all-season") || season.includes("all-weather"))
    return "all-season";

  // Default
  return "all-season";
}

const typeLabels: Record<TireType, string> = {
  "all-season": "All-Season",
  winter: "Winter",
  summer: "Summer",
  performance: "Performance",
  "all-terrain": "All-Terrain",
  "mud-terrain": "Mud-Terrain",
  highway: "Highway",
  touring: "Touring",
};

// ---------------------------------------------------------------------------
// Map a TireRow to a TireSize
// ---------------------------------------------------------------------------

export function tireRowToSize(row: TireRow): TireSize {
  const width = row.width ?? "";
  const aspect = row.aspect_ratio ?? "";
  const rim = row.rim_size ?? "";
  let size: string;
  if (width && aspect && rim) {
    size = `${width}/${aspect}R${rim}`;
  } else if (width && rim && !aspect) {
    // Flotation/LT sizes — extract full size from tire name (e.g. "35X12.50R20LT")
    const flotMatch = row.name?.match(/(\d{2,3}[Xx]\d{1,2}(?:\.\d{1,2})?R\d{2}(?:LT)?)/i);
    size = flotMatch ? flotMatch[1].toUpperCase() : `${width}R${rim}`;
  } else {
    size = row.name;
  }

  return {
    size,
    loadIndex: parseInt(row.load_rating ?? "0") || 0,
    speedRating: row.speed_rating ?? "",
    price: 0, // overridden by distributor/competitor pricing in getSitePrice/applyDistributorPricing
    tireId: row.id,
    imageUrl: resolveImage(row.local_thumbnail, row.thumbnail_url, row.image_0100_url),
    thumbnailUrl: resolveImage(row.local_thumbnail, row.thumbnail_url, row.image_0100_url),
    weight: row.weight ? parseFloat(row.weight) : undefined,
    treadDepth: row.tread_depth ?? undefined,
    utqg: row.utqg ?? undefined,
    loadRange: row.load_range ?? undefined,
    plyRating: row.ply_rating ?? undefined,
  };
}

/** Collect all unique image URLs for a model from a representative tire row.
 *  Side profile is first (best visual for product pages), then angle, front, thumbnail, etc. */
function collectModelImages(row: TireRow): string[] {
  const candidates = [
    resolveImage(row.local_side, row.side_image_url),
    resolveImage(row.local_angle, row.angle_image_url),
    resolveImage(row.local_front, row.front_image_url),
    resolveImage(row.local_thumbnail, row.thumbnail_url),
    resolveImage(row.local_side2, row.side2_image_url),
    resolveImage(null, row.image_0100_url),
    resolveImage(null, row.image_0200_url),
    resolveImage(null, row.image_0301_url),
    resolveImage(null, row.image_0302_url),
  ];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const url of candidates) {
    if (url && !seen.has(url)) {
      seen.add(url);
      result.push(url);
    }
  }
  return result;
}

const R2_BASE = "https://pub-1404e52fd5554e9dac9a045b7bb89f22.r2.dev";

/** Resolve image URL: local paths → R2 URL, remote URLs pass through.
 *  Skips known-dead external hosts (GCS autosync bucket was decommissioned). */
export function resolveImage(...sources: (string | null | undefined)[]): string | undefined {
  for (const src of sources) {
    if (!src || src === "FAILED") continue;
    // Skip decommissioned Google Cloud Storage bucket — files no longer exist
    if (src.includes("storage.googleapis.com/autosync_tires")) continue;
    // Local path from sync (e.g. "images/tires/abc.webp") → R2 URL
    if (src.startsWith("images/") || src.startsWith("images\\")) {
      // Strip "images/" prefix: "images/tires/abc.webp" → "tires/abc.webp"
      const r2Path = src.replace(/\\/g, "/").replace(/^images\//, "");
      return `${R2_BASE}/${r2Path}`;
    }
    // Already a full URL
    if (src.startsWith("http")) return src;
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Map grouped tires to a TireModel
// ---------------------------------------------------------------------------

/** Parse "* Feature one* Feature two" bullet format into string array */
function parseBulletPoints(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw
    .split("*")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export function tiresToModel(
  modelName: string,
  tires: TireRow[],
  brandName?: string,
  modelDetails?: TireModelDetailsRow
): TireModel {
  const allSizes = tires.map(tireRowToSize);

  // Deduplicate: same size + load + speed = same product; keep best price
  const sizeMap = new Map<string, TireSize>();
  for (const s of allSizes) {
    const key = `${s.size}|${s.loadIndex}|${s.speedRating}`;
    const existing = sizeMap.get(key);
    if (!existing) {
      sizeMap.set(key, s);
    } else if (s.price > 0 && (existing.price <= 0 || s.price < existing.price)) {
      sizeMap.set(key, s);
    }
  }
  const sizes = [...sizeMap.values()];

  const pricesWithValue = sizes.map((s) => s.price).filter((p) => p > 0);
  const minPrice =
    pricesWithValue.length > 0 ? Math.min(...pricesWithValue) : 0;
  const maxPrice =
    pricesWithValue.length > 0 ? Math.max(...pricesWithValue) : 0;

  const speedRatings = [
    ...new Set(tires.map((t) => t.speed_rating).filter(Boolean) as string[]),
  ];

  const type = mapTireType(tires[0]);

  // Build features from available data
  const features: string[] = [];
  const first = tires[0];
  if (first.three_pmsf) features.push("3PMSF Certified");
  if (first.run_flat) features.push("Run-Flat");
  if (first.mud_and_snow) features.push("M+S Rated");
  if (first.studdable) features.push("Studdable");
  const typeLabel = typeLabels[type];
  if (typeLabel) features.push(`${typeLabel} Tire`);

  // Find the best tire row for images — prefer one with the most image angles
  const imageRow = tires.reduce((best, t) => {
    const count = [
      t.side_image_url || t.local_side,
      t.angle_image_url || t.local_angle,
      t.front_image_url || t.local_front,
      t.thumbnail_url || t.local_thumbnail,
      t.side2_image_url || t.local_side2,
      t.image_0100_url,
    ].filter((v) => v && v !== "FAILED").length;
    const bestCount = [
      best.side_image_url || best.local_side,
      best.angle_image_url || best.local_angle,
      best.front_image_url || best.local_front,
      best.thumbnail_url || best.local_thumbnail,
      best.side2_image_url || best.local_side2,
      best.image_0100_url,
    ].filter((v) => v && v !== "FAILED").length;
    return count > bestCount ? t : best;
  }, first);

  const image = resolveImage(imageRow.local_thumbnail, imageRow.thumbnail_url, imageRow.image_0100_url);

  // Collect all unique images from the image-bearing tire (all angles are per-model, not per-size)
  const images = collectModelImages(imageRow);

  // Use DB description if available, otherwise auto-generate
  const description = modelDetails?.description
    ? modelDetails.description
    : generateDescription(modelName, first, type, sizes.length, brandName, tires);

  // Parse detailed features/benefits from tire_models table
  const detailedFeatures = parseBulletPoints(modelDetails?.features);
  const benefits = parseBulletPoints(modelDetails?.benefits);

  return {
    name: modelName,
    slug: toSlug(modelName),
    type,
    sizes,
    features,
    detailedFeatures: detailedFeatures.length > 0 ? detailedFeatures : undefined,
    benefits: benefits.length > 0 ? benefits : undefined,
    warranty: first.warranty ?? "",
    speedRatings,
    priceRange: [minPrice, maxPrice],
    description,
    image,
    images: images.length > 0 ? images : undefined,
    manufacturerUrl: modelDetails?.manufacturer_url ?? undefined,
  };
}

function generateDescription(
  modelName: string,
  tire: TireRow,
  type: TireType,
  sizeCount: number,
  explicitBrand?: string,
  allTires?: TireRow[]
): string {
  const typeLabel = typeLabels[type];
  const brand = explicitBrand || tire.make_name || "";
  const article = /^[aeiou]/i.test(typeLabel) ? "an" : "a";

  // Determine use case from type
  const useCase: Record<string, string> = {
    "all-season": "designed for year-round traction in dry, wet, and light snow conditions",
    winter: "engineered for maximum grip in snow, ice, and cold-weather driving",
    summer: "optimized for warm-weather performance with superior dry and wet handling",
    performance: "built for high-speed handling and responsive cornering",
    "all-terrain": "built for on- and off-road versatility across gravel, dirt, and pavement",
    "mud-terrain": "engineered for aggressive off-road traction in mud, rock, and loose terrain",
    highway: "designed for smooth highway cruising with long tread life",
    touring: "built for a quiet, comfortable ride with dependable all-season traction",
  };

  const parts: string[] = [
    `The ${brand} ${modelName} is ${article} ${typeLabel.toLowerCase()} tire ${useCase[type] || `available for ${typeLabel.toLowerCase()} driving`}.`,
  ];

  // Size range info
  if (sizeCount > 1 && allTires && allTires.length > 1) {
    const rims = [...new Set(allTires.map((t) => t.rim_size).filter(Boolean) as string[])].sort(
      (a, b) => parseFloat(a) - parseFloat(b)
    );
    if (rims.length >= 2) {
      parts.push(
        `Available in ${sizeCount} sizes fitting ${rims[0]}" to ${rims[rims.length - 1]}" wheels.`
      );
    } else {
      parts.push(`Available in ${sizeCount} size${sizeCount !== 1 ? "s" : ""}.`);
    }
  } else {
    parts.push(`Available in ${sizeCount} size${sizeCount !== 1 ? "s" : ""}.`);
  }

  // Key features
  const features: string[] = [];
  if (tire.three_pmsf) features.push("3-Peak Mountain Snowflake certified for severe snow");
  if (tire.run_flat) features.push("run-flat capable");
  if (tire.mud_and_snow) features.push("M+S rated");
  if (tire.studdable) features.push("studdable for ice traction");
  if (features.length > 0) {
    parts.push(`Key features: ${features.join(", ")}.`);
  }

  // Load range for truck/commercial tires
  if (allTires && allTires.length > 0) {
    const loadRanges = [...new Set(allTires.map((t) => t.load_range).filter(Boolean) as string[])];
    if (loadRanges.length > 0) {
      parts.push(`Available in load range${loadRanges.length > 1 ? "s" : ""} ${loadRanges.join(", ")}.`);
    }
  }

  if (tire.warranty) {
    parts.push(`Backed by a ${tire.warranty} warranty.`);
  }

  parts.push("Ships free to your door or local installer.");

  return parts.join(" ");
}

// ---------------------------------------------------------------------------
// Map BrandSummaryRow to a Brand (without models loaded)
// ---------------------------------------------------------------------------

export function brandSummaryToBrand(row: BrandSummaryRow): Brand {
  const localLogo = getBrandLogo(row.make_name);
  return {
    name: row.make_name,
    slug: toSlug(row.make_name),
    domain: guessDomain(row.make_name),
    country: "",
    founded: 0,
    description: "",
    models: [],
    logoUrl: localLogo || resolveImage(row.local_logo, row.make_image_url),
    tireCount: row.tire_count,
    modelCount: row.model_count,
  };
}

// ---------------------------------------------------------------------------
// Map ModelSummaryRow to a TireModel stub (without sizes loaded)
// ---------------------------------------------------------------------------

export function modelSummaryToModel(row: ModelSummaryRow): TireModel {
  const type = mapTireType(row);
  return {
    name: row.model_name,
    slug: toSlug(row.model_name),
    type,
    sizes: [],
    sizeCount: row.tire_count ?? 0,
    features: [],
    warranty: "",
    speedRatings: [],
    priceRange: [Number(row.min_price) || 0, Number(row.max_price) || 0],
    description: `${row.model_name} — ${row.tire_count} size${row.tire_count !== 1 ? "s" : ""} available.`,
    image: resolveImage(row.thumbnail_url),
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Best-effort domain guess for logo.dev fallback */
function guessDomain(brandName: string): string {
  const known: Record<string, string> = {
    MICHELIN: "michelin.com",
    BRIDGESTONE: "bridgestone.com",
    GOODYEAR: "goodyear.com",
    CONTINENTAL: "continental-tires.com",
    PIRELLI: "pirelli.com",
    HANKOOK: "hankooktire.com",
    YOKOHAMA: "yokohamatire.com",
    TOYO: "toyotires.com",
    FALKEN: "falkentire.com",
    FIRESTONE: "firestone.com",
    COOPER: "coopertire.com",
    BFGOODRICH: "bfgoodrichtires.com",
    GENERAL: "generaltire.com",
    KUMHO: "kumhotire.com",
    NEXEN: "nexentireusa.com",
    NITTO: "nittotire.com",
    DUNLOP: "dunloptires.com",
    MAXXIS: "maxxis.com",
    SUMITOMO: "sumitomotire.com",
    IRONMAN: "ironmantires.com",
    RADAR: "radartires.com",
    NOKIAN: "nokiantires.com",
    KELLY: "kellytires.com",
    MASTERCRAFT: "mastercrafttires.com",
    UNIROYAL: "uniroyal.com",
    FUZION: "fuziontire.com",
    ACHILLES: "achillestire.com",
    FEDERAL: "federaltire.com",
    KENDA: "kendatire.com",
    LAUFENN: "laufenn.com",
  };
  return known[brandName.toUpperCase()] ?? `${brandName.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`;
}
