export const dynamic = "force-static";

/**
 * OpenAPI 3.1 specification for the Ship.Tires public API.
 * Referenced by /.well-known/api-catalog and Link headers.
 */
export function GET() {
  const spec = {
    openapi: "3.1.0",
    info: {
      title: "Ship.Tires API",
      version: "1.0.0",
      description:
        "Public API for Ship.Tires — tire product feeds and search. Over 275,000 tires from 430+ brands with free shipping.",
      contact: {
        name: "Ship.Tires",
        url: "https://ship.tires/contact",
        phone: "+12792388473",
      },
    },
    servers: [{ url: "https://ship.tires" }],
    paths: {
      "/api/feeds/google-merchant": {
        get: {
          operationId: "getProductFeed",
          summary: "Tire product feed (RSS 2.0 XML)",
          description:
            "Returns an RSS 2.0 XML feed of tire products. Supports pagination, brand filtering, and vehicle-specific expanded listings.",
          parameters: [
            {
              name: "page",
              in: "query",
              description: "Page number (default 1)",
              schema: { type: "integer", default: 1, minimum: 1 },
            },
            {
              name: "limit",
              in: "query",
              description:
                "Items per page (default 50000 standard, 10000 vehicle mode, max 50000)",
              schema: { type: "integer", default: 50000, maximum: 50000 },
            },
            {
              name: "brands",
              in: "query",
              description:
                "Comma-separated brand names to filter (e.g. goodyear,michelin)",
              schema: { type: "string" },
            },
            {
              name: "vehicles",
              in: "query",
              description:
                "Set to 'true' to expand each tire into vehicle-specific listings",
              schema: { type: "string", enum: ["true", "false"] },
            },
          ],
          responses: {
            "200": {
              description: "RSS 2.0 XML product feed",
              headers: {
                "X-Total-Products": {
                  description: "Total number of tire products",
                  schema: { type: "string" },
                },
                "X-Page": {
                  description: "Current page number",
                  schema: { type: "string" },
                },
                "X-Total-Pages": {
                  description: "Total number of pages",
                  schema: { type: "string" },
                },
                "X-Items-On-Page": {
                  description: "Number of items on this page",
                  schema: { type: "string" },
                },
              },
              content: {
                "application/xml": {
                  schema: { type: "string" },
                },
              },
            },
          },
        },
      },
    },
  };

  return new Response(JSON.stringify(spec, null, 2), {
    headers: {
      "Content-Type": "application/openapi+json",
    },
  });
}
