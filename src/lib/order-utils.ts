import { getSupabase } from "@/lib/supabase";
import { Resend } from "resend";
import { calculateOrderFees } from "@/lib/tire-fees";
import type { CartItem, ShippingAddress } from "@/lib/types";
import { searchTires, getTireById, toSlug } from "@/lib/db";
import type { TireRow } from "@/lib/db";
import { getSitePrice, getSitePriceForLocation } from "@/lib/pricing";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

export type OrderItem = {
  brand: string;
  model: string;
  size: string;
  qty: number;
  price: number;
};

export type ValidatedItem = CartItem & {
  locationCode?: string;
  warehouseId?: string;
};

// ── Price validation ──

function slugsMatch(a: string, b: string): boolean {
  if (a === b) return true;
  const normalize = (s: string) => s.replace(/-/g, "");
  return normalize(a) === normalize(b);
}

function findByModelSlug(tires: TireRow[], modelSlug: string): TireRow | undefined {
  const strict = tires.find((t) => toSlug(t.model_name) === modelSlug);
  if (strict) return strict;
  return tires.find((t) => slugsMatch(toSlug(t.model_name), modelSlug));
}

export async function validateAndPriceItems(
  items: CartItem[],
  customerZip?: string
): Promise<ValidatedItem[]> {
  const validated: ValidatedItem[] = [];

  for (const item of items) {
    let match: TireRow | null | undefined = null;
    let searchResult: { tires: TireRow[] } = { tires: [] };

    if (item.tireId) {
      const tire = await getTireById(item.tireId);
      if (tire && slugsMatch(toSlug(tire.make_name), item.brandSlug)) {
        match = tire;
        searchResult = { tires: [tire] };
      }
    }

    if (!match) {
      const result = await searchTires({ brand: item.brandSlug, size: item.size, limit: 50 });
      searchResult = result;
      match = findByModelSlug(result.tires, item.modelSlug);
    }

    if (!match) {
      const result = await searchTires({ brand: item.brandSlug, limit: 100 });
      match = findByModelSlug(result.tires, item.modelSlug);
      if (match) searchResult = result;
    }

    if (!match) {
      throw new Error(
        `Could not find ${item.brand} ${item.model} in size ${item.size}. Please remove it from your cart and re-add it.`
      );
    }

    const weightLbs = parseFloat(match.weight ?? "") || null;
    let price: number;
    let locationCode: string | undefined;
    let warehouseId: string | undefined;

    if (customerZip) {
      const locResult = await getSitePriceForLocation(
        match.id, match.make_name, match.model_name, customerZip, weightLbs
      );
      price = locResult.price;
      locationCode = locResult.locationCode;
      warehouseId = locResult.warehouseId;
    } else {
      price = await getSitePrice(match.id, match.make_name, match.model_name, weightLbs);
    }

    if (price <= 0) {
      let priced: TireRow | null = null;
      for (const t of searchResult.tires) {
        if (t.id === match.id) continue;
        if (!slugsMatch(toSlug(t.model_name), item.modelSlug)) continue;
        const p = await getSitePrice(
          t.id, t.make_name, t.model_name, parseFloat(t.weight ?? "") || null
        );
        if (p > 0) { priced = t; break; }
      }
      if (!priced) {
        throw new Error(
          `Price unavailable for ${item.size} ${match.make_name} ${match.model_name}. Please call (279) 238-8473 for a quote.`
        );
      }

      const pricedWeight = parseFloat(priced.weight ?? "") || null;
      let pricedPrice: number;
      let pricedLocationCode: string | undefined;
      let pricedWarehouseId: string | undefined;

      if (customerZip) {
        const locResult = await getSitePriceForLocation(
          priced.id, priced.make_name, priced.model_name, customerZip, pricedWeight
        );
        pricedPrice = locResult.price;
        pricedLocationCode = locResult.locationCode;
        pricedWarehouseId = locResult.warehouseId;
      } else {
        pricedPrice = await getSitePrice(priced.id, priced.make_name, priced.model_name, pricedWeight);
      }

      validated.push({
        ...item,
        brand: priced.make_name,
        model: priced.model_name,
        price: pricedPrice,
        loadIndex: parseInt(priced.load_rating ?? "0") || 0,
        speedRating: priced.speed_rating ?? "",
        locationCode: pricedLocationCode,
        warehouseId: pricedWarehouseId,
      });
    } else {
      validated.push({
        ...item,
        brand: match.make_name,
        model: match.model_name,
        price,
        loadIndex: parseInt(match.load_rating ?? "0") || 0,
        speedRating: match.speed_rating ?? "",
        locationCode,
        warehouseId,
      });
    }
  }

  return validated;
}

