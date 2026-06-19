import zipcodes from "zipcodes";
import { states } from "@/data/locations";
import { toLocationSlug } from "@/lib/location-seo";
import { getSupabase } from "@/lib/supabase";
import type { StateData, CityData } from "@/data/locations";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PlaceResult {
  name: string;
  address: string;
  rating: number;
  totalRatings: number;
  placeId: string;
  lat: number;
  lng: number;
  openNow?: boolean;
  distanceMiles?: number;
}

// ---------------------------------------------------------------------------
// Geo
// ---------------------------------------------------------------------------

export function haversine(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959; // miles
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

// ---------------------------------------------------------------------------
// Google Places
// ---------------------------------------------------------------------------

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const SKIP_PLACES_AT_BUILD = process.env.SKIP_GOOGLE_PLACES === "1";

export async function fetchNearbyInstallers(
  lat: number,
  lng: number
): Promise<PlaceResult[]> {
  if (!GOOGLE_API_KEY || SKIP_PLACES_AT_BUILD) return [];

  try {
    const url = new URL(
      "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
    );
    url.searchParams.set("location", `${lat},${lng}`);
    url.searchParams.set("radius", "24140");
    url.searchParams.set("type", "car_repair");
    url.searchParams.set("keyword", "tire installation tires");
    url.searchParams.set("key", GOOGLE_API_KEY);

    const res = await fetch(url.toString(), {
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];

    const data = await res.json();
    if (data.status !== "OK") return [];

    return (data.results || [])
      .filter(
        (p: Record<string, unknown>) => p.rating && (p.rating as number) >= 3.0
      )
      .slice(0, 20)
      .map((p: Record<string, unknown>) => {
        const pLat = (
          p.geometry as { location: { lat: number; lng: number } }
        ).location.lat;
        const pLng = (
          p.geometry as { location: { lat: number; lng: number } }
        ).location.lng;
        const dist = haversine(lat, lng, pLat, pLng);
        return {
          name: p.name as string,
          address: (p.vicinity || "") as string,
          rating: p.rating as number,
          totalRatings: (p.user_ratings_total || 0) as number,
          placeId: p.place_id as string,
          lat: pLat,
          lng: pLng,
          openNow: (p.opening_hours as { open_now?: boolean })?.open_now,
          distanceMiles: Math.round(dist * 10) / 10,
        };
      })
      .sort(
        (a: PlaceResult, b: PlaceResult) =>
          (a.distanceMiles ?? 99) - (b.distanceMiles ?? 99)
      );
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Cached installer lookup (Supabase-backed)
// ---------------------------------------------------------------------------

interface CachedInstallerResult {
  zip: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  installers: PlaceResult[];
  hasGoogleData: boolean;
  fromCache: boolean;
}

/**
 * Get installers for a zip code — checks Supabase cache first,
 * only calls Google Places if cache is empty or expired.
 */
export async function getInstallersForZip(
  zip: string
): Promise<CachedInstallerResult | null> {
  const location = zipcodes.lookup(zip);
  if (!location) return null;

  const { city, state, latitude: lat, longitude: lng } = location;

  // 1. Check cache
  try {
    const sb = getSupabase();
    const { data: cached } = await sb
      .from("installers_cache")
      .select("installers, result_count, fetched_at, expires_at")
      .eq("zip", zip)
      .single();

    if (cached && new Date(cached.expires_at) > new Date()) {
      const installers = (cached.installers as PlaceResult[]) || [];
      return {
        zip,
        city,
        state,
        lat,
        lng,
        installers,
        hasGoogleData: installers.length > 0,
        fromCache: true,
      };
    }
  } catch {
    // Cache miss or Supabase error — continue to fetch
  }

  // 2. Fetch from Google Places
  const installers = await fetchNearbyInstallers(lat, lng);

  // 3. Save to cache (fire-and-forget, don't block response)
  try {
    const sb = getSupabase();
    await sb.from("installers_cache").upsert(
      {
        zip,
        city,
        state,
        lat,
        lng,
        installers: JSON.stringify(installers),
        result_count: installers.length,
        fetched_at: new Date().toISOString(),
        expires_at: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
      },
      { onConflict: "zip" }
    );
  } catch (e) {
    console.error("[installers-cache] save failed:", e);
  }

  return {
    zip,
    city,
    state,
    lat,
    lng,
    installers,
    hasGoogleData: installers.length > 0,
    fromCache: false,
  };
}

// ---------------------------------------------------------------------------
// Zip / City / State Lookups
// ---------------------------------------------------------------------------

/** Get all zip codes for a city+state using the zipcodes npm package. */
export function getZipsForCity(
  cityName: string,
  stateAbbr: string
): string[] {
  const results = zipcodes.lookupByName(cityName, stateAbbr);
  if (!results || results.length === 0) return [];
  return results.map((r: { zip: string }) => r.zip).sort();
}

/** Find a state in locations.ts by its 2-letter abbreviation (case-insensitive). */
export function findStateByAbbr(abbr: string): StateData | undefined {
  return states.find(
    (s) => s.abbreviation.toLowerCase() === abbr.toLowerCase()
  );
}

/** Slugify a city name for use in URLs: "Elk Grove" → "elk-grove" */
export function cityToSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Resolve a zip code to its canonical installer URL path. */
export function zipToInstallerUrl(zip: string): string | null {
  const loc = zipcodes.lookup(zip);
  if (!loc) return null;
  const stateAbbr = loc.state.toLowerCase();
  const citySlug = cityToSlug(loc.city);
  return `/installers/${stateAbbr}/${citySlug}/${zip}`;
}

/** Find the CityData match for a given city name within a state. */
export function findCityInState(
  stateData: StateData,
  cityName: string
): CityData | undefined {
  const lower = cityName.toLowerCase();
  return stateData.cities.find((c) => c.name.toLowerCase() === lower);
}

/**
 * Get unique cities from locations.ts for a given state,
 * with their installer-format slug (not the -tires slug).
 */
export function getInstallerCities(
  stateData: StateData
): { name: string; slug: string; population: number; zipCount: number }[] {
  return stateData.cities
    .map((c) => {
      const zips = getZipsForCity(c.name, stateData.abbreviation);
      return {
        name: c.name,
        slug: cityToSlug(c.name),
        population: c.population,
        zipCount: zips.length,
      };
    })
    .filter((c) => c.zipCount > 0)
    .sort((a, b) => b.population - a.population);
}

/**
 * Build the canonical city slug for a zip code's city,
 * matching the locations.ts data where possible.
 */
export function getCanonicalCitySlug(
  cityName: string,
  stateData: StateData
): string {
  const match = findCityInState(stateData, cityName);
  if (match) {
    return toLocationSlug(match.slug).replace(/-tires$/, "");
  }
  return cityToSlug(cityName);
}
