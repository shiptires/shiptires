export const dynamic = "force-static";

/**
 * Agent Communication Protocol (ACP) discovery endpoint.
 * Tells AI agents what this site offers and how to interact with it.
 */
export function GET() {
  const acp = {
    schema_version: "1.0",
    name: "Ship.Tires",
    description:
      "Shop & Ship Car, Truck & SUV Tires with Free Delivery. Over 275,000 tires from 430+ brands.",
    url: "https://ship.tires",
    human_url: "https://ship.tires",
    logo_url: "https://ship.tires/logo.png",
    provider: {
      organization: "Ship.Tires",
    },
    apis: [
      {
        name: "Google Merchant Feed",
        description:
          "RSS 2.0 XML feed of tire products. Supports pagination, brand filtering, and vehicle-expanded listings.",
        url: "https://ship.tires/api/feeds/google-merchant",
        type: "rest",
        documentation_url: "https://ship.tires/openapi.json",
      },
      {
        name: "Meta Commerce Feed",
        description:
          "TSV feed for Meta Commerce Manager (Facebook Shops, Instagram Shopping). Supports pagination and brand filtering.",
        url: "https://ship.tires/api/feeds/meta-commerce",
        type: "rest",
      },
    ],
    capabilities: {
      product_search: true,
      product_catalog: true,
      product_feed: true,
    },
    content_policy: {
      ai_training: "allowed",
      ai_search: "allowed",
      ai_input: "allowed",
    },
    contact: {
      phone: "+12792388473",
      url: "https://ship.tires/contact",
    },
  };

  return new Response(JSON.stringify(acp, null, 2), {
    headers: {
      "Content-Type": "application/json",
    },
  });
}
