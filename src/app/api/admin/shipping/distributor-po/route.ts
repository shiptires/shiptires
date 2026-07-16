import { isAdminRequest } from "@/lib/admin-auth";
import { getSupabase } from "@/lib/supabase";
import { Resend } from "resend";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

/**
 * POST /api/admin/shipping/distributor-po
 *
 * Sends a Purchase Order email to a distributor with order details and FedEx labels attached.
 *
 * Request body:
 *   { orderId, distributorEmail, labels: [{ trackingNumber, labelData }] }
 */
export async function POST(req: Request) {
  if (!(await isAdminRequest())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { orderId, distributorEmail, labels } = await req.json();

    if (!orderId) {
      return Response.json({ error: "orderId is required" }, { status: 400 });
    }
    if (!distributorEmail) {
      return Response.json({ error: "distributorEmail is required" }, { status: 400 });
    }

    // Fetch order details
    const { data: order, error: orderError } = await getSupabase()
      .from("tire_orders")
      .select("id, customer_name, customer_email, shipping_address, items, tracking_number, carrier, total_amount")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return Response.json({ error: "Order not found" }, { status: 404 });
    }

    const poNumber = `ST-${orderId.slice(0, 8)}`;
    const items = (order.items || []) as Array<{
      brand?: string;
      model?: string;
      size?: string;
      quantity?: number;
      qty?: number;
      price?: number;
      cost?: number;
      part_number?: string;
      sku?: string;
    }>;

    const address = order.shipping_address as {
      name?: string;
      street1?: string;
      line1?: string;
      address1?: string;
      street2?: string;
      line2?: string;
      address2?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      postal_code?: string;
      zip?: string;
      country?: string;
    } | null;

    // Build item rows for the email
    const itemRows = items.map((item) => {
      const sku = item.part_number || item.sku || "—";
      const desc = [item.brand, item.model, item.size].filter(Boolean).join(" ");
      const qty = item.quantity || item.qty || 1;
      const price = item.price || item.cost || 0;
      return { sku, desc, qty, price };
    });

    // Build tracking numbers list
    const trackingNumbers: string[] = [];
    if (labels && Array.isArray(labels)) {
      for (const label of labels) {
        if (label.trackingNumber) trackingNumbers.push(label.trackingNumber);
      }
    }
    if (trackingNumbers.length === 0 && order.tracking_number) {
      // Split comma-separated tracking numbers
      trackingNumbers.push(...order.tracking_number.split(",").map((t: string) => t.trim()).filter(Boolean));
    }

    // Build ship-to address
    const shipTo = address ? [
      address.name || order.customer_name || "",
      address.street1 || address.line1 || address.address1 || "",
      address.street2 || address.line2 || address.address2 || "",
      [address.city, address.state, address.postalCode || address.postal_code || address.zip].filter(Boolean).join(", "),
      address.country && address.country !== "US" ? address.country : "",
    ].filter(Boolean).join("\n") : (order.customer_name || "No address on file");

    // Build email HTML
    const html = buildPOEmailHtml(poNumber, itemRows, shipTo, trackingNumbers);

    // Build attachments from label data
    const attachments: Array<{ filename: string; content: string }> = [];
    if (labels && Array.isArray(labels)) {
      for (let i = 0; i < labels.length; i++) {
        const label = labels[i];
        if (label.labelData) {
          attachments.push({
            filename: `label-${poNumber}-${i + 1}.pdf`,
            content: label.labelData,
          });
        }
      }
    }

    // Send via Resend
    await getResend().emails.send({
      from: "Ship.Tires <orders@ship.tires>",
      to: distributorEmail,
      subject: `PO #${poNumber} — Ship.Tires Order`,
      html,
      attachments: attachments.length > 0 ? attachments : undefined,
    });

    return Response.json({ sent: true, poNumber });
  } catch (e) {
    console.error("Distributor PO email error:", e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Failed to send PO email" },
      { status: 500 }
    );
  }
}

