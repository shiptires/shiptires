import zipcodes from "zipcodes";
import {
  getInstallersForZip,
  findStateByAbbr,
  getZipsForCity,
  zipToInstallerUrl,
} from "@/lib/installer-utils";

const BASE = "https://ship.tires";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ state: string; city: string; zip: string }> }
) {
  const { state, city, zip } = await params;
  const location = zipcodes.lookup(zip);
  if (!location) {
    return new Response("Not found", { status: 404 });
  }

  const stateData = findStateByAbbr(state);
  const displayCity = location.city;
  const displayState = location.state;

  // Fetch installers — checks Supabase cache first, falls back to Google Places
  const cachedResult = await getInstallersForZip(zip);
  const installers = cachedResult?.installers ?? [];

  // Nearby zips
  const nearbyZips = getZipsForCity(displayCity, displayState)
    .filter((z) => z !== zip)
    .slice(0, 10);

  const lines = [
    `# Tire & Wheel Shops Near ${zip} — ${displayCity}, ${displayState}`,
    "",
    `> Find tire installers and wheel shops near ${displayCity}, ${displayState} ${zip}.`,
    "",
    `Location: ${displayCity}, ${displayState} ${zip}`,
    `Latitude: ${location.latitude}`,
    `Longitude: ${location.longitude}`,
    `Website: ${BASE}/installers/${state}/${city}/${zip}`,
    "",
    `## Nearby Tire Installers (${installers.length})`,
    ...(installers.length > 0
      ? installers.slice(0, 10).map((inst, i) => {
          const parts = [`${i + 1}. **${inst.name}**`];
          if (inst.address) parts.push(`   Address: ${inst.address}`);
          if (inst.rating) parts.push(`   Rating: ${inst.rating}/5 (${inst.totalRatings} reviews)`);
          if (inst.distanceMiles) parts.push(`   Distance: ${inst.distanceMiles.toFixed(1)} mi`);
          return parts.join("\n");
        })
      : ["No installers found for this zip code. Try a nearby zip."]),
    "",
    "## Ship.Tires Free Delivery",
    `All tires from Ship.Tires ship free to ${displayCity}, ${displayState}.`,
    "You can ship tires directly to any installer above, or to your home.",
    "",
    ...(nearbyZips.length > 0
      ? [
          "## Nearby Zip Codes",
          ...nearbyZips.map((z) => {
            const url = zipToInstallerUrl(z);
            return `- ${z} — ${BASE}${url}`;
          }),
          "",
        ]
      : []),
    "## Browse Tires",
    `- All Brands: ${BASE}/tires`,
    `- ${displayCity} Tire Delivery: ${BASE}/locations/${stateData?.slug ?? state}/${city}`,
    `- Find Installers by State: ${BASE}/installers/${state}`,
    "",
    "## Contact",
    "- Phone: (279) 238-8473",
    "- Email: info@ship.tires",
    "",
    `Source: Ship.Tires — ${BASE}`,
    `Updated: ${new Date().toISOString().split("T")[0]}`,
  ];

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
    },
  });
}
