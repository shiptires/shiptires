import { isAdminRequest } from "@/lib/admin-auth";
import { getSupabase } from "@/lib/supabase";
import { fetchEbayOrders } from "@/lib/ebay";
import type { EbayOrder } from "@/lib/ebay";

export const maxDuration = 120;

function mapEbayOrder(order: EbayOrder) {
  const shipTo =
    order.fulfillmentStartInstructions?.[0]?.shippingStep?.shipTo;
  const addr = shipTo?.contactAddress;

  const shippingAddress = addr
    ? {
        name: shipTo?.fullName || "",
        street1: addr.addressLine1 || "",
        street2: addr.addressLine2 || "",
        city: addr.city || "",
        state: addr.stateOrProvince || "",
        postalCode: addr.postalCode || "",
        country: addr.countryCode || "US",
      }
    : null;

  const items = order.lineItems.map((li) => ({
    title: li.title,
    sku: li.sku || "",
    quantity: li.quantity,
    price: parseFloat(li.lineItemCost.value),
  }));

  const total = parseFloat(order.pricingSummary.total.value);

  return {
    order_source: "ebay" as const,
    external_order_id: order.orderId,
    customer_name: shipTo?.fullName || order.buyer.username,
    customer_email: shipTo?.email || "",
    customer_phone: "",
    shipping_address: shippingAddress,
    items,
    total,
    subtotal: total,
    status: "paid",
    created_at: order.creationDate,
  };
}

export async function POST(req: Request) {
  if (!(await isAdminRequest())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { sinceDays = 30 } = body as { sinceDays?: number };

    const sinceDate = new Date(
      Date.now() - sinceDays * 24 * 60 * 60 * 1000
    ).toISOString();

    // Fetch orders from eBay
    const ebayOrders = await fetchEbayOrders(sinceDate);

    // Filter to paid orders only
    const paidOrders = ebayOrders.filter(
      (o) => o.orderPaymentStatus === "PAID"
    );

    // Get existing eBay order IDs to dedup
    const supabase = getSupabase();
    const { data: existingOrders } = await supabase
      .from("tire_orders")
      .select("external_order_id")
      .eq("order_source", "ebay")
      .not("external_order_id", "is", null);

    const existingIds = new Set(
      (existingOrders || []).map((o) => o.external_order_id)
    );

    let imported = 0;
    let skipped = 0;
    const errors: Array<{ orderId: string; error: string }> = [];

    for (const order of paidOrders) {
      if (existingIds.has(order.orderId)) {
        skipped++;
        continue;
      }

      try {
        const row = mapEbayOrder(order);
        const { error: insertError } = await supabase
          .from("tire_orders")
          .insert(row);

        if (insertError) {
          // Unique constraint violation = already imported
          if (insertError.code === "23505") {
            skipped++;
          } else {
            errors.push({ orderId: order.orderId, error: insertError.message });
          }
        } else {
          imported++;
        }
      } catch (e) {
        errors.push({
          orderId: order.orderId,
          error: e instanceof Error ? e.message : "Unknown error",
        });
      }
    }

    return Response.json({
      imported,
      skipped,
      errors,
      totalFromEbay: paidOrders.length,
    });
  } catch (e) {
    console.error("[ebay order sync]", e);
    return Response.json(
      { error: e instanceof Error ? e.message : "eBay order sync failed" },
      { status: 500 }
    );
  }
}
