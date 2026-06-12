#!/usr/bin/env node

/**
 * IndexNow Ping Script
 *
 * Reads the sitemap from https://ship.tires/sitemap.xml (or a local build),
 * extracts all <loc> URLs, and submits them to the IndexNow API in batches
 * of up to 10,000 URLs per request.
 *
 * Usage:
 *   node scripts/indexnow-ping.mjs                     # fetches live sitemap
 *   SITEMAP_URL=http://localhost:3000/sitemap.xml \
 *     node scripts/indexnow-ping.mjs                   # fetches local dev sitemap
 *
 * Requires INDEXNOW_KEY in .env.local or environment.
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Load .env.local (lightweight, no dependency)
// ---------------------------------------------------------------------------
function loadEnv() {
  try {
    const envPath = resolve(__dirname, "..", ".env.local");
    const lines = readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const value = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // .env.local may not exist; that is fine if INDEXNOW_KEY is already set
  }
}

loadEnv();

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const HOST = "ship.tires";
const INDEXNOW_KEY = process.env.INDEXNOW_KEY;
const SITEMAP_URL = process.env.SITEMAP_URL || `https://${HOST}/sitemap.xml`;
const KEY_LOCATION = `https://${HOST}/${INDEXNOW_KEY}.txt`;
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";
const BATCH_SIZE = 10_000;

if (!INDEXNOW_KEY) {
  console.error("ERROR: INDEXNOW_KEY is not set. Add it to .env.local or pass as env var.");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Fetch a single sitemap/index and extract <loc> URLs
// ---------------------------------------------------------------------------
async function fetchXmlLocs(url) {
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`  Warning: failed to fetch ${url}: ${res.status}`);
    return { locs: [], isSitemapIndex: false };
  }
  const xml = await res.text();

  const locs = [];
  const locRegex = /<loc>\s*(.*?)\s*<\/loc>/gi;
  let match;
  while ((match = locRegex.exec(xml)) !== null) {
    locs.push(match[1]);
  }

  // Detect sitemap index (contains <sitemap> tags)
  const isSitemapIndex = /<sitemap>/i.test(xml);
  return { locs, isSitemapIndex };
}

// ---------------------------------------------------------------------------
// Recursively fetch all page URLs from sitemap index + sub-sitemaps
// ---------------------------------------------------------------------------
async function fetchSitemapUrls() {
  console.log(`Fetching sitemap index: ${SITEMAP_URL}`);
  const { locs, isSitemapIndex } = await fetchXmlLocs(SITEMAP_URL);

  if (!isSitemapIndex) {
    console.log(`  Direct sitemap with ${locs.length} URLs`);
    return locs;
  }

  console.log(`  Sitemap index with ${locs.length} sub-sitemaps`);
  const allUrls = [];

  // Fetch all sub-sitemaps in parallel (batches of 10 to avoid hammering)
  for (let i = 0; i < locs.length; i += 10) {
    const batch = locs.slice(i, i + 10);
    const results = await Promise.all(
      batch.map(async (subUrl) => {
        const { locs: subLocs, isSitemapIndex: nested } = await fetchXmlLocs(subUrl);
        if (nested) {
          // One more level deep (shouldn't happen but handle it)
          const deepResults = await Promise.all(
            subLocs.map((u) => fetchXmlLocs(u).then((r) => r.locs))
          );
          return deepResults.flat();
        }
        return subLocs;
      })
    );
    for (const urls of results) {
      allUrls.push(...urls);
    }
    console.log(`  Fetched ${Math.min(i + 10, locs.length)}/${locs.length} sub-sitemaps (${allUrls.length} URLs so far)`);
  }

  return allUrls;
}

// ---------------------------------------------------------------------------
// Submit a batch to IndexNow
// ---------------------------------------------------------------------------
async function submitBatch(urls, batchNumber) {
  const payload = {
    host: HOST,
    key: INDEXNOW_KEY,
    keyLocation: KEY_LOCATION,
    urlList: urls,
  };

  console.log(`Submitting batch ${batchNumber} (${urls.length} URLs)...`);

  const res = await fetch(INDEXNOW_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(payload),
  });

  if (res.ok || res.status === 202) {
    console.log(`  Batch ${batchNumber}: accepted (${res.status})`);
  } else {
    const body = await res.text().catch(() => "");
    console.error(`  Batch ${batchNumber}: failed (${res.status}) ${body}`);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const urls = await fetchSitemapUrls();
  console.log(`Found ${urls.length} URLs in sitemap.`);

  if (urls.length === 0) {
    console.log("No URLs to submit.");
    return;
  }

  // Submit in batches of BATCH_SIZE
  const totalBatches = Math.ceil(urls.length / BATCH_SIZE);
  for (let i = 0; i < totalBatches; i++) {
    const batch = urls.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);
    await submitBatch(batch, i + 1);
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error("Fatal error:", err.message);
  process.exit(1);
});
