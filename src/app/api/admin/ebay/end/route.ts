import { isAdminRequest } from "@/lib/admin-auth";
import { endItems } from "@/lib/ebay";

export async function POST(req: Request) {
  if (!(await isAdminRequest())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { itemIds } = body;

    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      return Response.json({ error: "itemIds must be a non-empty array" }, { status: 400 });
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
