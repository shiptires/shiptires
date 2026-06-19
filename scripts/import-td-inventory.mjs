/**
 * Parse TD Wholesale inventory file (TD.txt) and upload to Supabase distributor_inventory.
 * Matches each tire against Turso DB for tire_id.
 */
import { createClient as createTursoClient } from "@libsql/client";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const TURSO_URL = "libsql://shiptires-cryptoshah.aws-us-west-2.turso.io";
const TURSO_TOKEN = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODEyMzY2MTMsImlkIjoiMDE5ZWI5ZjgtMDgwMS03MmRiLTk5NGQtYTFlZmM0YzNlNTQ0IiwicmlkIjoiMjVhYjViZTctNjc2ZS00ZjVmLTgxMDUtYTAwODFjMzQ4YWY5In0.CK8eWDTMQxbQS2xBLRRvkTvdJDy35d97-t0zhlH1ZxXEBGiYsD_AXXFjpYXhGPNB22MJAVzA9dAkzXRWadwaDg";
const SUPABASE_URL = "https://jrzccxsakhmnbhtnusih.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpyemNjeHNha2htbmJodG51c2loIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTMyMzUxNiwiZXhwIjoyMDg0ODk5NTE2fQ.W-HmE-YHq8EMX7Ivnrb4evZ3S-X5xJDlGHR70M0Qof4";
const DISTRIBUTOR_ID = "7009c439-32ab-43bb-b3d7-64f3b8bce46c";

const turso = createTursoClient({ url: TURSO_URL, authToken: TURSO_TOKEN });
const supabase = createSupabaseClient(SUPABASE_URL, SUPABASE_KEY);

// ── Known brand patterns ─────────────────────────────────────
const BRAND_PATTERNS = [
  { patterns: ["BFGOODRICH", "BF GOODRICH", "BFG "], dbName: "BFGOODRICH", display: "BFGoodrich" },
  { patterns: ["YOKOHAMA"], dbName: "YOKOHAMA", display: "Yokohama" },
  { patterns: ["MICHELIN"], dbName: "MICHELIN", display: "Michelin" },
  { patterns: ["GOODYEAR"], dbName: "GOODYEAR", display: "Goodyear" },
  { patterns: ["CONTINENTAL"], dbName: "CONTINENTAL", display: "Continental" },
  { patterns: ["BRIDGESTONE"], dbName: "BRIDGESTONE", display: "Bridgestone" },
  { patterns: ["FIRESTONE"], dbName: "FIRESTONE", display: "Firestone" },
  { patterns: ["PIRELLI"], dbName: "PIRELLI", display: "Pirelli" },
  { patterns: ["HANKOOK"], dbName: "HANKOOK", display: "Hankook" },
  { patterns: ["TOYO"], dbName: "TOYO", display: "Toyo" },
  { patterns: ["FALKEN"], dbName: "FALKEN", display: "Falken" },
  { patterns: ["COOPER"], dbName: "COOPER", display: "Cooper" },
  { patterns: ["NITTO"], dbName: "NITTO", display: "Nitto" },
  { patterns: ["KUMHO"], dbName: "KUMHO", display: "Kumho" },
  { patterns: ["GENERAL"], dbName: "GENERAL", display: "General" },
  { patterns: ["DUNLOP"], dbName: "DUNLOP", display: "Dunlop" },
];

function detectBrand(description) {
  const upper = description.toUpperCase();
  for (const b of BRAND_PATTERNS) {
    for (const pat of b.patterns) {
      if (upper.includes(pat)) return b;
    }
  }
  return null;
}

