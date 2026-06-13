import { isAdminRequest } from "@/lib/admin-auth";
import { getAccessToken } from "@/lib/walmart";

export async function GET() {
  if (!(await isAdminRequest())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const configured = !!(
    process.env.WALMART_CLIENT_ID &&
    process.env.WALMART_CLIENT_SECRET
  );

  if (!configured) {
    return Response.json({
      configured: false,
      authenticated: false,
      error: "Walmart API credentials not configured. Set WALMART_CLIENT_ID and WALMART_CLIENT_SECRET.",
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
    authenticated,
    error,
  });
}
