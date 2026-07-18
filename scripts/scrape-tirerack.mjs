/**
 * TireRack Price Scraper — Size-Based Approach
 *
 * Scrapes TireRack prices by querying their search-by-size pages, which return
 * ALL brands/models for a given tire size. This is ~6x more efficient than
 * querying by model (~3K unique sizes vs ~19K models).
 *
 * Writes matched prices to:
 *   1. Supabase `competitor_prices` table (source: "tirerack") — real-time site pricing
 *   2. Turso `tires.price_map` column — Google Merchant feed fallback
 *
 * Usage:
 *   node scripts/scrape-tirerack.mjs                                  # Scrape all sizes
 *   node scripts/scrape-tirerack.mjs --resume                         # Resume from last checkpoint
 *   node scripts/scrape-tirerack.mjs --sizes 225/45R17,205/55R16      # Specific sizes only
 *   node scripts/scrape-tirerack.mjs --dry-run                        # Show what would be scraped
 */
import { createClient as createTursoClient } from "@libsql/client";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Optional Puppeteer — required for TireRack
let puppeteer = null;
try {
  puppeteer = (await import("puppeteer")).default;
} catch {
  console.error("Puppeteer is required. Run: npm install puppeteer");
  process.exit(1);
}

// ── Config ──────────────────────────────────────────────────
const TURSO_URL =
  process.env.TURSO_DATABASE_URL ||
  "libsql://shiptires-shiptires.aws-us-west-2.turso.io";
const TURSO_TOKEN =
  process.env.TURSO_AUTH_TOKEN ||
  "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3ODQzNzkzOTMsImlkIjoiMDE5Zjc1NGMtM2QwMS03NmZlLWI1MTctMjU5OTRmYzg4NTZhIiwia2lkIjoiNm4weWJRYk9PWEl2RlBLTWJDSTJ1N0lrREc2OWRLVzNjc2R1Yng5dDZ5WSIsInJpZCI6IjgyYzAwZDkxLWE2YzMtNGM5ZC04NDQzLTUzMjZhNGM0NDEzYyJ9.ENMwrr3gITthfhBM_CHaw3zcU2yG8JlSR3hG5gJTLV89SN7U0nQZqoUX1XRcq1CdtSv5qxsHu0kkAAPZ3RZ7Dg";
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://jrzccxsakhmnbhtnusih.supabase.co";
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpyemNjeHNha2htbmJodG51c2loIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTMyMzUxNiwiZXhwIjoyMDg0ODk5NTE2fQ.W-HmE-YHq8EMX7Ivnrb4evZ3S-X5xJDlGHR70M0Qof4";

const RATE_DELAY_MS = 3000; // 3 sec between pages for bot protection
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";
const CHECKPOINT_FILE = path.join(__dirname, "_tirerack-progress.json");
const TURSO_BATCH_SIZE = 100;

const turso = createTursoClient({ url: TURSO_URL, authToken: TURSO_TOKEN });
const supabase = createSupabaseClient(SUPABASE_URL, SUPABASE_KEY);

// ── CLI Args ────────────────────────────────────────────────
function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { resume: false, dryRun: false, sizes: /** @type {string[]} */ ([]) };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--resume") opts.resume = true;
    if (args[i] === "--dry-run") opts.dryRun = true;
    if (args[i] === "--sizes" && args[i + 1]) {
      opts.sizes = args[++i].split(",").map((s) => s.trim());
    }
  }
  return opts;
}

