import { isAdminRequest } from "@/lib/admin-auth";
import { getEbayOrder, createShippingFulfillment } from "@/lib/ebay";

const CARRIER_MAP: Record<string, string> = {
  fedex: "FedEx",
  ups: "UPS",
  usps: "USPS",
};

export async function POST(req: Request) {
  if (!(await isAdminRequest())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { orderId, trackingNumber, carrier } = (await req.json()) as {
      orderId: string;
      trackingNumber: string;
      carrier: string;
    };

    if (!orderId || !trackingNumber || !carrier) {
      return Response.json(
        { error: "orderId, trackingNumber, and carrier are required" },
        { status: 400 }
      );
    }

    // Fetch the order to get lineItemIds
    const order = await getEbayOrder(orderId);
    const lineItems = order.lineItems.map((li) => ({
      lineItemId: li.lineItemId,
      quantity: li.quantity,
    }));

    const shippingCarrierCode =
      CARRIER_MAP[carrier.toLowerCase()] || "Other";

    const result = await createShippingFulfillment(orderId, {
      lineItems,
      shippingCarrierCode,
      trackingNumber,
    });

    return Response.json({
      success: true,
      fulfillmentId: result.fulfillmentId,
    });
  } catch (e) {
    console.error("[ebay fulfill]", e);
    return Response.json(
      { error: e instanceof Error ? e.message : "eBay fulfillment failed" },
      { status: 500 }
    );
  }
}
