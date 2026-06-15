import { isAdminRequest } from "@/lib/admin-auth";
import { getTiresForFeed } from "@/lib/db";
import type { TireRow } from "@/lib/db";
import {
  addFixedPriceItem,
  getActiveListings,
  getCompetitivePrice,
  revisePrice,
  tireToEbayItem,
  tireToSku,
} from "@/lib/ebay";

export const maxDuration = 300; // 5 min for large syncs

interface SyncResult {
  synced: number;
  skipped: number;
  revised: number;
  duplicatesInBatch: number;
  errors: Array<{ sku: string; error: string }>;
  total: number;
  dryRun: boolean;
}

const R2_BASE = "https://pub-1404e52fd5554e9dac9a045b7bb89f22.r2.dev";

function resolveImageUrl(row: TireRow): string | null {
  const sources = [row.local_thumbnail, row.thumbnail_url, row.image_0100_url];
  for (const src of sources) {
    if (!src || src === "FAILED") continue;
    if (src.startsWith("images/") || src.startsWith("images\\")) {
      const r2Path = src.replace(/\\/g, "/").replace(/^images\//, "");
      return `${R2_BASE}/${r2Path}`;
    }
    if (src.startsWith("http")) return src;
  }
  return null;
}

/** Build a product key from a tire to identify duplicates (same brand+model+size) */
function productKey(tire: TireRow): string {
  const parsed = tire.name.match(/(\d{3})\s*\/\s*(\d{2,3})\s*[RrZz]\s*(\d{2}(?:\.\d)?)/);
  const width = tire.width || parsed?.[1] || "";
  const aspect = tire.aspect_ratio || parsed?.[2] || "";
  const rim = tire.rim_size || parsed?.[3] || "";
  return `${tire.make_name}|${tire.model_name}|${width}/${aspect}R${rim}`.toUpperCase();
}

/** Fetch all active eBay listings and build a title→itemId lookup */
async function buildExistingListingsMap(): Promise<Map<string, { itemId: string; quantity: number }>> {
  const map = new Map<string, { itemId: string; quantity: number }>();
  try {
    const first = await getActiveListings(1, 200);
    for (const item of first.items) {
      map.set(item.title.toUpperCase(), { itemId: item.itemId, quantity: item.quantity });
    }
    for (let p = 2; p <= first.totalPages; p++) {
      const page = await getActiveListings(p, 200);
      for (const item of page.items) {
        map.set(item.title.toUpperCase(), { itemId: item.itemId, quantity: item.quantity });
      }
    }
  } catch (e) {
    console.warn("[ebay sync] Could not fetch existing listings for dedup:", e);
  }
  return map;
}

export async function POST(req: Request) {
  if (!(await isAdminRequest())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      brandSlugs,
      limit = 500,
      offset = 0,
      dryRun = false,
    } = body as {
      brandSlugs?: string[];
      limit?: number;
      offset?: number;
      dryRun?: boolean;
    };

    const { tires, total } = await getTiresForFeed(offset, limit, brandSlugs);

    const result: SyncResult = {
      synced: 0,
      skipped: 0,
      revised: 0,
      duplicatesInBatch: 0,
      errors: [],
      total,
      dryRun,
    };

    // Fetch existing eBay listings to detect already-listed products
    const existingMap = dryRun ? new Map() : await buildExistingListingsMap();

    // Track products we've already processed in this batch
    const seenInBatch = new Set<string>();

    for (const tire of tires) {
      const sku = tireToSku(tire);
      const key = productKey(tire);

      // Deduplicate within this sync batch
      if (seenInBatch.has(key)) {
        result.duplicatesInBatch++;
        result.skipped++;
        continue;
      }
      seenInBatch.add(key);

      // Must have image + identifier
      const imageUrl = resolveImageUrl(tire);
      const gtin = tire.ean || tire.upc;
      const mpn = tire.item_number || tire.gm_code;

      if (!imageUrl || (!gtin && !mpn)) {
        result.skipped++;
        continue;
      }

      try {
        // Look up competitive pricing
        let competitivePrice: number | null = null;
        try {
          competitivePrice = await getCompetitivePrice(tire);
        } catch {
          // Non-fatal — fall back to MAP + markup
        }

        const mapped = tireToEbayItem(tire, competitivePrice);
        if (!mapped) {
          result.skipped++;
          continue;
        }

        if (dryRun) {
          result.synced++;
          continue;
        }

        // Check if this product already exists on eBay
        const existingTitle = mapped.listing.title.toUpperCase();
        const existing = existingMap.get(existingTitle);

        if (existing) {
          // Product already listed — revise price if different (keeps listing fresh)
          await revisePrice(existing.itemId, parseFloat(mapped.listing.price));
          result.revised++;
        } else {
          // New product — create listing
          await addFixedPriceItem(mapped.listing);
          result.synced++;
          // Add to map so subsequent duplicates in batch are caught
          existingMap.set(existingTitle, { itemId: "new", quantity: mapped.listing.quantity });
        }
      } catch (e) {
        result.errors.push({
          sku,
          error: e instanceof Error ? e.message : String(e),
        });
      }
    }

    return Response.json(result);
  } catch (e) {
    console.error("eBay sync error:", e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Failed to sync" },
      { status: 500 }
    );
  }
}
