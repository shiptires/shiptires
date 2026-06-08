import { brands } from "@/data/brands";

export async function GET() {
  const data = brands.map((b) => ({
    name: b.name,
    slug: b.slug,
    country: b.country,
    founded: b.founded,
    description: b.description,
    models: b.models.map((m) => ({
      name: m.name,
      slug: m.slug,
      type: m.type,
      warranty: m.warranty,
      price_range: { min: m.priceRange[0], max: m.priceRange[1] },
      sizes_count: m.sizes.length,
      url: `https://ship.tires/tires/${b.slug}/${m.slug}`,
    })),
    url: `https://ship.tires/tires/${b.slug}`,
  }));

  return Response.json({
    total: data.length,
    brands: data,
    shipping: "Free shipping on all orders — all 50 US states",
    contact: { phone: "(916) 476-7689", email: "info@ship.tires" },
  }, {
    headers: {
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
