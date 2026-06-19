import { isAdminRequest } from "@/lib/admin-auth";
import { trackShipment, type CarrierName } from "@/lib/carriers";

export async function POST(req: Request) {
  if (!(await isAdminRequest())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { carrier, trackingNumber, shipmentId } = await req.json();

    if (!carrier || !trackingNumber) {
      return Response.json(
        { error: "carrier and trackingNumber are required" },
        { status: 400 }
      );
    }

    const validCarriers: CarrierName[] = ["fedex", "ups", "roadie", "shipstation"];
    if (!validCarriers.includes(carrier)) {
      return Response.json(
        { error: `Unsupported carrier: ${carrier}` },
        { status: 400 }
      );
    }

    const result = await trackShipment(
      carrier as CarrierName,
      trackingNumber,
      shipmentId
    );

    return Response.json(result);
  } catch (e) {
    console.error("Carrier tracking error:", e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Failed to get tracking info" },
      { status: 500 }
    );
  }
}
