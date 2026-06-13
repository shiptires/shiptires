import type { TireRow } from "@/lib/db";

// ── eBay API endpoints ──────────────────────────────────────
const EBAY_API = "https://api.ebay.com";
const TOKEN_URL = `${EBAY_API}/identity/v1/oauth2/token`;
const INVENTORY_URL = `${EBAY_API}/sell/inventory/v1`;
const OFFER_URL = `${EBAY_API}/sell/inventory/v1/offer`;
const BROWSE_URL = `${EBAY_API}/buy/browse/v1`;

const EBAY_CATEGORY_ID = "179680"; // Car & Truck Tires
const LISTING_QUANTITY = 50;
const MAP_MARKUP = 1.15; // 15% above MAP fallback

// ── OAuth token cache ───────────────────────────────────────
let _cachedToken: { token: string; expiresAt: number } | null = null;

function getCredentials() {
  const clientId = process.env.EBAY_CLIENT_ID;
  const clientSecret = process.env.EBAY_CLIENT_SECRET;
  const refreshToken = process.env.EBAY_REFRESH_TOKEN;

  if (!clientId || !clientSecret) {
    throw new Error("EBAY_CLIENT_ID and EBAY_CLIENT_SECRET must be set");
  }
  if (!refreshToken) {
    throw new Error("EBAY_REFRESH_TOKEN must be set");
  }

  return { clientId, clientSecret, refreshToken };
}

export async function getAccessToken(): Promise<string> {
  if (_cachedToken && Date.now() < _cachedToken.expiresAt) {
    return _cachedToken.token;
  }

  const { clientId, clientSecret, refreshToken } = getCredentials();
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      scope: [
        "https://api.ebay.com/oauth/api_scope/sell.inventory",
        "https://api.ebay.com/oauth/api_scope/sell.account",
        "https://api.ebay.com/oauth/api_scope/buy.browse",
      ].join(" "),
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`eBay OAuth ${res.status}: ${text}`);
  }

  const data = await res.json();
  _cachedToken = {
    token: data.access_token,
    // Expire 5 min early to avoid edge cases
    expiresAt: Date.now() + (data.expires_in - 300) * 1000,
  };

  return _cachedToken.token;
}

// ── Rate limiter (simple delay between calls) ───────────────
const RATE_LIMIT_MS = 50; // 20 req/s — well under 2M/day
let _lastRequest = 0;

async function waitForSlot(): Promise<void> {
  const now = Date.now();
  const elapsed = now - _lastRequest;
  if (elapsed < RATE_LIMIT_MS) {
    await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_MS - elapsed));
  }
  _lastRequest = Date.now();
}

// ── Core fetch wrapper ──────────────────────────────────────
async function ebayFetch<T>(
  url: string,
  options: { method?: string; body?: unknown } = {}
): Promise<T> {
  await waitForSlot();
  const token = await getAccessToken();

  const res = await fetch(url, {
    method: options.method || "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`eBay ${res.status}: ${text}`);
  }

  // Some eBay endpoints return 204 with no body
  if (res.status === 204) return {} as T;

  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return res.json() as Promise<T>;
  }
  return {} as T;
}

// ── Inventory API ───────────────────────────────────────────

export interface EbayInventoryItem {
  availability: {
    shipToLocationAvailability: {
      quantity: number;
    };
  };
  condition: string;
  product: {
    title: string;
    description: string;
    aspects: Record<string, string[]>;
    brand: string;
    mpn?: string;
    imageUrls: string[];
    upc?: string[];
    ean?: string[];
  };
}

export interface EbayOffer {
  sku: string;
  marketplaceId: string;
  format: string;
  listingDescription: string;
  availableQuantity: number;
  categoryId: string;
  merchantLocationKey: string;
  pricingSummary: {
    price: { value: string; currency: string };
  };
  listingPolicies: {
    fulfillmentPolicyId: string;
    paymentPolicyId: string;
    returnPolicyId: string;
  };
}

export interface OfferResponse {
  offerId: string;
  statusCode: number;
  errors?: Array<{ errorId: number; message: string }>;
}

export interface BulkOfferResponse {
  responses: OfferResponse[];
}

export interface BulkPublishResponse {
  responses: Array<{
    statusCode: number;
    listingId?: string;
    offerId: string;
    errors?: Array<{ errorId: number; message: string }>;
  }>;
}

/** PUT a single inventory item (create or replace) */
export function createOrReplaceInventoryItem(
  sku: string,
  item: EbayInventoryItem
): Promise<Record<string, unknown>> {
  return ebayFetch(`${INVENTORY_URL}/inventory_item/${encodeURIComponent(sku)}`, {
    method: "PUT",
    body: item,
  });
}

/** DELETE a single inventory item */
export function deleteInventoryItem(sku: string): Promise<Record<string, unknown>> {
  return ebayFetch(`${INVENTORY_URL}/inventory_item/${encodeURIComponent(sku)}`, {
    method: "DELETE",
  });
}

