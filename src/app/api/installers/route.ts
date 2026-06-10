import zipcodes from "zipcodes";

export interface PlaceResult {
  name: string;
  address: string;
  rating: number;
  totalRatings: number;
  placeId: string;
  lat: number;
  lng: number;
  openNow?: boolean;
  phoneNumber?: string;
  distanceMiles?: number;
}

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const zip = searchParams.get("zip");

  if (!zip || !/^\d{5}$/.test(zip)) {
    return Response.json({ error: "Valid 5-digit zip code required" }, { status: 400 });
  }

  const location = zipcodes.lookup(zip);
  if (!location) {
    return Response.json({ error: "Zip code not found" }, { status: 404 });
  }

  let places: PlaceResult[] = [];

  if (GOOGLE_API_KEY) {
    try {
      places = await fetchGooglePlaces(location.latitude, location.longitude, GOOGLE_API_KEY);
    } catch (e) {
      console.error("Google Places API error:", e);
    }
  }

  return Response.json(
    {
      zip,
      city: location.city,
      state: location.state,
      latitude: location.latitude,
      longitude: location.longitude,
      installers: places,
      hasGoogleData: places.length > 0,
    },
    {
      headers: {
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    }
  );
}

async function fetchGooglePlaces(
  lat: number,
  lng: number,
  apiKey: string
): Promise<PlaceResult[]> {
  const url = new URL("https://maps.googleapis.com/maps/api/place/nearbysearch/json");
  url.searchParams.set("location", `${lat},${lng}`);
  url.searchParams.set("radius", "24140"); // 15 miles in meters
  url.searchParams.set("type", "car_repair");
  url.searchParams.set("keyword", "tire installation tires");
  url.searchParams.set("key", apiKey);

  const res = await fetch(url.toString(), { next: { revalidate: 86400 } });
  if (!res.ok) throw new Error(`Places API: ${res.status}`);

  const data = await res.json();
  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    throw new Error(`Places API status: ${data.status}`);
  }

  const results: PlaceResult[] = (data.results || [])
    .filter((p: Record<string, unknown>) => p.rating && (p.rating as number) >= 3.0)
    .slice(0, 20)
    .map((p: Record<string, unknown>) => {
      const pLat = (p.geometry as { location: { lat: number; lng: number } }).location.lat;
      const pLng = (p.geometry as { location: { lat: number; lng: number } }).location.lng;
      const dist = haversine(lat, lng, pLat, pLng);

      return {
        name: p.name as string,
        address: (p.vicinity || p.formatted_address || "") as string,
        rating: p.rating as number,
        totalRatings: (p.user_ratings_total || 0) as number,
        placeId: p.place_id as string,
        lat: pLat,
        lng: pLng,
        openNow: (p.opening_hours as { open_now?: boolean })?.open_now,
        distanceMiles: Math.round(dist * 10) / 10,
      };
    })
    .sort((a: PlaceResult, b: PlaceResult) => (a.distanceMiles ?? 99) - (b.distanceMiles ?? 99));

  return results;
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
