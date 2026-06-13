import type { TireRow } from "@/lib/db";

// ── Amazon SP-API endpoints ─────────────────────────────────
const LWA_TOKEN_URL = "https://api.amazon.com/auth/o2/token";
const SP_API_BASE = "https://sellingpartnerapi-na.amazon.com";
const US_MARKETPLACE_ID = "ATVPDKIKX0DER";

const LISTING_QUANTITY = 50;
const MAP_MARKUP = 1.15; // 15% above MAP fallback

// ── OAuth token cache ───────────────────────────────────────
let _cachedToken: { token: string; expiresAt: number } | null = null;

function getCredentials() {
  const clientId = process.env.AMAZON_SP_CLIENT_ID;
  const clientSecret = process.env.AMAZON_SP_CLIENT_SECRET;
  const refreshToken = process.env.AMAZON_SP_REFRESH_TOKEN;
  const sellerId = process.env.AMAZON_SELLER_ID;

  if (!clientId || !clientSecret) {
    throw new Error("AMAZON_SP_CLIENT_ID and AMAZON_SP_CLIENT_SECRET must be set");
  }
  if (!refreshToken) {
    throw new Error("AMAZON_SP_REFRESH_TOKEN must be set");
  }
  if (!sellerId) {
    throw new Error("AMAZON_SELLER_ID must be set");
  }

  return { clientId, clientSecret, refreshToken, sellerId };
}

function getSellerId(): string {
  const sellerId = process.env.AMAZON_SELLER_ID;
  if (!sellerId) throw new Error("AMAZON_SELLER_ID must be set");
  return sellerId;
}

function getMarketplaceId(): string {
  return process.env.AMAZON_MARKETPLACE_ID || US_MARKETPLACE_ID;
}

/** Get LWA access token with automatic caching and refresh */
export async function getAccessToken(): Promise<string> {
  if (_cachedToken && Date.now() < _cachedToken.expiresAt) {
    return _cachedToken.token;
  }

  const { clientId, clientSecret, refreshToken } = getCredentials();

  const res = await fetch(LWA_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Amazon LWA OAuth ${res.status}: ${text}`);
  }

  const data = await res.json();
  _cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 300) * 1000,
  };

  return _cachedToken.token;
}

// ── Rate limiter ────────────────────────────────────────────
const RATE_LIMIT_MS = 100;
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
async function spApiFetch<T>(
  path: string,
  options: { method?: string; body?: unknown; query?: Record<string, string> } = {}
): Promise<T> {
  await waitForSlot();
  const token = await getAccessToken();

  let url = `${SP_API_BASE}${path}`;
  if (options.query) {
    const params = new URLSearchParams(options.query);
    url += `?${params.toString()}`;
  }

  const res = await fetch(url, {
    method: options.method || "GET",
    headers: {
      "x-amz-access-token": token,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Amazon SP-API ${res.status}: ${text}`);
  }

  if (res.status === 204) return {} as T;

  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return res.json() as Promise<T>;
  }
  return {} as T;
}

// ── Listings API ────────────────────────────────────────────

export interface AmazonListingPatch {
  productType: string;
  patches: Array<{
    op: "add" | "replace" | "delete";
    path: string;
    value?: unknown[];
  }>;
}

export interface AmazonListingResponse {
  sku: string;
  status: string;
  submissionId: string;
  issues?: Array<{ code: string; message: string; severity: string }>;
}

/** PUT create or update a listing via Listings API */
export function createOrUpdateListing(
  sku: string,
  listing: AmazonListingPatch
): Promise<AmazonListingResponse> {
  const sellerId = getSellerId();
  const marketplaceId = getMarketplaceId();
  return spApiFetch<AmazonListingResponse>(
    `/listings/2021-08-01/items/${encodeURIComponent(sellerId)}/${encodeURIComponent(sku)}`,
    {
      method: "PUT",
      query: { marketplaceIds: marketplaceId },
      body: listing,
    }
  );
}

/** PATCH update inventory quantity */
export function updateInventory(
  sku: string,
  quantity: number
): Promise<AmazonListingResponse> {
  const sellerId = getSellerId();
  const marketplaceId = getMarketplaceId();
  return spApiFetch<AmazonListingResponse>(
    `/listings/2021-08-01/items/${encodeURIComponent(sellerId)}/${encodeURIComponent(sku)}`,
    {
      method: "PATCH",
      query: { marketplaceIds: marketplaceId },
      body: {
        productType: "AUTO_TIRES",
        patches: [
          {
            op: "replace",
            path: "/attributes/fulfillment_availability",
            value: [
              {
                fulfillment_channel_code: "DEFAULT",
                quantity,
              },
            ],
          },
        ],
      },
    }
  );
}

