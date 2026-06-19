import { isAdminRequest } from "@/lib/admin-auth";
import { getSupabase } from "@/lib/supabase";
import { createShipment, type CarrierName } from "@/lib/carriers";
import { getWarehouse, getDefaultWarehouse } from "@/lib/warehouses";

export async function POST(req: Request) {
  if (!(await isAdminRequest())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      orderId,
      carrier,
      carrierCode, // legacy field — fallback
      serviceCode,
      weight,
      dimensions,
      warehouseId,
    } = body;

    const {
      signatureRequired,
      notificationsEnabled,
    } = body;

    const carrierName: CarrierName = carrier || carrierCode;

    if (!orderId || !carrierName || !serviceCode || !weight) {
      return Response.json(
        {
          error:
            "orderId, carrier (or carrierCode), serviceCode, and weight are required",
        },
        { status: 400 }
      );
    }

    const validCarriers: CarrierName[] = ["fedex", "ups", "roadie", "shipstation"];
    if (!validCarriers.includes(carrierName)) {
      return Response.json(
        { error: `Unsupported carrier: ${carrierName}. Use "fedex", "ups", "roadie", or "shipstation".` },
        { status: 400 }
      );
    }

    const warehouse = warehouseId
      ? await getWarehouse(warehouseId)
      : await getDefaultWarehouse();
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

    const result = await createShipment(carrierName, serviceCode, {
      shipFrom: {
        name: warehouse.name,
        company: warehouse.distributorName,
        street1: warehouse.street1,
        street2: warehouse.street2,
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
      packages: [
        {
          weight: {
            value: weight.value,
            units: weight.units || "pounds",
          },
          dimensions: dimensions
            ? {
                length: dimensions.length,
                width: dimensions.width,
                height: dimensions.height,
                units: dimensions.units || "inches",
              }
            : undefined,
        },
      ],
      ...(carrierName === "roadie" && {
        roadieOptions: {
          signatureRequired: signatureRequired ?? false,
          notificationsEnabled: notificationsEnabled ?? true,
        },
      }),
    });

    // Save tracking info back to order
    const { error: updateError } = await getSupabase()
      .from("tire_orders")
      .update({
        tracking_number: result.trackingNumber,
        carrier: carrierName,
        service_code: serviceCode,
        shipment_cost: result.totalCharge,
        shipment_id: result.shipmentId,
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
      shipmentCost: result.totalCharge,
      shipmentId: result.shipmentId,
      labelFormat: result.labelFormat || "pdf",
    });
  } catch (e) {
    console.error("Carrier label error:", e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Failed to create label" },
      { status: 500 }
    );
  }
}