// ── Helpers ─────────────────────────────────────────────────
function toSlug(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function tursoQuery(sql, args = [], retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await turso.execute({ sql, args });
    } catch (e) {
      if (attempt === retries) throw e;
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
}

// ── Matching Logic (reused from scrape-competitor-prices.mjs) ──

/** Match by MPN (item_number) — highest confidence */
async function matchByMPN(mpn) {
  if (!mpn) return null;
  const result = await tursoQuery(
    `SELECT id, name, make_name, model_name, width, aspect_ratio, rim_size, price_map
     FROM tires WHERE item_number = ? LIMIT 1`,
    [mpn]
  );
  return result.rows.length > 0 ? result.rows[0] : null;
}

/** Match by UPC — high confidence */
async function matchByUPC(upc) {
  if (!upc) return null;
  const result = await tursoQuery(
    `SELECT id, name, make_name, model_name, width, aspect_ratio, rim_size, price_map
     FROM tires WHERE upc = ? OR ean = ? LIMIT 1`,
    [upc, upc]
  );
  return result.rows.length > 0 ? result.rows[0] : null;
}

/** Match by size + brand + model — fuzzy */
async function matchBySizeBrandModel(width, aspect, rim, brand, model) {
  if (!width || !aspect || !rim || !brand) return null;

  const result = await tursoQuery(
    `SELECT id, name, make_name, model_name, width, aspect_ratio, rim_size, price_map
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

// ── Checkpoint ──────────────────────────────────────────────
function loadCheckpoint() {
  try {
    if (fs.existsSync(CHECKPOINT_FILE)) {
      return JSON.parse(fs.readFileSync(CHECKPOINT_FILE, "utf-8"));
    }
  } catch { /* fresh start */ }
  return { completedSizes: [], stats: { scraped: 0, matched: 0, errors: 0, priceMapUpdated: 0 } };
}

function saveCheckpoint(checkpoint) {
  fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(checkpoint, null, 2));
}

// ── Get all unique sizes from DB ────────────────────────────
async function getUniqueSizes() {
  const result = await tursoQuery(
    `SELECT DISTINCT
       CAST(width AS TEXT) AS w,
       CAST(aspect_ratio AS TEXT) AS ar,
       CAST(rim_size AS TEXT) AS rs
     FROM tires
     WHERE width IS NOT NULL AND aspect_ratio IS NOT NULL AND rim_size IS NOT NULL
       AND CAST(width AS INTEGER) >= 145 AND CAST(width AS INTEGER) <= 355
       AND CAST(aspect_ratio AS INTEGER) >= 25 AND CAST(aspect_ratio AS INTEGER) <= 85
       AND CAST(rim_size AS INTEGER) >= 13 AND CAST(rim_size AS INTEGER) <= 24
     ORDER BY w, ar, rs`
  );

  return result.rows.map((r) => ({
    width: String(r.w),
    aspect: String(r.ar),
    rim: String(r.rs),
    label: `${r.w}/${r.ar}R${r.rs}`,
  }));
}

// ── Parse specific sizes from CLI ───────────────────────────
function parseSizeArg(sizeStr) {
  // Accept formats: 225/45R17, 225/45/17
  const m = sizeStr.match(/(\d{3})[/](\d{2,3})[R/]?(\d{2})/i);
  if (!m) return null;
  return { width: m[1], aspect: m[2], rim: m[3], label: `${m[1]}/${m[2]}R${m[3]}` };
}

// ── Launch Puppeteer ────────────────────────────────────────
async function launchBrowser() {
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

// ── Extract tire data from TireRack search results page ─────
async function extractTiresFromPage(page) {
  return page.evaluate(() => {
    const results = [];

    // Strategy 1: JSON-LD structured data (best — has price, MPN, GTIN)
    document.querySelectorAll('script[type="application/ld+json"]').forEach((el) => {
      try {
        const raw = JSON.parse(el.textContent);
        const items = Array.isArray(raw) ? raw : raw["@graph"] || [raw];
        for (const item of items) {
          if (item["@type"] !== "Product") continue;
          const price = parseFloat(
            item.offers?.price || item.offers?.lowPrice || "0"
          );
          if (price <= 0) continue;

          // Extract brand and model from name
          const name = item.name || "";
          const brand = item.brand?.name || item.brand || "";

          results.push({
            price,
            name,
            brand: typeof brand === "object" ? brand.name || "" : brand,
            mpn: item.mpn || item.sku || null,
            upc: item.gtin13 || item.gtin12 || item.gtin || null,
          });
        }
      } catch { /* ignore parse errors */ }
    });

    if (results.length > 0) return { source: "json-ld", tires: results };

    // Strategy 2: DOM — look for tire result rows/cards
    const selectors = [
      ".tireSearchResult",
      "[data-tire]",
      ".product-card",
      ".tireListing",
      "table.tireSizeResults tr",
      ".searchResultRow",
    ];

    for (const sel of selectors) {
      const els = document.querySelectorAll(sel);
      if (els.length === 0) continue;

      els.forEach((el) => {
        const text = el.textContent || "";
        // Price: $XX.XX or $XXX.XX
        const priceMatch = text.match(/\$\s*(\d{2,4}\.\d{2})/);
        if (!priceMatch) return;
        const price = parseFloat(priceMatch[1]);
        if (price <= 0 || price > 2000) return;

        // Try to find brand and model text
        const headings = el.querySelectorAll("a, h2, h3, h4, .brand, .model, [class*='brand'], [class*='model'], [class*='name']");
        let brand = "";
        let model = "";
        for (const h of headings) {
          const t = h.textContent.trim();
          if (t.length > 2 && t.length < 50 && !t.includes("$")) {
            if (!brand) brand = t;
            else if (!model) model = t;
          }
        }

        results.push({
          price,
          name: `${brand} ${model}`.trim(),
          brand,
          mpn: null,
          upc: null,
        });
      });
    }

    if (results.length > 0) return { source: "dom", tires: results };

    // Strategy 3: Generic price elements with nearby tire info
    const priceEls = document.querySelectorAll(
      '[class*="price"], [itemprop="price"], [data-price]'
    );
    for (const el of priceEls) {
      const priceText = el.textContent || el.getAttribute("content") || "";
      const priceMatch = priceText.match(/\$?\s*(\d{2,4}\.\d{2})/);
      if (!priceMatch) continue;
      const price = parseFloat(priceMatch[1]);
      if (price <= 0 || price > 2000) continue;

      const ctx = el.closest("tr, [class*='tire'], [class*='product'], li, article, div");
      if (!ctx) continue;
      const ctxText = ctx.textContent || "";

      // Try to extract brand from context
      const brandEl = ctx.querySelector("[class*='brand'], [class*='name'], a");
      const brand = brandEl ? brandEl.textContent.trim() : "";

      results.push({
        price,
        name: brand,
        brand,
        mpn: null,
        upc: null,
      });
    }

    return { source: results.length > 0 ? "price-els" : "none", tires: results };
  });
}

// ── Upsert to Supabase competitor_prices ────────────────────
async function upsertCompetitorPrices(records) {
  if (records.length === 0) return 0;
  let upserted = 0;
  for (let c = 0; c < records.length; c += 50) {
    const chunk = records.slice(c, c + 50);
    const { error } = await supabase
      .from("competitor_prices")
      .upsert(chunk, { onConflict: "source,tire_id" });

    if (error) {
      console.error(`    Supabase batch error: ${error.message}`);
    } else {
      upserted += chunk.length;
    }
  }
  return upserted;
}

// ── Batch update price_map in Turso ─────────────────────────
async function batchUpdatePriceMap(updates) {
  if (updates.length === 0) return 0;
  let updated = 0;

  for (let i = 0; i < updates.length; i += TURSO_BATCH_SIZE) {
    const batch = updates.slice(i, i + TURSO_BATCH_SIZE);
    const stmts = batch.map(({ tireId, price }) => ({
      sql: "UPDATE tires SET price_map = ? WHERE id = ?",
      args: [price, tireId],
    }));

    try {
      await turso.batch(stmts);
      updated += batch.length;
    } catch (e) {
      console.error(`    Turso batch error: ${e.message}`);
      // Fall back to individual updates
      for (const { tireId, price } of batch) {
        try {
          await tursoQuery("UPDATE tires SET price_map = ? WHERE id = ?", [price, tireId]);
          updated++;
        } catch (e2) {
          console.error(`    Turso update error for tire ${tireId}: ${e2.message}`);
        }
      }
    }
  }

  return updated;
}

// ── Main ────────────────────────────────────────────────────
async function main() {
  const opts = parseArgs();
  console.log("\n=== TireRack Price Scraper (Size-Based) ===\n");

  // Step 1: Get sizes to scrape
  let sizes;
  if (opts.sizes.length > 0) {
    sizes = opts.sizes.map(parseSizeArg).filter(Boolean);
    console.log(`Specific sizes requested: ${sizes.map((s) => s.label).join(", ")}`);
  } else {
    console.log("Fetching distinct tire sizes from catalog...");
    sizes = await getUniqueSizes();
    console.log(`  Found ${sizes.length} unique sizes in DB`);
  }

  // Step 2: Load checkpoint for resume
  const checkpoint = opts.resume ? loadCheckpoint() : { completedSizes: [], stats: { scraped: 0, matched: 0, errors: 0, priceMapUpdated: 0 } };
  const completedSet = new Set(checkpoint.completedSizes);

  const remaining = sizes.filter((s) => !completedSet.has(s.label));
  console.log(`  Already scraped: ${completedSet.size}`);
  console.log(`  Remaining: ${remaining.length}\n`);

  if (opts.dryRun) {
    console.log("DRY RUN — sizes that would be scraped:\n");
    for (const s of remaining) {
      console.log(`  ${s.label}  (width=${s.width} aspect=${s.aspect} rim=${s.rim})`);
    }
    console.log(`\nTotal: ${remaining.length} sizes`);
    console.log(`Estimated time: ~${((remaining.length * RATE_DELAY_MS) / 1000 / 60).toFixed(0)} minutes`);
    return;
  }

  if (remaining.length === 0) {
    console.log("All sizes already scraped! Use without --resume to start fresh.\n");
    return;
  }

  // Step 3: Launch browser
  const browser = await launchBrowser();
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

  const stats = checkpoint.stats;
  let consecutiveErrors = 0;

  try {
    for (let i = 0; i < remaining.length; i++) {
      const { width, aspect, rim, label } = remaining[i];
      const url = `https://www.tirerack.com/tires/TireSearchResults.jsp?width=${width}&ratio=${aspect}&diameter=${rim}`;

      try {
        process.stdout.write(`  [${i + 1}/${remaining.length}] ${label}...`);

        await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
        await new Promise((r) => setTimeout(r, 2000)); // let dynamic content render

        // Check for bot block / captcha
        const pageTitle = await page.title();
        if (
          pageTitle.includes("Access Denied") ||
          pageTitle.includes("Robot") ||
          pageTitle.includes("Blocked") ||
          pageTitle.includes("unavailable")
        ) {
          console.log(` BLOCKED (${pageTitle})`);
          stats.errors++;
          consecutiveErrors++;
          if (consecutiveErrors >= 5) {
            console.error("\n  Too many consecutive blocks — stopping. Try again later.\n");
            break;
          }
          await new Promise((r) => setTimeout(r, 15000)); // wait longer
          continue;
        }

        consecutiveErrors = 0;

        // Extract tire data
        const extracted = await extractTiresFromPage(page);
        const tires = extracted?.tires || [];

        if (tires.length === 0) {
          console.log(` 0 tires found`);
          // Still mark as completed so we don't retry
          checkpoint.completedSizes.push(label);
          saveCheckpoint(checkpoint);
          await new Promise((r) => setTimeout(r, RATE_DELAY_MS));
          continue;
        }

        // Deduplicate by MPN (if available) or by brand+name
        const seen = new Set();
        const uniqueTires = tires.filter((t) => {
          const key = t.mpn || `${t.brand}|${t.name}|${t.price}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        stats.scraped += uniqueTires.length;

        // Match each tire to our DB
        const competitorRecords = [];
        const priceMapUpdates = [];

        for (const tire of uniqueTires) {
          let dbMatch = null;
          let matchedBy = "";
          let confidence = 1.0;

          // MPN match (highest confidence)
          if (tire.mpn) {
            dbMatch = await matchByMPN(tire.mpn);
            if (dbMatch) {
              matchedBy = "mpn";
              confidence = 1.0;
            }
          }

          // UPC match
          if (!dbMatch && tire.upc) {
            dbMatch = await matchByUPC(tire.upc);
            if (dbMatch) {
              matchedBy = "upc";
              confidence = 0.95;
            }
          }

          // Size + brand + model match
          if (!dbMatch && tire.brand) {
            // Extract model from name: usually "Brand ModelName" or just the tire name
            let modelName = tire.name || "";
            if (
              tire.brand &&
              modelName.toLowerCase().startsWith(tire.brand.toLowerCase())
            ) {
              modelName = modelName.slice(tire.brand.length).trim();
            }
            // Strip size info from model name
            modelName = modelName
              .replace(/\d{3}\/\d{2,3}(?:ZR|R)\d{2}.*/i, "")
              .trim();

            if (modelName) {
              dbMatch = await matchBySizeBrandModel(
                width,
                aspect,
                rim,
                tire.brand,
                modelName
              );
              if (dbMatch) {
                matchedBy = "size_brand_model";
                confidence = 0.8;
              }
            }
          }

          if (!dbMatch) continue;

          const tireId = Number(dbMatch.id);

          competitorRecords.push({
            tire_id: tireId,
            source: "tirerack",
            competitor_price: tire.price,
            competitor_url: url,
            brand: tire.brand,
            model: tire.name,
            size: label,
            matched_by: matchedBy,
            match_confidence: confidence,
            active: true,
            scraped_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

          // Queue price_map update — use TireRack price directly (markup applied at read time)
          priceMapUpdates.push({ tireId, price: tire.price });
        }

        // Upsert to Supabase
        const upserted = await upsertCompetitorPrices(competitorRecords);
        stats.matched += upserted;

        // Batch update price_map in Turso
        const pmUpdated = await batchUpdatePriceMap(priceMapUpdates);
        stats.priceMapUpdated += pmUpdated;

        console.log(
          ` ${uniqueTires.length} tires, ${upserted} matched, ${pmUpdated} price_map (${extracted.source})`
        );

        // Save checkpoint
        checkpoint.completedSizes.push(label);
        saveCheckpoint(checkpoint);
      } catch (e) {
        console.log(` ERROR: ${e.message}`);
        stats.errors++;
        consecutiveErrors++;
        if (consecutiveErrors >= 10) {
          console.error("\n  Too many consecutive errors — stopping.\n");
          break;
        }
      }

      // Rate limit between pages
      await new Promise((r) => setTimeout(r, RATE_DELAY_MS));
    }
  } finally {
    await browser.close();
  }

  // ── Summary ──────────────────────────────────────────────
  console.log("\n─── Final Summary ───");
  console.log(`Sizes scraped:   ${checkpoint.completedSizes.length}/${sizes.length}`);
  console.log(`Tires found:     ${stats.scraped}`);
  console.log(`Matched to DB:   ${stats.matched}`);
  console.log(`price_map set:   ${stats.priceMapUpdated}`);
  console.log(`Errors:          ${stats.errors}`);
  console.log(
    `Match rate:      ${stats.scraped > 0 ? ((stats.matched / stats.scraped) * 100).toFixed(1) : 0}%`
  );
  console.log(`\nCheckpoint saved to: ${CHECKPOINT_FILE}`);
  console.log("Done.\n");
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
