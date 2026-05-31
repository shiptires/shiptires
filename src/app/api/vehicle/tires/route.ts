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

  const apiKey = process.env.VDIM_API_KEY;

  if (!apiKey) {
    return Response.json({
      sizes: [],
      fallback: true,
      message: "Call us at (916) 476-7689 for your exact tire size.",
    });
  }

  try {
    const res = await fetch(
      `https://api.vdimsoftware.com/v1/tire-sizes?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&year=${year}`,
      {
        headers: { Authorization: `Bearer ${apiKey}` },
        next: { revalidate: 86400 },
      }
    );

    if (!res.ok) {
      return Response.json({
        sizes: [],
        fallback: true,
        message: "Tire size lookup is temporarily unavailable. Call us for help!",
      });
    }

    const data = await res.json();
    return Response.json({ sizes: data.sizes || [], fallback: false });
  } catch {
    return Response.json({
      sizes: [],
      fallback: true,
      message: "Tire size lookup is temporarily unavailable. Call us for help!",
    });
  }
}
