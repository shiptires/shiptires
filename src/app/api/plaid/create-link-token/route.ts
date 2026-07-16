import { getPlaid } from "@/lib/plaid";
import { Products, CountryCode } from "plaid";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: Request) {
  try {
    const { userId } = (await req.json()) as { userId?: string };

    const plaid = getPlaid();
    const webhookUrl = process.env.PLAID_WEBHOOK_URL || "https://ship.tires/api/plaid/webhook";

    const response = await plaid.linkTokenCreate({
      user: { client_user_id: userId || uuidv4() },
      client_name: "Ship.Tires",
      products: [Products.Transfer],
      country_codes: [CountryCode.Us],
      language: "en",
      webhook: webhookUrl,
    });

    return Response.json({ link_token: response.data.link_token });
  } catch (err) {
    console.error("Failed to create link token:", err);
    const message = err instanceof Error ? err.message : "Failed to create link token";
    return Response.json({ error: message }, { status: 500 });
  }
}
