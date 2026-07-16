import { getTiresForFeed, toSlug } from "@/lib/db";
import type { TireRow } from "@/lib/db";
import { sitePrice, sitePriceFromCost, sitePriceFromCompetitor } from "@/lib/pricing";
import { getDistributorPricingMap } from "@/lib/distributors";
import { getCompetitorPricingMap } from "@/lib/competitors";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Meta Commerce Manager Product Feed — TSV format.
 *
 * Compatible with Facebook Shops, Instagram Shopping, and Meta Advantage+ Catalog Ads.
 *
 *   GET /api/feeds/meta-commerce                          — all brands, first 50,000
 *   GET /api/feeds/meta-commerce?brands=goodyear,dunlop   — specific brands only
 *   GET /api/feeds/meta-commerce?page=2                   — next page
 *
 * Register URL as a scheduled data feed in Meta Commerce Manager.
 */

const META_CATEGORY =
  "Vehicles & Parts > Vehicle Parts & Accessories > Motor Vehicle Parts > Motor Vehicle Wheel Systems > Motor Vehicle Tires";

const ITEMS_PER_PAGE = 50_000;
const MAX_LIMIT = 50_000;

const R2_BASE = "https://pub-1404e52fd5554e9dac9a045b7bb89f22.r2.dev";

function resolveUrl(src: string | null | undefined): string | null {
  if (!src || src === "FAILED") return null;
  if (src.startsWith("images/") || src.startsWith("images\\")) {
    const r2Path = src.replace(/\\/g, "/").replace(/^images\//, "");
    return `${R2_BASE}/${r2Path}`;
  }
  if (src.startsWith("http")) return src;
  return null;
}

function resolveImageUrl(row: TireRow): string | null {
  const sources = [row.local_thumbnail, row.thumbnail_url, row.image_0100_url];
  for (const src of sources) {
    const url = resolveUrl(src);
    if (url) return url;
  }
  return null;
}

function resolveAdditionalImages(row: TireRow, primaryUrl: string | null): string[] {
  const candidates = [
    row.local_side, row.side_image_url,
    row.local_angle, row.angle_image_url,
    row.local_front, row.front_image_url,
    row.local_side2, row.side2_image_url,
    row.image_0200_url, row.image_0301_url, row.image_0302_url,
  ];
  const seen = new Set<string>();
  if (primaryUrl) seen.add(primaryUrl);
  const result: string[] = [];
  for (const src of candidates) {
    const url = resolveUrl(src);
    if (url && !seen.has(url)) {
      seen.add(url);
      result.push(url);
      if (result.length >= 9) break;
    }
  }
  return result;
}

function buildSize(row: TireRow): string {
  if (row.width && row.aspect_ratio && row.rim_size) {
    return `${row.width}/${row.aspect_ratio}R${row.rim_size}`;
  }
  if (row.width && row.rim_size) {
    return `${row.width}R${row.rim_size}`;
  }
  return row.name;
}

function buildTitle(row: TireRow, size: string): string {
  return `${row.make_name} ${row.model_name} ${size} Tire - 1 Tire`;
}

function buildDescription(row: TireRow, size: string): string {
  const parts: string[] = [];

  parts.push(`${row.make_name} ${row.model_name} ${size} tire.`);

  if (row.season && row.terrain) {
    parts.push(`${row.season} ${row.terrain} tire.`);
  } else if (row.season) {
    parts.push(`${row.season} tire.`);
  } else if (row.terrain) {
    parts.push(`${row.terrain} terrain tire.`);
  }

  if (row.load_rating && row.speed_rating) {
    parts.push(`Load/speed rating: ${row.load_rating}${row.speed_rating}.`);
  }

  if (row.utqg) parts.push(`UTQG ${row.utqg}.`);
  if (row.tread_depth) parts.push(`Tread depth: ${row.tread_depth}/32".`);

  if (row.ply_rating && row.load_range) {
    parts.push(`${row.ply_rating}-ply, load range ${row.load_range}.`);
  } else if (row.ply_rating) {
    parts.push(`${row.ply_rating}-ply.`);
  } else if (row.load_range) {
    parts.push(`Load range ${row.load_range}.`);
  }

  const features: string[] = [];
  if (row.run_flat) features.push("Run-Flat");
  if (row.mud_and_snow) features.push("M+S rated");
  if (row.three_pmsf) features.push("3PMSF severe snow rated");
  if (row.studdable) features.push("Studdable");
  if (features.length) parts.push(features.join(", ") + ".");

  if (row.warranty) parts.push(`${row.warranty} warranty.`);
  parts.push("Free shipping to your door.");

  return parts.join(" ");
}

/** Escape a value for TSV: if it contains tabs/newlines/quotes, wrap in quotes */
function escapeTsv(s: string): string {
  if (s.includes("\t") || s.includes("\n") || s.includes('"')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

const COLUMNS = [
  "id",
  "title",
  "description",
  "availability",
  "condition",
  "price",
  "link",
  "image_link",
  "additional_image_link",
  "brand",
  "gtin",
  "mpn",
  "fb_product_category",
  "product_type",
  "shipping",
  "shipping_weight",
  "custom_label_0",
  "custom_label_1",
] as const;

function buildRow(
  row: TireRow,
  distPricing?: Map<number, { cost: number; shipping: number }>,
  compPricing?: Map<number, { competitorPrice: number; source: string }>,
): string | null {
  if (!row.width || !row.rim_size) return null;

  const imageLink = resolveImageUrl(row);
  if (!imageLink) return null;

  const gtin = row.ean || row.upc || "";
  const mpn = row.item_number || row.gm_code || "";
  if (!gtin && !mpn) return null;

  // Pricing: distributor cost → competitor price (no TireWeb MAP fallback)
  const distSource = distPricing?.get(row.id);
  const compSource = compPricing?.get(row.id);
  let price: number;
  if (distSource) {
    price = sitePriceFromCost(distSource.cost, distSource.shipping);
  } else if (compSource) {
    price = sitePriceFromCompetitor(compSource.competitorPrice);
  } else {
    price = 0; // No distributor/competitor data — skip this item
  }

  if (price <= 0) return null;

  const size = buildSize(row);
  const brandSlug = toSlug(row.make_name);
  const modelSlug = toSlug(row.model_name);
  const sizeSlug = row.aspect_ratio
    ? `${row.width}-${row.aspect_ratio}r${row.rim_size}`.toLowerCase()
    : `${row.width}r${row.rim_size}`.toLowerCase();
  const link = `https://ship.tires/tires/${brandSlug}/${modelSlug}/${sizeSlug}`;

  const additionalImages = resolveAdditionalImages(row, imageLink);
  const tireType = row.season || row.terrain || row.category || "";

  const shippingWeight = row.weight ? parseFloat(row.weight) : 0;

  const values = [
    String(row.id),                                             // id
    buildTitle(row, size),                                      // title
    buildDescription(row, size),                                // description
    "in stock",                                                 // availability
    "new",                                                      // condition
    `${price.toFixed(2)} USD`,                                  // price
    link,                                                       // link
    imageLink,                                                  // image_link
    additionalImages.join(","),                                 // additional_image_link
    row.make_name,                                              // brand
    gtin,                                                       // gtin
    mpn,                                                        // mpn
    META_CATEGORY,                                              // fb_product_category
    `Tires > ${row.make_name} > ${row.model_name}`,            // product_type
    "US:::0.00 USD",                                            // shipping (free)
    shippingWeight > 0 ? `${shippingWeight.toFixed(2)} lb` : "",// shipping_weight
    size,                                                       // custom_label_0 (tire size)
    tireType,                                                   // custom_label_1 (season/type)
  ];

  return values.map(escapeTsv).join("\t");
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1") || 1);
  const limit = Math.min(
    Math.max(1, parseInt(searchParams.get("limit") || String(ITEMS_PER_PAGE)) || ITEMS_PER_PAGE),
    MAX_LIMIT,
  );
  const offset = (page - 1) * limit;

  const brandsParam = searchParams.get("brands");
  const filterBrands = brandsParam
    ? brandsParam.split(",").map((b) => b.trim()).filter(Boolean)
    : undefined;

  let distPricing: Map<number, { cost: number; shipping: number }> | undefined;
  let compPricing: Map<number, { competitorPrice: number; source: string }> | undefined;
  try {
    [distPricing, compPricing] = await Promise.all([
      getDistributorPricingMap(),
      getCompetitorPricingMap(),
    ]);
  } catch {
    // Supabase unavailable — use MAP pricing only
  }

  const { tires, total } = await getTiresForFeed(offset, limit, filterBrands);
  const totalPages = Math.ceil(total / limit);

  const lines: string[] = [COLUMNS.join("\t")];
  let itemCount = 0;

  for (const row of tires) {
    const line = buildRow(row, distPricing, compPricing);
    if (line) {
      lines.push(line);
      itemCount++;
    }
  }

  const tsv = lines.join("\n");

  return new Response(tsv, {
    headers: {
      "Content-Type": "text/tab-separated-values; charset=utf-8",
      "Content-Disposition": `inline; filename="meta-feed-page${page}.tsv"`,
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
      "X-Total-Products": String(total),
      "X-Page": String(page),
      "X-Total-Pages": String(totalPages),
      "X-Items-On-Page": String(itemCount),
    },
  });
}
