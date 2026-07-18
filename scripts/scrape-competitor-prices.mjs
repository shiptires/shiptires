/**
 * Scrape competitor prices from SimpleTire, Tires-Easy, Giga-Tires,
 * TireRack, and Discount Tire (America's Tire).
 * Matches scraped tires to our tire_id via Turso DB, upserts to Supabase competitor_prices.
 *
 * Usage:
 *   node scripts/scrape-competitor-prices.mjs --source simpletire --limit 100
 *   node scripts/scrape-competitor-prices.mjs --source tireseasy --limit 200
 *   node scripts/scrape-competitor-prices.mjs --source gigatires --limit 200
 *   node scripts/scrape-competitor-prices.mjs --source tirerack --limit 50
 *   node scripts/scrape-competitor-prices.mjs --source discounttire --limit 50
 *   node scripts/scrape-competitor-prices.mjs --source all --limit 500
 *
 * Sources:
 *   simpletire   — Uses JSON API (no browser needed, structured price data)
 *   tireseasy    — www.tires-easy.com product pages (Cloudflare protected, best-effort)
 *   gigatires    — www.giga-tires.com style pages for "starting at" prices
 *   tirerack     — www.tirerack.com (requires Puppeteer — npm install puppeteer)
 *   discounttire — www.discounttire.com / americastire.com (requires Puppeteer)
 */
import { createClient as createTursoClient } from "@libsql/client";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import * as cheerio from "cheerio";

// Optional Puppeteer — required for TireRack and Discount Tire scrapers
let puppeteer = null;
try {
  puppeteer = (await import("puppeteer")).default;
} catch {
  // Puppeteer not installed — tirerack/discounttire scrapers will be unavailable
}

// ── Config ──────────────────────────────────────────────────
const TURSO_URL = process.env.TURSO_DATABASE_URL || "libsql://shiptires-shiptires.aws-us-west-2.turso.io";
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN || "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3ODQzNzkzOTMsImlkIjoiMDE5Zjc1NGMtM2QwMS03NmZlLWI1MTctMjU5OTRmYzg4NTZhIiwia2lkIjoiNm4weWJRYk9PWEl2RlBLTWJDSTJ1N0lrREc2OWRLVzNjc2R1Yng5dDZ5WSIsInJpZCI6IjgyYzAwZDkxLWE2YzMtNGM5ZC04NDQzLTUzMjZhNGM0NDEzYyJ9.ENMwrr3gITthfhBM_CHaw3zcU2yG8JlSR3hG5gJTLV89SN7U0nQZqoUX1XRcq1CdtSv5qxsHu0kkAAPZ3RZ7Dg";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://jrzccxsakhmnbhtnusih.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpyemNjeHNha2htbmJodG51c2loIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTMyMzUxNiwiZXhwIjoyMDg0ODk5NTE2fQ.W-HmE-YHq8EMX7Ivnrb4evZ3S-X5xJDlGHR70M0Qof4";

const RATE_DELAY_MS = 1000; // 1 req/sec per site
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const turso = createTursoClient({ url: TURSO_URL, authToken: TURSO_TOKEN });
const supabase = createSupabaseClient(SUPABASE_URL, SUPABASE_KEY);

// ── Our curated brands ──────────────────────────────────────
const CURATED_BRANDS = [
  "michelin", "bridgestone", "goodyear", "continental", "pirelli", "cooper",
  "hankook", "yokohama", "toyo", "falken", "nitto", "kumho", "bfgoodrich",
  "firestone", "dunlop", "general", "nokian", "nexen", "maxxis", "uniroyal",
  "vredestein", "kenda", "mickey-thompson", "sumitomo", "federal", "hercules",
  "mastercraft", "nankang", "radar", "atturo", "delinte", "gt-radial",
];

const BRAND_DISPLAY = {
  michelin: "Michelin", bridgestone: "Bridgestone", goodyear: "Goodyear",
  continental: "Continental", pirelli: "Pirelli", cooper: "Cooper",
  hankook: "Hankook", yokohama: "Yokohama", toyo: "Toyo", falken: "Falken",
  nitto: "Nitto", kumho: "Kumho", bfgoodrich: "BFGoodrich",
  firestone: "Firestone", dunlop: "Dunlop", general: "General",
  nokian: "Nokian", nexen: "Nexen", maxxis: "Maxxis", uniroyal: "Uniroyal",
  vredestein: "Vredestein", kenda: "Kenda", "mickey-thompson": "Mickey Thompson",
  sumitomo: "Sumitomo", federal: "Federal", hercules: "Hercules",
  mastercraft: "Mastercraft", nankang: "Nankang", radar: "Radar",
  atturo: "Atturo", delinte: "Delinte", "gt-radial": "GT Radial",
};

// ── CLI args ────────────────────────────────────────────────
function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { source: "simpletire", limit: 100 };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--source" && args[i + 1]) opts.source = args[++i].toLowerCase();
    if (args[i] === "--limit" && args[i + 1]) opts.limit = parseInt(args[++i]) || 100;
  }
  return opts;
}

// ── Rate-limited fetch (only for external competitor sites) ──
let lastFetchTime = 0;

