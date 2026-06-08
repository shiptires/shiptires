import { brands } from "@/data/brands";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const size = searchParams.get("size");
  const brand = searchParams.get("brand");
  const category = searchParams.get("category");
  const minPrice = searchParams.get("min_price");
  const maxPrice = searchParams.get("max_price");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

  const results: {
    brand: string;
    brand_slug: string;
    model: string;
    model_slug: string;
    type: string;
    size: string;
    load_index: number;
    speed_rating: string;
    price: number;
    warranty: string;
    features: string[];
    url: string;
  }[] = [];

  for (const b of brands) {
    if (brand && b.slug !== brand && b.name.toLowerCase() !== brand.toLowerCase()) continue;

    for (const model of b.models) {
      if (category && model.type !== category) continue;

      for (const s of model.sizes) {
        if (size) {
          const normalizedQuery = size.replace(/[^0-9rR]/g, "").toLowerCase();
          const normalizedSize = s.size.replace(/[^0-9rR]/g, "").toLowerCase();
          if (!normalizedSize.includes(normalizedQuery) && !s.size.toLowerCase().includes(size.toLowerCase())) continue;
        }

        if (minPrice && s.price < parseFloat(minPrice)) continue;
        if (maxPrice && s.price > parseFloat(maxPrice)) continue;

        results.push({
          brand: b.name,
          brand_slug: b.slug,
          model: model.name,
          model_slug: model.slug,
          type: model.type,
          size: s.size,
          load_index: s.loadIndex,
          speed_rating: s.speedRating,
          price: s.price,
          warranty: model.warranty,
          features: model.features,
          url: `https://ship.tires/tires/${b.slug}/${model.slug}`,
        });
      }
    }
  }

  // Sort by price ascending
  results.sort((a, b) => a.price - b.price);

  return Response.json({
    total: results.length,
    results: results.slice(0, limit),
    shipping: "Free shipping on all orders — all 50 US states",
    contact: { phone: "(916) 476-7689", email: "info@ship.tires" },
  }, {
    headers: {
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
