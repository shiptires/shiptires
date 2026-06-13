import { isAdminRequest } from "@/lib/admin-auth";
import { listCarriers, listServices } from "@/lib/shipstation";

let cachedResponse: { data: unknown; ts: number } | null = null;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export async function GET() {
  if (!(await isAdminRequest())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    if (cachedResponse && Date.now() - cachedResponse.ts < CACHE_TTL) {
      return Response.json(cachedResponse.data);
    }

    const carriers = await listCarriers();

    const carriersWithServices = await Promise.all(
      carriers.map(async (carrier) => {
        const services = await listServices(carrier.code);
        return { ...carrier, services };
      })
    );

    cachedResponse = { data: carriersWithServices, ts: Date.now() };
    return Response.json(carriersWithServices);
  } catch (e) {
    console.error("ShipStation carriers error:", e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Failed to fetch carriers" },
      { status: 500 }
    );
  }
}
