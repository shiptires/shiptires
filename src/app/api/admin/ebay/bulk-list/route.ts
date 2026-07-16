import { isAdminRequest } from "@/lib/admin-auth";
import { getSupabase } from "@/lib/supabase";
import { getTireById, searchTires, toSlug } from "@/lib/db";
import type { TireRow } from "@/lib/db";
import {
  addFixedPriceItem,
  getActiveListings,
  reviseItemWithImages,
  distributorToEbayItem,
  calculateDistributorPrice,
  tireToEbayItem,
} from "@/lib/ebay";
import { updateEbayStatus } from "@/lib/distributors";
import { getShippingByWeight } from "@/lib/pricing";

export const maxDuration = 300; // 5 min — eBay API calls are slow

interface ExistingListingEntry {
  itemId: string;
  quantity: number;
}

/** Fetch all active eBay listings and build title + SKU lookups for dedup */
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
  } catch (e) {
    console.warn("[bulk-list] Could not fetch existing listings:", e);
  }
  return { byTitle, bySku };
}

/** Search the Turso catalog by brand + model + size to find a matching tire with images */
async function findCatalogMatch(
  brand: string,
  model: string,
  size: string
): Promise<TireRow | null> {
  // Parse size: strip LT/P prefix, extract width/aspect/rim
  const normalizedSize = size.replace(/^(LT|P)/i, "").trim();
  const sizeMatch = normalizedSize.match(
    /(\d{2,3})\s*\/\s*(\d{2,3})\s*[RrZz]\s*(\d{2}(?:\.\d)?)/
  );

  const brandSlug = toSlug(brand);

  const results = await searchTires({
    brand: brandSlug,
    width: sizeMatch?.[1],
    aspectRatio: sizeMatch?.[2],
    rimSize: sizeMatch?.[3],
    limit: 100,
  });

  if (results.tires.length === 0) return null;

  // Prefer a tire that has images
  const withImages = results.tires.filter(
    (t) => t.image_0100_url || t.thumbnail_url || t.local_thumbnail || t.front_image_url
  );
  const pool = withImages.length > 0 ? withImages : results.tires;

  // If model is provided, try to match it
  if (model) {
    const modelSlug = toSlug(model);
    const modelLower = model.toLowerCase();

    // Exact slug match
    const exact = pool.find((t) => toSlug(t.model_name) === modelSlug);
    if (exact) return exact;

    // Substring match
    const partial = pool.find(
      (t) =>
        t.model_name.toLowerCase().includes(modelLower) ||
        modelLower.includes(t.model_name.toLowerCase())
    );
    if (partial) return partial;
  }

  // No model match — return first tire with images for this brand+size
  return pool[0] ?? null;
}

