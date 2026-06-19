export const dynamic = "force-static";

/**
 * RFC 9727 — API Catalog
 * Tells AI agents where to find the machine-readable API description.
 */
export function GET() {
  const catalog = {
    linkset: [
      {
        anchor: "https://ship.tires/",
        "service-desc": [
          {
            href: "https://ship.tires/openapi.json",
            type: "application/openapi+json",
          },
        ],
      },
    ],
  };

  return new Response(JSON.stringify(catalog, null, 2), {
    headers: {
      "Content-Type": "application/linkset+json",
    },
  });
}
