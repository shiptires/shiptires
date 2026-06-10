import type { Brand, TireModel, TireSize, TireType } from "@/lib/types";
import type { TireRow, BrandSummaryRow, ModelSummaryRow } from "./types";
import { toSlug } from "./sqlite";
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
  const size =
    width && aspect && rim ? `${width}/${aspect}R${rim}` : row.name;

  return {
    size,
    loadIndex: parseInt(row.load_rating ?? "0") || 0,
    speedRating: row.speed_rating ?? "",
    price: row.price_map ?? 0,
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

/** Prefer local path → remote URL → undefined. Local paths become /images/... URLs. */
function resolveImage(...sources: (string | null | undefined)[]): string | undefined {
  for (const src of sources) {
    if (!src) continue;
    // Local path from sync (e.g. "images/tires/abc.webp") → serve via nginx
    if (src.startsWith("images/") || src.startsWith("images\\")) {
      return "/" + src.replace(/\\/g, "/");
    }
    // Already a full URL
    if (src.startsWith("http")) return src;
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Map grouped tires to a TireModel
// ---------------------------------------------------------------------------

export function tiresToModel(
  modelName: string,
  tires: TireRow[]
): TireModel {
  const sizes = tires.map(tireRowToSize);
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

  const image = resolveImage(first.local_thumbnail, first.thumbnail_url, first.image_0100_url);

  // Auto-generate description from specs
  const description = generateDescription(modelName, first, type, sizes.length);

  return {
    name: modelName,
    slug: toSlug(modelName),
    type,
    sizes,
    features,
    warranty: first.warranty ?? "",
    speedRatings,
    priceRange: [minPrice, maxPrice],
    description,
    image,
  };
}

function generateDescription(
  modelName: string,
  tire: TireRow,
  type: TireType,
  sizeCount: number
): string {
  const typeLabel = typeLabels[type];
  const brand = tire.make_name;
  const parts: string[] = [
    `The ${brand} ${modelName} is a ${typeLabel.toLowerCase()} tire available in ${sizeCount} size${sizeCount !== 1 ? "s" : ""}.`,
  ];

  if (tire.warranty) {
    parts.push(`Backed by a ${tire.warranty} warranty.`);
  }
  if (tire.utqg) {
    parts.push(`UTQG rating: ${tire.utqg}.`);
  }

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
    priceRange: [row.min_price ?? 0, row.max_price ?? 0],
    description: `${row.model_name} — ${row.tire_count} size${row.tire_count !== 1 ? "s" : ""} available.`,
    image: row.thumbnail_url ?? undefined,
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
