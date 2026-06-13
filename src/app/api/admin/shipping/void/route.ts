import { isAdminRequest } from "@/lib/admin-auth";
import { getSupabase } from "@/lib/supabase";
import { voidLabel } from "@/lib/shipstation";

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

    const result = await voidLabel(Number(shipmentId));

    if (!result.approved) {
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
    console.error("ShipStation void error:", e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Failed to void label" },
      { status: 500 }
    );
  }
}
