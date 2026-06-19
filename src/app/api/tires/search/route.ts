import { searchTires, toSlug } from "@/lib/db";
import { sitePrice } from "@/lib/pricing";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const size = searchParams.get("size") || undefined;
  const brand = searchParams.get("brand") || undefined;
  const category = searchParams.get("category") || undefined;
  const season = searchParams.get("season") || undefined;
  const terrain = searchParams.get("terrain") || undefined;
  const minPrice = searchParams.get("min_price")
    ? parseFloat(searchParams.get("min_price")!)
    : undefined;
  const maxPrice = searchParams.get("max_price")
    ? parseFloat(searchParams.get("max_price")!)
    : undefined;
  const query = searchParams.get("q") || undefined;
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
  const page = parseInt(searchParams.get("page") || "1") || 1;

  const result = await searchTires({
    brand,
    size,
    season,
    terrain,
    category,
    minPrice,
    maxPrice,
    query,
    page,
    limit,
  });

  const results = result.tires.map((t) => ({
    brand: t.make_name,
    brand_slug: toSlug(t.make_name),
    model: t.model_name,
    model_slug: toSlug(t.model_name),
    type: t.season || t.terrain || "",
    size:
      t.width && t.aspect_ratio && t.rim_size
        ? `${t.width}/${t.aspect_ratio}R${t.rim_size}`
        : t.name,
    load_index: parseInt(t.load_rating ?? "0") || 0,
    speed_rating: t.speed_rating ?? "",
    price: sitePrice(t.price_map),
    warranty: t.warranty ?? "",
    features: [] as string[],
    url: `https://ship.tires/tires/${toSlug(t.make_name)}/${toSlug(t.model_name)}`,
  }));

  return Response.json(
    {
      total: result.total,
      page: result.page,
      total_pages: result.totalPages,
      results,
      shipping: "Free shipping on all orders — all 50 US states",
      contact: { phone: "(279) 238-8473", email: "info@ship.tires" },
    },
    {
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
        "Access-Control-Allow-Origin": "*",
      },
    }
  );
}