// ── Order creation ──

interface ConsumerOrderData {
  paymentId: string;
  paymentMethod: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shipping: ShippingAddress;
  items: OrderItem[];
  total: number;
  status: string;
  authUserId?: string | null;
  fulfillmentWarehouseId?: string | null;
  fulfillmentLocationCode?: string | null;
}

export async function createConsumerOrder(data: ConsumerOrderData) {
  const { error } = await getSupabase().from("tire_orders").insert({
    payment_id: data.paymentId,
    payment_method: data.paymentMethod,
    customer_name: data.customerName,
    customer_email: data.customerEmail,
    customer_phone: data.customerPhone,
    shipping_address: data.shipping,
    items: data.items,
    total: data.total,
    status: data.status,
    auth_user_id: data.authUserId || null,
    fulfillment_warehouse_id: data.fulfillmentWarehouseId || null,
    fulfillment_location_code: data.fulfillmentLocationCode || null,
  });
  if (error) {
    console.error("Failed to store order in Supabase:", error.message);
  }
}

interface DealerOrderData {
  paymentId: string;
  paymentMethod: string;
  dealerId: string;
  items: OrderItem[];
  total: number;
  status: string;
}

export async function createDealerOrder(data: DealerOrderData) {
  const { error } = await getSupabase().from("dealer_orders").insert({
    dealer_id: data.dealerId,
    payment_id: data.paymentId,
    payment_method: data.paymentMethod,
    items: data.items,
    total: data.total,
    status: data.status,
  });
  if (error) {
    console.error("Failed to store dealer order in Supabase:", error.message);
  }
}

// ── Email sending ──

