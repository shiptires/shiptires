import { getPlaid } from "@/lib/plaid";
import {
  TransferType,
  TransferNetwork,
  ACHClass,
  TransferAuthorizationDecisionRationale,
} from "plaid";
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
      public_token,
      account_id,
      shipping,
      items,
      tireProtection,
      auth_user_id,
    } = (await req.json()) as {
      public_token: string;
      account_id: string;
      shipping: ShippingAddress;
      items: CartItem[];
      tireProtection?: boolean;
      auth_user_id?: string;
    };

    if (!public_token || !account_id) {
      return Response.json({ error: "Missing payment details" }, { status: 400 });
    }
    if (!items?.length) {
      return Response.json({ error: "Cart is empty" }, { status: 400 });
    }
    if (!shipping?.email || !shipping?.firstName || !shipping?.lastName) {
      return Response.json({ error: "Shipping info required" }, { status: 400 });
    }

    const plaid = getPlaid();

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

    // 4. Exchange public token for access token
    const exchangeResponse = await plaid.itemPublicTokenExchange({
      public_token,
    });
    const accessToken = exchangeResponse.data.access_token;

    // 5. Create transfer authorization
    const customerName = `${shipping.firstName} ${shipping.lastName}`;
    const authorizationResponse = await plaid.transferAuthorizationCreate({
      access_token: accessToken,
      account_id,
      type: TransferType.Debit,
      network: TransferNetwork.Ach,
      amount: total.toFixed(2),
      ach_class: ACHClass.Web,
      user: {
        legal_name: customerName,
        email_address: shipping.email,
        phone_number: shipping.phone || undefined,
      },
    });

    const authorization = authorizationResponse.data.authorization;
    if (authorization.decision === "declined") {
      const rationale = authorization.decision_rationale;
      return Response.json(
        {
          error: "Payment authorization declined",
          reason: rationale?.description || "Bank declined the transaction",
        },
        { status: 400 }
      );
    }

    // 6. Create the transfer
    const transferResponse = await plaid.transferCreate({
      access_token: accessToken,
      account_id,
      authorization_id: authorization.id,
      description: "Ship.Tires Order",
    });

    const transfer = transferResponse.data.transfer;

    // 7. Build order items for DB
    const orderItems = validated.map((i) => ({
      brand: i.brand,
      model: i.model,
      size: i.size,
      price: i.price,
      qty: i.quantity,
    }));

    // 8. Insert order into Supabase
    const shippingAddr = `${shipping.address1}${shipping.address2 ? ", " + shipping.address2 : ""}, ${shipping.city}, ${shipping.state} ${shipping.zip}`;
    await createConsumerOrder({
      paymentId: transfer.id,
      paymentMethod: "ach",
      customerName,
      customerEmail: shipping.email,
      customerPhone: shipping.phone,
      shipping,
      items: orderItems,
      total,
      status: "pending_payment",
      authUserId: auth_user_id || null,
      fulfillmentWarehouseId: fulfillmentWarehouseId || null,
      fulfillmentLocationCode: fulfillmentLocationCode || null,
    });

    // 9. Send confirmation emails
    try {
      await sendCustomerConfirmationEmail(shipping.email, orderItems, total, customerName);
    } catch (err) {
      console.error("Failed to send customer confirmation email:", err);
    }

    try {
      await sendAdminOrderNotification(orderItems, total, {
        name: customerName,
        email: shipping.email,
        phone: shipping.phone,
        shippingAddress: shippingAddr,
      }, transfer.id);
    } catch (err) {
      console.error("Failed to send admin notification email:", err);
    }

    // 10. Return success
    return Response.json({
      orderId: transfer.id,
      transferId: transfer.id,
      status: "pending",
    });
  } catch (err) {
    console.error("Process payment error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return Response.json({ error: message }, { status: 400 });
  }
}
