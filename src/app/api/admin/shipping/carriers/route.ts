import { isAdminRequest } from "@/lib/admin-auth";
import { getConfiguredCarriers, getAvailableSources } from "@/lib/carriers";

export async function GET() {
  if (!(await isAdminRequest())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const carriers = getConfiguredCarriers();
  const sources = getAvailableSources();

  return Response.json({ carriers, sources });
}