/** PATCH update price */
export function updatePrice(
  sku: string,
  price: number
): Promise<AmazonListingResponse> {
  const sellerId = getSellerId();
  const marketplaceId = getMarketplaceId();
  return spApiFetch<AmazonListingResponse>(
    `/listings/2021-08-01/items/${encodeURIComponent(sellerId)}/${encodeURIComponent(sku)}`,
    {
      method: "PATCH",
      query: { marketplaceIds: marketplaceId },
      body: {
        productType: "AUTO_TIRES",
        patches: [
          {
            op: "replace",
            path: "/attributes/purchasable_offer",
            value: [
              {
                marketplace_id: marketplaceId,
                currency: "USD",
                our_price: [{ schedule: [{ value_with_tax: price.toFixed(2) }] }],
              },
            ],
          },
        ],
      },
    }
  );
}

/** DELETE a listing */
export function deleteListing(sku: string): Promise<AmazonListingResponse> {
  const sellerId = getSellerId();
  const marketplaceId = getMarketplaceId();
  return spApiFetch<AmazonListingResponse>(
    `/listings/2021-08-01/items/${encodeURIComponent(sellerId)}/${encodeURIComponent(sku)}`,
    {
      method: "DELETE",
      query: { marketplaceIds: marketplaceId },
    }
  );
}

// ── Catalog Items API — ASIN lookup by GTIN ─────────────────

interface CatalogItem {
  asin: string;
  summaries?: Array<{ marketplaceId: string; itemName: string }>;
}

interface CatalogSearchResponse {
  numberOfResults: number;
  items: CatalogItem[];
}

/** Search Amazon catalog by UPC/EAN to find matching ASIN */
export async function searchCatalogByGtin(gtin: string): Promise<string | null> {
  try {
    const marketplaceId = getMarketplaceId();
    const result = await spApiFetch<CatalogSearchResponse>(
      "/catalog/2022-04-01/items",
      {
        query: {
          identifiers: gtin,
          identifiersType: "UPC",
          marketplaceIds: marketplaceId,
          includedData: "summaries",
        },
      }
    );
    if (result.items && result.items.length > 0) {
      return result.items[0].asin;
    }

    // Try EAN if UPC didn't match
    const eanResult = await spApiFetch<CatalogSearchResponse>(
      "/catalog/2022-04-01/items",
      {
        query: {
          identifiers: gtin,
          identifiersType: "EAN",
          marketplaceIds: marketplaceId,
          includedData: "summaries",
        },
      }
    );
    if (eanResult.items && eanResult.items.length > 0) {
      return eanResult.items[0].asin;
    }

    return null;
  } catch (e) {
    console.warn(`[amazon] catalog lookup failed for GTIN ${gtin}:`, e);
    return null;
  }
}

// ── Product Pricing API — competitor prices ─────────────────

interface CompetitivePriceData {
  ASIN: string;
  Product: {
    CompetitivePricing: {
      CompetitivePrices: Array<{
        condition: string;
        Price: {
          LandedPrice?: { Amount: number; CurrencyCode: string };
          ListingPrice: { Amount: number; CurrencyCode: string };
        };
      }>;
    };
  };
}

interface CompetitivePricingResponse {
  payload: CompetitivePriceData[];
}

/** Get competitive price for an ASIN */
export async function getCompetitivePrice(tire: TireRow): Promise<number | null> {
  const gtin = tire.ean || tire.upc;
  if (!gtin) return null;

  try {
    const asin = await searchCatalogByGtin(gtin);
    if (!asin) return null;

    const marketplaceId = getMarketplaceId();
    const result = await spApiFetch<CompetitivePricingResponse>(
      "/products/pricing/v0/competitivePrice",
      {
        query: {
          MarketplaceId: marketplaceId,
          Asins: asin,
          ItemType: "Asin",
        },
      }
    );

    if (!result.payload || result.payload.length === 0) return null;

    const prices: number[] = [];
    for (const item of result.payload) {
      for (const cp of item.Product.CompetitivePricing.CompetitivePrices) {
        if (cp.condition !== "New") continue;
        const price = cp.Price.LandedPrice?.Amount ?? cp.Price.ListingPrice.Amount;
        if (price > 0) prices.push(price);
      }
    }

    if (prices.length === 0) return null;
    return Math.min(...prices);
  } catch (e) {
    console.warn(`[amazon] competitive price lookup failed:`, e);
    return null;
  }
}

// ── Tire → Amazon mapping ───────────────────────────────────

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

function buildTitle(tire: TireRow): string {
  const parts = [tire.make_name, tire.model_name];
  if (tire.width && tire.aspect_ratio && tire.rim_size) {
    parts.push(`${tire.width}/${tire.aspect_ratio}R${tire.rim_size}`);
  }
  if (tire.load_rating) parts.push(tire.load_rating);
  if (tire.speed_rating) parts.push(tire.speed_rating);
  if (tire.season) parts.push(tire.season);

  let title = parts.join(" ");
  // Amazon allows 200 chars
  if (title.length > 200) {
    title = title.substring(0, 197) + "...";
  }
  return title;
}