export function buildOrderConfirmationHtml(
  items: OrderItem[],
  total: number,
  customerName?: string,
  achNote?: boolean
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

  const paymentNote = achNote
    ? `<tr><td colspan="3" style="padding:12px;font-family:Arial,sans-serif;font-size:13px;color:#555555;background:#FFF8F0;border-radius:4px;">Payment is processing via ACH bank transfer (1-3 business days).</td></tr>`
    : "";

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
        ${paymentNote}
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

export async function sendCustomerConfirmationEmail(
  email: string,
  items: OrderItem[],
  total: number,
  customerName?: string
) {
  const html = buildOrderConfirmationHtml(items, total, customerName, true);
  await getResend().emails.send({
    from: "Ship.Tires <orders@ship.tires>",
    to: email,
    subject: "Order Confirmation — Ship.Tires",
    html,
  });
}

export async function sendAdminOrderNotification(
  items: OrderItem[],
  total: number,
  customer: {
    name: string;
    email: string;
    phone: string;
    shippingAddress?: string;
  },
  paymentId: string
) {
  const itemRows = items
    .map(
      (i) =>
        `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;">${i.brand} ${i.model}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;">${i.size}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;">${i.qty}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;">$${(i.price * i.qty).toFixed(2)}</td>
        </tr>`
    )
    .join("");

  const adminHtml = `
    <div style="font-family:Arial,sans-serif;max-width:600px;">
      <h2 style="color:#FF5C00;margin-bottom:4px;">New Order Received!</h2>
      <p style="color:#555;margin-top:0;">Payment ID: ${paymentId}</p>

      <h3 style="margin-bottom:8px;">Customer</h3>
      <p style="margin:2px 0;"><strong>Name:</strong> ${customer.name}</p>
      <p style="margin:2px 0;"><strong>Email:</strong> ${customer.email}</p>
      <p style="margin:2px 0;"><strong>Phone:</strong> ${customer.phone}</p>
      <p style="margin:2px 0;"><strong>Ship to:</strong> ${customer.shippingAddress || "N/A"}</p>

      <h3 style="margin-bottom:8px;">Items</h3>
      <table style="width:100%;border-collapse:collapse;border:1px solid #ddd;">
        <tr style="background:#f5f5f5;">
          <th style="padding:8px 12px;text-align:left;">Tire</th>
          <th style="padding:8px 12px;text-align:left;">Size</th>
          <th style="padding:8px 12px;text-align:center;">Qty</th>
          <th style="padding:8px 12px;text-align:right;">Price</th>
        </tr>
        ${itemRows}
      </table>

      <p style="font-size:18px;font-weight:bold;margin-top:16px;">Total: $${total.toFixed(2)}</p>

      <p style="margin-top:24px;">
        <a href="https://ship.tires/admin/orders" style="display:inline-block;padding:12px 24px;background:#FF5C00;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold;">View in Admin</a>
      </p>
    </div>
  `;

  await getResend().emails.send({
    from: "Ship.Tires <orders@ship.tires>",
    to: ["farhad@ship.tires", "info@ship.tires"],
    subject: `New Order — ${customer.name} — $${total.toFixed(2)}`,
    html: adminHtml,
  });
}

export async function sendDealerConfirmationEmail(
  dealerId: string,
  items: OrderItem[],
  total: number
) {
  const { data: dealer } = await getSupabase()
    .from("dealers")
    .select("email, business_name, contact_name")
    .eq("id", dealerId)
    .single();

  if (!dealer?.email) return;

  const itemList = items
    .map((i) => `${i.brand} ${i.model} (${i.size}) x${i.qty} — $${(i.price * i.qty).toFixed(2)}`)
    .join("<br/>");

  await getResend().emails.send({
    from: "Ship.Tires <orders@ship.tires>",
    to: dealer.email,
    subject: "Dealer Order Confirmation — Ship.Tires",
    html: `
      <h2>Dealer Order Confirmed</h2>
      <p>Hi ${dealer.contact_name || dealer.business_name},</p>
      <p>Your wholesale order has been received and is being processed.</p>
      <h3>Order Details</h3>
      <p>${itemList}</p>
      <p><strong>Total: $${total.toFixed(2)}</strong></p>
      <hr/>
      <p>Track your orders at <a href="https://ship.tires/dealer/dashboard/orders">ship.tires/dealer/dashboard/orders</a></p>
      <p>Questions? Contact us at <a href="mailto:info@ship.tires">info@ship.tires</a> or call (279) 238-8473.</p>
    `,
  });
}

export async function sendDealerAdminNotification(
  dealerId: string,
  items: OrderItem[],
  total: number
) {
  const itemList = items
    .map((i) => `${i.brand} ${i.model} (${i.size}) x${i.qty} — $${(i.price * i.qty).toFixed(2)}`)
    .join("<br/>");

  await getResend().emails.send({
    from: "Ship.Tires <orders@ship.tires>",
    to: ["farhad@ship.tires", "info@ship.tires"],
    subject: `New Dealer Order — $${total.toFixed(2)}`,
    html: `
      <div style="font-family:Arial,sans-serif;">
        <h2 style="color:#FF5C00;">New Dealer Order Received</h2>
        <p><strong>Dealer ID:</strong> ${dealerId}</p>
        <h3>Items</h3>
        <p>${itemList}</p>
        <p style="font-size:18px;font-weight:bold;">Total: $${total.toFixed(2)}</p>
        <p><a href="https://ship.tires/admin/orders" style="display:inline-block;padding:12px 24px;background:#FF5C00;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold;">View in Admin</a></p>
      </div>
    `,
  });
}

export { calculateOrderFees };
