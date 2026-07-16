import { isAdminRequest } from "@/lib/admin-auth";
import { searchTires } from "@/lib/db";
import type { TireRow } from "@/lib/db";
import {
  addFixedPriceItem,
  getActiveListings,
  reviseItemWithImages,
  tireToEbayItem,
  tireToSku,
  calculateDistributorPrice,
} from "@/lib/ebay";
import { getSupabase } from "@/lib/supabase";
import { getShippingByWeight } from "@/lib/pricing";

export const maxDuration = 300; // 5 min for large syncs

interface SyncResult {
  synced: number;
  skipped: number;
  revised: number;
  duplicatesInBatch: number;
  errors: Array<{ sku: string; error: string }>;
  total: number;
  existingOnEbay: number;
  existingSkuCount: number;
  dryRun: boolean;
  debug?: {
    ebayTitles: string[];
    ebaySkus: string[];
    generatedTitles: string[];
    generatedSkus: string[];
  };
}

/** Build a product key from a tire to identify duplicates (same brand+model+size) */
function productKey(tire: TireRow): string {
  const parsed = tire.name.match(/(\d{3})\s*\/\s*(\d{2,3})\s*[RrZz]\s*(\d{2}(?:\.\d)?)/);
  const width = tire.width || parsed?.[1] || "";
  const aspect = tire.aspect_ratio || parsed?.[2] || "";
  const rim = tire.rim_size || parsed?.[3] || "";
  return `${tire.make_name}|${tire.model_name}|${width}/${aspect}R${rim}`.toUpperCase();
}

interface ExistingListingEntry { itemId: string; quantity: number }

/** Fetch all active eBay listings and build title + SKU lookups */
async function buildExistingListingsMaps(): Promise<{
  byTitle: Map<string, ExistingListingEntry>;
  bySku: Map<string, ExistingListingEntry>;
}> {
  const byTitle = new Map<string, ExistingListingEntry>();
  const bySku = new Map<string, ExistingListingEntry>();
  try {
    const first = await getActiveListings(1, 200);
    for (const item of first.items) {
      const entry = { itemId: item.itemId, quantity: item.quantity };
      byTitle.set(item.title.toUpperCase(), entry);
      if (item.sku) bySku.set(item.sku.toUpperCase(), entry);
    }
    for (let p = 2; p <= first.totalPages; p++) {
      const page = await getActiveListings(p, 200);
      for (const item of page.items) {
        const entry = { itemId: item.itemId, quantity: item.quantity };
        byTitle.set(item.title.toUpperCase(), entry);
        if (item.sku) bySku.set(item.sku.toUpperCase(), entry);
      }
    }
    console.log(`[ebay sync] Loaded ${byTitle.size} existing listings (${bySku.size} with SKUs)`);
  } catch (e) {
    console.warn("[ebay sync] Could not fetch existing listings for dedup:", e);
  }
  return { byTitle, bySku };
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

    // Filter to only tires with pricing (populated by price scraper)
    allTires = allTires.filter((t) => (t.price_map ?? 0) > 0);

    // Fetch existing eBay listings to detect already-listed products
    const emptyMaps = { byTitle: new Map<string, ExistingListingEntry>(), bySku: new Map<string, ExistingListingEntry>() };
    const { byTitle: existingByTitle, bySku: existingBySku } = dryRun ? emptyMaps : await buildExistingListingsMaps();

    // Collect debug info — first 5 titles/SKUs from each side
    const debugEbayTitles = Array.from(existingByTitle.keys()).slice(0, 5);
    const debugEbaySkus = Array.from(existingBySku.keys()).slice(0, 5);
    const debugGeneratedTitles: string[] = [];
    const debugGeneratedSkus: string[] = [];

    const result: SyncResult = {
      synced: 0,
      skipped: 0,
      revised: 0,
      duplicatesInBatch: 0,
      errors: [],
      total,
      existingOnEbay: existingByTitle.size,
      existingSkuCount: existingBySku.size,
      dryRun,
    };

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
        // Look up distributor cost for this tire
        const sb = getSupabase();
        const { data: inv } = await sb.from("distributor_inventory")
          .select("cost")
          .eq("tire_id", tire.id)
          .eq("active", true)
          .gt("cost", 0)
          .order("cost", { ascending: true })
          .limit(1);

        const cost = inv?.[0]?.cost;
        if (!cost) {
          result.skipped++;
          continue;
        }

        const weightLbs = tire.weight ? parseFloat(tire.weight) : null;
        const shippingCost = getShippingByWeight(weightLbs);
        const ebayPrice = calculateDistributorPrice(cost, shippingCost);

        const mapped = tireToEbayItem(tire, ebayPrice);
        if (!mapped) {
          result.skipped++;
          continue;
        }

        // Capture debug info for first few items
        if (debugGeneratedTitles.length < 5) {
          debugGeneratedTitles.push(mapped.listing.title.toUpperCase());
          debugGeneratedSkus.push(mapped.listing.sku.toUpperCase());
        }

        if (dryRun) {
          result.synced++;
          continue;
        }

        // Check if this product already exists on eBay (by title, then SKU fallback)
        const existingTitle = mapped.listing.title.toUpperCase();
        const existingSku = mapped.listing.sku.toUpperCase();
        const existing = existingByTitle.get(existingTitle) || existingBySku.get(existingSku);

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
          // Add to maps so subsequent duplicates in batch are caught
          const newEntry = { itemId: "new", quantity: mapped.listing.quantity };
          existingByTitle.set(existingTitle, newEntry);
          existingBySku.set(existingSku, newEntry);
        }
      } catch (e) {
        result.errors.push({
          sku,
          error: e instanceof Error ? e.message : String(e),
        });
      }
    }

    result.debug = {
      ebayTitles: debugEbayTitles,
      ebaySkus: debugEbaySkus,
      generatedTitles: debugGeneratedTitles,
      generatedSkus: debugGeneratedSkus,
    };

    return Response.json(result);
  } catch (e) {
    console.error("eBay sync error:", e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Failed to sync" },
      { status: 500 }
    );
  }
}
