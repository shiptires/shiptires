import { getAllBrands, getModelsByBrand, toSlug } from "@/lib/db";

export async function GET() {
  const brandRows = getAllBrands();

  const data = brandRows.map((b) => {
    const slug = toSlug(b.make_name);
    const models = getModelsByBrand(slug);

    return {
      name: b.make_name,
      slug,
      logo_url: b.make_image_url,
      tire_count: b.tire_count,
      model_count: b.model_count,
      models: models.slice(0, 20).map((m) => ({
        name: m.model_name,
        slug: toSlug(m.model_name),
        sizes_count: m.tire_count,
        price_range: {
          min: m.min_price ?? 0,
          max: m.max_price ?? 0,
        },
        url: `https://ship.tires/tires/${slug}/${toSlug(m.model_name)}`,
      })),
      url: `https://ship.tires/tires/${slug}`,
    };
  });

  return Response.json(
    {
      total: data.length,
      brands: data,
      shipping: "Free shipping on all orders — all 50 US states",
      contact: { phone: "(279) 238-8473", email: "info@ship.tires" },
    },
    {
      headers: {
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
        "Access-Control-Allow-Origin": "*",
      },
    }
  );
}
