import { getStripe } from "@/lib/stripe";
import { getSupabase } from "@/lib/supabase";
import { Resend } from "resend";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

type OrderItem = {
  brand: string;
  model: string;
  size: string;
  qty: number;
  price: number;
};

export function buildOrderConfirmationHtml(
  items: OrderItem[],
  total: number,
  customerName?: string
) {
  const itemRows = items
    .map(
      (i) => `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #E5E5E5;font-family:Arial,sans-serif;font-size:14px;color:#333333;">
            ${i.brand} ${i.model}<br/>
            <span style="color:#777777;font-size:12px;">${i.size}</span>
          </td>
          <td style="padding:10px 12px;border-bottom:1px solid #E5E5E5;font-family:Arial,sans-serif;font-size:14px;color:#333333;text-align:center;">
            ${i.qty}
          </td>
          <td style="padding:10px 12px;border-bottom:1px solid #E5E5E5;font-family:Arial,sans-serif;font-size:14px;color:#333333;text-align:right;">
            $${(i.price * i.qty).toFixed(2)}
          </td>
        </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background-color:#FAFAF7;font-family:Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FAFAF7;">
<tr><td align="center" style="padding:20px 10px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

  <!-- Header -->
  <tr>
    <td style="background-color:#141414;padding:28px 40px;text-align:center;">
      <img src="https://ship.tires/logo.png" alt="Ship.Tires" width="180" style="display:inline-block;max-width:180px;height:auto;"/>
    </td>
  </tr>

  <!-- Confirmation Banner -->
  <tr>
    <td style="background-color:#FFFFFF;padding:36px 40px 24px;text-align:center;">
      <div style="display:inline-block;width:48px;height:48px;border-radius:50%;background-color:#FF5C00;text-align:center;line-height:48px;font-size:24px;color:#FFFFFF;">&#10003;</div>
      <h1 style="margin:16px 0 8px;font-family:Arial,sans-serif;font-size:26px;font-weight:700;color:#141414;">Order Confirmed!</h1>
      <p style="margin:0;font-family:Arial,sans-serif;font-size:15px;color:#555555;">
        Thank you${customerName ? `, ${customerName}` : ""}! We&#8217;ve received your order.
      </p>
    </td>
  </tr>

  <!-- Order Details -->
  <tr>
    <td style="background-color:#FFFFFF;padding:0 40px 24px;">
      <h2 style="margin:0 0 12px;font-family:Arial,sans-serif;font-size:13px;font-weight:700;color:#FF5C00;text-transform:uppercase;letter-spacing:1px;">Order Details</h2>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E5E5E5;border-radius:6px;border-collapse:separate;">
        <tr style="background-color:#F7F7F5;">
          <th style="padding:10px 12px;font-family:Arial,sans-serif;font-size:12px;font-weight:700;color:#555555;text-transform:uppercase;text-align:left;border-bottom:1px solid #E5E5E5;">Item</th>
          <th style="padding:10px 12px;font-family:Arial,sans-serif;font-size:12px;font-weight:700;color:#555555;text-transform:uppercase;text-align:center;border-bottom:1px solid #E5E5E5;">Qty</th>
          <th style="padding:10px 12px;font-family:Arial,sans-serif;font-size:12px;font-weight:700;color:#555555;text-transform:uppercase;text-align:right;border-bottom:1px solid #E5E5E5;">Price</th>
        </tr>
        ${itemRows}
        <tr>
          <td colspan="2" style="padding:12px;font-family:Arial,sans-serif;font-size:15px;font-weight:700;color:#141414;text-align:right;">Total</td>
          <td style="padding:12px;font-family:Arial,sans-serif;font-size:15px;font-weight:700;color:#141414;text-align:right;">$${total.toFixed(2)}</td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Shipping Info -->
  <tr>
    <td style="background-color:#FFFFFF;padding:0 40px 32px;">
      <h2 style="margin:0 0 12px;font-family:Arial,sans-serif;font-size:13px;font-weight:700;color:#FF5C00;text-transform:uppercase;letter-spacing:1px;">Shipping</h2>
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding:6px 0;font-family:Arial,sans-serif;font-size:14px;color:#333333;">Ships within <strong>1-2 business days</strong></td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-family:Arial,sans-serif;font-size:14px;color:#333333;">Free shipping on all orders</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-family:Arial,sans-serif;font-size:14px;color:#333333;">Estimated delivery: <strong>3-7 business days</strong></td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- CTA Button -->
  <tr>
    <td style="background-color:#FFFFFF;padding:0 40px 32px;text-align:center;">
      <a href="https://ship.tires/account/orders" style="display:inline-block;padding:14px 36px;background-color:#FF5C00;color:#FFFFFF;font-family:Arial,sans-serif;font-size:15px;font-weight:700;text-decoration:none;border-radius:6px;">Track Your Order</a>
    </td>
  </tr>

  <!-- Contact -->
  <tr>
    <td style="background-color:#F7F7F5;padding:24px 40px;text-align:center;border-top:1px solid #E5E5E5;">
      <p style="margin:0 0 4px;font-family:Arial,sans-serif;font-size:14px;color:#555555;">Questions? We&#8217;re here to help.</p>
      <p style="margin:0;font-family:Arial,sans-serif;font-size:14px;color:#555555;">
        Call or text <a href="tel:+12792388473" style="color:#FF5C00;text-decoration:none;font-weight:700;">(279) 238-8473</a>
        &nbsp;|&nbsp;
        <a href="mailto:orders@ship.tires" style="color:#FF5C00;text-decoration:none;font-weight:700;">orders@ship.tires</a>
      </p>
    </td>
  </tr>

  <!-- Footer -->
  <tr>
    <td style="background-color:#141414;padding:20px 40px;text-align:center;">
      <p style="margin:0;font-family:Arial,sans-serif;font-size:12px;color:#999999;">&copy; ${new Date().getFullYear()} Ship.Tires &mdash; All rights reserved.</p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

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

    const items: OrderItem[] = session.metadata?.items_json
      ? JSON.parse(session.metadata.items_json)
      : [];

    const shipping = session.metadata?.shipping_address
      ? JSON.parse(session.metadata.shipping_address)
      : null;

    // Store order in Supabase (unified tire_orders table)
    const authUserId = session.metadata?.auth_user_id || null;
    try {
      await getSupabase().from("tire_orders").insert({
        stripe_session_id: session.id,
        customer_name: session.metadata?.customer_name || "",
        customer_email: session.customer_email || "",
        customer_phone: session.metadata?.customer_phone || "",
        shipping_address: shipping,
        items,
        total: (session.amount_total || 0) / 100,
        status: "paid",
        auth_user_id: authUserId || null,
      });
    } catch {
      // Log but don't fail the webhook
      console.error("Failed to store order in Supabase");
    }

    // Send confirmation email
    try {
      if (session.customer_email) {
        const total = (session.amount_total || 0) / 100;
        const html = buildOrderConfirmationHtml(
          items,
          total,
          session.metadata?.customer_name || undefined
        );

        await getResend().emails.send({
          from: "Ship.Tires <orders@ship.tires>",
          to: session.customer_email,
          subject: "Order Confirmation — Ship.Tires",
          html,
        });
      }
    } catch {
      console.error("Failed to send confirmation email");
    }
  }

  return new Response("OK", { status: 200 });
}
