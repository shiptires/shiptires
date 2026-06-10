/**
 * Sync local SQLite DB → Turso cloud database
 * Usage: node scripts/sync-to-turso.mjs
 */
import Database from "better-sqlite3";
import { createClient } from "@libsql/client";

const LOCAL_DB = process.env.TIRE_DB_PATH || "D:/SHIP.TIRES/ship_tires.db";
const TURSO_URL = "libsql://ship-tires-sigmaagents.aws-us-west-2.turso.io";
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;

if (!TURSO_TOKEN) {
  console.error("Set TURSO_AUTH_TOKEN env var");
  process.exit(1);
}

const local = new Database(LOCAL_DB, { readonly: true });
const turso = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN });

async function run() {
  // 1. Get schema from local DB
  console.log("[1] Reading schema...");
  const tables = local
    .prepare("SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
    .all();

  for (const t of tables) {
    console.log(`  Creating table: ${t.name}`);
    await turso.execute(`DROP TABLE IF EXISTS ${t.name}`);
    await turso.execute(t.sql);
  }

  // 2. Copy data table by table in batches
  for (const t of tables) {
    const count = local.prepare(`SELECT COUNT(*) as c FROM ${t.name}`).get().c;
    console.log(`[2] Syncing ${t.name}: ${count} rows`);

    const BATCH = 200;
    for (let offset = 0; offset < count; offset += BATCH) {
      const rows = local.prepare(`SELECT * FROM ${t.name} LIMIT ? OFFSET ?`).all(BATCH, offset);
      if (rows.length === 0) break;

      const cols = Object.keys(rows[0]);
      const placeholders = cols.map(() => "?").join(",");
      const sql = `INSERT INTO ${t.name} (${cols.join(",")}) VALUES (${placeholders})`;

      // Use batch for efficiency
      const stmts = rows.map((row) => ({
        sql,
        args: cols.map((c) => row[c] ?? null),
      }));

      await turso.batch(stmts);

      if ((offset + BATCH) % 5000 === 0 || offset + BATCH >= count) {
        console.log(`  ${Math.min(offset + BATCH, count)}/${count}`);
      }
    }
  }

  // 3. Copy indexes
  console.log("[3] Creating indexes...");
  const indexes = local
    .prepare("SELECT sql FROM sqlite_master WHERE type='index' AND sql IS NOT NULL")
    .all();
  for (const idx of indexes) {
    try {
      await turso.execute(idx.sql);
    } catch (e) {
      console.log(`  Skipped index: ${e.message?.slice(0, 60)}`);
    }
  }

  console.log("Done!");
  local.close();
  turso.close();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
