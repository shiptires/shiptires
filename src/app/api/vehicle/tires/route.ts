import { lookupTireSizes } from "@/data/tire-sizes";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const make = searchParams.get("make");
  const model = searchParams.get("model");
  const year = searchParams.get("year");

  if (!make || !model || !year) {
    return Response.json(
      { error: "make, model, and year required", sizes: [] },
      { status: 400 }
    );
  }

  const sizes = lookupTireSizes(make, model);

  return Response.json({
    sizes,
    fallback: false,
    year,
    make,
    model,
  });
}
