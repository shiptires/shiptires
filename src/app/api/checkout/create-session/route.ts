import { getStripe } from "@/lib/stripe";
import { searchTires, toSlug } from "@/lib/db";
import type { CartItem, ShippingAddress } from "@/lib/types";

async function validateAndPriceItems(items: CartItem[]): Promise<CartItem[]> {
  const validated: CartItem[] = [];

  for (const item of items) {
    const result = await searchTires({
      brand: item.brandSlug,
      size: item.size,
      limit: 50,
    });

    const match = result.tires.find(
      (t) => toSlug(t.model_name) === item.modelSlug
    );

    if (!match) {
      const brandCheck = await searchTires({ brand: item.brandSlug, limit: 1 });
      if (brandCheck.total === 0) {
        throw new Error(`Brand not found: ${item.brandSlug}`);
      }
      const modelCheck = await searchTires({ brand: item.brandSlug, limit: 100 });
      const modelExists = modelCheck.tires.some(
        (t) => toSlug(t.model_name) === item.modelSlug
      );
      if (!modelExists) {
        throw new Error(`Model not found: ${item.modelSlug}`);
      }
      throw new Error(
        `Size not found: ${item.size} for ${item.brandSlug} ${item.modelSlug}`
      );
    }

    const price = typeof match.price_map === "string"
      ? parseFloat(match.price_map) || 0
      : match.price_map ?? 0;

    if (price <= 0) {
      const priced = result.tires.find(
        (t) =>
          toSlug(t.model_name) === item.modelSlug &&
          (typeof t.price_map === "string"
            ? parseFloat(t.price_map) > 0
            : (t.price_map ?? 0) > 0)
      );
      if (!priced) {
        throw new Error(
          `Price unavailable for ${item.size} ${match.make_name} ${match.model_name}. Please call (279) 238-8473 for a quote.`
        );
      }
      const pricedValue = typeof priced.price_map === "string"
        ? parseFloat(priced.price_map)
        : priced.price_map ?? 0;

      validated.push({
        ...item,
        brand: priced.make_name,
        model: priced.model_name,
        price: pricedValue,
        loadIndex: parseInt(priced.load_rating ?? "0") || 0,
        speedRating: priced.speed_rating ?? "",
      });
    } else {
      validated.push({
        ...item,
        brand: match.make_name,
        model: match.model_name,
        price,
        loadIndex: parseInt(match.load_rating ?? "0") || 0,
        speedRating: match.speed_rating ?? "",
      });
    }
  }

  return validated;
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

    const validated = await validateAndPriceItems(items);

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
