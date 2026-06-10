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
// Fetch sitemap and extract URLs
// ---------------------------------------------------------------------------
async function fetchSitemapUrls() {
  console.log(`Fetching sitemap: ${SITEMAP_URL}`);
  const res = await fetch(SITEMAP_URL);
  if (!res.ok) {
    throw new Error(`Failed to fetch sitemap: ${res.status} ${res.statusText}`);
  }
  const xml = await res.text();

  // Extract all <loc>...</loc> values
  const urls = [];
  const locRegex = /<loc>\s*(.*?)\s*<\/loc>/gi;
  let match;
  while ((match = locRegex.exec(xml)) !== null) {
    urls.push(match[1]);
  }

  return urls;
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
