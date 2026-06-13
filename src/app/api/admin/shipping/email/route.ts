import { isAdminRequest } from "@/lib/admin-auth";
import { getSupabase } from "@/lib/supabase";
import { Resend } from "resend";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

export async function POST(req: Request) {
  if (!(await isAdminRequest())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { orderId } = await req.json();

    if (!orderId) {
      return Response.json({ error: "orderId is required" }, { status: 400 });
    }

    const { data: order, error: orderError } = await getSupabase()
      .from("tire_orders")
      .select("tracking_number, carrier, customer_email, customer_name, items")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return Response.json({ error: "Order not found" }, { status: 404 });
    }

    if (!order.tracking_number) {
      return Response.json(
        { error: "Order has no tracking number" },
        { status: 400 }
      );
    }

    if (!order.customer_email) {
      return Response.json(
        { error: "Order has no customer email" },
        { status: 400 }
      );
    }

    const items = (order.items || []) as Array<{
      brand?: string;
      model?: string;
      size?: string;
      quantity?: number;
      qty?: number;
    }>;

    const itemLines = items
      .map(
        (i) =>
          `• ${i.brand || ""} ${i.model || ""} (${i.size || ""}) x${i.quantity || i.qty || 1}`
      )
      .join("\n");

    const carrier = (order.carrier || "").toUpperCase();

    await getResend().emails.send({
      from: "Ship.Tires <orders@ship.tires>",
      to: order.customer_email,
      subject: "Your Order Has Shipped! — Ship.Tires",
      text: `Hi ${order.customer_name || "there"},\n\nGreat news — your order has shipped!\n\nTracking Number: ${order.tracking_number}\nCarrier: ${carrier}\n\nItems Shipped:\n${itemLines}\n\nEstimated delivery: 3-7 business days.\n\nQuestions? Call or text (279) 238-8473 or reply to this email.\n\n— Ship.Tires Team`,
    });

    return Response.json({ sent: true });
  } catch (e) {
    console.error("Shipping email error:", e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Failed to send email" },
      { status: 500 }
    );
  }
}
