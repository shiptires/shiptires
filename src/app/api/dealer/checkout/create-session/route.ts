import { getDealerFromRequest } from "@/lib/dealer-auth";
import { getPlaid } from "@/lib/plaid";
import { getDealerPriceBatch } from "@/lib/dealer-pricing";
import {
  createDealerOrder,
  sendDealerConfirmationEmail,
  sendDealerAdminNotification,
} from "@/lib/order-utils";
import {
  TransferType,
  TransferNetwork,
  ACHClass,
} from "plaid";
import { getSupabase } from "@/lib/supabase";

interface CartItem {
  tireId: number;
  brand: string;
  model: string;
  size: string;
  price: number;
  quantity: number;
  image: string | null;
  loadIndex: number;
  speedRating: string;
}

export async function POST(req: Request) {
  try {
    const dealerId = await getDealerFromRequest();
    if (!dealerId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { items, public_token, account_id } = (await req.json()) as {
      items: CartItem[];
      public_token: string;
      account_id: string;
    };

    if (!items?.length) {
      return Response.json({ error: "Cart is empty" }, { status: 400 });
    }
    if (!public_token || !account_id) {
      return Response.json({ error: "Missing payment details" }, { status: 400 });
    }

    // Re-validate pricing server-side
    const tireIds = items.map((i) => i.tireId);
    const pricing = await getDealerPriceBatch(tireIds);

    const validatedItems = items.map((item) => {
      const dealerPrice = pricing.get(item.tireId);
      const price = dealerPrice?.wholesalePrice ?? item.price;
      return { ...item, price };
    });

    // Calculate total (no tax or disposal fees for B2B)
    const total = validatedItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // Look up dealer info for Plaid user details
    const { data: dealer } = await getSupabase()
      .from("dealers")
      .select("business_name, contact_name, email")
      .eq("id", dealerId)
      .single();

    const plaid = getPlaid();

    // Exchange public token for access token
    const exchangeResponse = await plaid.itemPublicTokenExchange({
      public_token,
    });
    const accessToken = exchangeResponse.data.access_token;

    // Create transfer authorization
    const authorizationResponse = await plaid.transferAuthorizationCreate({
      access_token: accessToken,
      account_id,
      type: TransferType.Debit,
      network: TransferNetwork.Ach,
      amount: total.toFixed(2),
      ach_class: ACHClass.Ccd,
      user: {
        legal_name: dealer?.business_name || dealer?.contact_name || "Dealer",
        email_address: dealer?.email || undefined,
      },
    });

    const authorization = authorizationResponse.data.authorization;
    if (authorization.decision === "declined") {
      return Response.json(
        {
          error: "Payment authorization declined",
          reason: authorization.decision_rationale?.description || "Bank declined the transaction",
        },
        { status: 400 }
      );
    }

    // Create the transfer
    const transferResponse = await plaid.transferCreate({
      access_token: accessToken,
      account_id,
      authorization_id: authorization.id,
      description: "Ship.Tires Dealer Order",
    });

    const transfer = transferResponse.data.transfer;

    // Build order items
    const orderItems = validatedItems.map((i) => ({
      tireId: i.tireId,
      brand: i.brand,
      model: i.model,
      size: i.size,
      price: i.price,
      qty: i.quantity,
    }));

    // Insert into dealer_orders
    await createDealerOrder({
      paymentId: transfer.id,
      paymentMethod: "ach",
      dealerId,
      items: orderItems,
      total,
      status: "pending_payment",
    });

    // Send confirmation emails
    try {
      await sendDealerConfirmationEmail(dealerId, orderItems, total);
    } catch (err) {
      console.error("Failed to send dealer confirmation email:", err);
    }

    try {
      await sendDealerAdminNotification(dealerId, orderItems, total);
    } catch (err) {
      console.error("Failed to send admin dealer notification:", err);
    }

    return Response.json({
      orderId: transfer.id,
      transferId: transfer.id,
      status: "pending",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return Response.json({ error: message }, { status: 400 });
  }
}
