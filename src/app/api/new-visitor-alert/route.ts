import { Resend } from "resend";

export async function POST(req: Request) {
  try {
    const { landingPage, referrer, source, userAgent, timestamp } =
      await req.json();

    const resend = new Resend(process.env.RESEND_API_KEY);

    const date = new Date(timestamp);
    const formatted = date.toLocaleString("en-US", {
      timeZone: "America/Los_Angeles",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    const ua = userAgent || "";
    const isMobile = /mobile|android|iphone|ipad/i.test(ua);
    const device = isMobile ? "Mobile" : "Desktop";
    let browser = "Unknown";
    if (/edg/i.test(ua)) browser = "Edge";
    else if (/chrome|crios/i.test(ua)) browser = "Chrome";
    else if (/firefox|fxios/i.test(ua)) browser = "Firefox";
    else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = "Safari";
    else if (/opera|opr/i.test(ua)) browser = "Opera";

    await resend.emails.send({
      from: "Ship.Tires <orders@ship.tires>",
      to: "tires@ship.tires",
      subject: `New Visitor on Ship.Tires — from ${source || "Unknown"}`,
      html: `
        <h2 style="margin:0 0 16px">🆕 New Visitor Alert</h2>
        <table style="border-collapse:collapse;font-size:15px">
          <tr><td style="padding:4px 12px 4px 0;font-weight:bold">Landing Page</td><td>${landingPage || "/"}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;font-weight:bold">Source</td><td>${source || "Unknown"}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;font-weight:bold">Referrer</td><td>${referrer || "None"}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;font-weight:bold">Device</td><td>${device} / ${browser}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;font-weight:bold">Time</td><td>${formatted} PST</td></tr>
        </table>
      `,
    });

    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Failed to send alert" }, { status: 500 });
  }
}
