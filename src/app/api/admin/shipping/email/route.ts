import { isAdminRequest } from "@/lib/admin-auth";
import { getSupabase } from "@/lib/supabase";
import { Resend } from "resend";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

function getTrackingUrl(carrier: string, trackingNumber: string): string {
  const c = carrier.toUpperCase();
  if (c.includes("FEDEX")) return `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`;
  if (c.includes("UPS")) return `https://www.ups.com/track?tracknum=${trackingNumber}`;
  if (c.includes("USPS")) return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`;
  return `https://ship.tires/account/orders`;
}

function buildShippingHtml(
  customerName: string,
  trackingNumber: string,
  carrier: string,
  items: Array<{ brand?: string; model?: string; size?: string; quantity?: number; qty?: number }>
) {
  const trackingUrl = getTrackingUrl(carrier, trackingNumber);
  const carrierDisplay = carrier.toUpperCase();

  const itemRows = items
    .map(
      (i) => `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #E5E5E5;font-family:Arial,sans-serif;font-size:14px;color:#333333;">
            ${i.brand || ""} ${i.model || ""}<br/>
            <span style="color:#777777;font-size:12px;">${i.size || ""}</span>
          </td>
          <td style="padding:10px 12px;border-bottom:1px solid #E5E5E5;font-family:Arial,sans-serif;font-size:14px;color:#333333;text-align:center;">
            ${i.quantity || i.qty || 1}
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

  <!-- Shipped Banner -->
  <tr>
    <td style="background-color:#FFFFFF;padding:36px 40px 24px;text-align:center;">
      <div style="display:inline-block;width:48px;height:48px;border-radius:50%;background-color:#FF5C00;text-align:center;line-height:48px;font-size:24px;color:#FFFFFF;">&#x1F4E6;</div>
      <h1 style="margin:16px 0 8px;font-family:Arial,sans-serif;font-size:26px;font-weight:700;color:#141414;">Your Order Has Shipped!</h1>
      <p style="margin:0;font-family:Arial,sans-serif;font-size:15px;color:#555555;">
        Hi ${customerName || "there"}, great news &#8212; your tires are on the way!
      </p>
    </td>
  </tr>

  <!-- Tracking Info -->
  <tr>
    <td style="background-color:#FFFFFF;padding:0 40px 24px;">
      <h2 style="margin:0 0 12px;font-family:Arial,sans-serif;font-size:13px;font-weight:700;color:#FF5C00;text-transform:uppercase;letter-spacing:1px;">Tracking Information</h2>
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#F7F7F5;border-radius:6px;border:1px solid #E5E5E5;">
        <tr>
          <td style="padding:16px 20px;">
            <p style="margin:0 0 6px;font-family:Arial,sans-serif;font-size:12px;font-weight:700;color:#555555;text-transform:uppercase;">Carrier</p>
            <p style="margin:0 0 14px;font-family:Arial,sans-serif;font-size:15px;color:#141414;font-weight:700;">${carrierDisplay}</p>
            <p style="margin:0 0 6px;font-family:Arial,sans-serif;font-size:12px;font-weight:700;color:#555555;text-transform:uppercase;">Tracking Number</p>
            <p style="margin:0;font-family:Arial,sans-serif;font-size:15px;">
              <a href="${trackingUrl}" style="color:#FF5C00;text-decoration:none;font-weight:700;">${trackingNumber}</a>
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Items Shipped -->
  <tr>
    <td style="background-color:#FFFFFF;padding:0 40px 24px;">
      <h2 style="margin:0 0 12px;font-family:Arial,sans-serif;font-size:13px;font-weight:700;color:#FF5C00;text-transform:uppercase;letter-spacing:1px;">Items Shipped</h2>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E5E5E5;border-radius:6px;border-collapse:separate;">
        <tr style="background-color:#F7F7F5;">
          <th style="padding:10px 12px;font-family:Arial,sans-serif;font-size:12px;font-weight:700;color:#555555;text-transform:uppercase;text-align:left;border-bottom:1px solid #E5E5E5;">Item</th>
          <th style="padding:10px 12px;font-family:Arial,sans-serif;font-size:12px;font-weight:700;color:#555555;text-transform:uppercase;text-align:center;border-bottom:1px solid #E5E5E5;">Qty</th>
        </tr>
        ${itemRows}
      </table>
    </td>
  </tr>

  <!-- Estimated Delivery -->
  <tr>
    <td style="background-color:#FFFFFF;padding:0 40px 32px;">
      <h2 style="margin:0 0 12px;font-family:Arial,sans-serif;font-size:13px;font-weight:700;color:#FF5C00;text-transform:uppercase;letter-spacing:1px;">Estimated Delivery</h2>
      <p style="margin:0;font-family:Arial,sans-serif;font-size:14px;color:#333333;"><strong>3-7 business days</strong> from shipment date</p>
    </td>
  </tr>

  <!-- CTA Button -->
  <tr>
    <td style="background-color:#FFFFFF;padding:0 40px 32px;text-align:center;">
      <a href="${trackingUrl}" style="display:inline-block;padding:14px 36px;background-color:#FF5C00;color:#FFFFFF;font-family:Arial,sans-serif;font-size:15px;font-weight:700;text-decoration:none;border-radius:6px;">Track Your Package</a>
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

    const carrier = order.carrier || "";

    const html = buildShippingHtml(
      order.customer_name || "",
      order.tracking_number,
      carrier,
      items
    );

    await getResend().emails.send({
      from: "Ship.Tires <orders@ship.tires>",
      to: order.customer_email,
      subject: "Your Order Has Shipped! — Ship.Tires",
      html,
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
