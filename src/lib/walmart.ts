import type { TireRow } from "@/lib/db";

// ── Walmart Marketplace API endpoints ───────────────────────
const WM_API_BASE = "https://marketplace.walmartapis.com";
const WM_TOKEN_URL = `${WM_API_BASE}/v3/token`;

const LISTING_QUANTITY = 50;
const MAP_MARKUP = 1.15; // 15% above MAP fallback

// ── OAuth token cache ───────────────────────────────────────
let _cachedToken: { token: string; expiresAt: number } | null = null;

function getCredentials() {
  const clientId = process.env.WALMART_CLIENT_ID;
  const clientSecret = process.env.WALMART_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("WALMART_CLIENT_ID and WALMART_CLIENT_SECRET must be set");
  }

  return { clientId, clientSecret };
}

/** Get Walmart access token via client credentials flow */
export async function getAccessToken(): Promise<string> {
  if (_cachedToken && Date.now() < _cachedToken.expiresAt) {
    return _cachedToken.token;
  }

  const { clientId, clientSecret } = getCredentials();
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch(WM_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      "WM_SVC.NAME": "Ship.Tires",
      "WM_QOS.CORRELATION_ID": crypto.randomUUID(),
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Walmart OAuth ${res.status}: ${text}`);
  }

  const data = await res.json();
  _cachedToken = {
    token: data.access_token,
    // Walmart tokens last ~900s, expire 5 min early
    expiresAt: Date.now() + ((data.expires_in || 900) - 300) * 1000,
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
async function walmartFetch<T>(
  path: string,
  options: { method?: string; body?: unknown; contentType?: string } = {}
): Promise<T> {
  await waitForSlot();
  const token = await getAccessToken();

  const headers: Record<string, string> = {
    Authorization: `Basic ${token}`,
    "WM_SEC.ACCESS_TOKEN": token,
    "WM_SVC.NAME": "Ship.Tires",
    "WM_QOS.CORRELATION_ID": crypto.randomUUID(),
    Accept: "application/json",
  };

  if (options.body) {
    headers["Content-Type"] = options.contentType || "application/json";
  }

  const res = await fetch(`${WM_API_BASE}${path}`, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Walmart ${res.status}: ${text}`);
  }

  if (res.status === 204) return {} as T;

  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return res.json() as Promise<T>;
  }
  return {} as T;
}

// ── Items API ───────────────────────────────────────────────

export interface WalmartItem {
  sku: string;
  productIdentifiers: Array<{
    productIdType: string;
    productId: string;
  }>;
  productName: string;
  brand: string;
  price: number;
  currency: string;
  ShippingWeight: number;
  ShippingWeightUnit: string;
  shortDescription: string;
  mainImageUrl: string;
  productCategory: string;
  condition: string;
  additionalAttributes?: Record<string, string>;
}

export interface WalmartFeedResponse {
  feedId: string;
  additionalAttributes?: unknown;
  errors?: Array<{ code: string; description: string }>;
}

export interface WalmartItemResponse {
  sku: string;
  publishedStatus?: string;
  lifecycleStatus?: string;
  errors?: Array<{ code: string; description: string }>;
}

/** Submit items feed (MP_ITEM spec) */
export function createItem(item: WalmartItem): Promise<WalmartFeedResponse> {
  // Walmart uses a feed-based approach with MP_ITEM_MATCH or MP_ITEM
  const feed = {
    MPItemFeedHeader: {
      sellingChannel: "marketplace",
      processMode: "REPLACE",
      locale: "en",
      version: "4.7",
    },
    MPItem: [
      {
        sku: item.sku,
        productIdentifiers: item.productIdentifiers,
        MPProduct: {
          productName: item.productName,
          brand: item.brand,
          shortDescription: item.shortDescription,
          mainImageUrl: item.mainImageUrl,
          productCategory: item.productCategory,
          condition: item.condition,
          additionalProductAttributes: item.additionalAttributes
            ? Object.entries(item.additionalAttributes).map(([name, value]) => ({
                productAttributeName: name,
                productAttributeValue: value,
              }))
            : undefined,
        },
        MPOffer: {
          price: item.price,
          currency: item.currency,
          ShippingWeight: item.ShippingWeight,
          ShippingWeightUnit: item.ShippingWeightUnit,
          fulfillmentType: "SELLER",
        },
      },
    ],
  };

  return walmartFetch<WalmartFeedResponse>("/v3/feeds?feedType=MP_ITEM", {
    method: "POST",
    body: feed,
  });
}

