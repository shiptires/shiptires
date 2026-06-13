import { isAdminRequest } from "@/lib/admin-auth";
import { getAccessToken } from "@/lib/amazon";

export async function GET() {
  if (!(await isAdminRequest())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const configured = !!(
    process.env.AMAZON_SP_CLIENT_ID &&
    process.env.AMAZON_SP_CLIENT_SECRET &&
    process.env.AMAZON_SP_REFRESH_TOKEN
  );

  const sellerConfigured = !!process.env.AMAZON_SELLER_ID;

  if (!configured) {
    return Response.json({
      configured: false,
      sellerConfigured: false,
      authenticated: false,
      error: "Amazon SP-API credentials not configured. Set AMAZON_SP_CLIENT_ID, AMAZON_SP_CLIENT_SECRET, and AMAZON_SP_REFRESH_TOKEN.",
    });
  }

  let authenticated = false;
  let error: string | null = null;

  try {
    await getAccessToken();
    authenticated = true;
  } catch (e) {
    error = e instanceof Error ? e.message : "Authentication failed";
  }

  return Response.json({
    configured,
    sellerConfigured,
    authenticated,
    error,
  });
}
