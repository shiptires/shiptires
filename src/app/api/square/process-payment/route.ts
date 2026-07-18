import { randomUUID } from "crypto";
import { getSquareClient } from "@/lib/square";
import {
  validateAndPriceItems,
  createConsumerOrder,
  sendCustomerConfirmationEmail,
  sendAdminOrderNotification,
} from "@/lib/order-utils";
import { calculateOrderFees } from "@/lib/tire-fees";
import { TIRE_PROTECTION_PRICE } from "@/lib/constants";
import type { CartItem, ShippingAddress } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const {
      sourceId,
      shipping,
      items,
      tireProtection,
      auth_user_id,
    } = (await req.json()) as {
      sourceId: string;
      shipping: ShippingAddress;
      items: CartItem[];
      tireProtection?: boolean;
      auth_user_id?: string;
    };

    if (!sourceId) {
      return Response.json({ error: "Missing payment token" }, { status: 400 });
    }
    if (!items?.length) {
      return Response.json({ error: "Cart is empty" }, { status: 400 });
    }
    if (!shipping?.email || !shipping?.firstName || !shipping?.lastName) {
      return Response.json({ error: "Shipping info required" }, { status: 400 });
    }

    // 1. Validate and price items server-side
    const customerZip = shipping.zip || "";
    const validated = await validateAndPriceItems(items, customerZip || undefined);

    // 2. Calculate totals
    const tireSubtotal = validated.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const totalTires = validated.reduce((sum, item) => sum + item.quantity, 0);
    const state = (shipping.state || "").toUpperCase();
    const fees = calculateOrderFees(state, totalTires, tireSubtotal);
    const protectionTotal = tireProtection ? totalTires * TIRE_PROTECTION_PRICE : 0;
    const total = fees.total + protectionTotal;

    // 3. Determine fulfillment warehouse
    const fulfillmentItem = validated.find((v) => v.warehouseId);
    const fulfillmentWarehouseId = fulfillmentItem?.warehouseId || "";
    const fulfillmentLocationCode = fulfillmentItem?.locationCode || "";

    // 4. Charge the card via Square Payments API
    const squareClient = getSquareClient();
    const locationId = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID!;
    const totalInCents = BigInt(Math.round(total * 100));

    const paymentResponse = await squareClient.payments.create({
      sourceId,
      idempotencyKey: randomUUID(),
      amountMoney: {
        amount: totalInCents,
        currency: "USD",
      },
      locationId,
      buyerEmailAddress: shipping.email,
      note: `Ship.Tires Order - ${shipping.firstName} ${shipping.lastName}`,
    });

    const payment = paymentResponse.payment;
    if (!payment || payment.status !== "COMPLETED") {
      return Response.json(
        { error: "Payment failed. Please try again." },
        { status: 400 }
      );
    }

    // 5. Build order items for DB
    const customerName = `${shipping.firstName} ${shipping.lastName}`;
    const orderItems = validated.map((i) => ({
      brand: i.brand,
      model: i.model,
      size: i.size,
      price: i.price,
      qty: i.quantity,
    }));

    // 6. Insert order into Supabase
    await createConsumerOrder({
      paymentId: payment.id!,
      paymentMethod: "square",
      customerName,
      customerEmail: shipping.email,
      customerPhone: shipping.phone,
      shipping,
      items: orderItems,
      total,
      status: "paid",
      authUserId: auth_user_id || null,
      fulfillmentWarehouseId: fulfillmentWarehouseId || null,
      fulfillmentLocationCode: fulfillmentLocationCode || null,
    });

    // 7. Send confirmation emails (non-blocking)
    try {
      await sendCustomerConfirmationEmail(shipping.email, orderItems, total, customerName);
    } catch (err) {
      console.error("Failed to send customer confirmation email:", err);
    }

    try {
      const shippingAddr = `${shipping.address1}${shipping.address2 ? ", " + shipping.address2 : ""}, ${shipping.city}, ${shipping.state} ${shipping.zip}`;
      await sendAdminOrderNotification(orderItems, total, {
        name: customerName,
        email: shipping.email,
        phone: shipping.phone,
        shippingAddress: shippingAddr,
      }, payment.id!);
    } catch (err) {
      console.error("Failed to send admin notification email:", err);
    }

    // 8. Return success
    return Response.json({ orderId: payment.id });
  } catch (err) {
    console.error("Square process payment error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return Response.json({ error: message }, { status: 400 });
  }
}
