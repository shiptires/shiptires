import { getTiresForFeed, toSlug } from "@/lib/db";
import type { TireRow } from "@/lib/db";
import { sitePrice, sitePriceFromCost, sitePriceFromCompetitor } from "@/lib/pricing";
import { getDistributorPricingMap } from "@/lib/distributors";
import { getCompetitorPricingMap } from "@/lib/competitors";
import { getVehiclesForSize } from "@/data/tire-sizes";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Google Merchant Center Product Feed — RSS 2.0 with g: namespace.
 *
 * Standard feed (one entry per tire):
 *   GET /api/feeds/google-merchant                              — all brands, first 50,000
 *   GET /api/feeds/google-merchant?brands=goodyear,dunlop       — specific brands only
 *   GET /api/feeds/google-merchant?page=2                       — next page
 *
 * Vehicle-expanded feed (one entry per tire × compatible vehicle):
 *   GET /api/feeds/google-merchant?vehicles=true                — vehicle-specific listings
 *   GET /api/feeds/google-merchant?vehicles=true&page=2         — next page
 *
 * Register URL(s) as scheduled fetches in Google Merchant Center.
 */

const GOOGLE_CATEGORY =
  "Vehicles & Parts > Vehicle Parts & Accessories > Motor Vehicle Parts > Motor Vehicle Wheel Systems > Motor Vehicle Tires";
const GOOGLE_CATEGORY_ID = "2636";

const ITEMS_PER_PAGE = 50_000;
const VEHICLE_ITEMS_PER_PAGE = 10_000;
const MAX_LIMIT = 50_000;

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

const R2_BASE = "https://pub-1404e52fd5554e9dac9a045b7bb89f22.r2.dev";

