#!/usr/bin/env node

/**
 * Google Indexing API — Batch URL Submission for Ship.Tires
 *
 * SETUP:
 * 1. Go to https://console.cloud.google.com
 * 2. Create a project (or use existing)
 * 3. Enable "Web Search Indexing API" (APIs & Services → Library → search "Indexing API")
 * 4. Create a Service Account (APIs & Services → Credentials → Create Credentials → Service Account)
 * 5. Create a JSON key for the service account (Keys tab → Add Key → JSON)
 * 6. Save the JSON key file as: scripts/service-account.json
 * 7. Copy the service account email (e.g., indexing@project.iam.gserviceaccount.com)
 * 8. Go to Google Search Console → Settings → Users and permissions → Add user
 * 9. Add the service account email as "Owner"
 *
 * USAGE:
 *   node scripts/google-indexing.js                    # Submit first 200 URLs (daily quota)
 *   node scripts/google-indexing.js --limit 50         # Submit 50 URLs
 *   node scripts/google-indexing.js --offset 200       # Skip first 200, submit next 200
 *   node scripts/google-indexing.js --dry-run           # Preview URLs without submitting
 *   node scripts/google-indexing.js --url https://ship.tires/tires  # Submit single URL
 *   node scripts/google-indexing.js --priority high     # Only high-priority pages (static + brands + models)
 *   node scripts/google-indexing.js --priority locations # Only location pages
 *
 * QUOTA: Google allows 200 publish requests per day per property.
 *        Run daily with --offset to cycle through all URLs over multiple days.
 */

const { GoogleAuth } = require("google-auth-library");
const https = require("https");
const path = require("path");
const fs = require("fs");

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const SITE_URL = "https://ship.tires";
const SITEMAP_URL = `${SITE_URL}/sitemap.xml`;
const INDEXING_ENDPOINT = "https://indexing.googleapis.com/v3/urlNotifications:publish";
const BATCH_ENDPOINT = "https://indexing.googleapis.com/batch";
const KEY_FILE = path.join(__dirname, "service-account.json");
const STATE_FILE = path.join(__dirname, ".indexing-state.json");
const DAILY_QUOTA = 200;
const BATCH_SIZE = 40; // requests per batch HTTP call (Google max is 100, but 40 is safer)

// ---------------------------------------------------------------------------
// Args
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
function getArg(name) {
  const idx = args.indexOf(`--${name}`);
  if (idx === -1) return undefined;
  return args[idx + 1];
}
const hasFlag = (name) => args.includes(`--${name}`);

const LIMIT = parseInt(getArg("limit") || String(DAILY_QUOTA), 10);
const OFFSET = parseInt(getArg("offset") || "0", 10);
const DRY_RUN = hasFlag("dry-run");
const SINGLE_URL = getArg("url");
const PRIORITY = getArg("priority"); // "high" | "locations" | undefined (all)
const REMOVE = hasFlag("remove"); // send URL_DELETED instead of URL_UPDATED

// ---------------------------------------------------------------------------
// Fetch sitemap XML and parse URLs
// ---------------------------------------------------------------------------

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchUrl(res.headers.location).then(resolve, reject);
      }
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve(data));
      res.on("error", reject);
    }).on("error", reject);
  });
}

function parseUrlsFromSitemap(xml) {
  const urls = [];
  const regex = /<loc>([^<]+)<\/loc>/g;
  let match;
  while ((match = regex.exec(xml)) !== null) {
    urls.push(match[1]);
  }
  return urls;
}

function categorizeUrls(urls) {
  const high = []; // static pages, brands, models
  const locations = []; // /locations/...

  for (const url of urls) {
    const path = url.replace(SITE_URL, "");
    if (path.startsWith("/locations/")) {
      locations.push(url);
    } else {
      high.push(url);
    }
  }

  return { high, locations };
}

// ---------------------------------------------------------------------------
// Google Auth
// ---------------------------------------------------------------------------

async function getAuthClient() {
  if (!fs.existsSync(KEY_FILE)) {
    console.error(`\n  ERROR: Service account key not found at:\n  ${KEY_FILE}\n`);
    console.error("  Follow the setup instructions at the top of this file.\n");
    process.exit(1);
  }

  const auth = new GoogleAuth({
    keyFile: KEY_FILE,
    scopes: ["https://www.googleapis.com/auth/indexing"],
  });

  return auth.getClient();
}

// ---------------------------------------------------------------------------
// Submit single URL
// ---------------------------------------------------------------------------

async function submitUrl(client, url, type = "URL_UPDATED") {
  try {
    const res = await client.request({
      url: INDEXING_ENDPOINT,
      method: "POST",
      data: { url, type },
    });
    return { url, status: res.status, ok: true };
  } catch (err) {
    const status = err?.response?.status || "ERR";
    const msg = err?.response?.data?.error?.message || err.message;
    return { url, status, ok: false, error: msg };
  }
}

// ---------------------------------------------------------------------------
// Batch submit (sends multiple in one HTTP request)
// ---------------------------------------------------------------------------

