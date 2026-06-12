import { v4 as uuidv4 } from "uuid";
import { getSupabase } from "@/lib/supabase";
import { searchTires, toSlug } from "@/lib/db";
import type { CartItem } from "@/lib/types";

interface CartCreateItem {
  brandSlug: string;
  modelSlug: string;
  size: string;
  quantity?: number;
}

async function validateItems(rawItems: CartCreateItem[]): Promise<CartItem[]> {
  const validated: CartItem[] = [];

  for (const item of rawItems) {
    // Parse tire size into components for DB search
    const sizeMatch = item.size.match(/^(\d{2,3})\/(\d{2,3})R(\d{2,3})$/i);
    if (!sizeMatch) {
      throw new Error(`Invalid tire size format: ${item.size}`);
    }

    // Search the live database for this exact brand + model + size
    const result = await searchTires({
      brand: item.brandSlug,
      size: item.size,
      limit: 50,
    });

    // Find the matching tire by model slug
    const match = result.tires.find(
      (t) => toSlug(t.model_name) === item.modelSlug
    );

    if (!match) {
      // Try a broader search without size to distinguish brand-not-found vs size-not-found
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

    // Use the best available price (skip $0 entries)
    const price = typeof match.price_map === "string"
      ? parseFloat(match.price_map) || 0
      : match.price_map ?? 0;

    if (price <= 0) {
      // Search all results for this model+size to find one with a price
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
        brand: priced.make_name,
        brandSlug: toSlug(priced.make_name),
        model: priced.model_name,
        modelSlug: toSlug(priced.model_name),
        size: item.size,
        price: pricedValue,
        quantity: item.quantity || 4,
        loadIndex: parseInt(priced.load_rating ?? "0") || 0,
        speedRating: priced.speed_rating ?? "",
      });
    } else {
      validated.push({
        brand: match.make_name,
        brandSlug: toSlug(match.make_name),
        model: match.model_name,
        modelSlug: toSlug(match.model_name),
        size: item.size,
        price,
        quantity: item.quantity || 4,
        loadIndex: parseInt(match.load_rating ?? "0") || 0,
        speedRating: match.speed_rating ?? "",
      });
    }
  }

  return validated;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rawItems: CartCreateItem[] = body.items;

    if (!rawItems?.length) {
      return Response.json({ error: "Items required" }, { status: 400 });
    }

    const validated = await validateItems(rawItems);
    const id = uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    await getSupabase().from("cart_sessions").insert({
      id,
      items: validated,
      expires_at: expiresAt,
      source: body.source || "api",
    });

    const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://ship.tires").trim();
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
