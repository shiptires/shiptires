import { getDealerFromRequest } from "@/lib/dealer-auth";
import { getStripe } from "@/lib/stripe";
import { getDealerPriceBatch } from "@/lib/dealer-pricing";

interface CartItem {
  tireId: number;
  brand: string;
  model: string;
  size: string;
  price: number;
  quantity: number;
  image: string | null;
  loadIndex: number;
  speedRating: string;
}

export async function POST(req: Request) {
  try {
    const dealerId = await getDealerFromRequest();
    if (!dealerId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { items } = (await req.json()) as { items: CartItem[] };

    if (!items?.length) {
      return Response.json({ error: "Cart is empty" }, { status: 400 });
    }

    // Re-validate pricing server-side
    const tireIds = items.map((i) => i.tireId);
    const pricing = await getDealerPriceBatch(tireIds);

    const line_items = items.map((item) => {
      const dealerPrice = pricing.get(item.tireId);
      const price = dealerPrice?.wholesalePrice ?? item.price;

      return {
        price_data: {
          currency: "usd" as const,
          product_data: {
            name: `${item.brand} ${item.model} (${item.size})`,
            description: `Size: ${item.size} | Wholesale | Free Shipping`,
          },
          unit_amount: Math.round(price * 100),
        },
        quantity: item.quantity,
      };
    });

    // No tire disposal fees or sales tax for B2B orders

    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      line_items,
      metadata: {
        dealer_id: dealerId,
        is_dealer_order: "true",
        items_json: JSON.stringify(
          items.map((i) => ({
            tireId: i.tireId,
            brand: i.brand,
            model: i.model,
            size: i.size,
            price: pricing.get(i.tireId)?.wholesalePrice ?? i.price,
            qty: i.quantity,
          }))
        ),
      },
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://ship.tires"}/dealer/dashboard/orders?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://ship.tires"}/dealer/dashboard/tires`,
    });

    return Response.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return Response.json({ error: message }, { status: 400 });
  }
}
