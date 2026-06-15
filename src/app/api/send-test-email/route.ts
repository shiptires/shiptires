import { isAdminRequest } from "@/lib/admin-auth";
import { Resend } from "resend";
import { buildOrderConfirmationHtml } from "@/app/api/checkout/webhook/route";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

export async function POST() {
  if (!(await isAdminRequest())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dummyItems = [
    { brand: "BFGoodrich", model: "All-Terrain T/A KO2", size: "265/70R17", qty: 4, price: 274.63 },
    { brand: "Michelin", model: "Defender LTX M/S", size: "245/65R17", qty: 2, price: 198.99 },
  ];

  const total = dummyItems.reduce((sum, i) => sum + i.price * i.qty, 0);

  const html = buildOrderConfirmationHtml(dummyItems, total, "Farhad");

  try {
    await getResend().emails.send({
      from: "Ship.Tires <orders@ship.tires>",
      to: "farhad@ship.tires",
      subject: "Order Confirmation — Ship.Tires (TEST)",
      html,
    });

    return Response.json({ sent: true, to: "farhad@ship.tires", total });
  } catch (e) {
    console.error("Test email error:", e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Failed to send test email" },
      { status: 500 }
    );
  }
}
