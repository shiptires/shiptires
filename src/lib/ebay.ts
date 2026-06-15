import type { TireRow } from "@/lib/db";

// ── eBay API endpoints ──────────────────────────────────────
const EBAY_API = "https://api.ebay.com";
const TOKEN_URL = `${EBAY_API}/identity/v1/oauth2/token`;
const TRADING_API_URL = `${EBAY_API}/ws/api.dll`;
const INVENTORY_URL = `${EBAY_API}/sell/inventory/v1`;
const BROWSE_URL = `${EBAY_API}/buy/browse/v1`;

const EBAY_MOTORS_SITE_ID = "100";
const EBAY_CATEGORY_ID = "179680"; // eBay Motors > Tires
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
        "https://api.ebay.com/oauth/api_scope",
        "https://api.ebay.com/oauth/api_scope/sell.inventory",
        "https://api.ebay.com/oauth/api_scope/sell.account",
        "https://api.ebay.com/oauth/api_scope/sell.fulfillment",
        "https://api.ebay.com/oauth/api_scope/sell.marketing",
        "https://api.ebay.com/oauth/api_scope/sell.finances",
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

// ── XML helpers ─────────────────────────────────────────────
function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

interface TradingApiResult {
  ack: string;
  itemId?: string;
  errors: Array<{ code: string; message: string; severity: string }>;
  rawXml: string;
}

function parseTradingResponse(xml: string): TradingApiResult {
  const ack = xml.match(/<Ack>(\w+)<\/Ack>/)?.[1] || "Failure";
  const itemId = xml.match(/<ItemID>(\d+)<\/ItemID>/)?.[1];
  const errors: TradingApiResult["errors"] = [];
  // Extract each <Errors> block, then parse fields in any order
  const blockRegex = /<Errors>([\s\S]*?)<\/Errors>/g;
  let block: RegExpExecArray | null;
  while ((block = blockRegex.exec(xml)) !== null) {
    const b = block[1];
    const severity = b.match(/<SeverityCode>(\w+)<\/SeverityCode>/)?.[1] || "Error";
    const code = b.match(/<ErrorCode>(\d+)<\/ErrorCode>/)?.[1] || "0";
    const message =
      b.match(/<LongMessage>([\s\S]*?)<\/LongMessage>/)?.[1] ||
      b.match(/<ShortMessage>([\s\S]*?)<\/ShortMessage>/)?.[1] ||
      "Unknown error";
    errors.push({ severity, code, message });
  }
  return { ack, itemId, errors, rawXml: xml };
}

/** Call eBay Trading API (XML) */
async function tradingApiCall(
  callName: string,
  xml: string
): Promise<TradingApiResult> {
  await waitForSlot();
  const res = await fetch(TRADING_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "text/xml",
      "X-EBAY-API-COMPATIBILITY-LEVEL": "1193",
      "X-EBAY-API-CALL-NAME": callName,
      "X-EBAY-API-SITEID": EBAY_MOTORS_SITE_ID,
    },
    body: xml,
  });
  const text = await res.text();
  const parsed = parseTradingResponse(text);
  return parsed;
}

// ── Trading API — AddFixedPriceItem ─────────────────────────

export interface EbayListingInput {
  title: string;
  description: string;
  categoryId: string;
  price: string;
  quantity: number;
  imageUrl: string;
  imageUrls: string[];
  sku: string;
  itemSpecifics: Record<string, string>;
}

