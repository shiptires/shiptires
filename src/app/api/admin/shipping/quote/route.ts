import { isAdminRequest } from "@/lib/admin-auth";
import { getRatesFromAll, isRoadieConfigured } from "@/lib/carriers";

export async function POST(req: Request) {
  if (!(await isAdminRequest())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      fromPostalCode,
      toPostalCode,
      toCity,
      toState,
      toCountry,
      weight,
      dimensions,
      residential,
      sources,
      packageCount,
    } = body;

    if (!fromPostalCode || !toPostalCode || !weight) {
      return Response.json(
        { error: "fromPostalCode, toPostalCode, and weight are required" },
        { status: 400 }
      );
    }

    const { rates, errors } = await getRatesFromAll({
      fromPostalCode,
      toPostalCode,
      toCity: toCity || "",
      toState: toState || "",
      toCountry: toCountry || "US",
      weight: {
        value: weight.value,
        units: weight.units || "pounds",
      },
      dimensions: dimensions
        ? {
            length: dimensions.length,
            width: dimensions.width,
            height: dimensions.height,
            units: dimensions.units || "inches",
          }
        : undefined,
      residential: residential !== false,
      sources: sources || undefined,
      packageCount: packageCount || 1,
    });

    // Map to response shape compatible with existing frontend
    const allRates = rates.map((r) => ({
      carrier: r.carrier,
      carrierCode: r.carrier,
      source: r.source,
      serviceCode: r.serviceCode,
      serviceName: r.serviceName,
      totalCost: r.totalCost,
      transitDays: r.transitDays,
      shipmentCost: r.totalCost,
      otherCost: 0,
    }));

    // If Roadie is configured but was requested and returned no rates (postal-code-only mode),
    // add an informational message
    const requestedSources: string[] | undefined = sources;
    const roadieRequested = requestedSources
      ? requestedSources.includes("roadie")
      : isRoadieConfigured();
    const hasRoadieRates = allRates.some((r) => r.source === "roadie");
    if (roadieRequested && !hasRoadieRates && isRoadieConfigured()) {
      errors.push({
        source: "roadie",
        error: "Roadie requires full addresses. Use order-based rates for Roadie estimates.",
      });
    }

    return Response.json({ rates: allRates, errors: errors.length > 0 ? errors : undefined });
  } catch (e) {
    console.error("Carrier quote error:", e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Failed to get rates" },
      { status: 500 }
    );
  }
}
