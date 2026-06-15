import { isAdminRequest } from "@/lib/admin-auth";
import { getModelsByBrand, getDistinctSizesForBrand, toSlug } from "@/lib/db";

export async function GET(req: Request) {
  if (!(await isAdminRequest())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(req.url);
    const brand = url.searchParams.get("brand");

    if (!brand) {
      return Response.json({ models: [], sizes: [] });
    }

    const slug = toSlug(brand);
    const [models, sizes] = await Promise.all([
      getModelsByBrand(slug),
      getDistinctSizesForBrand(slug),
    ]);

    return Response.json({
      models: models.map((m) => ({
        name: m.model_name,
        count: m.tire_count,
        season: m.season,
        terrain: m.terrain,
      })),
      sizes: sizes.map((s) => ({
        width: s.width,
        aspectRatio: s.aspect_ratio,
        rimSize: s.rim_size,
        count: s.count,
      })),
    });
  } catch (e) {
    console.error("eBay filters error:", e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Failed to load filters" },
      { status: 500 }
    );
  }
}
