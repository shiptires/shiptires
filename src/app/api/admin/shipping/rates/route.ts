import { isAdminRequest } from "@/lib/admin-auth";
import { getSupabase } from "@/lib/supabase";
import { getRatesFromAll } from "@/lib/carriers";
import { getWarehouse, getDefaultWarehouse } from "@/lib/warehouses";

export async function POST(req: Request) {
  if (!(await isAdminRequest())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { orderId, weight, dimensions, warehouseId, sources } = body;

    if (!orderId || !weight) {
      return Response.json(
        { error: "orderId and weight are required" },
        { status: 400 }
      );
    }

    const warehouse = warehouseId
      ? await getWarehouse(warehouseId)
      : await getDefaultWarehouse();
    if (!warehouse) {
      return Response.json({ error: "Invalid warehouse" }, { status: 400 });
    }

    // Look up order to get shipping address
    const { data: order, error: orderError } = await getSupabase()
      .from("tire_orders")
      .select("shipping_address, customer_name")
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

    // Build full addresses for carriers that need them (Roadie)
    const fromAddress = {
      name: warehouse.name,
      company: warehouse.distributorName,
      street1: warehouse.street1,
      street2: warehouse.street2,
      city: warehouse.city,
      state: warehouse.state,
      postalCode: warehouse.postalCode,
      country: warehouse.country,
      phone: warehouse.phone,
    };

    const toAddress = {
      name: order.customer_name || addr.name || "Customer",
      street1: addr.street1 || addr.line1 || addr.address1 || "",
      street2: addr.street2 || addr.line2 || addr.address2 || "",
      city: addr.city || "",
      state: addr.state || "",
      postalCode: addr.postalCode || addr.postal_code || addr.zip || "",
      country: addr.country || "US",
    };

    // Get rates from requested sources (FedEx, UPS, ShipStation, Roadie)
    const { rates, errors } = await getRatesFromAll({
      fromPostalCode: warehouse.postalCode,
      fromState: warehouse.state,
      toPostalCode: addr.postalCode,
      toCity: addr.city || "",
      toState: addr.state || "",
      toCountry: addr.country || "US",
      weight: { value: weight.value, units: weight.units || "pounds" },
      dimensions: dimensions
        ? {
            length: dimensions.length,
            width: dimensions.width,
            height: dimensions.height,
            units: dimensions.units || "inches",
          }
        : undefined,
      residential: true,
      sources: sources || undefined,
      fromAddress,
      toAddress,
    });

    // Map to response shape (compatible with existing frontend)
    const allRates = rates.map((r) => ({
      carrier: r.carrier,
      carrierCode: r.carrier,
      source: r.source,
      serviceCode: r.serviceCode,
      serviceName: r.serviceName,
      totalCost: r.totalCost,
      transitDays: r.transitDays,
      shipmentCost: r.totalCost,
      otherCost: 0,
      ...(r.estimatedDistance != null && { estimatedDistance: r.estimatedDistance }),
    }));

    return Response.json({ rates: allRates, errors: errors.length > 0 ? errors : undefined });
  } catch (e) {
    console.error("Carrier rates error:", e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Failed to get rates" },
      { status: 500 }
    );
  }
}