function buildAddItemXml(
  token: string,
  item: EbayListingInput
): string {
  const fulfillmentPolicyId = process.env.EBAY_FULFILLMENT_POLICY_ID;
  const paymentPolicyId = process.env.EBAY_PAYMENT_POLICY_ID;
  const returnPolicyId = process.env.EBAY_RETURN_POLICY_ID;

  if (!fulfillmentPolicyId || !paymentPolicyId || !returnPolicyId) {
    throw new Error(
      "EBAY_FULFILLMENT_POLICY_ID, EBAY_PAYMENT_POLICY_ID, and EBAY_RETURN_POLICY_ID must be set"
    );
  }

  const specificsXml = Object.entries(item.itemSpecifics)
    .map(
      ([name, value]) =>
        `      <NameValueList><Name>${escapeXml(name)}</Name><Value>${escapeXml(value)}</Value></NameValueList>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="utf-8"?>
<AddFixedPriceItemRequest xmlns="urn:ebay:apis:eBLBaseComponents">
  <RequesterCredentials>
    <eBayAuthToken>${token}</eBayAuthToken>
  </RequesterCredentials>
  <ErrorLanguage>en_US</ErrorLanguage>
  <WarningLevel>High</WarningLevel>
  <Item>
    <Title>${escapeXml(item.title)}</Title>
    <Description><![CDATA[${item.description}]]></Description>
    <PrimaryCategory>
      <CategoryID>${item.categoryId}</CategoryID>
    </PrimaryCategory>
    <StartPrice currencyID="USD">${item.price}</StartPrice>
    <ConditionID>1000</ConditionID>
    <Country>US</Country>
    <Currency>USD</Currency>
    <DispatchTimeMax>3</DispatchTimeMax>
    <ListingDuration>GTC</ListingDuration>
    <ListingType>FixedPriceItem</ListingType>
    <Location>Sacramento, CA 95828</Location>
    <Quantity>${item.quantity}</Quantity>
    <SKU>${escapeXml(item.sku)}</SKU>
    <PictureDetails>
${(item.imageUrls.length > 0 ? item.imageUrls : [item.imageUrl]).map((url) => `      <PictureURL>${escapeXml(url)}</PictureURL>`).join("\n")}
    </PictureDetails>
    <ItemSpecifics>
${specificsXml}
    </ItemSpecifics>
    <SellerProfiles>
      <SellerPaymentProfile>
        <PaymentProfileID>${paymentPolicyId}</PaymentProfileID>
      </SellerPaymentProfile>
      <SellerReturnProfile>
        <ReturnProfileID>${returnPolicyId}</ReturnProfileID>
      </SellerReturnProfile>
      <SellerShippingProfile>
        <ShippingProfileID>${fulfillmentPolicyId}</ShippingProfileID>
      </SellerShippingProfile>
    </SellerProfiles>
  </Item>
</AddFixedPriceItemRequest>`;
}

/** Create a new eBay listing via Trading API */
export async function addFixedPriceItem(
  item: EbayListingInput
): Promise<{ itemId: string }> {
  const token = await getAccessToken();
  const xml = buildAddItemXml(token, item);
  const result = await tradingApiCall("AddFixedPriceItem", xml);

  if (result.ack === "Failure") {
    const realErrors = result.errors.filter((e) => e.severity === "Error");
    const errMsgs = realErrors.length > 0
      ? realErrors.map((e) => `${e.code}: ${e.message}`).join("; ")
      : result.rawXml.substring(0, 500);
    throw new Error(errMsgs);
  }

  if (!result.itemId) {
    throw new Error("eBay AddFixedPriceItem returned no ItemID");
  }

  return { itemId: result.itemId };
}

// ── Trading API — GetSellerList ──────────────────────────────

export interface EbayActiveItem {
  itemId: string;
  sku: string;
  title: string;
  price: number;
  quantity: number;
  imageUrl: string;
}

export interface GetActiveListingsResult {
  items: EbayActiveItem[];
  totalPages: number;
  totalEntries: number;
}

/** Fetch active listings from eBay via Trading API GetSellerList */
export async function getActiveListings(
  page = 1,
  entriesPerPage = 50
): Promise<GetActiveListingsResult> {
  const token = await getAccessToken();
  const xml = `<?xml version="1.0" encoding="utf-8"?>
<GetSellerListRequest xmlns="urn:ebay:apis:eBLBaseComponents">
  <RequesterCredentials>
    <eBayAuthToken>${token}</eBayAuthToken>
  </RequesterCredentials>
  <ErrorLanguage>en_US</ErrorLanguage>
  <ActiveList>true</ActiveList>
  <EndTimeFrom>${new Date().toISOString()}</EndTimeFrom>
  <EndTimeTo>${new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString()}</EndTimeTo>
  <GranularityLevel>Fine</GranularityLevel>
  <Pagination>
    <EntriesPerPage>${entriesPerPage}</EntriesPerPage>
    <PageNumber>${page}</PageNumber>
  </Pagination>
  <OutputSelector>ItemID</OutputSelector>
  <OutputSelector>SKU</OutputSelector>
  <OutputSelector>Title</OutputSelector>
  <OutputSelector>SellingStatus</OutputSelector>
  <OutputSelector>Quantity</OutputSelector>
  <OutputSelector>PictureDetails</OutputSelector>
  <OutputSelector>PaginationResult</OutputSelector>
</GetSellerListRequest>`;

  const result = await tradingApiCall("GetSellerList", xml);

  if (result.ack === "Failure") {
    const realErrors = result.errors.filter((e) => e.severity === "Error");
    throw new Error(
      realErrors.map((e) => `${e.code}: ${e.message}`).join("; ") || "GetSellerList failed"
    );
  }

  // Parse items from XML
  const items: EbayActiveItem[] = [];
  const itemRegex = /<Item>([\s\S]*?)<\/Item>/g;
  let match: RegExpExecArray | null;
  while ((match = itemRegex.exec(result.rawXml)) !== null) {
    const block = match[1];
    const itemId = block.match(/<ItemID>(\d+)<\/ItemID>/)?.[1] || "";
    const sku = block.match(/<SKU>([\s\S]*?)<\/SKU>/)?.[1] || "";
    const title = block.match(/<Title>([\s\S]*?)<\/Title>/)?.[1] || "";
    const priceStr = block.match(/<CurrentPrice[^>]*>([\d.]+)<\/CurrentPrice>/)?.[1];
    const quantity = parseInt(block.match(/<Quantity>(\d+)<\/Quantity>/)?.[1] || "0");
    const imageUrl = block.match(/<PictureURL>([\s\S]*?)<\/PictureURL>/)?.[1] || "";

    if (itemId) {
      items.push({
        itemId,
        sku,
        title,
        price: priceStr ? parseFloat(priceStr) : 0,
        quantity,
        imageUrl,
      });
    }
  }

  // Parse pagination
  const totalEntries = parseInt(
    result.rawXml.match(/<TotalNumberOfEntries>(\d+)<\/TotalNumberOfEntries>/)?.[1] || "0"
  );
  const totalPages = parseInt(
    result.rawXml.match(/<TotalNumberOfPages>(\d+)<\/TotalNumberOfPages>/)?.[1] || "1"
  );

  return { items, totalPages, totalEntries };
}

// ── Trading API — EndFixedPriceItem ─────────────────────────

/** End a single eBay listing */
export async function endItem(
  itemId: string,
  reason = "NotAvailable"
): Promise<{ success: boolean }> {
  const token = await getAccessToken();
  const xml = `<?xml version="1.0" encoding="utf-8"?>
<EndFixedPriceItemRequest xmlns="urn:ebay:apis:eBLBaseComponents">
  <RequesterCredentials>
    <eBayAuthToken>${token}</eBayAuthToken>
  </RequesterCredentials>
  <ErrorLanguage>en_US</ErrorLanguage>
  <ItemID>${itemId}</ItemID>
  <EndingReason>${escapeXml(reason)}</EndingReason>
</EndFixedPriceItemRequest>`;

  const result = await tradingApiCall("EndFixedPriceItem", xml);

  if (result.ack === "Failure") {
    const realErrors = result.errors.filter((e) => e.severity === "Error");
    throw new Error(
      realErrors.map((e) => `${e.code}: ${e.message}`).join("; ") || "EndFixedPriceItem failed"
    );
  }

  return { success: true };
}

/** End multiple eBay listings */
export async function endItems(
  itemIds: string[]
): Promise<{ ended: number; errors: Array<{ itemId: string; error: string }> }> {
  let ended = 0;
  const errors: Array<{ itemId: string; error: string }> = [];

  for (const itemId of itemIds) {
    try {
      await endItem(itemId);
      ended++;
    } catch (e) {
      errors.push({ itemId, error: e instanceof Error ? e.message : "Unknown error" });
    }
  }

  return { ended, errors };
}

// ── Trading API — ReviseFixedPriceItem ──────────────────────

/** Revise the price of a single eBay listing */
export async function revisePrice(
  itemId: string,
  newPrice: number
): Promise<{ success: boolean }> {
  const token = await getAccessToken();
  const xml = `<?xml version="1.0" encoding="utf-8"?>
<ReviseFixedPriceItemRequest xmlns="urn:ebay:apis:eBLBaseComponents">
  <RequesterCredentials>
    <eBayAuthToken>${token}</eBayAuthToken>
  </RequesterCredentials>
  <ErrorLanguage>en_US</ErrorLanguage>
  <Item>
    <ItemID>${itemId}</ItemID>
    <StartPrice currencyID="USD">${newPrice.toFixed(2)}</StartPrice>
  </Item>
</ReviseFixedPriceItemRequest>`;

  const result = await tradingApiCall("ReviseFixedPriceItem", xml);

  if (result.ack === "Failure") {
    const realErrors = result.errors.filter((e) => e.severity === "Error");
    throw new Error(
      realErrors.map((e) => `${e.code}: ${e.message}`).join("; ") || "ReviseFixedPriceItem failed"
    );
  }

  return { success: true };
}

/** Revise price AND images on an existing eBay listing */
export async function reviseItemWithImages(
  itemId: string,
  newPrice: number,
  imageUrls: string[]
): Promise<{ success: boolean }> {
  const token = await getAccessToken();
  const pictureXml = imageUrls.length > 0
    ? `    <PictureDetails>\n${imageUrls.map((url) => `      <PictureURL>${escapeXml(url)}</PictureURL>`).join("\n")}\n    </PictureDetails>`
    : "";

  const xml = `<?xml version="1.0" encoding="utf-8"?>
<ReviseFixedPriceItemRequest xmlns="urn:ebay:apis:eBLBaseComponents">
  <RequesterCredentials>
    <eBayAuthToken>${token}</eBayAuthToken>
  </RequesterCredentials>
  <ErrorLanguage>en_US</ErrorLanguage>
  <Item>
    <ItemID>${itemId}</ItemID>
    <StartPrice currencyID="USD">${newPrice.toFixed(2)}</StartPrice>
${pictureXml}
  </Item>
</ReviseFixedPriceItemRequest>`;

  const result = await tradingApiCall("ReviseFixedPriceItem", xml);

  if (result.ack === "Failure") {
    const realErrors = result.errors.filter((e) => e.severity === "Error");
    throw new Error(
      realErrors.map((e) => `${e.code}: ${e.message}`).join("; ") || "ReviseFixedPriceItem failed"
    );
  }

  return { success: true };
}

/** Revise prices for multiple eBay listings */
export async function revisePrices(
  items: Array<{ itemId: string; newPrice: number }>
): Promise<{ revised: number; errors: Array<{ itemId: string; error: string }> }> {
  let revised = 0;
  const errors: Array<{ itemId: string; error: string }> = [];

  for (const { itemId, newPrice } of items) {
    try {
      await revisePrice(itemId, newPrice);
      revised++;
    } catch (e) {
      errors.push({ itemId, error: e instanceof Error ? e.message : "Unknown error" });
    }
  }

  return { revised, errors };
}

// ── Core fetch wrapper (for REST APIs) ──────────────────────
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
      "Content-Language": "en-US",
      "Accept-Language": "en-US",
      "X-EBAY-C-MARKETPLACE-ID": "EBAY_US",
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

/** Try to extract width/aspect/rim from tire name like "225/65R17" */
function parseSizeFromName(name: string): {
  width?: string;
  aspectRatio?: string;
  rimSize?: string;
} {
  const m = name.match(/(\d{3})\s*\/\s*(\d{2,3})\s*[RrZz]\s*(\d{2}(?:\.\d)?)/);
  if (m) return { width: m[1], aspectRatio: m[2], rimSize: m[3] };
  return {};
}

const R2_BASE = "https://pub-1404e52fd5554e9dac9a045b7bb89f22.r2.dev";

function resolveOneImage(src: string | null | undefined): string | null {
  if (!src || src === "FAILED") return null;
  if (src.startsWith("images/") || src.startsWith("images\\")) {
    const r2Path = src.replace(/\\/g, "/").replace(/^images\//, "");
    return `${R2_BASE}/${r2Path}`;
  }
  if (src.startsWith("http")) return src;
  return null;
}

/** Resolve all available image URLs for a tire (up to 12 for eBay) */
function resolveAllImageUrls(row: TireRow): string[] {
  const sources = [
    row.local_thumbnail,
    row.local_angle,
    row.local_front,
    row.local_side,
    row.local_side2,
    row.thumbnail_url,
    row.angle_image_url,
    row.front_image_url,
    row.side_image_url,
    row.side2_image_url,
    row.image_0100_url,
    row.image_0200_url,
    row.image_0301_url,
    row.image_0302_url,
  ];

  const urls: string[] = [];
  const seen = new Set<string>();
  for (const src of sources) {
    const url = resolveOneImage(src);
    if (url && !seen.has(url)) {
      seen.add(url);
      urls.push(url);
      if (urls.length >= 12) break; // eBay max 12 photos
    }
  }
  return urls;
}

function resolveImageUrl(row: TireRow): string | null {
  const urls = resolveAllImageUrls(row);
  return urls.length > 0 ? urls[0] : null;
}

function buildEbayTitle(tire: TireRow): string {
  const parsed = parseSizeFromName(tire.name);
  const width = tire.width || parsed.width;
  const aspectRatio = tire.aspect_ratio || parsed.aspectRatio;
  const rimSize = tire.rim_size || parsed.rimSize;

  const parts = [tire.make_name, tire.model_name];

  if (width && aspectRatio && rimSize) {
    parts.push(`${width}/${aspectRatio}R${rimSize}`);
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
  const parsed = parseSizeFromName(tire.name);
  const width = tire.width || parsed.width;
  const aspectRatio = tire.aspect_ratio || parsed.aspectRatio;
  const rimSize = tire.rim_size || parsed.rimSize;

  const lines: string[] = [];
  lines.push(`<h2>${tire.make_name} ${tire.model_name}</h2>`);

  if (width && aspectRatio && rimSize) {
    lines.push(`<p><strong>Size:</strong> ${width}/${aspectRatio}R${rimSize}</p>`);
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

/** Map a TireRow to eBay Trading API listing input */
export function tireToEbayItem(
  tire: TireRow,
  competitivePrice?: number | null
): { listing: EbayListingInput; price: number } | null {
  const imageUrls = resolveAllImageUrls(tire);
  const imageUrl = imageUrls[0] || null;
  if (!imageUrl) return null;

  const mpn = tire.item_number || tire.gm_code;
  if (!mpn && !tire.ean && !tire.upc) return null;

  const price = calculatePrice(tire, competitivePrice ?? null);
  if (price <= 0) return null;

  // Resolve size fields — fall back to parsing from name
  const parsed = parseSizeFromName(tire.name);
  const width = tire.width || parsed.width;
  const aspectRatio = tire.aspect_ratio || parsed.aspectRatio;
  const rimSize = tire.rim_size || parsed.rimSize;

  // eBay requires Aspect Ratio, Section Width, Rim Diameter for category 179680
  if (!width || !aspectRatio || !rimSize) return null;

  const sku = tireToSku(tire);
  const title = buildEbayTitle(tire);
  const description = buildEbayDescription(tire);

  // Build item specifics (eBay-required fields first)
  const itemSpecifics: Record<string, string> = {
    Brand: tire.make_name,
    Quantity: "1",
    "Section Width": `${width} mm`,
    "Aspect Ratio": aspectRatio,
    "Rim Diameter": `${rimSize} in`,
    "Tire Size": `${width}/${aspectRatio}R${rimSize}`,
  };
  if (mpn) itemSpecifics["Manufacturer Part Number"] = mpn;
  if (tire.load_rating) itemSpecifics["Load Index"] = tire.load_rating;
  if (tire.speed_rating) itemSpecifics["Speed Rating"] = tire.speed_rating;
  if (tire.season) itemSpecifics["Type"] = tire.season;
  if (tire.terrain) itemSpecifics["Performance Category"] = tire.terrain;
  if (tire.ply_rating) itemSpecifics["Ply Rating"] = tire.ply_rating;
  if (tire.load_range) itemSpecifics["Load Range"] = tire.load_range;
  if (tire.upc) itemSpecifics["UPC"] = tire.upc;
  if (tire.ean) itemSpecifics["EAN"] = tire.ean;

  const listing: EbayListingInput = {
    title,
    description,
    categoryId: EBAY_CATEGORY_ID,
    price: price.toFixed(2),
    quantity: LISTING_QUANTITY,
    imageUrl,
    imageUrls,
    sku,
    itemSpecifics,
  };

  return { listing, price };
}

