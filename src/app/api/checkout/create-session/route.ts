import { getStripe } from "@/lib/stripe";
import { searchTires, toSlug } from "@/lib/db";
import { getSitePrice } from "@/lib/pricing";
import { calculateOrderFees } from "@/lib/tire-fees";
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

    // Distributor cost overrides MAP when available
    const price = await getSitePrice(match.id, match.price_map);

    if (price <= 0) {
      // Try other tires with same model/size that have pricing
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
      const pricedPrice = await getSitePrice(priced.id, priced.price_map);

      validated.push({
        ...item,
        brand: priced.make_name,
        model: priced.model_name,
        price: pricedPrice,
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

    // Tire line items
    const line_items = validated.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: `${item.brand} ${item.model} (${item.size})`,
          description: `Size: ${item.size} | Load Index: ${item.loadIndex} | Speed Rating: ${item.speedRating} | Free Shipping | 3-7 Day Delivery`,
          ...(item.image ? { images: [item.image] } : {}),
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));

    // Calculate fees and tax
    const tireSubtotal = validated.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const totalTires = validated.reduce((sum, item) => sum + item.quantity, 0);
    const state = (shipping.state || "").toUpperCase();
    const fees = calculateOrderFees(state, totalTires, tireSubtotal);

    // Tire disposal fee line item (only if state has a fee)
    if (fees.tireFeePerTire > 0) {
      line_items.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: `${state} Tire Disposal Fee`,
            description: `State tire recycling/disposal fee — $${fees.tireFeePerTire.toFixed(2)} per tire`,
          },
          unit_amount: Math.round(fees.tireFeePerTire * 100),
        },
        quantity: totalTires,
      });
    }

    // Handling fee line item
    line_items.push({
      price_data: {
        currency: "usd",
        product_data: {
          name: "Order Handling Fee",
          description: "Order processing and handling",
        },
        unit_amount: Math.round(fees.handlingFee * 100),
      },
      quantity: 1,
    });

    // Sales tax line item (only if rate > 0)
    if (fees.taxAmount > 0) {
      line_items.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: `Sales Tax (${state})`,
            description: `State sales tax at ${(fees.taxRate * 100).toFixed(2)}%`,
          },
          unit_amount: Math.round(fees.taxAmount * 100),
        },
        quantity: 1,
      });
    }

    const session = await getStripe().checkout.sessions.create({
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
        tire_fee_total: fees.tireFeeTotal.toFixed(2),
        handling_fee: fees.handlingFee.toFixed(2),
        tax_amount: fees.taxAmount.toFixed(2),
        tax_rate: (fees.taxRate * 100).toFixed(2),
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
