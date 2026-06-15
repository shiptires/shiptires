import { isAdminRequest } from "@/lib/admin-auth";
import { getActiveListings } from "@/lib/ebay";

export async function GET(req: Request) {
  if (!(await isAdminRequest())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "50");

    const result = await getActiveListings(page, limit);
    return Response.json(result);
  } catch (e) {
    console.error("eBay listings error:", e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Failed to fetch listings" },
      { status: 500 }
    );
  }
}