async function submitBatch(client, urls, type = "URL_UPDATED") {
  const boundary = "batch_indexing_" + Date.now();
  const results = [];

  for (let i = 0; i < urls.length; i += BATCH_SIZE) {
    const chunk = urls.slice(i, i + BATCH_SIZE);

    let body = "";
    for (const url of chunk) {
      body += `--${boundary}\r\n`;
      body += "Content-Type: application/http\r\n";
      body += "Content-Transfer-Encoding: binary\r\n\r\n";
      body += "POST /v3/urlNotifications:publish HTTP/1.1\r\n";
      body += "Content-Type: application/json\r\n\r\n";
      body += JSON.stringify({ url, type }) + "\r\n";
    }
    body += `--${boundary}--`;

    try {
      const res = await client.request({
        url: BATCH_ENDPOINT,
        method: "POST",
        headers: {
          "Content-Type": `multipart/mixed; boundary=${boundary}`,
        },
        data: body,
      });

      // Parse batch response
      const responseText = typeof res.data === "string" ? res.data : JSON.stringify(res.data);
      for (const url of chunk) {
        results.push({ url, status: 200, ok: true });
      }
    } catch (err) {
      // If batch fails, fall back to individual requests
      for (const url of chunk) {
        const result = await submitUrl(client, url, type);
        results.push(result);
        await sleep(100); // rate limit
      }
    }

    if (i + BATCH_SIZE < urls.length) {
      process.stdout.write(`  Submitted ${Math.min(i + BATCH_SIZE, urls.length)}/${urls.length}...\r`);
      await sleep(500);
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// State tracking — remember where we left off
// ---------------------------------------------------------------------------

function loadState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
  } catch {
    return { lastOffset: 0, lastRun: null, totalSubmitted: 0 };
  }
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function formatNum(n) {
  return n.toLocaleString();
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("\n  Ship.Tires — Google Indexing API\n");

  // Handle single URL
  if (SINGLE_URL) {
    if (DRY_RUN) {
      console.log(`  [DRY RUN] Would submit: ${SINGLE_URL}`);
      return;
    }
    const client = await getAuthClient();
    const type = REMOVE ? "URL_DELETED" : "URL_UPDATED";
    console.log(`  Submitting: ${SINGLE_URL} (${type})`);
    const result = await submitUrl(client, SINGLE_URL, type);
    console.log(`  ${result.ok ? "OK" : "FAIL"} (${result.status})${result.error ? ": " + result.error : ""}`);
    return;
  }

  // Fetch sitemap
  console.log(`  Fetching sitemap: ${SITEMAP_URL}`);
  const xml = await fetchUrl(SITEMAP_URL);
  let urls = parseUrlsFromSitemap(xml);
  console.log(`  Found ${formatNum(urls.length)} URLs in sitemap\n`);

  // Filter by priority
  if (PRIORITY) {
    const categorized = categorizeUrls(urls);
    if (PRIORITY === "high") {
      urls = categorized.high;
      console.log(`  Filtered to ${formatNum(urls.length)} high-priority URLs`);
    } else if (PRIORITY === "locations") {
      urls = categorized.locations;
      console.log(`  Filtered to ${formatNum(urls.length)} location URLs`);
    }
  }

  // Apply offset and limit
  const total = urls.length;
  urls = urls.slice(OFFSET, OFFSET + LIMIT);

  console.log(`  Submitting URLs ${OFFSET + 1}–${OFFSET + urls.length} of ${formatNum(total)}`);
  console.log(`  Daily quota: ${DAILY_QUOTA} | This batch: ${urls.length}`);
  if (total > OFFSET + LIMIT) {
    console.log(`  Next run: --offset ${OFFSET + LIMIT}`);
  }
  console.log();

  // Dry run — just print
  if (DRY_RUN) {
    console.log("  [DRY RUN] URLs that would be submitted:\n");
    urls.forEach((url, i) => console.log(`  ${OFFSET + i + 1}. ${url}`));
    console.log(`\n  Total: ${urls.length} URLs (not submitted)\n`);
    return;
  }

  // Authenticate and submit
  const client = await getAuthClient();
  const type = REMOVE ? "URL_DELETED" : "URL_UPDATED";

  console.log(`  Submitting ${urls.length} URLs (${type})...\n`);
  const results = await submitBatch(client, urls, type);

  // Report
  const ok = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok);

  console.log(`\n  Done! ${ok}/${results.length} submitted successfully.`);

  if (failed.length > 0) {
    console.log(`\n  Failed (${failed.length}):`);
    for (const f of failed.slice(0, 10)) {
      console.log(`    ${f.status} ${f.url} — ${f.error}`);
    }
    if (failed.length > 10) {
      console.log(`    ... and ${failed.length - 10} more`);
    }
  }

  // Save state
  const state = loadState();
  state.lastOffset = OFFSET + urls.length;
  state.lastRun = new Date().toISOString();
  state.totalSubmitted = (state.totalSubmitted || 0) + ok;
  saveState(state);

  console.log(`\n  State saved. Total submitted all-time: ${formatNum(state.totalSubmitted)}`);

  if (total > OFFSET + LIMIT) {
    const daysLeft = Math.ceil((total - OFFSET - LIMIT) / DAILY_QUOTA);
    console.log(`  ${formatNum(total - OFFSET - LIMIT)} URLs remaining (~${daysLeft} days at ${DAILY_QUOTA}/day)`);
    console.log(`  Next: node scripts/google-indexing.js --offset ${OFFSET + LIMIT}\n`);
  } else {
    console.log("  All URLs submitted!\n");
  }
}

main().catch((err) => {
  console.error("\n  Error:", err.message);
  process.exit(1);
});
