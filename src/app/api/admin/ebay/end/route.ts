import { isAdminRequest } from "@/lib/admin-auth";
import { endItems, getActiveListings } from "@/lib/ebay";

export const maxDuration = 300;

export async function POST(req: Request) {
  if (!(await isAdminRequest())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { itemIds, endAll } = body;

    // End all active listings
    if (endAll === true) {
      const allItemIds: string[] = [];
      let page = 1;
      let totalPages = 1;

      // Fetch all pages of active listings
      while (page <= totalPages) {
        const listings = await getActiveListings(page, 200);
        for (const item of listings.items) {
          allItemIds.push(item.itemId);
        }
        totalPages = listings.totalPages;
        page++;
      }

      if (allItemIds.length === 0) {
        return Response.json({ ended: 0, errors: [], totalFound: 0 });
      }

      const result = await endItems(allItemIds);
      return Response.json({ ...result, totalFound: allItemIds.length });
    }

    // End specific listings
    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      return Response.json({ error: "itemIds must be a non-empty array, or pass endAll: true" }, { status: 400 });
    }

    const result = await endItems(itemIds);
    return Response.json(result);
  } catch (e) {
    console.error("eBay end items error:", e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Failed to end items" },
      { status: 500 }
    );
  }
}
