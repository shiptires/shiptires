import { getTiresForFeed, toSlug } from "@/lib/db";
import type { TireRow } from "@/lib/db";
import { sitePrice, sitePriceFromCost } from "@/lib/pricing";
import { getDistributorPricingMap } from "@/lib/distributors";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Google Merchant Center Product Feed — RSS 2.0 with g: namespace.
 *
 * Usage:
 *   GET /api/feeds/google-merchant                              — all brands, first 10,000
 *   GET /api/feeds/google-merchant?brands=goodyear,dunlop       — specific brands only
 *   GET /api/feeds/google-merchant?page=2                       — next page
 *   GET /api/feeds/google-merchant?limit=50000                  — larger batch (max 50,000)
 *
 * Register the URL as a scheduled fetch in Google Merchant Center.
 */

const GOOGLE_CATEGORY =
  "Vehicles & Parts > Vehicle Parts & Accessories > Motor Vehicle Parts > Motor Vehicle Wheel Systems > Motor Vehicle Tires";
const GOOGLE_CATEGORY_ID = "2636";

const ITEMS_PER_PAGE = 50_000;
const MAX_LIMIT = 50_000;

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function resolveImageUrl(row: TireRow): string | null {
  // Prefer R2 CDN thumbnail, then primary image — skip local paths (they 404)
  const sources = [row.thumbnail_url, row.image_0100_url, row.local_thumbnail];
  for (const src of sources) {
    if (!src) continue;
    if (src.startsWith("http")) return src;
  }
  return null;
}

function buildSize(row: TireRow): string {
  if (row.width && row.aspect_ratio && row.rim_size) {
    return `${row.width}/${row.aspect_ratio}R${row.rim_size}`;
  }
  return row.name;
}

function buildTitle(row: TireRow, size: string): string {
  return `${row.make_name} ${row.model_name} ${size} Tire - 1 Tire`;
}

function buildDescription(row: TireRow, size: string): string {
  const parts = [`${row.make_name} ${row.model_name} ${size}`];

  if (row.season) parts.push(row.season);
  if (row.terrain) parts.push(row.terrain);
  if (row.load_rating && row.speed_rating)
    parts.push(`${row.load_rating}${row.speed_rating}`);
  if (row.warranty) parts.push(`${row.warranty} warranty`);

  parts.push("Free shipping");
  return parts.join(" | ");
}

function buildItemXml(
  row: TireRow,
  distPricing?: Map<number, { cost: number; shipping: number }>
): string {
  const size = buildSize(row);
  const title = escapeXml(buildTitle(row, size));
  const description = escapeXml(buildDescription(row, size));
  const brandSlug = toSlug(row.make_name);
  const modelSlug = toSlug(row.model_name);
  const link = `https://ship.tires/tires/${brandSlug}/${modelSlug}`;
  const imageLink = resolveImageUrl(row);

  // Use distributor cost-based pricing when available, fall back to MAP
  const distSource = distPricing?.get(row.id);
  const price = distSource
    ? sitePriceFromCost(distSource.cost, distSource.shipping).toFixed(2)
    : sitePrice(row.price_map).toFixed(2);

  // Prefer EAN > UPC for GTIN; fall back to item_number as MPN
  const gtin = row.ean || row.upc || "";
  const mpn = row.item_number || row.gm_code || "";

  // Must have at least one identifier and an image — Google rejects products without images
  if (!gtin && !mpn) return "";
  if (!imageLink) return "";

  const lines = [
    "    <item>",
    `      <g:id>${row.id}</g:id>`,
    `      <g:title>${title}</g:title>`,
    `      <g:description>${description}</g:description>`,
    `      <g:link>${link}</g:link>`,
    `      <g:checkout_link_template>https://ship.tires/buy/${row.id}</g:checkout_link_template>`,
  ];

  if (imageLink) {
    lines.push(`      <g:image_link>${escapeXml(imageLink)}</g:image_link>`);
  }

  lines.push(
    `      <g:price>${price} USD</g:price>`,
    `      <g:brand>${escapeXml(row.make_name)}</g:brand>`,
    `      <g:condition>new</g:condition>`,
    `      <g:availability>in_stock</g:availability>`,
    `      <g:google_product_category>${GOOGLE_CATEGORY_ID}</g:google_product_category>`,
    `      <g:product_type>${escapeXml(GOOGLE_CATEGORY)}</g:product_type>`
  );

  if (gtin) lines.push(`      <g:gtin>${escapeXml(gtin)}</g:gtin>`);
  if (mpn) lines.push(`      <g:mpn>${escapeXml(mpn)}</g:mpn>`);

  // Size as custom label for filtering in Merchant Center
  lines.push(`      <g:custom_label_0>${escapeXml(size)}</g:custom_label_0>`);

  // Season/type as custom label
  const tireType = row.season || row.terrain || row.category || "";
  if (tireType) {
    lines.push(
      `      <g:custom_label_1>${escapeXml(tireType)}</g:custom_label_1>`
    );
  }

  // Explicitly single tire — not a set
  lines.push(
    "      <g:multipack>1</g:multipack>",
    "      <g:is_bundle>no</g:is_bundle>"
  );

  // Free shipping
  lines.push(
    "      <g:shipping>",
    "        <g:country>US</g:country>",
    "        <g:service>Standard</g:service>",
    "        <g:price>0 USD</g:price>",
    "      </g:shipping>"
  );

  // Exclude from local programs (online-only store, no physical inventory)
  lines.push(
    "      <g:excluded_destination>free_local_listings</g:excluded_destination>",
    "      <g:excluded_destination>local_inventory_ads</g:excluded_destination>"
  );

  lines.push("    </item>");
  return lines.join("\n");
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1") || 1);
  const limit = Math.min(
    Math.max(1, parseInt(searchParams.get("limit") || String(ITEMS_PER_PAGE)) || ITEMS_PER_PAGE),
    MAX_LIMIT
  );
  const offset = (page - 1) * limit;

  // Optional brand filter: ?brands=goodyear,dunlop,radar,falken
  const brandsParam = searchParams.get("brands");
  const filterBrands = brandsParam
    ? brandsParam.split(",").map((b) => b.trim()).filter(Boolean)
    : undefined;

  // Fetch distributor pricing map (for tires we have in distributor inventory)
  let distPricing: Map<number, { cost: number; shipping: number }> | undefined;
  try {
    distPricing = await getDistributorPricingMap();
  } catch {
    // Supabase unavailable — use MAP pricing only
  }

  const { tires, total } = await getTiresForFeed(offset, limit, filterBrands);
  const totalPages = Math.ceil(total / limit);

  const items = tires
    .map((row) => buildItemXml(row, distPricing))
    .filter(Boolean)
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Ship.Tires Product Feed</title>
    <link>https://ship.tires</link>
    <description>Shop &amp; Ship Car, Truck &amp; SUV Tires with Free Delivery. Page ${page} of ${totalPages} (${total} total products).</description>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
      "X-Total-Products": String(total),
      "X-Page": String(page),
      "X-Total-Pages": String(totalPages),
    },
  });
}
