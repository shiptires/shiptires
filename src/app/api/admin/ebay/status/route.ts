import { isAdminRequest } from "@/lib/admin-auth";
import { getAccessToken } from "@/lib/ebay";

const EBAY_API = "https://api.ebay.com";

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

  // Test auth
  let authenticated = false;
  let inventoryCount = 0;
  let error: string | null = null;

  try {
    const token = await getAccessToken();
    authenticated = true;

    // Get inventory count
    const res = await fetch(
      `${EBAY_API}/sell/inventory/v1/inventory_item?limit=1&offset=0`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      }
    );

    if (res.ok) {
      const data = await res.json();
      inventoryCount = data.total ?? 0;
    }
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
