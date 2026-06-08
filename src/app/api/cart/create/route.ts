import { v4 as uuidv4 } from "uuid";
import { getSupabase } from "@/lib/supabase";
import { brands } from "@/data/brands";
import type { CartItem } from "@/lib/types";

interface CartCreateItem {
  brandSlug: string;
  modelSlug: string;
  size: string;
  quantity?: number;
}

function validateItems(rawItems: CartCreateItem[]): CartItem[] {
  return rawItems.map((item) => {
    const brand = brands.find((b) => b.slug === item.brandSlug);
    if (!brand) throw new Error(`Brand not found: ${item.brandSlug}`);

    const model = brand.models.find((m) => m.slug === item.modelSlug);
    if (!model) throw new Error(`Model not found: ${item.modelSlug}`);

    const size = model.sizes.find((s) => s.size === item.size);
    if (!size) throw new Error(`Size not found: ${item.size} for ${brand.name} ${model.name}`);

    return {
      brand: brand.name,
      brandSlug: brand.slug,
      model: model.name,
      modelSlug: model.slug,
      size: size.size,
      price: size.price,
      quantity: item.quantity || 4,
      loadIndex: size.loadIndex,
      speedRating: size.speedRating,
    };
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rawItems: CartCreateItem[] = body.items;

    if (!rawItems?.length) {
      return Response.json({ error: "Items required" }, { status: 400 });
    }

    const validated = validateItems(rawItems);
    const id = uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    await getSupabase().from("cart_sessions").insert({
      id,
      items: validated,
      expires_at: expiresAt,
      source: body.source || "api",
    });

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ship.tires";
    const checkout_url = `${baseUrl}/checkout/${id}`;

    return Response.json({
      checkout_url,
      session_id: id,
      items: validated.map((i) => ({
        brand: i.brand,
        model: i.model,
        size: i.size,
        price: i.price,
        quantity: i.quantity,
      })),
      subtotal: validated.reduce((sum, i) => sum + i.price * i.quantity, 0),
      expires_at: expiresAt,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return Response.json({ error: message }, { status: 400 });
  }
}