async function rateLimitedFetch(url, options = {}, retries = 3) {
  // Enforce rate limit between external requests
  const now = Date.now();
  const wait = RATE_DELAY_MS - (now - lastFetchTime);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastFetchTime = Date.now();

  const timeoutMs = options.method === "POST" ? 30000 : 15000;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const fetchOpts = {
        method: options.method || "GET",
        headers: {
          "User-Agent": USER_AGENT,
          Accept: options.accept || "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          ...options.headers,
        },
        signal: AbortSignal.timeout(timeoutMs),
      };
      if (options.body) fetchOpts.body = options.body;
      const res = await fetch(url, fetchOpts);
      if (res.status === 429) {
        const backoff = 5000 * attempt;
        console.warn(`  429 from ${url}, waiting ${backoff}ms...`);
        await new Promise((r) => setTimeout(r, backoff));
        continue;
      }
      if (res.status === 403) {
        console.warn(`  403 (Cloudflare?) from ${url}`);
        return null;
      }
      if (!res.ok) {
        console.warn(`  HTTP ${res.status} from ${url}`);
        if (attempt < retries) {
          await new Promise((r) => setTimeout(r, 3000 * attempt));
          continue;
        }
        return null;
      }
      return options.json ? await res.json() : await res.text();
    } catch (e) {
      if (attempt < retries) {
        console.warn(`  Fetch error (attempt ${attempt}): ${e.message}`);
        await new Promise((r) => setTimeout(r, 3000 * attempt));
        continue;
      }
      console.warn(`  Failed to fetch ${url}: ${e.message}`);
      return null;
    }
  }
  return null;
}

/** Fetch without rate limiting (for internal sitemaps) */
async function fetchXml(url) {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) return null;
    return await res.text();
  } catch (e) {
    console.warn(`  Failed to fetch ${url}: ${e.message}`);
    return null;
  }
}

// ── Turso matching ──────────────────────────────────────────
async function tursoQuery(sql, args, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await turso.execute({ sql, args });
    } catch (e) {
      if (attempt === retries) throw e;
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
}

/** Match by MPN (item_number) — highest confidence */
async function matchByMPN(mpn) {
  if (!mpn) return null;
  const result = await tursoQuery(
    `SELECT id, name, make_name, model_name, width, aspect_ratio, rim_size
     FROM tires WHERE item_number = ? LIMIT 1`,
    [mpn]
  );
  return result.rows.length > 0 ? result.rows[0] : null;
}

/** Match by UPC — high confidence */
async function matchByUPC(upc) {
  if (!upc) return null;
  const result = await tursoQuery(
    `SELECT id, name, make_name, model_name, width, aspect_ratio, rim_size
     FROM tires WHERE upc = ? OR ean = ? LIMIT 1`,
    [upc, upc]
  );
  return result.rows.length > 0 ? result.rows[0] : null;
}

/** Match by size + brand + model — fuzzy */
async function matchBySizeBrandModel(width, aspect, rim, brand, model) {
  if (!width || !aspect || !rim || !brand) return null;

  const result = await tursoQuery(
    `SELECT id, name, make_name, model_name, width, aspect_ratio, rim_size
     FROM tires
     WHERE UPPER(make_name) = ?
       AND CAST(width AS TEXT) = ?
       AND CAST(aspect_ratio AS TEXT) = ?
       AND CAST(rim_size AS TEXT) = ?
     LIMIT 50`,
    [brand.toUpperCase(), String(width), String(aspect), String(rim)]
  );

  if (result.rows.length === 0) return null;

  const modelSlug = toSlug(model);
  // Exact slug match
  for (const row of result.rows) {
    const dbSlug = toSlug(String(row.model_name));
    if (dbSlug === modelSlug) return row;
  }
  // Contains match
  for (const row of result.rows) {
    const dbSlug = toSlug(String(row.model_name));
    if (dbSlug.includes(modelSlug) || modelSlug.includes(dbSlug)) return row;
  }
  // Keyword overlap (need at least 2 matching words)
  const modelWords = modelSlug.split("-").filter((w) => w.length > 2);
  if (modelWords.length >= 2) {
    for (const row of result.rows) {
      const dbSlug = toSlug(String(row.model_name));
      const overlap = modelWords.filter((w) => dbSlug.includes(w)).length;
      if (overlap >= 2) return row;
    }
  }

  return null;
}

function toSlug(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function parseSize(sizeStr) {
  const m = sizeStr.match(/(\d{3})\/(\d{2,3})(?:ZR|R)(\d{2})/i);
  if (!m) return null;
  return { width: m[1], aspect: m[2], rim: m[3] };
}

// ── Get unique brand+model combos from our DB ───────────────
async function getUniqueModels(limit) {
  const result = await tursoQuery(
    `SELECT DISTINCT make_name, model_name
     FROM tires
     WHERE make_name IS NOT NULL AND model_name IS NOT NULL
       AND make_name != '' AND model_name != ''
     ORDER BY make_name, model_name`,
    []
  );

  // Filter to curated brands
  const models = result.rows
    .filter((r) => CURATED_BRANDS.includes(toSlug(String(r.make_name))))
    .map((r) => ({
      brand: toSlug(String(r.make_name)),
      model: String(r.model_name),
      displayBrand: String(r.make_name),
    }));

  // Shuffle and limit
  const shuffled = models.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, limit);
}

