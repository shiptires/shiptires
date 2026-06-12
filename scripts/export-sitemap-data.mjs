#!/usr/bin/env node
/**
 * export-sitemap-data.mjs
 *
 * Runs locally (where D:/SHIP.TIRES/ship_tires.db exists) to export
 * curated brand+model pairs and distinct tire sizes to static JSON files
 * that Vercel builds can use without local DB access.
 *
 * Usage: node scripts/export-sitemap-data.mjs
 */

import { createRequire } from "module";
import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const Database = require("better-sqlite3");

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, "..");
const DB_PATH = process.env.TIRE_DB_PATH || "D:/SHIP.TIRES/ship_tires.db";

const CURATED_BRANDS = [
  "ADVANTA", "BFGOODRICH", "BRIDGESTONE", "CONTINENTAL", "COOPER",
  "DUNLOP", "FALKEN", "FIRESTONE", "GENERAL", "GOODYEAR",
  "HANKOOK", "HOOSIER", "KENDA", "KUMHO", "LAUFENN",
  "MAXXIS", "MICHELIN", "MICKEY THOMPSON", "NANKANG", "NEXEN",
  "NITTO", "NOKIAN", "PIRELLI", "POWER KING", "RADAR",
  "RANGE FINDER", "RIKEN", "SUMITOMO", "TOYO", "UNIROYAL",
  "VITOUR", "VOGUE", "VREDESTEIN", "YOKOHAMA",
];

function toSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function sizeSlug(width, aspectRatio, rimSize) {
  return `${width}-${aspectRatio}r${rimSize}`.toLowerCase();
}

function main() {
  console.log(`Opening database: ${DB_PATH}`);
  const db = new Database(DB_PATH, { readonly: true });

  const placeholders = CURATED_BRANDS.map(() => "?").join(",");

  // --- Export brand+model pairs ---
  const modelRows = db
    .prepare(
      `SELECT DISTINCT UPPER(make_name) AS brand, model_name
       FROM tires
       WHERE UPPER(make_name) IN (${placeholders})
       ORDER BY brand, model_name`
    )
    .all(...CURATED_BRANDS);

  const products = modelRows.map((r) => ({
    brand: r.brand,
    brandSlug: toSlug(r.brand),
    model: r.model_name,
    modelSlug: toSlug(r.model_name),
  }));

  const productsPath = join(PROJECT_ROOT, "src/data/sitemap-products.json");
  writeFileSync(productsPath, JSON.stringify(products, null, 2));
  console.log(`Wrote ${products.length} products → ${productsPath}`);

  // --- Export distinct sizes ---
  const sizeRows = db
    .prepare(
      `SELECT DISTINCT width, aspect_ratio, rim_size
       FROM tires
       WHERE width IS NOT NULL AND aspect_ratio IS NOT NULL AND rim_size IS NOT NULL
         AND length(width) > 0
         AND UPPER(make_name) IN (${placeholders})
       ORDER BY CAST(width AS INTEGER), CAST(aspect_ratio AS INTEGER), CAST(rim_size AS INTEGER)`
    )
    .all(...CURATED_BRANDS);

  const sizes = sizeRows.map((r) => ({
    size: `${r.width}/${r.aspect_ratio}R${r.rim_size}`,
    slug: sizeSlug(r.width, r.aspect_ratio, r.rim_size),
    width: r.width,
    aspectRatio: r.aspect_ratio,
    rimSize: r.rim_size,
  }));

  const sizesPath = join(PROJECT_ROOT, "src/data/sitemap-sizes.json");
  writeFileSync(sizesPath, JSON.stringify(sizes, null, 2));
  console.log(`Wrote ${sizes.length} sizes → ${sizesPath}`);

  db.close();
  console.log("Done.");
}

main();
