import { isAdminRequest } from "@/lib/admin-auth";
import { getSupabase } from "@/lib/supabase";
import { voidShipment, type CarrierName } from "@/lib/carriers";

export async function POST(req: Request) {
  if (!(await isAdminRequest())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { orderId, shipmentId } = await req.json();

    if (!orderId || !shipmentId) {
      return Response.json(
        { error: "orderId and shipmentId are required" },
        { status: 400 }
      );
    }

    // Look up order to get carrier and tracking number
    const { data: order, error: orderError } = await getSupabase()
      .from("tire_orders")
      .select("carrier, tracking_number, shipment_id")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return Response.json({ error: "Order not found" }, { status: 404 });
    }

    const carrier = order.carrier as CarrierName;
    const validCarriers: CarrierName[] = ["fedex", "ups", "roadie", "shipstation"];
    if (!validCarriers.includes(carrier)) {
      return Response.json(
        { error: `Cannot void: unknown carrier "${order.carrier}"` },
        { status: 400 }
      );
    }

    const result = await voidShipment(carrier, {
      trackingNumber: order.tracking_number || "",
      shipmentId: order.shipment_id || shipmentId,
    });

    if (!result.success) {
      return Response.json(
        { error: result.message || "Void request was not approved" },
        { status: 400 }
      );
    }

    // Clear tracking info and revert status
    const { error: updateError } = await getSupabase()
      .from("tire_orders")
      .update({
        tracking_number: null,
        carrier: null,
        service_code: null,
        shipment_cost: null,
        shipment_id: null,
        shipped_at: null,
        status: "paid",
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (updateError) {
      console.error("Failed to clear tracking info on order:", updateError);
    }

    return Response.json({ approved: true, message: result.message });
  } catch (e) {
    console.error("Carrier void error:", e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Failed to void label" },
      { status: 500 }
    );
  }
}