function resolveImageUrl(row: TireRow): string | null {
  const sources = [row.local_thumbnail, row.thumbnail_url, row.image_0100_url];
  for (const src of sources) {
    if (!src || src === "FAILED") continue;
    // Local path from sync → R2 URL
    if (src.startsWith("images/") || src.startsWith("images\\")) {
      const r2Path = src.replace(/\\/g, "/").replace(/^images\//, "");
      return `${R2_BASE}/${r2Path}`;
    }
    // Already a full URL
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

function buildTitle(
  row: TireRow,
  size: string,
  vehicle?: string
): string {
  if (vehicle) {
    const mpn = row.item_number || row.gm_code || "";
    return `${vehicle} ${row.make_name} ${mpn} ${row.model_name} ${size} Tire`
      .replace(/\s{2,}/g, " ")
      .trim();
  }
  return `${row.make_name} ${row.model_name} ${size} Tire - 1 Tire`;
}

function buildDescription(
  row: TireRow,
  size: string,
  vehicle?: string
): string {
  const parts: string[] = [];

  // Product identity
  if (vehicle) {
    parts.push(
      `${row.make_name} ${row.model_name} ${size} tire for ${vehicle}.`
    );
  } else {
    parts.push(`${row.make_name} ${row.model_name} ${size} tire.`);
  }

  // Season / terrain
  if (row.season && row.terrain) {
    parts.push(`${row.season} ${row.terrain} tire.`);
  } else if (row.season) {
    parts.push(`${row.season} tire.`);
  } else if (row.terrain) {
    parts.push(`${row.terrain} terrain tire.`);
  }

  // Load and speed rating
  if (row.load_rating && row.speed_rating) {
    parts.push(`Load/speed rating: ${row.load_rating}${row.speed_rating}.`);
  }

  // UTQG
  if (row.utqg) parts.push(`UTQG ${row.utqg}.`);

  // Tread depth
  if (row.tread_depth) parts.push(`Tread depth: ${row.tread_depth}/32".`);

  // Ply / load range
  if (row.ply_rating && row.load_range) {
    parts.push(`${row.ply_rating}-ply, load range ${row.load_range}.`);
  } else if (row.ply_rating) {
    parts.push(`${row.ply_rating}-ply.`);
  } else if (row.load_range) {
    parts.push(`Load range ${row.load_range}.`);
  }

  // Feature flags
  const features: string[] = [];
  if (row.run_flat) features.push("Run-Flat");
  if (row.mud_and_snow) features.push("M+S rated");
  if (row.three_pmsf) features.push("3PMSF severe snow rated");
  if (row.studdable) features.push("Studdable");
  if (features.length) parts.push(features.join(", ") + ".");

  // Warranty
  if (row.warranty) parts.push(`${row.warranty} warranty.`);

  // Shipping
  parts.push("Free shipping to your door.");

  return parts.join(" ");
}

function buildItemXml(
  row: TireRow,
  distPricing?: Map<number, { cost: number; shipping: number }>,
  compPricing?: Map<number, { competitorPrice: number; source: string }>,
  vehicle?: { make: string; model: string }
): string {
  const size = buildSize(row);
  const vehicleName = vehicle
    ? `${vehicle.make} ${vehicle.model}`
    : undefined;
  const title = escapeXml(buildTitle(row, size, vehicleName));
  const description = escapeXml(buildDescription(row, size, vehicleName));

  const brandSlug = toSlug(row.make_name);
  const modelSlug = toSlug(row.model_name);
  const sizeSlug =
    row.width && row.aspect_ratio && row.rim_size
      ? `${row.width}-${row.aspect_ratio}r${row.rim_size}`.toLowerCase()
      : String(row.id);

  const link = vehicle
    ? `https://ship.tires/tires/vehicle/${toSlug(vehicle.make)}/${toSlug(vehicle.model)}`
    : `https://ship.tires/tires/${brandSlug}/${modelSlug}/${sizeSlug}`;

  const imageLink = resolveImageUrl(row);

  // Pricing waterfall: distributor → competitor → MAP
  const distSource = distPricing?.get(row.id);
  const compSource = compPricing?.get(row.id);
  let price: string;
  if (distSource) {
    price = sitePriceFromCost(distSource.cost, distSource.shipping).toFixed(2);
  } else if (compSource) {
    price = sitePriceFromCompetitor(compSource.competitorPrice).toFixed(2);
  } else {
    price = sitePrice(row.price_map).toFixed(2);
  }

  // Skip items with no price (no MAP and no distributor pricing)
  if (price === "0.00") return "";

  const gtin = row.ean || row.upc || "";
  const mpn = row.item_number || row.gm_code || "";

  if (!gtin && !mpn) return "";

  const itemId = vehicle
    ? `${row.id}-v-${toSlug(vehicle.make)}-${toSlug(vehicle.model)}`
    : String(row.id);

  const lines = [
    "    <item>",
    `      <g:id>${escapeXml(itemId)}</g:id>`,
    `      <g:title>${title}</g:title>`,
    `      <g:description>${description}</g:description>`,
    `      <g:link>${link}</g:link>`,
    `      <g:checkout_link_template>https://ship.tires/buy/${row.id}</g:checkout_link_template>`,
    ...(imageLink ? [`      <g:image_link>${escapeXml(imageLink)}</g:image_link>`] : []),
    `      <g:price>${price} USD</g:price>`,
    `      <g:brand>${escapeXml(row.make_name)}</g:brand>`,
    `      <g:condition>new</g:condition>`,
    `      <g:availability>in_stock</g:availability>`,
    `      <g:google_product_category>${GOOGLE_CATEGORY_ID}</g:google_product_category>`,
    `      <g:product_type>${escapeXml(GOOGLE_CATEGORY)}</g:product_type>`,
  ];

  if (gtin) lines.push(`      <g:gtin>${escapeXml(gtin)}</g:gtin>`);
  if (mpn) lines.push(`      <g:mpn>${escapeXml(mpn)}</g:mpn>`);

  lines.push(`      <g:custom_label_0>${escapeXml(size)}</g:custom_label_0>`);

  const tireType = row.season || row.terrain || row.category || "";
  if (tireType) {
    lines.push(
      `      <g:custom_label_1>${escapeXml(tireType)}</g:custom_label_1>`
    );
  }

  if (vehicleName) {
    lines.push(
      `      <g:custom_label_2>${escapeXml(vehicleName)}</g:custom_label_2>`
    );
  }

  lines.push(
    "      <g:multipack>1</g:multipack>",
    "      <g:is_bundle>no</g:is_bundle>",
    "      <g:included_destination>Free_listings</g:included_destination>",
    "      <g:included_destination>Shopping_ads</g:included_destination>",
    "      <g:shipping>",
    "        <g:country>US</g:country>",
    "        <g:service>Standard</g:service>",
    "        <g:price>0 USD</g:price>",
    "      </g:shipping>",
    "    </item>"
  );

  return lines.join("\n");
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const vehicleMode = searchParams.get("vehicles") === "true";
  const defaultLimit = vehicleMode ? VEHICLE_ITEMS_PER_PAGE : ITEMS_PER_PAGE;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1") || 1);
  const limit = Math.min(
    Math.max(
      1,
      parseInt(searchParams.get("limit") || String(defaultLimit)) ||
        defaultLimit
    ),
    MAX_LIMIT
  );
  const offset = (page - 1) * limit;

  const brandsParam = searchParams.get("brands");
  const filterBrands = brandsParam
    ? brandsParam
        .split(",")
        .map((b) => b.trim())
        .filter(Boolean)
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

  let xmlItems: string;
  let itemCount: number;

  if (vehicleMode) {
    // Expand each tire into vehicle-specific listings
    const vehicleXml: string[] = [];
    const sizeCache = new Map<string, { make: string; model: string }[]>();

    for (const row of tires) {
      const size = buildSize(row);
      const key = size.toUpperCase().replace(/\s+/g, "");

      if (!sizeCache.has(key)) {
        sizeCache.set(key, getVehiclesForSize(size, 200));
      }

      const vehicles = sizeCache.get(key)!;
      for (const v of vehicles) {
        const xml = buildItemXml(row, distPricing, compPricing, v);
        if (xml) vehicleXml.push(xml);
      }
    }

    xmlItems = vehicleXml.join("\n");
    itemCount = vehicleXml.length;
  } else {
    const list = tires
      .map((row) => buildItemXml(row, distPricing, compPricing))
      .filter(Boolean);
    xmlItems = list.join("\n");
    itemCount = list.length;
  }

  const feedTitle = vehicleMode
    ? "Ship.Tires Vehicle Fitment Feed"
    : "Ship.Tires Product Feed";

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${feedTitle}</title>
    <link>https://ship.tires</link>
    <description>Shop &amp; Ship Car, Truck &amp; SUV Tires with Free Delivery. Page ${page} of ${totalPages} (${total} total tires, ${itemCount} items on this page).</description>
${xmlItems}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
      "X-Total-Products": String(total),
      "X-Page": String(page),
      "X-Total-Pages": String(totalPages),
      "X-Items-On-Page": String(itemCount),
    },
  });
}
