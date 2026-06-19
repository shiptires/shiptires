import { getInstallersForZip } from "@/lib/installer-utils";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const zip = searchParams.get("zip");

  if (!zip || !/^\d{5}$/.test(zip)) {
    return Response.json(
      { error: "Valid 5-digit zip code required" },
      { status: 400 }
    );
  }

  const result = await getInstallersForZip(zip);
  if (!result) {
    return Response.json({ error: "Zip code not found" }, { status: 404 });
  }

  return Response.json(
    {
      zip: result.zip,
      city: result.city,
      state: result.state,
      latitude: result.lat,
      longitude: result.lng,
      installers: result.installers,
      hasGoogleData: result.hasGoogleData,
    },
    {
      headers: {
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    }
  );
}
