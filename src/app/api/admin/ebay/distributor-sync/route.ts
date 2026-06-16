import { isAdminRequest } from "@/lib/admin-auth";
import { searchTires, toSlug } from "@/lib/db";
import type { TireRow } from "@/lib/db";
import {
  addFixedPriceItem,
  getActiveListings,
  reviseItemWithImages,
  calculateDistributorPrice,
  distributorToEbayItem,
} from "@/lib/ebay";
import { upsertInventoryItem, updateEbayStatus } from "@/lib/distributors";

export const maxDuration = 300;

interface DistributorItem {
  brand: string;
  model: string;
  size: string;
  quantity: number;
  cost: number;
  partNumber?: string;
}

interface ItemResult {
  brand: string;
  model: string;
  size: string;
  status: "synced" | "revised" | "skipped" | "error";
  ebayPrice?: number;
  error?: string;
  itemId?: string;
  tireId?: number;
}

interface ExistingListingEntry {
  itemId: string;
  quantity: number;
}

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
    console.warn("[distributor sync] Could not fetch existing listings:", e);
  }
  return { byTitle, bySku };
}

/** Try to find a matching tire in the DB for a distributor item */
async function findDbMatch(
  brand: string,
  model: string,
  size: string
): Promise<TireRow | null> {
  // Normalize size: strip LT/P prefix, trim
  const normalizedSize = size.replace(/^(LT|P)/i, "").trim();

  // Extract width/aspect/rim from size string
  const sizeMatch = normalizedSize.match(
    /(\d{2,3})\s*\/\s*(\d{2,3})\s*[RrZz]\s*(\d{2}(?:\.\d)?)/
  );

  const brandSlug = toSlug(brand);

  // Search by brand + size components for better matching
  const results = await searchTires({
    brand: brandSlug,
    width: sizeMatch?.[1],
    aspectRatio: sizeMatch?.[2],
    rimSize: sizeMatch?.[3],
    limit: 100,
  });

  if (results.tires.length === 0) return null;

  // Find best model match
  const modelSlug = toSlug(model);
  const modelLower = model.toLowerCase();

  // Exact slug match
  const exact = results.tires.find(
    (t) => toSlug(t.model_name) === modelSlug
  );
  if (exact) return exact;

  // Substring match (either direction)
  const partial = results.tires.find(
    (t) =>
      t.model_name.toLowerCase().includes(modelLower) ||
      modelLower.includes(t.model_name.toLowerCase())
  );
  if (partial) return partial;

  return null;
}

export async function POST(req: Request) {
  if (!(await isAdminRequest())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      items,
      shippingCost = 55,
      ebayFvf = 0.1325,
      miscRate = 0.02,
      marginRate = 0.15,
      dryRun = false,
      distributorId,
    } = body as {
      items: DistributorItem[];
      shippingCost?: number;
      ebayFvf?: number;
      miscRate?: number;
      marginRate?: number;
      dryRun?: boolean;
      distributorId?: string;
    };

    if (!items || !Array.isArray(items) || items.length === 0) {
      return Response.json({ error: "No items provided" }, { status: 400 });
    }

    // Build existing listings map (skip for dry run)
    const emptyMaps = {
      byTitle: new Map<string, ExistingListingEntry>(),
      bySku: new Map<string, ExistingListingEntry>(),
    };
    const { byTitle: existingByTitle, bySku: existingBySku } = dryRun
      ? emptyMaps
      : await buildExistingListingsMaps();

    const itemResults: ItemResult[] = [];
    let synced = 0;
    let revised = 0;
    let skipped = 0;
    const errors: Array<{ sku: string; error: string }> = [];

    for (const item of items) {
      const ebayPrice = calculateDistributorPrice(
        item.cost,
        shippingCost,
        ebayFvf,
        miscRate,
        marginRate
      );

      // Find DB match
      const tire = await findDbMatch(item.brand, item.model, item.size);

      if (!tire) {
        skipped++;
        itemResults.push({
          brand: item.brand,
          model: item.model,
          size: item.size,
          status: "skipped",
          ebayPrice,
          error: "No matching tire in DB",
        });
        continue;
      }

      // Save to distributor inventory if distributorId provided
      if (distributorId && !dryRun) {
        try {
          const parsed = tire.name.match(/(\d{3})\s*\/\s*(\d{2,3})\s*[RrZz]\s*(\d{2}(?:\.\d)?)/);
          const sizeStr = tire.width && tire.aspect_ratio && tire.rim_size
            ? `${tire.width}/${tire.aspect_ratio}R${tire.rim_size}`
            : parsed ? `${parsed[1]}/${parsed[2]}R${parsed[3]}` : item.size;
          await upsertInventoryItem({
            distributor_id: distributorId,
            tire_id: tire.id,
            cost: item.cost,
            quantity: item.quantity,
            part_number: item.partNumber,
            brand: tire.make_name,
            model: tire.model_name,
            size: sizeStr,
          });
        } catch (e) {
          console.warn("[distributor sync] Failed to save inventory:", e);
        }
      }

      // Build eBay listing
      const listing = distributorToEbayItem(tire, ebayPrice, item.quantity);

      if (!listing) {
        skipped++;
        itemResults.push({
          brand: item.brand,
          model: item.model,
          size: item.size,
          status: "skipped",
          ebayPrice,
          tireId: tire.id,
          error: "Missing images or size data",
        });
        continue;
      }

      if (dryRun) {
        synced++;
        itemResults.push({
          brand: item.brand,
          model: item.model,
          size: item.size,
          status: "synced",
          ebayPrice,
          tireId: tire.id,
        });
        continue;
      }

      // Check for existing listing
      try {
        const existingTitle = listing.title.toUpperCase();
        const existingSku = listing.sku.toUpperCase();
        const existing =
          existingByTitle.get(existingTitle) ||
          existingBySku.get(existingSku);

        if (existing) {
          await reviseItemWithImages(
            existing.itemId,
            ebayPrice,
            listing.imageUrls
          );
          revised++;
          // Save eBay item ID back to inventory
          if (distributorId) {
            await updateEbayStatus(distributorId, tire.id, existing.itemId).catch(() => {});
          }
          itemResults.push({
            brand: item.brand,
            model: item.model,
            size: item.size,
            status: "revised",
            ebayPrice,
            tireId: tire.id,
            itemId: existing.itemId,
          });
        } else {
          const result = await addFixedPriceItem(listing);
          synced++;
          // Add to maps for batch dedup
          const newEntry = { itemId: result.itemId, quantity: listing.quantity };
          existingByTitle.set(listing.title.toUpperCase(), newEntry);
          existingBySku.set(listing.sku.toUpperCase(), newEntry);
          // Save eBay item ID back to inventory
          if (distributorId) {
            await updateEbayStatus(distributorId, tire.id, result.itemId).catch(() => {});
          }
          itemResults.push({
            brand: item.brand,
            model: item.model,
            size: item.size,
            status: "synced",
            ebayPrice,
            tireId: tire.id,
            itemId: result.itemId,
          });
        }
      } catch (e) {
        const errMsg = e instanceof Error ? e.message : String(e);
        errors.push({ sku: listing.sku, error: errMsg });
        itemResults.push({
          brand: item.brand,
          model: item.model,
          size: item.size,
          status: "error",
          ebayPrice,
          tireId: tire.id,
          error: errMsg,
        });
      }
    }

    return Response.json({
      synced,
      revised,
      skipped,
      errors,
      total: items.length,
      dryRun,
      itemResults,
    });
  } catch (e) {
    console.error("Distributor sync error:", e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Failed to sync" },
      { status: 500 }
    );
  }
}
