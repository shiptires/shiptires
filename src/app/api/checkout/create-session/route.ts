import { getStripe } from "@/lib/stripe";
import { brands } from "@/data/brands";
import type { CartItem, ShippingAddress } from "@/lib/types";

function validateAndPriceItems(items: CartItem[]): CartItem[] {
  return items.map((item) => {
    const brand = brands.find((b) => b.slug === item.brandSlug);
    if (!brand) throw new Error(`Brand not found: ${item.brandSlug}`);

    const model = brand.models.find((m) => m.slug === item.modelSlug);
    if (!model) throw new Error(`Model not found: ${item.modelSlug}`);

    const size = model.sizes.find((s) => s.size === item.size);
    if (!size) throw new Error(`Size not found: ${item.size}`);

    return {
      ...item,
      brand: brand.name,
      model: model.name,
      price: size.price, // server-side price — never trust client
      loadIndex: size.loadIndex,
      speedRating: size.speedRating,
    };
  });
}

export async function POST(req: Request) {
  try {
    const { items, shipping, auth_user_id } = (await req.json()) as {
      items: CartItem[];
      shipping: ShippingAddress;
      auth_user_id?: string;
    };

    if (!items?.length) {
      return Response.json({ error: "Cart is empty" }, { status: 400 });
    }

    if (!shipping?.email || !shipping?.firstName || !shipping?.lastName) {
      return Response.json({ error: "Shipping info required" }, { status: 400 });
    }

    const validated = validateAndPriceItems(items);

    const line_items = validated.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: `${item.brand} ${item.model}`,
          description: `Size: ${item.size} | Load: ${item.loadIndex} | Speed: ${item.speedRating}`,
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));

    const session = await getStripe().checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items,
      customer_email: shipping.email,
      shipping_address_collection: {
        allowed_countries: ["US"],
      },
      metadata: {
        customer_name: `${shipping.firstName} ${shipping.lastName}`,
        customer_phone: shipping.phone,
        shipping_address: JSON.stringify(shipping),
        items_json: JSON.stringify(
          validated.map((i) => ({
            brand: i.brand,
            model: i.model,
            size: i.size,
            price: i.price,
            qty: i.quantity,
          }))
        ),
        auth_user_id: auth_user_id || "",
      },
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://ship.tires"}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://ship.tires"}/cart`,
    });

    return Response.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return Response.json({ error: message }, { status: 400 });
  }
}
