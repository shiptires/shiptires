/**
 * Push local SQLite data → Turso (remote libSQL)
 * Uses @libsql/client already installed in ship-tires project
 */

import { createClient } from "@libsql/client";
import Database from "better-sqlite3";

const TURSO_URL = "libsql://ship-tires-sigmaagents.aws-us-west-2.turso.io";
const TURSO_TOKEN = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODEwOTE2NTcsImlkIjoiMDE5ZWIwYjUtZjMwMS03OWVjLWI3YmUtYTljYjA1MGJlMDE4IiwicmlkIjoiOWI0YjYxYTAtY2IzYi00NTk0LWE3NTgtMTliYzlmNDIzMDk0In0.WWH1bPs-mzztBRZCaOmxoFCCfug9Nvcg01CPGRLD1_g22CHEM5Gnwe7k8hEI1MyZv0IEt10KzUBmIc-0ZhlwAw";
const LOCAL_DB = "D:\\SHIP.TIRES\\ship_tires.db";

const PRIORITY_BRANDS = [
  "ADVANTA","BFGOODRICH","BRIDGESTONE","CONTINENTAL","COOPER",
  "DUNLOP","FALKEN","FIRESTONE","GENERAL","GOODYEAR",
  "HANKOOK","HOOSIER","KENDA","KUMHO","LAUFENN",
  "MAXXIS","MICHELIN","MICKEY THOMPSON","NANKANG","NEXEN",
  "NITTO","NOKIAN","PIRELLI","POWER KING","RADAR",
  "RANGE FINDER","RIKEN","SUMITOMO","TOYO","UNIROYAL",
  "VITOUR","VOGUE","VREDESTEIN","YOKOHAMA",
];

const turso = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN });
const local = new Database(LOCAL_DB, { readonly: true });

// ---- Step 1: Create tables ----
console.log("Creating tables in Turso...");
await turso.execute(`CREATE TABLE IF NOT EXISTS manufacturers (
  id INTEGER PRIMARY KEY, name TEXT, image_url TEXT, local_logo TEXT,
  dot_reg_url TEXT, updated_at TEXT
)`);
await turso.execute(`CREATE TABLE IF NOT EXISTS tires (
  id INTEGER PRIMARY KEY, name TEXT, item_number TEXT, tire_model_id INTEGER,
  tire_make_id INTEGER, width TEXT, aspect_ratio TEXT, rim_size TEXT,
  section_width TEXT, diameter_overall TEXT, load_rating TEXT, speed_rating TEXT,
  ply_rating TEXT, load_range TEXT, utqg TEXT, load_capacity_single TEXT,
  load_capacity_dual TEXT, max_inflation_pressure TEXT, revolutions_per_mile TEXT,
  rolling_circumference TEXT, tread_depth TEXT, weight TEXT, sidewall TEXT,
  rim_approved_width TEXT, rim_diameter_metric TEXT, season TEXT, terrain TEXT,
  studdable TEXT, category TEXT, three_pmsf TEXT, run_flat TEXT, mud_and_snow TEXT,
  price_map REAL, warranty TEXT, gm_code TEXT, upc TEXT, ean TEXT, asin TEXT,
  thumbnail_url TEXT, angle_image_url TEXT, front_image_url TEXT,
  side_image_url TEXT, side2_image_url TEXT, image_0100_url TEXT,
  image_0200_url TEXT, image_0301_url TEXT, image_0302_url TEXT,
  local_thumbnail TEXT, local_angle TEXT, local_front TEXT, local_side TEXT,
  local_side2 TEXT, make_name TEXT, make_image_url TEXT, model_name TEXT,
  has_detail INTEGER DEFAULT 0, updated_at TEXT
)`);
await turso.execute(`CREATE TABLE IF NOT EXISTS tire_models (
  id INTEGER PRIMARY KEY, name TEXT, description TEXT, features TEXT,
  benefits TEXT, image_url TEXT, image_360_url TEXT, image_360_thumbnail_url TEXT,
  video_url TEXT, manufacturer_url TEXT, three_pmsf TEXT, local_image TEXT,
  local_image_360 TEXT, updated_at TEXT
)`);
await turso.execute("CREATE INDEX IF NOT EXISTS idx_tires_make ON tires(make_name)");
await turso.execute("CREATE INDEX IF NOT EXISTS idx_tires_model ON tires(model_name)");
await turso.execute("CREATE INDEX IF NOT EXISTS idx_tires_size ON tires(width, aspect_ratio, rim_size)");
await turso.execute("CREATE INDEX IF NOT EXISTS idx_tires_make_model ON tires(make_name, model_name)");
console.log("Tables created.");

