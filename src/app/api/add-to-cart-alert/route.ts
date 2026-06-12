import { Resend } from "resend";

export async function POST(req: Request) {
  try {
    const { product, size, brand, price, qty, page, time } = await req.json();

    const resend = new Resend(process.env.RESEND_API_KEY);

    const date = new Date(time);
    const formatted = date.toLocaleString("en-US", {
      timeZone: "America/Los_Angeles",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    const total = (Number(price) * Number(qty)).toFixed(2);

    await resend.emails.send({
      from: "Ship.Tires <orders@ship.tires>",
      to: "farhad@ship.tires",
      subject: `Add to Cart on Ship.Tires — ${product}`,
      html: `
        <h2 style="margin:0 0 16px">🛒 Add to Cart Alert</h2>
        <table style="border-collapse:collapse;font-size:15px">
          <tr><td style="padding:4px 12px 4px 0;font-weight:bold">Product</td><td>${product}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;font-weight:bold">Brand</td><td>${brand}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;font-weight:bold">Size</td><td>${size}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;font-weight:bold">Price</td><td>$${Number(price).toFixed(2)} × ${qty}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;font-weight:bold">Total</td><td>$${total}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;font-weight:bold">Page</td><td><a href="${page}">${page}</a></td></tr>
          <tr><td style="padding:4px 12px 4px 0;font-weight:bold">Time</td><td>${formatted} PST</td></tr>
        </table>
      `,
    });

    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Failed to send alert" }, { status: 500 });
  }
}
