import { getPlaid } from "@/lib/plaid";
import { getSupabase } from "@/lib/supabase";
import { Resend } from "resend";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const webhookType = body.webhook_type;
    const webhookCode = body.webhook_code;

    // Handle transfer events
    if (webhookType === "TRANSFER" && webhookCode === "TRANSFER_EVENTS_UPDATE") {
      const plaid = getPlaid();
      const supabase = getSupabase();

      // Sync latest transfer events
      const syncResponse = await plaid.transferEventSync({
        after_id: 0,
      });

      const events = syncResponse.data.transfer_events;

      for (const event of events) {
        const transferId = event.transfer_id;
        const eventType = event.event_type;

        // Map Plaid transfer event types to order statuses
        let newStatus: string | null = null;
        switch (eventType) {
          case "posted":
          case "settled":
            newStatus = "paid";
            break;
          case "returned":
            newStatus = "returned";
            break;
          case "failed":
            newStatus = "payment_failed";
            break;
          default:
            // Other events (pending, cancelled, etc.) — no status update needed
            continue;
        }

        if (!newStatus) continue;

        // Update consumer orders
        await supabase
          .from("tire_orders")
          .update({ status: newStatus })
          .eq("payment_id", transferId);

        // Update dealer orders
        await supabase
          .from("dealer_orders")
          .update({ status: newStatus })
          .eq("payment_id", transferId);

        // Send admin alert on ACH returns
        if (eventType === "returned") {
          try {
            await getResend().emails.send({
              from: "Ship.Tires <orders@ship.tires>",
              to: ["farhad@ship.tires", "info@ship.tires"],
              subject: `ACH Return Alert — Transfer ${transferId}`,
              html: `
                <div style="font-family:Arial,sans-serif;max-width:600px;">
                  <h2 style="color:#DC2626;">ACH Transfer Returned</h2>
                  <p><strong>Transfer ID:</strong> ${transferId}</p>
                  <p><strong>Return Code:</strong> ${event.failure_reason?.ach_return_code || "N/A"}</p>
                  <p><strong>Description:</strong> ${event.failure_reason?.description || "N/A"}</p>
                  <p style="margin-top:16px;">
                    <a href="https://ship.tires/admin/orders" style="display:inline-block;padding:12px 24px;background:#DC2626;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold;">Review in Admin</a>
                  </p>
                </div>
              `,
            });
          } catch (err) {
            console.error("Failed to send ACH return alert:", err);
          }
        }
      }
    }

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("Plaid webhook error:", err);
    return new Response("Webhook processing failed", { status: 500 });
  }
}