/** GET existing offers for a SKU */
export function getOffers(sku: string): Promise<{
  total: number;
  offers: Array<{ offerId: string; status: string; sku: string }>;
}> {
  return ebayFetch(`${OFFER_URL}?sku=${encodeURIComponent(sku)}`);
}

/** POST create a single offer */
export function createOffer(offer: EbayOffer): Promise<{ offerId: string }> {
  return ebayFetch(`${OFFER_URL}`, {
    method: "POST",
    body: offer,
  });
}

/** POST bulk create up to 25 offers */
export function bulkCreateOffer(
  requests: Array<{ sku: string; offer: EbayOffer }>
): Promise<BulkOfferResponse> {
  return ebayFetch(`${OFFER_URL}/bulk_create_offer`, {
    method: "POST",
    body: { requests: requests.map((r) => r.offer) },
  });
}

/** POST publish a single offer */
export function publishOffer(offerId: string): Promise<{ listingId: string }> {
  return ebayFetch(`${OFFER_URL}/${offerId}/publish`, {
    method: "POST",
  });
}

/** POST bulk publish up to 25 offers */
export function bulkPublishOffer(
  offerIds: string[]
): Promise<BulkPublishResponse> {
  return ebayFetch(`${OFFER_URL}/bulk_publish_offer`, {
    method: "POST",
    body: {
      requests: offerIds.map((id) => ({ offerId: id })),
    },
  });
}

// ── Browse API — competitor pricing ─────────────────────────

interface BrowseItemSummary {
  price?: { value: string; currency: string };
  condition?: string;
}

interface BrowseSearchResponse {
  total: number;
  itemSummaries?: BrowseItemSummary[];
}

/** Search eBay by GTIN to find competitor prices */
export async function searchByGtin(gtin: string): Promise<BrowseSearchResponse> {
  const params = new URLSearchParams({
    gtin,
    filter: "conditionIds:{1000}", // New condition only
    limit: "50",
  });
  return ebayFetch<BrowseSearchResponse>(
    `${BROWSE_URL}/item_summary/search?${params.toString()}`
  );
}

/** Look up market price for a tire — returns lowest competitor price or null */
export async function getCompetitivePrice(tire: TireRow): Promise<number | null> {
  const gtin = tire.ean || tire.upc;
  if (!gtin) return null;

  try {
    const result = await searchByGtin(gtin);
    if (!result.itemSummaries || result.itemSummaries.length === 0) return null;

    const prices = result.itemSummaries
      .filter((item) => item.price && item.price.currency === "USD")
      .map((item) => parseFloat(item.price!.value))
      .filter((p) => p > 0 && !isNaN(p));

    if (prices.length === 0) return null;
    return Math.min(...prices);
  } catch (e) {
    console.warn(`[ebay] competitive price lookup failed for GTIN ${gtin}:`, e);
    return null;
  }
}

// ── Tire → eBay mapping ─────────────────────────────────────

