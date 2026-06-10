import { states } from "@/data/locations";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q")?.toLowerCase() || "";
  const stateFilter = searchParams.get("state")?.toLowerCase();
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

  const results: {
    city: string;
    state: string;
    state_abbreviation: string;
    population: number;
    url: string;
    brands_available: number;
  }[] = [];

  for (const state of states) {
    if (stateFilter && state.slug !== stateFilter && state.abbreviation.toLowerCase() !== stateFilter) continue;

    for (const city of state.cities) {
      if (query && !city.name.toLowerCase().includes(query) && !state.name.toLowerCase().includes(query)) continue;

      results.push({
        city: city.name,
        state: state.name,
        state_abbreviation: state.abbreviation,
        population: city.population,
        url: `https://ship.tires/locations/${state.slug}/${city.slug}`,
        brands_available: 21,
      });
    }
  }

  results.sort((a, b) => b.population - a.population);

  return Response.json({
    total: results.length,
    results: results.slice(0, limit),
    shipping: "Free shipping to all locations — all 50 US states",
    contact: { phone: "(279) 238-8473", email: "info@ship.tires" },
  }, {
    headers: {
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
