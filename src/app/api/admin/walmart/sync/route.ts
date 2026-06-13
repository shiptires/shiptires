import { isAdminRequest } from "@/lib/admin-auth";
import { getTiresForFeed } from "@/lib/db";
import type { TireRow } from "@/lib/db";
import {
  createItem,
  updateInventory,
  tireToWalmartItem,
  tireToSku,
} from "@/lib/walmart";

export const maxDuration = 300;

interface SyncResult {
  synced: number;
  skipped: number;
  errors: Array<{ sku: string; error: string }>;
  total: number;
  dryRun: boolean;
}

function resolveImageUrl(row: TireRow): string | null {
  const sources = [row.local_thumbnail, row.thumbnail_url, row.image_0100_url];
  for (const src of sources) {
    if (!src) continue;
    if (src.startsWith("images/") || src.startsWith("images\\")) {
      return `https://ship.tires/${src.replace(/\\/g, "/")}`;
    }
    if (src.startsWith("http")) return src;
  }
  return null;
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
      errors: [],
      total,
      dryRun,
    };

    for (const tire of tires) {
      const sku = tireToSku(tire);

      const imageUrl = resolveImageUrl(tire);
      const gtin = tire.upc || tire.ean;

      if (!imageUrl || !gtin) {
        result.skipped++;
        continue;
      }

      try {
        // Walmart doesn't have a public competitor price API,
        // so we use MAP + markup pricing
        const mapped = tireToWalmartItem(tire);
        if (!mapped) {
          result.skipped++;
          continue;
        }

        if (dryRun) {
          result.synced++;
          continue;
        }

        // 1. Create/update item via feed
        await createItem(mapped.item);

        // 2. Update inventory quantity
        try {
          await updateInventory(sku, 50);
        } catch {
          // Item may not be published yet — inventory update can fail initially
        }

        result.synced++;
      } catch (e) {
        result.errors.push({
          sku,
          error: e instanceof Error ? e.message : String(e),
        });
      }
    }

    return Response.json(result);
  } catch (e) {
    console.error("Walmart sync error:", e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Failed to sync" },
      { status: 500 }
    );
  }
}
