import { isAdminRequest } from "@/lib/admin-auth";
import { getAccessToken, getActiveListings } from "@/lib/ebay";

export async function GET() {
  if (!(await isAdminRequest())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if eBay env vars are configured
  const configured = !!(
    process.env.EBAY_CLIENT_ID &&
    process.env.EBAY_CLIENT_SECRET &&
    process.env.EBAY_REFRESH_TOKEN
  );

  const policiesConfigured = !!(
    process.env.EBAY_FULFILLMENT_POLICY_ID &&
    process.env.EBAY_PAYMENT_POLICY_ID &&
    process.env.EBAY_RETURN_POLICY_ID &&
    process.env.EBAY_LOCATION_KEY
  );

  if (!configured) {
    return Response.json({
      configured: false,
      policiesConfigured: false,
      authenticated: false,
      inventoryCount: 0,
      error: "eBay API credentials not configured. Set EBAY_CLIENT_ID, EBAY_CLIENT_SECRET, and EBAY_REFRESH_TOKEN.",
    });
  }

  // Test auth + get active listing count via Trading API
  let authenticated = false;
  let inventoryCount = 0;
  let error: string | null = null;

  try {
    await getAccessToken();
    authenticated = true;

    // Use Trading API GetSellerList (same as Manage Listings tab)
    const result = await getActiveListings(1, 1);
    inventoryCount = result.totalEntries;
  } catch (e) {
    error = e instanceof Error ? e.message : "Authentication failed";
  }

  return Response.json({
    configured,
    policiesConfigured,
    authenticated,
    inventoryCount,
    error,
  });
}