function resolveImageUrl(row: TireRow): string | null {
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

function buildEbayTitle(tire: TireRow): string {
  const parts = [tire.make_name, tire.model_name];

  if (tire.width && tire.aspect_ratio && tire.rim_size) {
    parts.push(`${tire.width}/${tire.aspect_ratio}R${tire.rim_size}`);
  }
  if (tire.load_rating) parts.push(tire.load_rating);
  if (tire.speed_rating) parts.push(tire.speed_rating);

  // eBay title max 80 chars
  let title = parts.join(" ");
  if (title.length > 80) {
    title = title.substring(0, 77) + "...";
  }
  return title;
}

function buildEbayDescription(tire: TireRow): string {
  const lines: string[] = [];
  lines.push(`<h2>${tire.make_name} ${tire.model_name}</h2>`);

  if (tire.width && tire.aspect_ratio && tire.rim_size) {
    lines.push(`<p><strong>Size:</strong> ${tire.width}/${tire.aspect_ratio}R${tire.rim_size}</p>`);
  }
  if (tire.season) lines.push(`<p><strong>Season:</strong> ${tire.season}</p>`);
  if (tire.terrain) lines.push(`<p><strong>Terrain:</strong> ${tire.terrain}</p>`);
  if (tire.load_rating) lines.push(`<p><strong>Load Index:</strong> ${tire.load_rating}</p>`);
  if (tire.speed_rating) lines.push(`<p><strong>Speed Rating:</strong> ${tire.speed_rating}</p>`);
  if (tire.ply_rating) lines.push(`<p><strong>Ply Rating:</strong> ${tire.ply_rating}</p>`);
  if (tire.load_range) lines.push(`<p><strong>Load Range:</strong> ${tire.load_range}</p>`);
  if (tire.tread_depth) lines.push(`<p><strong>Tread Depth:</strong> ${tire.tread_depth}</p>`);
  if (tire.utqg) lines.push(`<p><strong>UTQG:</strong> ${tire.utqg}</p>`);
  if (tire.warranty) lines.push(`<p><strong>Warranty:</strong> ${tire.warranty}</p>`);

  const features: string[] = [];
  if (tire.run_flat) features.push("Run-Flat");
  if (tire.three_pmsf) features.push("3PMSF (3-Peak Mountain Snowflake)");
  if (tire.mud_and_snow) features.push("M+S (Mud and Snow)");
  if (tire.studdable) features.push("Studdable");
  if (features.length > 0) {
    lines.push(`<p><strong>Features:</strong> ${features.join(", ")}</p>`);
  }

  lines.push("<p>Free shipping. Sold individually (1 tire per listing).</p>");

  return lines.join("\n");
}

function calculatePrice(tire: TireRow, competitivePrice: number | null): number {
  const mapPrice = tire.price_map ?? 0;
  const fallback = mapPrice * MAP_MARKUP;

  if (competitivePrice !== null && competitivePrice > 0) {
    // Match lowest competitor minus a penny, but don't go below MAP
    const competitive = competitivePrice - 0.01;
    if (competitive >= mapPrice) {
      return Math.min(competitive, fallback);
    }
    // Competitor is below MAP — use MAP + markup
    return fallback;
  }

  return fallback;
}

export function tireToSku(tire: TireRow): string {
  return `ST-${tire.id}`;
}

/** Map a TireRow to eBay inventory item shape */
export function tireToEbayItem(
  tire: TireRow,
  competitivePrice?: number | null
): { item: EbayInventoryItem; offer: Omit<EbayOffer, "merchantLocationKey" | "listingPolicies">; price: number } | null {
  const imageUrl = resolveImageUrl(tire);
  if (!imageUrl) return null;

  const gtin = tire.ean || tire.upc;
  const mpn = tire.item_number || tire.gm_code;
  if (!gtin && !mpn) return null;

  const price = calculatePrice(tire, competitivePrice ?? null);
  if (price <= 0) return null;

  const sku = tireToSku(tire);
  const title = buildEbayTitle(tire);
  const description = buildEbayDescription(tire);

  // Build aspects (item specifics)
  const aspects: Record<string, string[]> = {
    Brand: [tire.make_name],
  };
  if (tire.width) aspects["Section Width"] = [`${tire.width}mm`];
  if (tire.aspect_ratio) aspects["Aspect Ratio"] = [tire.aspect_ratio];
  if (tire.rim_size) aspects["Rim Diameter"] = [`${tire.rim_size}`];
  if (tire.width && tire.aspect_ratio && tire.rim_size) {
    aspects["Tire Size"] = [`${tire.width}/${tire.aspect_ratio}R${tire.rim_size}`];
  }
  if (tire.load_rating) aspects["Load Index"] = [tire.load_rating];
  if (tire.speed_rating) aspects["Speed Rating"] = [tire.speed_rating];
  if (tire.season) aspects["Type"] = [tire.season];
  if (tire.terrain) aspects["Performance Category"] = [tire.terrain];
  if (tire.ply_rating) aspects["Ply Rating"] = [tire.ply_rating];
  if (tire.load_range) aspects["Load Range"] = [tire.load_range];

  const product: EbayInventoryItem["product"] = {
    title,
    description,
    aspects,
    brand: tire.make_name,
    imageUrls: [imageUrl],
  };

  if (mpn) product.mpn = mpn;
  if (tire.ean) product.ean = [tire.ean];
  if (tire.upc) product.upc = [tire.upc];

  const item: EbayInventoryItem = {
    availability: {
      shipToLocationAvailability: {
        quantity: LISTING_QUANTITY,
      },
    },
    condition: "NEW",
    product,
  };

  const offer = {
    sku,
    marketplaceId: "EBAY_US",
    format: "FIXED_PRICE",
    listingDescription: description,
    availableQuantity: LISTING_QUANTITY,
    categoryId: EBAY_CATEGORY_ID,
    pricingSummary: {
      price: {
        value: price.toFixed(2),
        currency: "USD",
      },
    },
  };

  return { item, offer, price };
}

/** Build a full EbayOffer with policies for creating on eBay */
export function buildFullOffer(
  partialOffer: Omit<EbayOffer, "merchantLocationKey" | "listingPolicies">
): EbayOffer {
  const locationKey = process.env.EBAY_LOCATION_KEY;
  const fulfillmentPolicyId = process.env.EBAY_FULFILLMENT_POLICY_ID;
  const paymentPolicyId = process.env.EBAY_PAYMENT_POLICY_ID;
  const returnPolicyId = process.env.EBAY_RETURN_POLICY_ID;

  if (!locationKey || !fulfillmentPolicyId || !paymentPolicyId || !returnPolicyId) {
    throw new Error(
      "EBAY_LOCATION_KEY, EBAY_FULFILLMENT_POLICY_ID, EBAY_PAYMENT_POLICY_ID, and EBAY_RETURN_POLICY_ID must be set"
    );
  }

  return {
    ...partialOffer,
    merchantLocationKey: locationKey,
    listingPolicies: {
      fulfillmentPolicyId,
      paymentPolicyId,
      returnPolicyId,
    },
  };
}
