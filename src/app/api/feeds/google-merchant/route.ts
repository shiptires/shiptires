import { getTiresForFeed, toSlug } from "@/lib/db";
import type { TireRow } from "@/lib/db";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Google Merchant Center Product Feed — RSS 2.0 with g: namespace.
 *
 * Usage:
 *   GET /api/feeds/google-merchant           — first 10,000 items
 *   GET /api/feeds/google-merchant?page=2    — items 10,001–20,000
 *   GET /api/feeds/google-merchant?limit=500 — custom batch size (max 50,000)
 *
 * Register each page URL as a separate primary feed in Merchant Center,
 * or use a single URL with a large limit for smaller catalogs.
 */

const GOOGLE_CATEGORY =
  "Vehicles & Parts > Vehicle Parts & Accessories > Motor Vehicle Parts > Motor Vehicle Wheel Systems > Motor Vehicle Tires";
const GOOGLE_CATEGORY_ID = "2636";

const ITEMS_PER_PAGE = 10_000;
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
  // Prefer local thumbnail, then remote thumbnail, then primary image
  const sources = [row.local_thumbnail, row.thumbnail_url, row.image_0100_url];
  for (const src of sources) {
    if (!src) continue;
    if (src.startsWith("images/") || src.startsWith("images\\")) {
      return `https://ship.tires/${src.replace(/\\/g, "/")}`;
    }
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
  return `${row.make_name} ${row.model_name} ${size} Tire`;
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

function buildItemXml(row: TireRow): string {
  const size = buildSize(row);
  const title = escapeXml(buildTitle(row, size));
  const description = escapeXml(buildDescription(row, size));
  const brandSlug = toSlug(row.make_name);
  const modelSlug = toSlug(row.model_name);
  const link = `https://ship.tires/tires/${brandSlug}/${modelSlug}`;
  const imageLink = resolveImageUrl(row);
  const price = (row.price_map ?? 0).toFixed(2);

  // Prefer EAN > UPC for GTIN; fall back to item_number as MPN
  const gtin = row.ean || row.upc || "";
  const mpn = row.item_number || row.gm_code || "";

  // Must have at least one identifier
  if (!gtin && !mpn) return "";

  const lines = [
    "    <item>",
    `      <g:id>${row.id}</g:id>`,
    `      <g:title>${title}</g:title>`,
    `      <g:description>${description}</g:description>`,
    `      <g:link>${link}</g:link>`,
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

  // Free shipping
  lines.push(
    "      <g:shipping>",
    "        <g:country>US</g:country>",
    "        <g:service>Standard</g:service>",
    "        <g:price>0 USD</g:price>",
    "      </g:shipping>"
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

  const { tires, total } = await getTiresForFeed(offset, limit);
  const totalPages = Math.ceil(total / limit);

  const items = tires
    .map(buildItemXml)
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