export async function POST(req: Request) {
  if (!(await isAdminRequest())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const t0 = Date.now();
    const log = (msg: string) => console.log(`[bulk-list] +${Date.now() - t0}ms ${msg}`);
    const body = await req.json();
    const {
      dryRun = false,
      brand,
      brands,
      distributorId: filterDistributorId,
      maxQuantity,
      limit: listingLimit,
      skipDedup = false,
    } = body as {
      dryRun?: boolean;
      brand?: string;
      brands?: string[];
      distributorId?: string;
      maxQuantity?: number;
      limit?: number;
      skipDedup?: boolean;
    };

    // Combine brand/brands into a single list
    const brandFilter: string[] = [];
    if (brands && brands.length > 0) brandFilter.push(...brands.map(b => b.toUpperCase()));
    else if (brand) brandFilter.push(brand.toUpperCase());

    // 1. Fetch in-stock distributor inventory
    const allItems: Array<{
      id: string;
      distributor_id: string;
      tire_id: number;
      cost: number;
      quantity: number;
      part_number: string | null;
      brand: string;
      model: string;
      size: string;
      ebay_item_id: string | null;
      location_costs: Record<string, number> | null;
    }> = [];

    const PAGE = 1000;
    for (let offset = 0; ; offset += PAGE) {
      let query = getSupabase()
        .from("distributor_inventory")
        .select("id, distributor_id, tire_id, cost, quantity, part_number, brand, model, size, ebay_item_id, location_costs")
        .eq("active", true)
        .gt("quantity", 0);

      // When not doing a dry run, only fetch items not already on eBay
      if (!dryRun) query = query.is("ebay_item_id", null);

      if (brandFilter.length === 1) query = query.ilike("brand", brandFilter[0]);
      else if (brandFilter.length > 1) query = query.in("brand", brandFilter);
      if (filterDistributorId) query = query.eq("distributor_id", filterDistributorId);

      const { data: page } = await query.range(offset, offset + PAGE - 1);

      if (!page || page.length === 0) break;
      allItems.push(...page);
      if (page.length < PAGE) break;
    }
    log(`Fetched ${allItems.length} items from Supabase`);

    // 2. Deduplicate — by tire_id for matched items, by brand+size for unmatched
    const bestByTire = new Map<number, typeof allItems[0]>();
    const bestByBrandSize = new Map<string, typeof allItems[0]>();
    for (const item of allItems) {
      if (item.tire_id && item.tire_id > 0) {
        const existing = bestByTire.get(item.tire_id);
        if (!existing || item.cost < existing.cost) {
          bestByTire.set(item.tire_id, item);
        }
      } else {
        // No tire_id — dedup by brand+size (normalized)
        const key = `${item.brand.toUpperCase()}|${item.size.replace(/\s/g, "")}`;
        const existing = bestByBrandSize.get(key);
        if (!existing || item.cost < existing.cost) {
          bestByBrandSize.set(key, item);
        }
      }
    }

    const uniqueItems = [
      ...Array.from(bestByTire.values()),
      ...Array.from(bestByBrandSize.values()),
    ].sort((a, b) => a.cost - b.cost);

    // 3. Build existing eBay listings map (skip for dry run)
    const emptyMaps = {
      byTitle: new Map<string, ExistingListingEntry>(),
      bySku: new Map<string, ExistingListingEntry>(),
    };
    const { byTitle: existingByTitle, bySku: existingBySku } = (dryRun || skipDedup)
      ? emptyMaps
      : await buildExistingListingsMaps();

    // 4. Process each unique tire
    let listed = 0;
    let revised = 0;
    let skipped = 0;
    let noMatch = 0;
    let noImages = 0;
    let alreadyListed = 0;
    let catalogMatched = 0;
    const errors: Array<{ tireId: number; error: string }> = [];

    // Pre-fetch all tires in parallel (batched) to avoid sequential Turso lookups
    const tireCache = new Map<number, TireRow | null>();
    const brandSizeCache = new Map<string, TireRow | null>();

    // Only pre-fetch tire IDs we'll actually need (limit * 3 to account for skips)
    const prefetchLimit = listingLimit ? listingLimit * 3 : 200;
    const tireIdsToFetch = [...new Set(
      uniqueItems
        .filter(i => !i.ebay_item_id && i.tire_id && i.tire_id > 0)
        .slice(0, prefetchLimit)
        .map(i => i.tire_id)
    )];

    log(`Pre-fetching ${tireIdsToFetch.length} tire IDs`);
    // Batch fetch in groups of 10 concurrently
    for (let i = 0; i < tireIdsToFetch.length; i += 10) {
      const batch = tireIdsToFetch.slice(i, i + 10);
      const results = await Promise.all(batch.map(id => getTireById(id)));
      for (let j = 0; j < batch.length; j++) {
        tireCache.set(batch[j], results[j]);
      }
    }

    const cachedNonNull = [...tireCache.values()].filter(Boolean).length;
    log(`Pre-fetch complete, ${tireCache.size} cached (${cachedNonNull} found)`);

    const maxNewListings = listingLimit ?? Infinity;
    let loopIdx = 0;

    for (const item of uniqueItems) {
      loopIdx++;
      // Stop if we've hit the listing limit
      if (listed + revised >= maxNewListings) break;

      // Skip items already on eBay
      if (item.ebay_item_id) {
        alreadyListed++;
        continue;
      }

      log(`Loop ${loopIdx}/${uniqueItems.length}: tire_id=${item.tire_id} brand=${item.brand}`);

      // Look up tire in catalog — by ID first, then by brand+size search
      let tire: TireRow | null = null;
      if (item.tire_id && item.tire_id > 0) {
        if (tireCache.has(item.tire_id)) {
          tire = tireCache.get(item.tire_id)!;
        } else {
          log(`Cache miss for tire ${item.tire_id}, fetching...`);
          tire = await getTireById(item.tire_id);
          tireCache.set(item.tire_id, tire);
          log(`Fetched tire ${item.tire_id}: ${tire ? 'found' : 'null'}`);
        }
      }

      // Fallback: search Turso catalog by brand + size
      if (!tire && item.brand && item.size) {
        const cacheKey = `${item.brand.toUpperCase()}|${item.size}`;
        if (brandSizeCache.has(cacheKey)) {
          tire = brandSizeCache.get(cacheKey)!;
        } else {
          tire = await findCatalogMatch(item.brand, item.model, item.size);
          brandSizeCache.set(cacheKey, tire);
        }
        if (tire) catalogMatched++;
      }

      if (!tire) {
        noMatch++;
        continue;
      }

      // Use lowest warehouse cost if location_costs is populated, otherwise flat cost
      let effectiveCost = item.cost;
      if (item.location_costs && Object.keys(item.location_costs).length > 0) {
        const costValues = Object.values(item.location_costs).filter((c) => c > 0);
        if (costValues.length > 0) {
          effectiveCost = Math.min(...costValues);
        }
      }

      // Calculate eBay price from distributor cost — use weight-based shipping
      const weightLbs = tire.weight ? parseFloat(tire.weight) : null;
      const tireShippingCost = getShippingByWeight(weightLbs);
      const ebayPrice = calculateDistributorPrice(
        effectiveCost,
        tireShippingCost
      );

      // Cap quantity if maxQuantity specified
      const qty = maxQuantity ? Math.min(item.quantity, maxQuantity) : item.quantity;

      // Also try catalog-based pricing if tire has MAP price — use whichever is higher
      let listing = distributorToEbayItem(tire, ebayPrice, qty);

      // Fallback: try catalog-based listing if distributor mapping fails
      if (!listing) {
        const catalogListing = tireToEbayItem(tire, ebayPrice);
        if (catalogListing) {
          listing = catalogListing.listing;
        }
      }

      if (!listing) {
        noImages++;
        continue;
      }

      if (dryRun) {
        listed++;
        continue;
      }

      // Check for existing listing on eBay (dedup by title/SKU)
      try {
        const existingTitle = listing.title.toUpperCase();
        const existingSku = listing.sku.toUpperCase();
        const existing =
          existingByTitle.get(existingTitle) ||
          existingBySku.get(existingSku);

        if (existing) {
          // Already on eBay — revise price + images
          await reviseItemWithImages(
            existing.itemId,
            parseFloat(listing.price),
            listing.imageUrls
          );
          revised++;
          // Save eBay item ID back
          await updateEbayStatus(item.distributor_id, item.tire_id, existing.itemId).catch(() => {});
        } else {
          // New listing
          log(`About to call eBay API for listing #${listed + 1}`);
          const result = await addFixedPriceItem(listing);
          listed++;
          // Track for batch dedup
          const newEntry = { itemId: result.itemId, quantity: listing.quantity };
          existingByTitle.set(listing.title.toUpperCase(), newEntry);
          existingBySku.set(listing.sku.toUpperCase(), newEntry);
          // Save eBay item ID back
          await updateEbayStatus(item.distributor_id, item.tire_id, result.itemId).catch(() => {});
        }
      } catch (e) {
        errors.push({
          tireId: item.tire_id,
          error: e instanceof Error ? e.message : String(e),
        });
      }
    }

    return Response.json({
      dryRun,
      totalInventory: allItems.length,
      uniqueTires: uniqueItems.length,
      alreadyListed,
      listed,
      revised,
      skipped,
      noMatch,
      noImages,
      catalogMatched,
      errors: errors.slice(0, 50),
      errorCount: errors.length,
    });
  } catch (e) {
    console.error("[bulk-list] Error:", e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Bulk list failed" },
      { status: 500 }
    );
  }
}
