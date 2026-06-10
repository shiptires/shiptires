import { getStripe } from "@/lib/stripe";
import { getSupabase } from "@/lib/supabase";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return new Response("Missing signature", { status: 400 });
  }

  let event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    const items = session.metadata?.items_json
      ? JSON.parse(session.metadata.items_json)
      : [];

    const shipping = session.metadata?.shipping_address
      ? JSON.parse(session.metadata.shipping_address)
      : null;

    // Store order in Supabase
    try {
      await getSupabase().from("orders").insert({
        stripe_session_id: session.id,
        customer_name: session.metadata?.customer_name || "",
        customer_email: session.customer_email || "",
        customer_phone: session.metadata?.customer_phone || "",
        shipping_address: shipping,
        items,
        total: (session.amount_total || 0) / 100,
        status: "paid",
      });
    } catch {
      // Log but don't fail the webhook
      console.error("Failed to store order in Supabase");
    }

    // Send confirmation email
    try {
      if (session.customer_email) {
        const itemLines = items
          .map(
            (i: { brand: string; model: string; size: string; qty: number; price: number }) =>
              `${i.brand} ${i.model} (${i.size}) x${i.qty} — $${(i.price * i.qty).toFixed(2)}`
          )
          .join("\n");

        await resend.emails.send({
          from: "Ship.Tires <orders@ship.tires>",
          to: session.customer_email,
          subject: "Order Confirmation — Ship.Tires",
          text: `Thank you for your order!\n\nOrder Details:\n${itemLines}\n\nTotal: $${((session.amount_total || 0) / 100).toFixed(2)}\n\nYour tires will ship within 1-2 business days with free shipping.\nDelivery: 3-7 business days.\n\nQuestions? Call or text (279) 238-8473 or reply to this email.\n\n— Ship.Tires Team`,
        });
      }
    } catch {
      console.error("Failed to send confirmation email");
    }
  }

  return new Response("OK", { status: 200 });
}