// ── Parse TD.txt ─────────────────────────────────────────────
function parseTDFile(filePath) {
  const raw = readFileSync(filePath, "utf-8");
  const lines = raw.split("\n").map((l) => l.trim());
  const tires = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    // Skip empty, "Button", or qty-only lines (handle "24+" format too)
    if (!line || line === "Button" || /^\d+\+?$/.test(line)) continue;

    // A tire data line has tabs with Part#, Price, etc.
    const parts = line.split("\t").filter((p) => p !== "");
    if (parts.length < 3) continue;

    const description = parts[0];
    const partNumber = parts[1];
    const priceStr = parts[3];
    const fetStr = parts[4];

    if (!priceStr || !priceStr.startsWith("$")) continue;

    const cost = parseFloat(priceStr.replace("$", ""));
    const fet = parseFloat((fetStr || "$0.00").replace("$", ""));

    // Get warehouse qty from the main line (handle "24+" format)
    const warehouseQty = parseInt(String(parts[5]).replace("+", "")) || 0;

    // Collect other warehouse qtys from following lines
    let totalQty = warehouseQty;
    for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
      const next = lines[j].trim();
      if (next === "Button") continue;
      if (/^\d+\+?$/.test(next)) {
        totalQty += parseInt(next.replace("+", ""));
        continue;
      }
      break;
    }

    // Parse size from description (handle commercial sizes like 295/75R22.5)
    const sizeMatch = description.match(
      /^(LT)?(P)?(\d{3})\/(\d{2,3})(R|ZR)(\d{2}(?:\.\d)?)/i
    );
    if (!sizeMatch) {
      console.log(`⚠ Could not parse size from: ${description}`);
      continue;
    }
    const ltPrefix = sizeMatch[1] || "";
    const pPrefix = sizeMatch[2] || "";
    const width = sizeMatch[3];
    const aspect = sizeMatch[4];
    const rimRaw = sizeMatch[6];
    const rim = rimRaw.includes(".") ? rimRaw : rimRaw; // keep as-is

    // Skip commercial tire sizes (22.5, 24.5) - not in consumer DB
    if (rimRaw.includes(".")) {
      console.log(`⚠ Skipping commercial size: ${description}`);
      continue;
    }

    const size = `${width}/${aspect}R${rim}`;
    const fullSize = ltPrefix ? `LT${size}` : pPrefix ? `P${size}` : size;

    // Detect brand from description
    const brandInfo = detectBrand(description);
    if (!brandInfo) {
      console.log(`⚠ Unknown brand in: ${description}`);
      continue;
    }

    // Extract model name — strip size prefix and brand
    const brandRegex = new RegExp(
      brandInfo.patterns.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"),
      "i"
    );
    let model = description
      .replace(/^(LT)?(P)?\d{3}\/\d{2,3}(R|ZR)\d{2}(?:\.\d)?(\/\d+)?(XL)?\s*/i, "") // strip size
      .replace(new RegExp(`\\d+PR\\s+`, "i"), "") // strip ply rating like "8PR "
      .replace(brandRegex, "") // strip brand
      .replace(/\s+\d{2,3}\/\d{2,3}[A-Z]?\s*$/, "") // strip trailing load/speed if duplicated
      .replace(/\s+\d{2,3}[A-Z]\s.*$/, "") // strip load/speed rating and everything after
      .replace(/\s+\*+[^*]+\*+\s*$/i, "") // strip *60K* etc
      .replace(/\s+''+[^']+''.*$/i, "") // strip ''TAKE-OFF'' etc
      .replace(/\s+"[^"]+"\s*$/i, "") // strip "TRAILER" etc
      .replace(/\s+\$+\s*$/, "") // strip $$$$
      .trim();

    // Clean up model further
    model = model
      .replace(/\s+RWL.*$/i, "")
      .replace(/\s+OWL.*$/i, "")
      .replace(/\s+BSW.*$/i, "")
      .replace(/\s+BW\s.*$/i, "")
      .replace(/\s+TL\s*$/i, "")
      .replace(/\s+\d+ PLY.*$/i, "")
      .replace(/\s+\d+PLY.*$/i, "")
      .replace(/\s+D\/\d+PR.*$/i, "") // strip D/8PR etc
      .replace(/\s+\d{3}[A-Z]{2,3}\s.*$/i, "") // strip UTQG like 400AAA, 620AB
      .replace(/\s+\d{2,3}K\s*$/i, "") // strip warranty like 45K, 65K
      .replace(/\s+\d{2,3}K\s+/i, " ") // strip warranty in middle
      .replace(/\s+\*+.*\*+/i, "") // strip anything in asterisks
      .replace(/\s+DOT-\d{4}.*$/i, "") // strip DOT year
      .replace(/\s{2,}/g, " ")
      .trim();

    tires.push({
      description,
      partNumber,
      cost,
      fet,
      quantity: totalQty,
      size,
      fullSize,
      width: parseInt(width),
      aspect: parseInt(aspect),
      rim: parseInt(rim),
      model,
      brand: brandInfo.dbName,
      brandDisplay: brandInfo.display,
      ltPrefix: !!ltPrefix,
    });
  }

  return tires;
}