// ---- Step 2: Push manufacturers ----
console.log("\nPushing manufacturers...");
const mfrs = local.prepare("SELECT * FROM manufacturers").all();
console.log(`  ${mfrs.length} manufacturers`);

const BATCH = 20;
for (let i = 0; i < mfrs.length; i += BATCH) {
  const batch = mfrs.slice(i, i + BATCH);
  const tx = batch.map((row) => ({
    sql: "INSERT OR REPLACE INTO manufacturers (id,name,image_url,local_logo,dot_reg_url,updated_at) VALUES (?,?,?,?,?,?)",
    args: [row.id, row.name, row.image_url, row.local_logo, row.dot_reg_url, row.updated_at],
  }));
  await turso.batch(tx, "write");
}
console.log(`  Done: ${mfrs.length} pushed.`);

// ---- Step 3: Push curated brand tires ----
console.log("\nPushing curated brand tires...");
const ph = PRIORITY_BRANDS.map(() => "?").join(",");
const totalRow = local.prepare(`SELECT COUNT(*) as c FROM tires WHERE UPPER(make_name) IN (${ph})`).get(...PRIORITY_BRANDS);
const total = totalRow.c;
console.log(`  ${total.toLocaleString()} curated tires to push`);

const tireCols = local.prepare("PRAGMA table_info(tires)").all().map((r) => r.name);
const tireColStr = tireCols.join(",");
const tirePlaceholders = tireCols.map(() => "?").join(",");

const TIRE_BATCH = 25; // Turso free tier has small batch limits
let pushed = 0;
let offset = 0;

while (offset < total) {
  const rows = local.prepare(`
    SELECT * FROM tires WHERE UPPER(make_name) IN (${ph})
    ORDER BY id LIMIT ? OFFSET ?
  `).all(...PRIORITY_BRANDS, TIRE_BATCH, offset);

  if (rows.length === 0) break;

  const tx = rows.map((row) => ({
    sql: `INSERT OR REPLACE INTO tires (${tireColStr}) VALUES (${tirePlaceholders})`,
    args: tireCols.map((col) => row[col] ?? null),
  }));

  try {
    await turso.batch(tx, "write");
    pushed += rows.length;
  } catch (e) {
    console.error(`  Error at offset ${offset}: ${e.message}`);
    // Try smaller batch
    for (const stmt of tx) {
      try { await turso.execute(stmt); pushed++; } catch { /* skip */ }
    }
  }

  offset += TIRE_BATCH;
  if (pushed % 500 === 0 && pushed > 0) {
    console.log(`  ${pushed.toLocaleString()}/${total.toLocaleString()} pushed`);
  }
}
console.log(`  Done: ${pushed.toLocaleString()} tires pushed.`);

// ---- Step 4: Push tire_models ----
console.log("\nPushing tire models...");
const modelTotal = local.prepare("SELECT COUNT(*) as c FROM tire_models").get().c;
console.log(`  ${modelTotal.toLocaleString()} tire models`);

const modelCols = local.prepare("PRAGMA table_info(tire_models)").all().map((r) => r.name);
const modelColStr = modelCols.join(",");
const modelPh = modelCols.map(() => "?").join(",");

offset = 0;
pushed = 0;

while (offset < modelTotal) {
  const rows = local.prepare(`SELECT * FROM tire_models ORDER BY id LIMIT ? OFFSET ?`).all(TIRE_BATCH, offset);
  if (rows.length === 0) break;

  const tx = rows.map((row) => ({
    sql: `INSERT OR REPLACE INTO tire_models (${modelColStr}) VALUES (${modelPh})`,
    args: modelCols.map((col) => row[col] ?? null),
  }));

  try {
    await turso.batch(tx, "write");
    pushed += rows.length;
  } catch (e) {
    console.error(`  Error: ${e.message}`);
    for (const stmt of tx) {
      try { await turso.execute(stmt); pushed++; } catch { /* skip */ }
    }
  }

  offset += TIRE_BATCH;
  if (pushed % 500 === 0 && pushed > 0) {
    console.log(`  ${pushed.toLocaleString()}/${modelTotal.toLocaleString()} pushed`);
  }
}
console.log(`  Done: ${pushed.toLocaleString()} tire models pushed.`);

local.close();
turso.close();
console.log("\n=== PUSH COMPLETE ===");