/** Launch headless browser (requires Puppeteer) */
async function launchBrowser() {
  if (!puppeteer) {
    console.error("  ✗ Puppeteer not installed. Run: npm install puppeteer");
    return null;
  }
  return puppeteer.launch({
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled",
    ],
    defaultViewport: { width: 1366, height: 768 },
  });
}

// ══════════════════════════════════════════════════════════════
// SimpleTire — JSON API scraper (primary source, best data)
// ══════════════════════════════════════════════════════════════
// API endpoint: GET /api/product-detail?brand={brand}-tires&productLine={model}
// Returns structured JSON with priceInCents for every tire size.
// Product lines discovered via sitemap at /sitemap/product-line.xml

async function scrapeSimpleTire(limit) {
  console.log("\n=== Scraping SimpleTire via JSON API ===\n");

  // Step 1: Discover product lines from sitemap
  console.log("Fetching product-line sitemap...");
  const xml = await fetchXml("https://simpletire.com/sitemap/product-line.xml");
  if (!xml) {
    console.error("  Could not fetch SimpleTire sitemap");
    return { scraped: 0, matched: 0, errors: 0 };
  }

  const $ = cheerio.load(xml, { xmlMode: true });
  const productLines = [];
  $("url > loc").each((_, el) => {
    const url = $(el).text().trim();
    const m = url.match(/\/brands\/([^/]+)-tires\/([^/]+)$/);
    if (m) {
      const brandSlug = m[1];
      if (CURATED_BRANDS.includes(brandSlug)) {
        productLines.push({ brand: brandSlug, model: m[2], url });
      }
    }
  });

  console.log(`  Found ${productLines.length} curated product lines in sitemap`);

  // Shuffle and limit
  const shuffled = productLines.sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, limit);

  let scraped = 0;
  let matched = 0;
  let errors = 0;

  // Step 2: Fetch pricing via API for each product line
  for (let i = 0; i < selected.length; i++) {
    const { brand, model } = selected[i];
    const apiUrl = `https://simpletire.com/api/product-detail?brand=${brand}-tires&productLine=${model}`;

    // This is the only external fetch per product line — rate limited
    const data = await rateLimitedFetch(apiUrl, {
      accept: "application/json",
      json: true,
      headers: { Referer: `https://simpletire.com/brands/${brand}-tires/${model}` },
    });

    if (!data || !data.siteProductLineAvailableSizeList) {
      console.log(`  [${i + 1}/${selected.length}] No data: ${brand} ${model}`);
      errors++;
      continue;
    }

    const rawBrand = data.siteProductLine?.brand;
    const brandDisplay = (typeof rawBrand === "object" ? rawBrand?.label : rawBrand) || BRAND_DISPLAY[brand] || brand;
    const modelName = data.siteProductLine?.name || data.siteProductLine?.productLineName || model;
    const sizes = data.siteProductLineAvailableSizeList;

    // Collect all sizes with prices
    const validSizes = sizes.filter((s) => s.priceInCents && parseInt(s.priceInCents) > 0);
    console.log(`  [${i + 1}/${selected.length}] ${brandDisplay} ${modelName}: ${validSizes.length}/${sizes.length} priced sizes`);

    if (validSizes.length === 0) continue;

    // Batch: try MPN match for all sizes in one pass (concurrent Turso queries, no rate limit)
    const matchResults = await Promise.all(
      validSizes.map(async (size) => {
        const price = parseInt(size.priceInCents) / 100;
        const sizeStr = size.size || "";
        const partNumber = size.partNumber || null;

        let dbMatch = null;
        let matchedBy = "";
        let confidence = 1.0;

        // MPN match
        if (partNumber) {
          dbMatch = await matchByMPN(partNumber);
          if (dbMatch) { matchedBy = "mpn"; confidence = 1.0; }
        }

        // Size + brand + model fallback
        if (!dbMatch && sizeStr) {
          const parsed = parseSize(sizeStr);
          if (parsed) {
            dbMatch = await matchBySizeBrandModel(parsed.width, parsed.aspect, parsed.rim, brandDisplay, modelName);
            if (dbMatch) { matchedBy = "size_brand_model"; confidence = 0.8; }
          }
        }

        return { price, sizeStr, partNumber, dbMatch, matchedBy, confidence };
      })
    );

    scraped += validSizes.length;

    // Batch upsert matched tires
    const toUpsert = matchResults.filter((r) => r.dbMatch);
    if (toUpsert.length > 0) {
      const records = toUpsert.map((r) => ({
        tire_id: Number(r.dbMatch.id),
        source: "simpletire",
        competitor_price: r.price,
        competitor_url: `https://simpletire.com/brands/${brand}-tires/${model}`,
        brand: brandDisplay,
        model: modelName,
        size: r.sizeStr,
        matched_by: r.matchedBy,
        match_confidence: r.confidence,
        active: true,
        scraped_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      // Batch upsert in chunks of 50
      for (let c = 0; c < records.length; c += 50) {
        const chunk = records.slice(c, c + 50);
        const { error } = await supabase
          .from("competitor_prices")
          .upsert(chunk, { onConflict: "source,tire_id" });

        if (error) {
          console.error(`    DB batch error: ${error.message}`);
          errors += chunk.length;
        } else {
          matched += chunk.length;
        }
      }

      console.log(`    ✓ Matched ${toUpsert.length} tires (${toUpsert.filter((r) => r.matchedBy === "mpn").length} MPN, ${toUpsert.filter((r) => r.matchedBy === "size_brand_model").length} fuzzy)`);
    }
  }

  return { scraped, matched, errors };
}

// ══════════════════════════════════════════════════════════════
// Tires-Easy — www.tires-easy.com (Cloudflare protected, HTML scraping)
// Same SAP Hybris platform as Giga-Tires.
// Product URLs: /{size}/{brand}-tires/{model}/tirecode/{code}
// Style pages: /brands/{brand}-tires/s/{model}
// ══════════════════════════════════════════════════════════════

async function scrapeTiresEasy(limit) {
  console.log("\n=== Scraping Tires-Easy ===\n");

  // Discover product URLs from PRODUCT sitemap
  console.log("Fetching product sitemap...");
  const xml = await fetchXml(
    "https://www.tires-easy.com/medias/sys_master/root/h62/h7e/12505137020958/tiresSite-PRODUCT-en-USD-0-9291984079572096371.xml"
  );
  if (!xml) {
    console.error("  Could not fetch Tires-Easy sitemap");
    return { scraped: 0, matched: 0, errors: 0 };
  }

  const $ = cheerio.load(xml, { xmlMode: true });
  const productUrls = [];
  $("url > loc").each((_, el) => {
    const url = $(el).text().trim();
    // Filter to curated brands: /{size}/{brand}-tires/{model}/tirecode/{code}
    for (const brand of CURATED_BRANDS) {
      if (url.includes(`/${brand}-tires/`)) {
        productUrls.push(url);
        break;
      }
    }
  });

  console.log(`  Found ${productUrls.length} curated product URLs`);

  // Shuffle and limit
  const shuffled = productUrls.sort(() => Math.random() - 0.5).slice(0, limit);

  let scraped = 0;
  let matched = 0;
  let errors = 0;

  for (let i = 0; i < shuffled.length; i++) {
    const url = shuffled[i];

    // Extract size, brand, model from URL pattern: /{size}/{brand}-tires/{model}/tirecode/{code}
    const urlMatch = url.match(/\/(\d{3}-\d{2,3}-\d{2})\/([^/]+)-tires\/([^/]+)\/tirecode\/(\d+)/);
    if (!urlMatch) { errors++; continue; }

    const [, sizeSlug, brandSlug, modelSlug] = urlMatch;
    const brandDisplay = BRAND_DISPLAY[brandSlug] || brandSlug;
    const sizeFormatted = sizeSlug.replace(/-/g, (_, idx) => idx === 3 ? "/" : idx === 6 ? "R" : "-");
    // e.g. "205-55-16" → "205/55R16"
    const parts = sizeSlug.split("-");
    const size = parts.length === 3 ? `${parts[0]}/${parts[1]}R${parts[2]}` : sizeSlug;

    // Try to fetch the page HTML
    const html = await rateLimitedFetch(url);
    if (!html) { errors++; continue; }

    // Check if we got Cloudflare challenge page
    if (html.includes("Just a moment...") || html.includes("challenge-platform")) {
      if (i === 0) console.warn("  ⚠ Cloudflare blocking detected — will try to parse URLs for matching only");
      // Can't get price from Cloudflare-blocked pages, but we can still
      // try to match by URL metadata and use style-page "starting at" prices
      errors++;
      continue;
    }

    // Parse product page HTML
    const product = parseTiresEasyProduct(html, url, brandDisplay, modelSlug, size);
    if (!product || product.price <= 0) {
      console.log(`  [${i + 1}/${shuffled.length}] No price: ${url}`);
      errors++;
      continue;
    }

    scraped++;

    // Match to DB
    let dbMatch = null;
    let matchedBy = "";
    let confidence = 1.0;

    if (product.mpn) {
      dbMatch = await matchByMPN(product.mpn);
      if (dbMatch) { matchedBy = "mpn"; confidence = 1.0; }
    }
    if (!dbMatch) {
      const parsed = parseSize(size);
      if (parsed) {
        dbMatch = await matchBySizeBrandModel(parsed.width, parsed.aspect, parsed.rim, brandDisplay, product.model);
        if (dbMatch) { matchedBy = "size_brand_model"; confidence = 0.8; }
      }
    }

    if (!dbMatch) continue;

    const ok = await upsertCompetitorPrice({
      tireId: Number(dbMatch.id),
      source: "tireseasy",
      price: product.price,
      url,
      brand: brandDisplay,
      model: product.model,
      size,
      matchedBy,
      confidence,
    });

    if (ok) {
      matched++;
      console.log(`  [${i + 1}/${shuffled.length}] ✓ ${brandDisplay} ${product.model} ${size} @ $${product.price} → tire_id ${dbMatch.id}`);
    }
  }

  return { scraped, matched, errors };
}

function parseTiresEasyProduct(html, url, brand, modelSlug, size) {
  const $ = cheerio.load(html);

  // Try JSON-LD
  let productData = null;
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).html());
      const prod = data["@type"] === "Product" ? data
        : Array.isArray(data) ? data.find((d) => d["@type"] === "Product")
        : data["@graph"]?.find?.((d) => d["@type"] === "Product");
      if (prod) productData = prod;
    } catch { /* ignore */ }
  });

  if (productData) {
    const price = parseFloat(productData.offers?.price || productData.offers?.lowPrice || "0");
    return {
      price,
      brand,
      model: productData.name || modelSlug.replace(/-/g, " "),
      mpn: productData.mpn || productData.sku || null,
    };
  }

  // Fallback: try to find price in HTML
  const priceText = $('[class*="price"], [itemprop="price"]').first().text();
  const priceMatch = priceText.match(/\$?([\d,]+\.?\d*)/);
  const price = priceMatch ? parseFloat(priceMatch[1].replace(",", "")) : 0;

  return {
    price,
    brand,
    model: $("h1").first().text().trim() || modelSlug.replace(/-/g, " "),
    mpn: null,
  };
}