/** Bulk item feed — submit multiple items at once */
export function bulkItemFeed(items: WalmartItem[]): Promise<WalmartFeedResponse> {
  const feed = {
    MPItemFeedHeader: {
      sellingChannel: "marketplace",
      processMode: "REPLACE",
      locale: "en",
      version: "4.7",
    },
    MPItem: items.map((item) => ({
      sku: item.sku,
      productIdentifiers: item.productIdentifiers,
      MPProduct: {
        productName: item.productName,
        brand: item.brand,
        shortDescription: item.shortDescription,
        mainImageUrl: item.mainImageUrl,
        productCategory: item.productCategory,
        condition: item.condition,
        additionalProductAttributes: item.additionalAttributes
          ? Object.entries(item.additionalAttributes).map(([name, value]) => ({
              productAttributeName: name,
              productAttributeValue: value,
            }))
          : undefined,
      },
      MPOffer: {
        price: item.price,
        currency: item.currency,
        ShippingWeight: item.ShippingWeight,
        ShippingWeightUnit: item.ShippingWeightUnit,
        fulfillmentType: "SELLER",
      },
    })),
  };

  return walmartFetch<WalmartFeedResponse>("/v3/feeds?feedType=MP_ITEM", {
    method: "POST",
    body: feed,
  });
}

// ── Inventory API ───────────────────────────────────────────

export function updateInventory(
  sku: string,
  quantity: number
): Promise<Record<string, unknown>> {
  return walmartFetch(`/v3/inventory?sku=${encodeURIComponent(sku)}`, {
    method: "PUT",
    body: {
      sku,
      quantity: {
        unit: "EACH",
        amount: quantity,
      },
    },
  });
}

// ── Price API ───────────────────────────────────────────────

export function updatePrice(
  sku: string,
  price: number,
  currency = "USD"
): Promise<Record<string, unknown>> {
  return walmartFetch("/v3/price", {
    method: "PUT",
    body: {
      sku,
      pricing: [
        {
          currentPriceType: "BASE",
          currentPrice: {
            amount: price.toFixed(2),
            currency,
          },
        },
      ],
    },
  });
}

// ── Item status ─────────────────────────────────────────────

export function getItem(sku: string): Promise<WalmartItemResponse> {
  return walmartFetch(`/v3/items/${encodeURIComponent(sku)}`);
}

/** Get feed status */
export function getFeedStatus(feedId: string): Promise<{
  feedId: string;
  feedStatus: string;
  itemsReceived: number;
  itemsSucceeded: number;
  itemsFailed: number;
}> {
  return walmartFetch(`/v3/feeds/${encodeURIComponent(feedId)}`);
}

// ── Tire → Walmart mapping ──────────────────────────────────

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

  // Walmart allows up to 200 chars
  let title = parts.join(" ");
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

  const features: string[] = [];
  if (tire.run_flat) features.push("Run-Flat");
  if (tire.three_pmsf) features.push("3PMSF");
  if (tire.mud_and_snow) features.push("M+S");
  if (features.length > 0) parts.push(`Features: ${features.join(", ")}`);

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

/** Map a TireRow to Walmart item shape */
export function tireToWalmartItem(
  tire: TireRow,
  competitivePrice?: number | null
): { item: WalmartItem; price: number } | null {
  const imageUrl = resolveImageUrl(tire);
  if (!imageUrl) return null;

  const gtin = tire.upc || tire.ean;
  if (!gtin) return null; // Walmart requires UPC or EAN

  const price = calculatePrice(tire, competitivePrice ?? null);
  if (price <= 0) return null;

  const title = buildTitle(tire);
  const description = buildDescription(tire);

  // Build additional attributes for tire specifics
  const additionalAttributes: Record<string, string> = {};
  if (tire.width && tire.aspect_ratio && tire.rim_size) {
    additionalAttributes["tireSize"] = `${tire.width}/${tire.aspect_ratio}R${tire.rim_size}`;
    additionalAttributes["sectionWidth"] = `${tire.width}mm`;
    additionalAttributes["aspectRatio"] = tire.aspect_ratio;
    additionalAttributes["rimDiameter"] = `${tire.rim_size} inches`;
  }
  if (tire.speed_rating) additionalAttributes["speedRating"] = tire.speed_rating;
  if (tire.load_rating) additionalAttributes["loadIndex"] = tire.load_rating;
  if (tire.season) additionalAttributes["tireSeason"] = tire.season;
  if (tire.terrain) additionalAttributes["terrainType"] = tire.terrain;
  if (tire.item_number) additionalAttributes["manufacturerPartNumber"] = tire.item_number;

  const item: WalmartItem = {
    sku: tireToSku(tire),
    productIdentifiers: [
      {
        productIdType: tire.upc ? "UPC" : "EAN",
        productId: gtin,
      },
    ],
    productName: title,
    brand: tire.make_name,
    price,
    currency: "USD",
    ShippingWeight: parseFloat(tire.weight || "0") || 25, // Default 25 lbs for tires
    ShippingWeightUnit: "LB",
    shortDescription: description,
    mainImageUrl: imageUrl,
    productCategory: "Tires",
    condition: "New",
    additionalAttributes:
      Object.keys(additionalAttributes).length > 0 ? additionalAttributes : undefined,
  };

  return { item, price };
}
