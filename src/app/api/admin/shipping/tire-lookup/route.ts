import { isAdminRequest } from "@/lib/admin-auth";
import { createClient } from "@libsql/client";

function getDb() {
  return createClient({
    url: process.env.TURSO_DATABASE_URL || "",
    authToken: process.env.TURSO_AUTH_TOKEN || "",
  });
}

export async function GET(req: Request) {
  if (!(await isAdminRequest())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const brand = url.searchParams.get("brand");
  const model = url.searchParams.get("model");
  const size = url.searchParams.get("size");

  const db = getDb();

  try {
    // Level 1: List brands
    if (!brand) {
      const result = await db.execute(
        "SELECT DISTINCT make_name FROM tires WHERE make_name IS NOT NULL AND make_name != '' ORDER BY make_name"
      );
      return Response.json({
        brands: result.rows.map((r) => r.make_name as string),
      });
    }

    // Level 2: List models for a brand
    if (!model) {
      const result = await db.execute({
        sql: "SELECT DISTINCT model_name FROM tires WHERE make_name = ? AND model_name IS NOT NULL AND model_name != '' ORDER BY model_name",
        args: [brand],
      });
      return Response.json({
        models: result.rows.map((r) => r.model_name as string),
      });
    }

    // Level 3: List sizes for a brand+model (with weight/dimensions)
    if (!size) {
      const result = await db.execute({
        sql: `SELECT DISTINCT
          width || '/' || aspect_ratio || 'R' || rim_size AS size,
          weight,
          diameter_overall,
          section_width
        FROM tires
        WHERE make_name = ? AND model_name = ?
          AND width IS NOT NULL AND aspect_ratio IS NOT NULL AND rim_size IS NOT NULL
        ORDER BY CAST(width AS INTEGER), CAST(aspect_ratio AS INTEGER), CAST(rim_size AS INTEGER)`,
        args: [brand, model],
      });
      return Response.json({
        sizes: result.rows.map((r) => ({
          size: r.size as string,
          weight: r.weight ? parseFloat(r.weight as string) : null,
          diameterOverall: r.diameter_overall ? parseFloat(r.diameter_overall as string) : null,
          sectionWidth: r.section_width ? parseFloat(r.section_width as string) : null,
        })),
      });
    }

    // Level 4: Get specific tire details
    const [w, ar] = size.split("/");
    const rimPart = ar?.split("R");
    const aspect = rimPart?.[0];
    const rim = rimPart?.[1];

    if (!w || !aspect || !rim) {
      return Response.json({ error: "Invalid size format" }, { status: 400 });
    }

    const result = await db.execute({
      sql: `SELECT weight, diameter_overall, section_width
        FROM tires
        WHERE make_name = ? AND model_name = ? AND width = ? AND aspect_ratio = ? AND rim_size = ?
        LIMIT 1`,
      args: [brand, model, w, aspect, rim],
    });

    if (result.rows.length === 0) {
      return Response.json({ error: "Tire not found" }, { status: 404 });
    }

    const row = result.rows[0];
    const tireWeight = row.weight ? parseFloat(row.weight as string) : null;
    const diameter = row.diameter_overall ? parseFloat(row.diameter_overall as string) : null;
    const secWidth = row.section_width ? parseFloat(row.section_width as string) : null;

    // Estimate shipping dimensions from tire specs
    // Box is roughly: diameter+2 x diameter+2 x sectionWidth+2 (inches)
    const estLength = diameter ? Math.ceil(diameter + 2) : null;
    const estWidth = diameter ? Math.ceil(diameter + 2) : null;
    const estHeight = secWidth ? Math.ceil(secWidth / 25.4 + 2) : null; // section_width may be in mm

    // Shipping weight = tire weight + ~2 lbs for packaging
    const shippingWeight = tireWeight ? Math.ceil((tireWeight + 2) * 10) / 10 : null;

    return Response.json({
      tire: {
        weight: tireWeight,
        shippingWeight,
        diameterOverall: diameter,
        sectionWidth: secWidth,
        estLength,
        estWidth,
        estHeight,
      },
    });
  } catch (e) {
    console.error("Tire lookup error:", e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Lookup failed" },
      { status: 500 }
    );
  }
}
