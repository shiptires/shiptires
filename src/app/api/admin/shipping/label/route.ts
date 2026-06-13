import { isAdminRequest } from "@/lib/admin-auth";
import { getSupabase } from "@/lib/supabase";
import { createLabel, type LabelRequest } from "@/lib/shipstation";
import { getWarehouse, DEFAULT_WAREHOUSE_ID } from "@/lib/warehouses";

export async function POST(req: Request) {
  if (!(await isAdminRequest())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { orderId, carrierCode, serviceCode, weight, dimensions, testLabel, warehouseId } = body;

    if (!orderId || !carrierCode || !serviceCode || !weight) {
      return Response.json(
        { error: "orderId, carrierCode, serviceCode, and weight are required" },
        { status: 400 }
      );
    }

    const warehouse = getWarehouse(warehouseId || DEFAULT_WAREHOUSE_ID);
    if (!warehouse) {
      return Response.json({ error: "Invalid warehouse" }, { status: 400 });
    }

    // Look up order for ship-to address
    const { data: order, error: orderError } = await getSupabase()
      .from("tire_orders")
      .select("shipping_address, customer_name, customer_phone")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return Response.json({ error: "Order not found" }, { status: 404 });
    }

    const addr = order.shipping_address;
    if (!addr || !addr.postalCode) {
      return Response.json(
        { error: "Order has no shipping address" },
        { status: 400 }
      );
    }

    const labelParams: LabelRequest = {
      carrierCode,
      serviceCode,
      packageCode: body.packageCode || "package",
      shipDate: new Date().toISOString().split("T")[0],
      weight: { value: weight.value, units: weight.units || "pounds" },
      dimensions: dimensions
        ? { ...dimensions, units: dimensions.units || "inches" }
        : undefined,
      shipFrom: {
        name: warehouse.name,
        street1: warehouse.street1,
        city: warehouse.city,
        state: warehouse.state,
        postalCode: warehouse.postalCode,
        country: warehouse.country,
        phone: warehouse.phone,
      },
      shipTo: {
        name: order.customer_name || addr.name || "Customer",
        street1: addr.street1 || addr.line1 || addr.address1 || "",
        street2: addr.street2 || addr.line2 || addr.address2 || "",
        city: addr.city || "",
        state: addr.state || "",
        postalCode: addr.postalCode || addr.postal_code || addr.zip || "",
        country: addr.country || "US",
        phone: order.customer_phone || "",
      },
      testLabel: testLabel === true,
    };

    const result = await createLabel(labelParams);

    // Save tracking info back to order
    const { error: updateError } = await getSupabase()
      .from("tire_orders")
      .update({
        tracking_number: result.trackingNumber,
        carrier: carrierCode,
        service_code: serviceCode,
        shipment_cost: result.shipmentCost,
        shipment_id: String(result.shipmentId),
        shipped_at: new Date().toISOString(),
        status: "shipped",
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (updateError) {
      console.error("Failed to update order with tracking info:", updateError);
    }

    return Response.json({
      trackingNumber: result.trackingNumber,
      labelData: result.labelData,
      shipmentCost: result.shipmentCost,
      shipmentId: result.shipmentId,
    });
  } catch (e) {
    console.error("ShipStation label error:", e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Failed to create label" },
      { status: 500 }
    );
  }
}