function buildDescription(tire: TireRow): string {
  const parts = [`${tire.make_name} ${tire.model_name}`];
  if (tire.width && tire.aspect_ratio && tire.rim_size) {
    parts.push(`Size: ${tire.width}/${tire.aspect_ratio}R${tire.rim_size}`);
  }
  if (tire.season) parts.push(`Season: ${tire.season}`);
  if (tire.terrain) parts.push(`Terrain: ${tire.terrain}`);
  if (tire.load_rating && tire.speed_rating) {
    parts.push(`Load/Speed: ${tire.load_rating}${tire.speed_rating}`);
  }
  if (tire.warranty) parts.push(`Warranty: ${tire.warranty}`);
  parts.push("Free shipping. Sold individually (1 tire).");
  return parts.join(". ");
}

function calculatePrice(tire: TireRow, competitivePrice: number | null): number {
  const mapPrice = tire.price_map ?? 0;
  const fallback = mapPrice * MAP_MARKUP;

  if (competitivePrice !== null && competitivePrice > 0) {
    const competitive = competitivePrice - 0.01;
    if (competitive >= mapPrice) {
      return Math.min(competitive, fallback);
    }
    return fallback;
  }

  return fallback;
}

export function tireToSku(tire: TireRow): string {
  return `ST-${tire.id}`;
}

/** Map a TireRow to an Amazon listing PUT body */
export function tireToAmazonListing(
  tire: TireRow,
  competitivePrice?: number | null
): { listing: AmazonListingPatch; price: number } | null {
  const imageUrl = resolveImageUrl(tire);
  if (!imageUrl) return null;

  const gtin = tire.ean || tire.upc;
  const mpn = tire.item_number || tire.gm_code;
  if (!gtin && !mpn) return null;

  const price = calculatePrice(tire, competitivePrice ?? null);
  if (price <= 0) return null;

  const title = buildTitle(tire);
  const description = buildDescription(tire);
  const marketplaceId = getMarketplaceId();

  // Build listing patches
  const patches: AmazonListingPatch["patches"] = [
    {
      op: "add",
      path: "/attributes/item_name",
      value: [{ value: title, marketplace_id: marketplaceId }],
    },
    {
      op: "add",
      path: "/attributes/brand",
      value: [{ value: tire.make_name }],
    },
    {
      op: "add",
      path: "/attributes/product_description",
      value: [{ value: description, marketplace_id: marketplaceId }],
    },
    {
      op: "add",
      path: "/attributes/condition_type",
      value: [{ value: "new_new" }],
    },
    {
      op: "add",
      path: "/attributes/fulfillment_availability",
      value: [
        {
          fulfillment_channel_code: "DEFAULT",
          quantity: LISTING_QUANTITY,
        },
      ],
    },
    {
      op: "add",
      path: "/attributes/purchasable_offer",
      value: [
        {
          marketplace_id: marketplaceId,
          currency: "USD",
          our_price: [{ schedule: [{ value_with_tax: price.toFixed(2) }] }],
        },
      ],
    },
    {
      op: "add",
      path: "/attributes/main_product_image_locator",
      value: [{ media_location: imageUrl }],
    },
  ];

  // Product identifier
  if (tire.upc) {
    patches.push({
      op: "add",
      path: "/attributes/externally_assigned_product_identifier",
      value: [{ type: "upc", value: tire.upc }],
    });
  } else if (tire.ean) {
    patches.push({
      op: "add",
      path: "/attributes/externally_assigned_product_identifier",
      value: [{ type: "ean", value: tire.ean }],
    });
  }

  // MPN
  if (mpn) {
    patches.push({
      op: "add",
      path: "/attributes/manufacturer_part_number",
      value: [{ value: mpn }],
    });
  }

  // Tire-specific attributes
  if (tire.width && tire.aspect_ratio && tire.rim_size) {
    patches.push({
      op: "add",
      path: "/attributes/tire_size",
      value: [{ value: `${tire.width}/${tire.aspect_ratio}R${tire.rim_size}` }],
    });
    patches.push({
      op: "add",
      path: "/attributes/section_width",
      value: [{ value: `${tire.width}`, unit: "millimeters" }],
    });
    patches.push({
      op: "add",
      path: "/attributes/aspect_ratio",
      value: [{ value: tire.aspect_ratio }],
    });
    patches.push({
      op: "add",
      path: "/attributes/rim_diameter",
      value: [{ value: `${tire.rim_size}`, unit: "inches" }],
    });
  }

  if (tire.speed_rating) {
    patches.push({
      op: "add",
      path: "/attributes/speed_rating",
      value: [{ value: tire.speed_rating }],
    });
  }

  if (tire.load_rating) {
    patches.push({
      op: "add",
      path: "/attributes/load_index",
      value: [{ value: tire.load_rating }],
    });
  }

  if (tire.season) {
    patches.push({
      op: "add",
      path: "/attributes/tire_season",
      value: [{ value: tire.season }],
    });
  }

  const listing: AmazonListingPatch = {
    productType: "AUTO_TIRES",
    patches,
  };

  return { listing, price };
}