// ══════════════════════════════════════════════════════════════
// Giga-Tires — www.giga-tires.com (Cloudflare protected)
// Style pages show "starting at" price server-side.
// URL pattern: /brands/{brand}-tires/s/{model}
// ══════════════════════════════════════════════════════════════

async function scrapeGigaTires(limit) {
  console.log("\n=== Scraping Giga-Tires ===\n");

  // Use brand listing pages to find product lines with starting prices
  let scraped = 0;
  let matched = 0;
  let errors = 0;

  for (const brand of CURATED_BRANDS) {
    if (scraped >= limit) break;

    const brandUrl = `https://www.giga-tires.com/brands/${brand}-tires`;
    console.log(`  Fetching ${brand} brand page...`);
    const html = await rateLimitedFetch(brandUrl);
    if (!html) { errors++; continue; }

    if (html.includes("Just a moment...") || html.includes("challenge-platform")) {
      console.warn(`  ⚠ Cloudflare blocking on ${brand} page`);
      errors++;
      continue;
    }

    const $ = cheerio.load(html);

    // Look for product cards with "starting at" prices
    $("a[href*='/s/']").each((_, el) => {
      if (scraped >= limit) return;

      const href = $(el).attr("href") || "";
      const card = $(el);

      // Extract price from card text
      const text = card.text();
      const priceMatch = text.match(/\$\s*([\d,]+\.?\d*)/);
      if (!priceMatch) return;

      const price = parseFloat(priceMatch[1].replace(",", ""));
      if (price <= 0) return;

      // Extract model from URL: /brands/{brand}-tires/s/{model}
      const modelMatch = href.match(/\/s\/([^/?]+)/);
      if (!modelMatch) return;

      const modelSlug = modelMatch[1];
      const modelName = modelSlug.replace(/-/g, " ");
      const brandDisplay = BRAND_DISPLAY[brand] || brand;
      const fullUrl = href.startsWith("http") ? href : `https://www.giga-tires.com${href}`;

      scraped++;
      // Queue for matching (we'll process below)
      matchAndUpsert(brand, brandDisplay, modelName, price, fullUrl);
    });
  }

  async function matchAndUpsert(brandSlug, brandDisplay, modelName, price, url) {
    // For "starting at" prices we can only match at the model level
    // Find any tire for this brand+model to get a representative tire_id
    const result = await tursoQuery(
      `SELECT id, name, make_name, model_name, width, aspect_ratio, rim_size
       FROM tires
       WHERE UPPER(make_name) = ?
       LIMIT 50`,
      [brandDisplay.toUpperCase()]
    );

    if (result.rows.length === 0) return;

    const modelSlug = toSlug(modelName);
    let dbMatch = null;
    for (const row of result.rows) {
      const dbSlug = toSlug(String(row.model_name));
      if (dbSlug === modelSlug || dbSlug.includes(modelSlug) || modelSlug.includes(dbSlug)) {
        dbMatch = row;
        break;
      }
    }

    if (!dbMatch) return;

    const ok = await upsertCompetitorPrice({
      tireId: Number(dbMatch.id),
      source: "gigatires",
      price,
      url,
      brand: brandDisplay,
      model: modelName,
      size: `${dbMatch.width}/${dbMatch.aspect_ratio}R${dbMatch.rim_size}`,
      matchedBy: "size_brand_model",
      confidence: 0.6, // Lower confidence for "starting at" prices
    });

    if (ok) {
      matched++;
      console.log(`    ✓ ${brandDisplay} ${modelName} "starting at" $${price} → tire_id ${dbMatch.id}`);
    }
  }

  return { scraped, matched, errors };
}