// ── Slugify for matching ─────────────────────────────────────
function toSlug(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// ── Search Turso DB with retry ───────────────────────────────
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

function matchModel(rows, tire) {
  const tireSlug = toSlug(tire.model);

  // 1. Exact slug match
  let match = rows.find((r) => toSlug(String(r.model_name)) === tireSlug);
  if (match) return match;

  // 2. Slug contains match
  match = rows.find((r) => {
    const dbSlug = toSlug(String(r.model_name));
    return dbSlug.includes(tireSlug) || tireSlug.includes(dbSlug);
  });
  if (match) return match;

  // 3. Keyword overlap
  const tireWords = tireSlug.split("-").filter((w) => w.length > 1);
  match = rows.find((r) => {
    const dbSlug = toSlug(String(r.model_name));
    return tireWords.filter((w) => dbSlug.includes(w)).length >= 2;
  });
  if (match) return match;

  // 4. Strong keyword match
  match = rows.find((r) => {
    const dbModel = String(r.model_name).toLowerCase();
    const tdModel = tire.model.toLowerCase();
    for (const key of ["ko2", "km3", "ko ", "kdw", "comp-2", "radial t/a", "trail terrain", "advantage control", "advantage t/a", "geolandar", "geolander", "avid", "s drive", "s-drive", "ascend", "envigor", "touring"]) {
      if (tdModel.includes(key) && dbModel.includes(key)) return true;
    }
    return false;
  });
  if (match) return match;

  return null;
}

// ── Process a single tire (query + match) ────────────────────
async function processTire(tire) {
  const result = await tursoQuery(
    `SELECT id, name, make_name, model_name, width, aspect_ratio, rim_size,
            load_rating, speed_rating, price_map
     FROM tires
     WHERE UPPER(make_name) = ?
       AND CAST(width AS TEXT) = ?
       AND CAST(aspect_ratio AS TEXT) = ?
       AND CAST(rim_size AS TEXT) = ?
     LIMIT 50`,
    [tire.brand.toUpperCase(), String(tire.width), String(tire.aspect), String(tire.rim)]
  );

  if (result.rows.length === 0) return null;
  return matchModel(result.rows, tire);
}

// ── Run N promises concurrently ──────────────────────────────
async function parallelMap(items, fn, concurrency = 5) {
  const results = new Array(items.length);
  let idx = 0;

  async function worker() {
    while (idx < items.length) {
      const i = idx++;
      results[i] = await fn(items[i], i);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()));
  return results;
}

// ── Main ─────────────────────────────────────────────────────
async function main() {
  const filePath = process.argv[2] || "C:\\Users\\crypt\\Downloads\\TD.txt";
  console.log(`\nParsing ${filePath}...\n`);

  const tires = parseTDFile(filePath);
  console.log(`Found ${tires.length} tires\n`);

  const matched = [];
  const unmatched = [];

  // Process all tires with 5 concurrent Turso queries
  console.log("Matching against Turso DB (5 concurrent)...\n");
  const results = await parallelMap(tires, async (tire) => {
    try {
      return await processTire(tire);
    } catch (e) {
      console.error(`  ERROR ${tire.description}: ${e.message}`);
      return null;
    }
  }, 5);

  // Collect results
  for (let i = 0; i < tires.length; i++) {
    const tire = tires[i];
    const dbMatch = results[i];
    if (dbMatch) {
      const ebayPrice = Math.round(((tire.cost + 55) / 0.6975) * 100) / 100;
      const sitePrice = Math.round(((tire.cost + 55) / 0.82) * 100) / 100;
      matched.push({
        ...tire,
        tireId: Number(dbMatch.id),
        dbModel: String(dbMatch.model_name),
        dbName: String(dbMatch.name),
        mapPrice: dbMatch.price_map,
        ebayPrice,
        sitePrice,
      });
      console.log(`✓ ${tire.fullSize} ${tire.model} → ${dbMatch.model_name} (${dbMatch.id}) | $${tire.cost} → Site $${sitePrice} / eBay $${ebayPrice} | Qty ${tire.quantity}`);
    } else {
      unmatched.push(tire);
      console.log(`✗ ${tire.fullSize} ${tire.model} — NO MATCH | $${tire.cost} | Qty ${tire.quantity}`);
    }
  }

  console.log(`\n─── Summary ───`);
  console.log(`Matched: ${matched.length} / ${tires.length}`);
  console.log(`Unmatched: ${unmatched.length}`);

  if (matched.length === 0) {
    console.log("\nNo matches to upload.");
    return;
  }

  // Deduplicate by tire_id
  const byTireId = new Map();
  for (const m of matched) {
    const existing = byTireId.get(m.tireId);
    if (existing) {
      existing.quantity += m.quantity;
      if (m.cost < existing.cost) { existing.cost = m.cost; existing.partNumber = m.partNumber; existing.fullSize = m.fullSize; }
      console.log(`  ↳ Combined tire_id ${m.tireId}: qty=${existing.quantity}`);
    } else {
      byTireId.set(m.tireId, { ...m });
    }
  }

  const deduped = Array.from(byTireId.values());
  console.log(`\nUploading ${deduped.length} unique items to Supabase...`);

  let uploaded = 0;
  let errors = 0;
  for (const m of deduped) {
    const { error } = await supabase
      .from("distributor_inventory")
      .upsert({
        distributor_id: DISTRIBUTOR_ID,
        tire_id: m.tireId,
        cost: m.cost,
        quantity: m.quantity,
        part_number: m.partNumber,
        brand: m.brandDisplay || m.brand,
        model: m.dbModel,
        size: m.fullSize,
        active: true,
      }, { onConflict: "distributor_id,tire_id" });

    if (error) { console.error(`  ✗ tire_id ${m.tireId}: ${error.message}`); errors++; }
    else uploaded++;
  }

  console.log(`\n✓ Uploaded: ${uploaded} | Errors: ${errors}`);

  if (unmatched.length > 0) {
    console.log(`\n─── Unmatched ───`);
    for (const u of unmatched) console.log(`  ${u.fullSize} ${u.model} ($${u.cost}, qty ${u.quantity})`);
  }

  console.log("\nDone.");
}

main().catch(console.error);
