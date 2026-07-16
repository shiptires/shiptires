import { searchModels, toSlug, resolveImage } from "@/lib/db";
import { sitePrice } from "@/lib/pricing";
import { detectVehicle, parseFlexibleSize, parseRimSize } from "@/lib/vehicle-detection";

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

  // 1. Check if query is a vehicle (e.g., "2018 camry", "honda civic")
  const vehicle = query ? detectVehicle(query) : null;

  // 2. Check if query is a tire size in flexible format
  let resolvedSize = size;
  let resolvedRimSize: string | undefined;
  if (query && !vehicle) {
    const parsedSize = parseFlexibleSize(query);
    if (parsedSize) {
      resolvedSize = parsedSize;
    } else {
      const rimSize = parseRimSize(query);
      if (rimSize) resolvedRimSize = rimSize;
    }
  }

  // 3. If vehicle detected, search by its tire sizes
  let searchSize = resolvedSize;
  if (vehicle && vehicle.sizes.length > 0 && !resolvedSize) {
    searchSize = vehicle.sizes[0];
  }

  const result = await searchModels({
    brand,
    size: searchSize,
    season,
    terrain,
    category,
    minPrice,
    maxPrice,
    query: vehicle || resolvedSize || resolvedRimSize ? undefined : query,
    rimSize: resolvedRimSize,
    page,
    limit,
  });

  const results = result.models.map((m) => ({
    brand: m.make_name,
    brand_slug: toSlug(m.make_name),
    model: m.model_name,
    model_slug: toSlug(m.model_name),
    type: m.season || m.terrain || "",
    size: `${m.tire_count} size${m.tire_count !== 1 ? "s" : ""}`,
    price: sitePrice(m.min_price),
    warranty: m.warranty ?? "",
    features: [] as string[],
    url: `/tires/${toSlug(m.make_name)}/${toSlug(m.model_name)}`,
    thumbnail: resolveImage(m.local_thumbnail, m.thumbnail_url) ?? null,
  }));

  return Response.json(
    {
      total: result.total,
      page: result.page,
      total_pages: result.totalPages,
      results,
      vehicle: vehicle
        ? {
            year: vehicle.year,
            make: vehicle.makeDisplay,
            model: vehicle.model.replace(/\b\w/g, (c) => c.toUpperCase()),
            sizes: vehicle.sizes,
            url: vehicle.url,
          }
        : undefined,
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
