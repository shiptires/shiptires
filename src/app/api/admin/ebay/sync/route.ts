import { isAdminRequest } from "@/lib/admin-auth";
import { searchTires } from "@/lib/db";
import type { TireRow } from "@/lib/db";
import {
  addFixedPriceItem,
  getActiveListings,
  getCompetitivePrice,
  reviseItemWithImages,
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
      brand,
      model,
      width,
      aspectRatio,
      rimSize,
      season,
      terrain,
      minPrice,
      maxPrice,
      limit = 500,
      dryRun = false,
    } = body as {
      brand?: string;
      model?: string;
      width?: string;
      aspectRatio?: string;
      rimSize?: string;
      season?: string;
      terrain?: string;
      minPrice?: number;
      maxPrice?: number;
      limit?: number;
      dryRun?: boolean;
    };

    // Use searchTires with all filters — paginate through all results
    const pageSize = Math.min(limit, 100);
    let allTires: TireRow[] = [];
    let total = 0;
    let page = 1;

    while (allTires.length < limit) {
      const searchResult = await searchTires({
        brand: brand || undefined,
        query: model || undefined,
        width: width || undefined,
        aspectRatio: aspectRatio || undefined,
        rimSize: rimSize || undefined,
        season: season || undefined,
        terrain: terrain || undefined,
        minPrice: minPrice ?? undefined,
        maxPrice: maxPrice ?? undefined,
        page,
        limit: pageSize,
      });

      if (page === 1) total = searchResult.total;
      allTires = allTires.concat(searchResult.tires);

      if (searchResult.tires.length < pageSize || allTires.length >= limit) break;
      page++;
    }

    // Trim to requested limit
    if (allTires.length > limit) allTires = allTires.slice(0, limit);

    // Filter to only tires with pricing
    allTires = allTires.filter((t) => (t.price_map ?? 0) > 0);

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

    for (const tire of allTires) {
      const sku = tireToSku(tire);
      const key = productKey(tire);

      // Deduplicate within this sync batch
      if (seenInBatch.has(key)) {
        result.duplicatesInBatch++;
        result.skipped++;
        continue;
      }
      seenInBatch.add(key);

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
          // Product already listed — revise price + push all images
          await reviseItemWithImages(
            existing.itemId,
            parseFloat(mapped.listing.price),
            mapped.listing.imageUrls
          );
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
