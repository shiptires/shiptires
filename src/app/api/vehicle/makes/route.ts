export async function GET() {
  try {
    const res = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/GetMakesForVehicleType/car?format=json`,
      { next: { revalidate: 86400 } }
    );

    if (!res.ok) {
      return Response.json({ error: "Failed to fetch makes", Results: [] }, { status: 502 });
    }

    const data = await res.json();
    return Response.json(data);
  } catch {
    return Response.json({ error: "NHTSA API unavailable", Results: [] }, { status: 502 });
  }
}