// ══════════════════════════════════════════════════════════════
// TireRack — www.tirerack.com (requires Puppeteer for bot protection)
// Navigates to product-line pages, extracts per-size prices from
// rendered DOM + JSON-LD structured data.
// ══════════════════════════════════════════════════════════════

async function scrapeTireRack(limit) {
  console.log("\n=== Scraping TireRack (Puppeteer) ===\n");

  if (!puppeteer) {
    console.error("  ✗ Puppeteer is required for TireRack. Run: npm install puppeteer");
    return { scraped: 0, matched: 0, errors: 0 };
  }

  const models = await getUniqueModels(limit);
  console.log(`  Found ${models.length} brand+model combos to scrape`);

  const browser = await launchBrowser();
  if (!browser) return { scraped: 0, matched: 0, errors: 0 };

  let scraped = 0;
  let matched = 0;
  let errors = 0;

  try {
    const page = await browser.newPage();
    await page.setUserAgent(USER_AGENT);
    // Block images/fonts/css for speed
    await page.setRequestInterception(true);
    page.on("request", (req) => {
      const type = req.resourceType();
      if (["image", "font", "stylesheet", "media"].includes(type)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    for (let i = 0; i < models.length; i++) {
      const { brand, model, displayBrand } = models[i];
      const encodedBrand = encodeURIComponent(displayBrand);
      const encodedModel = encodeURIComponent(model);
      const url = `https://www.tirerack.com/tires/tires.jsp?tireMake=${encodedBrand}&tireModel=${encodedModel}`;

      try {
        console.log(`  [${i + 1}/${models.length}] ${displayBrand} ${model}...`);
        await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });

        // Wait briefly for dynamic content
        await page.waitForTimeout(2000);

        // Check if we hit a captcha/block page
        const pageTitle = await page.title();
        if (
          pageTitle.includes("Access Denied") ||
          pageTitle.includes("Robot") ||
          pageTitle.includes("unavailable")
        ) {
          console.warn(`    ⚠ Blocked by bot protection`);
          errors++;
          // Wait longer before retry
          await new Promise((r) => setTimeout(r, 10000));
          continue;
        }

        // Extract tire data from the page
        const tireData = await page.evaluate(() => {
          const results = [];

          // Strategy 1: JSON-LD structured data
          document.querySelectorAll('script[type="application/ld+json"]').forEach((el) => {
            try {
              const data = JSON.parse(el.textContent);
              const products = data["@type"] === "Product" ? [data]
                : Array.isArray(data) ? data.filter((d) => d["@type"] === "Product")
                : data["@graph"]?.filter?.((d) => d["@type"] === "Product") || [];
              for (const p of products) {
                const price = parseFloat(
                  p.offers?.price || p.offers?.lowPrice || "0"
                );
                if (price > 0) {
                  results.push({
                    price,
                    size: p.name || "",
                    mpn: p.mpn || p.sku || null,
                    upc: p.gtin13 || p.gtin12 || p.gtin || null,
                  });
                }
              }
            } catch { /* ignore */ }
          });

          if (results.length > 0) return results;

          // Strategy 2: Table rows with prices (TireRack uses tables)
          document.querySelectorAll("table tr, .tireSearchResult, [data-tire]").forEach((row) => {
            const text = row.textContent || "";
            // Look for price pattern: $XX.XX or $XXX.XX
            const priceMatch = text.match(/\$\s*(\d{2,4}\.\d{2})/);
            // Look for tire size pattern: 205/55R16, 245/40ZR19, etc.
            const sizeMatch = text.match(/(\d{3})\/?(\d{2,3})(?:ZR|R)(\d{2})/i);
            if (priceMatch && sizeMatch) {
              results.push({
                price: parseFloat(priceMatch[1]),
                size: `${sizeMatch[1]}/${sizeMatch[2]}R${sizeMatch[3]}`,
                mpn: null,
                upc: null,
              });
            }
          });

          if (results.length > 0) return results;

          // Strategy 3: Any element with price-like content + nearby size
          const priceEls = document.querySelectorAll(
            '[class*="price"], [itemprop="price"], [data-price]'
          );
          for (const el of priceEls) {
            const priceText = el.textContent || el.getAttribute("content") || "";
            const priceMatch = priceText.match(/\$?\s*(\d{2,4}\.\d{2})/);
            if (!priceMatch) continue;

            // Look for size in parent/sibling context
            const context = el.closest("tr, [class*='tire'], [class*='product'], li, article");
            if (!context) continue;
            const ctxText = context.textContent || "";
            const sizeMatch = ctxText.match(/(\d{3})\/?(\d{2,3})(?:ZR|R)(\d{2})/i);
            if (sizeMatch) {
              results.push({
                price: parseFloat(priceMatch[1]),
                size: `${sizeMatch[1]}/${sizeMatch[2]}R${sizeMatch[3]}`,
                mpn: null,
                upc: null,
              });
            }
          }

          return results;
        });

        if (!tireData || tireData.length === 0) {
          console.log(`    No price data found on page`);
          errors++;
          continue;
        }

        console.log(`    Found ${tireData.length} priced sizes`);
        scraped += tireData.length;

        // Match each tire to our DB and upsert
        for (const tire of tireData) {
          let dbMatch = null;
          let matchedBy = "";
          let confidence = 1.0;

          // MPN match
          if (tire.mpn) {
            dbMatch = await matchByMPN(tire.mpn);
            if (dbMatch) { matchedBy = "mpn"; confidence = 1.0; }
          }
          // UPC match
          if (!dbMatch && tire.upc) {
            dbMatch = await matchByUPC(tire.upc);
            if (dbMatch) { matchedBy = "upc"; confidence = 0.95; }
          }
          // Size + brand + model
          if (!dbMatch && tire.size) {
            const parsed = parseSize(tire.size);
            if (parsed) {
              dbMatch = await matchBySizeBrandModel(
                parsed.width, parsed.aspect, parsed.rim, displayBrand, model
              );
              if (dbMatch) { matchedBy = "size_brand_model"; confidence = 0.8; }
            }
          }

          if (!dbMatch) continue;

          const ok = await upsertCompetitorPrice({
            tireId: Number(dbMatch.id),
            source: "tirerack",
            price: tire.price,
            url,
            brand: displayBrand,
            model,
            size: tire.size,
            matchedBy,
            confidence,
          });
          if (ok) matched++;
        }

        if (matched > 0) {
          console.log(`    ✓ Matched ${matched} tires to DB`);
        }
      } catch (e) {
        console.warn(`    Error: ${e.message}`);
        errors++;
      }

      // Rate limit: 3 sec between pages for bot protection
      await new Promise((r) => setTimeout(r, 3000));
    }
  } finally {
    await browser.close();
  }

  return { scraped, matched, errors };
}

// ══════════════════════════════════════════════════════════════
// Discount Tire / America's Tire — www.discounttire.com
// Direct GraphQL API at /webapi/discounttire.graph (NO Puppeteer needed)
// Queries by tire size — each request returns ALL brands for that size.
// ══════════════════════════════════════════════════════════════

const DT_GRAPHQL_URL = "https://www.discounttire.com/webapi/discounttire.graph";
const DT_STORE_CODE = "1344";
const DT_PAGE_SIZE = 48; // max results per page

const DT_GRAPHQL_QUERY = `query TireSizeProductSearch($searchInput: TireSizeSearchInput!, $vehicleInfo: VehicleInput, $storeCode: String!) {
  productSearch {
    tireSize(searchInput: $searchInput, vehicleInfo: $vehicleInfo, storeCode: $storeCode) {
      pagination { currentPage numberOfPages pageSize totalNumberOfResults }
      results {
        name brand size
        price { value formattedValue }
        averageRating description
        images { url altText }
        manufacturerAID url
        stock { stockCount availabilityMessage }
      }
    }
  }
}`;

async function scrapeDiscountTire(limit) {
  console.log("\n=== Scraping Discount Tire (Direct GraphQL API) ===\n");

  // Step 1: Get distinct tire sizes from our catalog
  console.log("Fetching distinct tire sizes from catalog...");
  const sizeResult = await tursoQuery(
    `SELECT DISTINCT CAST(width AS TEXT) AS w, CAST(aspect_ratio AS TEXT) AS ar, CAST(rim_size AS TEXT) AS rs
     FROM tires
     WHERE width IS NOT NULL AND aspect_ratio IS NOT NULL AND rim_size IS NOT NULL
       AND CAST(width AS INTEGER) >= 145 AND CAST(width AS INTEGER) <= 355
       AND CAST(aspect_ratio AS INTEGER) >= 25 AND CAST(aspect_ratio AS INTEGER) <= 85
       AND CAST(rim_size AS INTEGER) >= 13 AND CAST(rim_size AS INTEGER) <= 24
     ORDER BY RANDOM()`,
    []
  );

  const sizes = sizeResult.rows.map((r) => ({
    width: String(r.w),
    aspect: String(r.ar),
    rim: String(r.rs),
    label: `${r.w}/${r.ar}R${r.rs}`,
  }));

  const selected = sizes.slice(0, limit);
  console.log(`  Found ${sizes.length} distinct sizes, will query ${selected.length}\n`);

  let scraped = 0;
  let matched = 0;
  let errors = 0;

  for (let i = 0; i < selected.length; i++) {
    const { width, aspect, rim, label } = selected[i];

    try {
      // Query all pages for this size
      let pageNum = 0;
      let totalPages = 1;
      let sizeScraped = 0;
      let sizeMatched = 0;

      while (pageNum < totalPages && pageNum < 10) {
        const body = {
          operationName: "TireSizeProductSearch",
          variables: {
            searchInput: {
              front: { width, aspectRatio: aspect, diameter: rim },
              nearByStoreCodes: [],
              pageNumber: pageNum,
              pageSize: DT_PAGE_SIZE,
              rawQuery: `${width}/${aspect}R${rim}`,
            },
            storeCode: DT_STORE_CODE,
            vehicleInfo: null,
          },
          query: DT_GRAPHQL_QUERY,
        };

        const data = await rateLimitedFetch(DT_GRAPHQL_URL, {
          accept: "application/json",
          json: true,
          headers: {
            "Content-Type": "application/json",
            Referer: `https://www.discounttire.com/fitmentresult/tires/${width}-${aspect}-${rim}`,
            Origin: "https://www.discounttire.com",
          },
          method: "POST",
          body: JSON.stringify(body),
        });

        if (!data?.data?.productSearch?.tireSize) {
          if (pageNum === 0) {
            console.log(`  [${i + 1}/${selected.length}] ${label}: no results`);
            errors++;
          }
          break;
        }

        const tireSize = data.data.productSearch.tireSize;
        const { pagination, results } = tireSize;

        if (pageNum === 0) {
          totalPages = pagination?.numberOfPages || 1;
        }

        if (!results || results.length === 0) break;

        // Process results — match to our catalog and upsert
        const toUpsert = [];

        for (const tire of results) {
          const price = tire.price?.value;
          if (!price || price <= 0) continue;

          const brand = tire.brand || "";
          const name = tire.name || "";
          const mpn = tire.manufacturerAID || null;
          const tireUrl = tire.url ? `https://www.discounttire.com${tire.url}` : "";

          // Extract model name: name is usually "Brand ModelName" or just the full tire name
          let modelName = name;
          if (brand && name.toLowerCase().startsWith(brand.toLowerCase())) {
            modelName = name.slice(brand.length).trim();
          }
          // Clean common suffixes
          modelName = modelName.replace(/\s*\d{3}\/\d{2,3}R\d{2}.*$/, "").trim();

          // Only process curated brands
          const brandSlug = toSlug(brand);
          if (!CURATED_BRANDS.includes(brandSlug)) continue;

          sizeScraped++;

          // Match to our DB
          let dbMatch = null;
          let matchedBy = "";
          let confidence = 1.0;

          // MPN match first
          if (mpn) {
            dbMatch = await matchByMPN(mpn);
            if (dbMatch) { matchedBy = "mpn"; confidence = 1.0; }
          }

          // Size + brand + model fallback
          if (!dbMatch) {
            dbMatch = await matchBySizeBrandModel(width, aspect, rim, brand, modelName);
            if (dbMatch) { matchedBy = "size_brand_model"; confidence = 0.8; }
          }

          if (dbMatch) {
            toUpsert.push({
              tire_id: Number(dbMatch.id),
              source: "discounttire",
              competitor_price: price,
              competitor_url: tireUrl,
              brand,
              model: modelName,
              size: label,
              matched_by: matchedBy,
              match_confidence: confidence,
              active: true,
              scraped_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
          }
        }

        // Batch upsert in chunks of 50
        for (let c = 0; c < toUpsert.length; c += 50) {
          const chunk = toUpsert.slice(c, c + 50);
          const { error } = await supabase
            .from("competitor_prices")
            .upsert(chunk, { onConflict: "source,tire_id" });

          if (error) {
            console.error(`    DB batch error: ${error.message}`);
            errors += chunk.length;
          } else {
            sizeMatched += chunk.length;
          }
        }

        pageNum++;
      }

      scraped += sizeScraped;
      matched += sizeMatched;

      if (sizeScraped > 0) {
        console.log(`  [${i + 1}/${selected.length}] ${label}: ${sizeScraped} priced → ${sizeMatched} matched`);
      } else if (i % 10 === 0) {
        // Periodic progress even for empty sizes
        console.log(`  [${i + 1}/${selected.length}] ${label}: 0 results`);
      }
    } catch (e) {
      console.warn(`  [${i + 1}/${selected.length}] ${label}: error — ${e.message}`);
      errors++;
    }
  }

  return { scraped, matched, errors };
}

// ── Upsert to Supabase ──────────────────────────────────────
async function upsertCompetitorPrice(record) {
  const { error } = await supabase
    .from("competitor_prices")
    .upsert(
      {
        tire_id: record.tireId,
        source: record.source,
        competitor_price: record.price,
        competitor_url: record.url,
        brand: record.brand,
        model: record.model,
        size: record.size,
        matched_by: record.matchedBy,
        match_confidence: record.confidence,
        active: true,
        scraped_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "source,tire_id" }
    );

  if (error) {
    console.error(`  DB error for tire_id ${record.tireId}: ${error.message}`);
    return false;
  }
  return true;
}

// ── Main scrape dispatcher ──────────────────────────────────

const SCRAPERS = {
  simpletire: scrapeSimpleTire,
  tireseasy: scrapeTiresEasy,
  gigatires: scrapeGigaTires,
  tirerack: scrapeTireRack,
  discounttire: scrapeDiscountTire,
};

async function main() {
  const { source, limit } = parseArgs();
  console.log(`\nCompetitor Price Scraper`);
  console.log(`Source: ${source} | Limit: ${limit}\n`);

  const sources = source === "all" ? Object.keys(SCRAPERS) : [source];
  const totals = { scraped: 0, matched: 0, errors: 0 };

  for (const src of sources) {
    const scraper = SCRAPERS[src];
    if (!scraper) {
      console.error(`Unknown source: ${src}. Valid: ${Object.keys(SCRAPERS).join(", ")}`);
      continue;
    }
    const perSourceLimit = source === "all" ? Math.ceil(limit / sources.length) : limit;
    const result = await scraper(perSourceLimit);
    totals.scraped += result.scraped;
    totals.matched += result.matched;
    totals.errors += result.errors;
  }

  console.log(`\n─── Final Summary ───`);
  console.log(`Scraped: ${totals.scraped} products`);
  console.log(`Matched: ${totals.matched} to our DB`);
  console.log(`Errors:  ${totals.errors}`);
  console.log(`Match rate: ${totals.scraped > 0 ? ((totals.matched / totals.scraped) * 100).toFixed(1) : 0}%`);
  console.log("\nDone.");
}

main().catch(console.error);
