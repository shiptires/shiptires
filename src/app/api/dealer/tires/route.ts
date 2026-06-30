import { getDealerFromRequest } from "@/lib/dealer-auth";
import { searchTires } from "@/lib/db/turso";
import { getDealerPriceBatch } from "@/lib/dealer-pricing";

export async function GET(req: Request) {
  const dealerId = await getDealerFromRequest();
  if (!dealerId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const query = url.searchParams.get("q") || undefined;
  const size = url.searchParams.get("size") || undefined;
  const brand = url.searchParams.get("brand") || undefined;
  const page = parseInt(url.searchParams.get("page") || "1", 10);

  const result = await searchTires({
    query,
    size,
    brand,
    page,
    limit: 24,
  });

  // Apply dealer pricing
  const tireIds = result.tires.map((t) => t.id);
  const pricing = await getDealerPriceBatch(tireIds);

  const tiresWithPricing = result.tires.map((tire) => {
    const dealerPrice = pricing.get(tire.id);
    return {
      id: tire.id,
      make_name: tire.make_name,
      model_name: tire.model_name,
      size: `${tire.width}/${tire.aspect_ratio}R${tire.rim_size}`,
      width: tire.width,
      aspect_ratio: tire.aspect_ratio,
      rim_size: tire.rim_size,
      load_rating: tire.load_rating,
      speed_rating: tire.speed_rating,
      season: tire.season,
      category: tire.category,
      image_url: tire.thumbnail_url ?? tire.image_0100_url,
      wholesale_price: dealerPrice?.wholesalePrice ?? null,
    };
  });

  return Response.json({
    tires: tiresWithPricing,
    total: result.total,
    page: result.page,
    totalPages: result.totalPages,
  });
}
