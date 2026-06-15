import { isAdminRequest } from "@/lib/admin-auth";
import { getActiveListings, revisePrices } from "@/lib/ebay";

export async function POST(req: Request) {
  if (!(await isAdminRequest())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { itemIds, adjustType, value } = body;

    if (!adjustType || !["set", "percent", "amount"].includes(adjustType)) {
      return Response.json(
        { error: "adjustType must be 'set', 'percent', or 'amount'" },
        { status: 400 }
      );
    }

    if (typeof value !== "number" || isNaN(value)) {
      return Response.json({ error: "value must be a number" }, { status: 400 });
    }

    // If itemIds not provided, fetch all active listings
    let items: Array<{ itemId: string; currentPrice: number }> = [];

    if (Array.isArray(itemIds) && itemIds.length > 0) {
      // We need current prices for percent/amount adjustments
      if (adjustType === "set") {
        items = itemIds.map((id: string) => ({ itemId: id, currentPrice: 0 }));
      } else {
        // Fetch all pages to find prices for selected items
        const firstPage = await getActiveListings(1, 200);
        let allItems = [...firstPage.items];
        for (let p = 2; p <= firstPage.totalPages; p++) {
          const page = await getActiveListings(p, 200);
          allItems = allItems.concat(page.items);
        }
        items = itemIds.map((id: string) => {
          const found = allItems.find((i) => i.itemId === id);
          return { itemId: id, currentPrice: found?.price || 0 };
        });
      }
    } else {
      // Apply to ALL active listings
      const firstPage = await getActiveListings(1, 200);
      let allItems = [...firstPage.items];
      for (let p = 2; p <= firstPage.totalPages; p++) {
        const page = await getActiveListings(p, 200);
        allItems = allItems.concat(page.items);
      }
      items = allItems.map((i) => ({ itemId: i.itemId, currentPrice: i.price }));
    }

    // Calculate new prices
    const revisions = items
      .map(({ itemId, currentPrice }) => {
        let newPrice: number;
        switch (adjustType) {
          case "set":
            newPrice = value;
            break;
          case "percent":
            newPrice = currentPrice * (1 + value / 100);
            break;
          case "amount":
            newPrice = currentPrice + value;
            break;
          default:
            newPrice = currentPrice;
        }
        // Round to 2 decimal places and ensure positive
        newPrice = Math.round(newPrice * 100) / 100;
        if (newPrice <= 0) return null;
        return { itemId, newPrice };
      })
      .filter((r): r is { itemId: string; newPrice: number } => r !== null);

    const result = await revisePrices(revisions);
    return Response.json(result);
  } catch (e) {
    console.error("eBay price adjust error:", e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Failed to adjust prices" },
      { status: 500 }
    );
  }
}
