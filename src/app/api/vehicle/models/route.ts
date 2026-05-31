export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const make = searchParams.get("make");
  const year = searchParams.get("year");

  if (!make || !year) {
    return Response.json({ error: "make and year required", Results: [] }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMakeYear/make/${encodeURIComponent(make)}/modelyear/${year}?format=json`,
      { next: { revalidate: 86400 } }
    );

    if (!res.ok) {
      return Response.json({ error: "Failed to fetch models", Results: [] }, { status: 502 });
    }

    const data = await res.json();
    return Response.json(data);
  } catch {
    return Response.json({ error: "NHTSA API unavailable", Results: [] }, { status: 502 });
  }
}