function buildPOEmailHtml(
  poNumber: string,
  items: Array<{ sku: string; desc: string; qty: number; price: number }>,
  shipTo: string,
  trackingNumbers: string[]
): string {
  const itemRows = items
    .map(
      (item) => `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #E5E5E5;font-family:Arial,sans-serif;font-size:13px;color:#333;">${item.sku}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #E5E5E5;font-family:Arial,sans-serif;font-size:13px;color:#333;">${item.desc}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #E5E5E5;font-family:Arial,sans-serif;font-size:13px;color:#333;text-align:center;">${item.qty}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #E5E5E5;font-family:Arial,sans-serif;font-size:13px;color:#333;text-align:right;">$${item.price.toFixed(2)}</td>
        </tr>`
    )
    .join("");

  const trackingHtml = trackingNumbers.length > 0
    ? trackingNumbers.map((tn) => `<p style="margin:2px 0;font-family:monospace;font-size:13px;color:#333;">${tn}</p>`).join("")
    : `<p style="margin:2px 0;font-family:Arial,sans-serif;font-size:13px;color:#999;">Labels attached</p>`;

  const shipToHtml = shipTo.split("\n").map((line) => `<p style="margin:2px 0;font-family:Arial,sans-serif;font-size:13px;color:#333;">${line}</p>`).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;">
<tr><td align="center" style="padding:20px 10px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:6px;overflow:hidden;border:1px solid #ddd;">

  <!-- Header -->
  <tr>
    <td style="background-color:#141414;padding:20px 30px;">
      <h1 style="margin:0;font-family:Arial,sans-serif;font-size:20px;color:#fff;">Purchase Order</h1>
      <p style="margin:4px 0 0;font-family:Arial,sans-serif;font-size:14px;color:#FF5C00;font-weight:bold;">${poNumber}</p>
    </td>
  </tr>

  <!-- PO Details -->
  <tr>
    <td style="padding:24px 30px 16px;">
      <h2 style="margin:0 0 12px;font-family:Arial,sans-serif;font-size:14px;font-weight:700;color:#555;text-transform:uppercase;letter-spacing:1px;">Order Items</h2>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E5E5E5;border-radius:4px;border-collapse:separate;">
        <tr style="background-color:#f7f7f5;">
          <th style="padding:8px 12px;font-family:Arial,sans-serif;font-size:12px;font-weight:700;color:#555;text-transform:uppercase;text-align:left;border-bottom:1px solid #E5E5E5;">SKU</th>
          <th style="padding:8px 12px;font-family:Arial,sans-serif;font-size:12px;font-weight:700;color:#555;text-transform:uppercase;text-align:left;border-bottom:1px solid #E5E5E5;">Description</th>
          <th style="padding:8px 12px;font-family:Arial,sans-serif;font-size:12px;font-weight:700;color:#555;text-transform:uppercase;text-align:center;border-bottom:1px solid #E5E5E5;">Qty</th>
          <th style="padding:8px 12px;font-family:Arial,sans-serif;font-size:12px;font-weight:700;color:#555;text-transform:uppercase;text-align:right;border-bottom:1px solid #E5E5E5;">Price</th>
        </tr>
        ${itemRows}
      </table>
    </td>
  </tr>

  <!-- Ship To -->
  <tr>
    <td style="padding:0 30px 16px;">
      <h2 style="margin:0 0 8px;font-family:Arial,sans-serif;font-size:14px;font-weight:700;color:#555;text-transform:uppercase;letter-spacing:1px;">Ship To</h2>
      <div style="background:#f7f7f5;border-radius:4px;padding:12px 16px;border:1px solid #E5E5E5;">
        ${shipToHtml}
      </div>
    </td>
  </tr>

  <!-- Tracking -->
  <tr>
    <td style="padding:0 30px 24px;">
      <h2 style="margin:0 0 8px;font-family:Arial,sans-serif;font-size:14px;font-weight:700;color:#555;text-transform:uppercase;letter-spacing:1px;">Tracking Number(s)</h2>
      <div style="background:#f7f7f5;border-radius:4px;padding:12px 16px;border:1px solid #E5E5E5;">
        ${trackingHtml}
      </div>
    </td>
  </tr>

  <!-- Footer -->
  <tr>
    <td style="background-color:#f7f7f5;padding:16px 30px;border-top:1px solid #E5E5E5;">
      <p style="margin:0;font-family:Arial,sans-serif;font-size:12px;color:#999;">
        Ship.Tires &mdash; orders@ship.tires &mdash; (279) 238-8473
      </p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}
