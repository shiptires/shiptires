import { isAdminRequest } from "@/lib/admin-auth";
import { getSupabase } from "@/lib/supabase";
import { getRates, listCarriers, type RateRequest } from "@/lib/shipstation";
import { getWarehouse, DEFAULT_WAREHOUSE_ID } from "@/lib/warehouses";

export async function POST(req: Request) {
  if (!(await isAdminRequest())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { orderId, carrierCode, weight, dimensions, warehouseId } = body;

    if (!orderId || !weight) {
      return Response.json(
        { error: "orderId and weight are required" },
        { status: 400 }
      );
    }

    const warehouse = getWarehouse(warehouseId || DEFAULT_WAREHOUSE_ID);
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

    // Build the base rate request params (carrierCode added per-carrier below)
    const baseParams = {
      fromPostalCode: warehouse.postalCode,
      toState: addr.state || "",
      toCountry: addr.country || "US",
      toPostalCode: addr.postalCode,
      toCity: addr.city || "",
      weight: { value: weight.value, units: weight.units || "pounds" },
      dimensions: dimensions
        ? { ...dimensions, units: dimensions.units || "inches" }
        : undefined,
      residential: true,
    };

    // If a specific carrier was requested, just get rates for that one
    let carrierCodes: string[];
    if (carrierCode) {
      carrierCodes = [carrierCode];
    } else {
      const carriers = await listCarriers();
      carrierCodes = carriers.map((c) => c.code);
    }

    // Fetch rates from all requested carriers in parallel
    const rateResults = await Promise.allSettled(
      carrierCodes.map((code) =>
        getRates({ ...baseParams, carrierCode: code })
      )
    );

    const allRates = rateResults.flatMap((result, i) => {
      if (result.status === "fulfilled") {
        return result.value.map((r) => ({
          carrierCode: carrierCodes[i],
          serviceCode: r.serviceCode,
          serviceName: r.serviceName,
          shipmentCost: r.shipmentCost,
          otherCost: r.otherCost,
          totalCost: r.shipmentCost + r.otherCost,
        }));
      }
      return [];
    });

    // Sort by total cost ascending
    allRates.sort((a, b) => a.totalCost - b.totalCost);

    return Response.json({ rates: allRates });
  } catch (e) {
    console.error("ShipStation rates error:", e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Failed to get rates" },
      { status: 500 }
    );
  }
}
