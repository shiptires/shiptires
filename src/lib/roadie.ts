// ── Roadie REST API Direct Integration ─────────────────────────
// Docs: https://connect.roadie.com/docs
// Auth: Static Bearer token (no OAuth flow needed)

const ROADIE_BASE_URL = process.env.ROADIE_SANDBOX === "true"
  ? "https://connect-sandbox.roadie.com/v1"
  : "https://connect.roadie.com/v1";

function getConfig() {
  const apiKey = process.env.ROADIE_API_KEY;
  if (!apiKey) {
    throw new Error("ROADIE_API_KEY must be set");
  }
  return {
    apiKey,
    customerId: process.env.ROADIE_CUSTOMER_ID || "",
  };
}

async function roadieFetch<T>(
  path: string,
  options: { method?: string; body?: unknown } = {}
): Promise<T> {
  const { apiKey } = getConfig();

  const res = await fetch(`${ROADIE_BASE_URL}${path}`, {
    method: options.method || "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  // Handle rate limiting
  if (res.status === 429) {
    const retryAfter = parseInt(res.headers.get("Retry-After") || "2", 10);
    await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
    return roadieFetch<T>(path, options);
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Roadie ${res.status}: ${text}`);
  }

  // DELETE returns 204 No Content
  if (res.status === 204) {
    return {} as T;
  }

  return res.json() as Promise<T>;
}

// ── Types ──────────────────────────────────────────────────────
export interface RoadieAddress {
  name: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  phone?: string;
}

export interface RoadieEstimateResult {
  price: number;
  distance: number; // miles
  currency: string;
}

export interface RoadieShipmentResult {
  trackingNumber: string;
  shipmentId: string;
  labelData: string; // base64 PNG barcode
  totalCharge: number;
}

export interface RoadieTrackingEvent {
  timestamp: string;
  description: string;
  city: string;
  stateOrProvince: string;
  postalCode: string;
  country: string;
}

export interface RoadieTrackingResult {
  status: string;
  statusDescription: string;
  estimatedDelivery: string | null;
  events: RoadieTrackingEvent[];
  driver?: {
    name: string;
    phone: string;
    vehicle?: string;
  };
}

// ── Helpers ───────────────────────────────────────────────────

/** Sanitize phone to 10 digits (US) */
function sanitizePhone(phone?: string): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  // Strip leading 1 if 11 digits
  if (digits.length === 11 && digits.startsWith("1")) {
    return digits.slice(1);
  }
  return digits.slice(0, 10);
}

/** Map Roadie status codes to human-readable descriptions */
const STATUS_DESCRIPTIONS: Record<string, string> = {
  scheduled: "Shipment scheduled — awaiting driver assignment",
  assigned: "Driver assigned — preparing for pickup",
  en_route_to_pickup: "Driver en route to pickup location",
  at_pickup: "Driver at pickup location",
  en_route_to_dropoff: "Driver en route to delivery address",
  at_dropoff: "Driver at delivery address",
  delivered: "Delivered",
  attempted: "Delivery attempted — could not complete",
  returned: "Package returned to sender",
  canceled: "Shipment canceled",
  expired: "Shipment expired — no driver accepted",
};

/** Build ISO time windows: pickup in +30min, delivery in +1-4hr */
function buildTimeWindows() {
  const now = new Date();
  const pickupStart = new Date(now.getTime() + 30 * 60 * 1000);
  const pickupEnd = new Date(pickupStart.getTime() + 30 * 60 * 1000);
  const deliverStart = new Date(now.getTime() + 60 * 60 * 1000);
  const deliverEnd = new Date(now.getTime() + 4 * 60 * 60 * 1000);

  return {
    pickup_after: pickupStart.toISOString(),
    pickup_before: pickupEnd.toISOString(),
    deliver_after: deliverStart.toISOString(),
    deliver_before: deliverEnd.toISOString(),
  };
}

// ── getEstimate ────────────────────────────────────────────────
// Requires full street addresses — returns empty array if only
// postal codes are available.
export async function getEstimate(params: {
  pickupAddress: RoadieAddress;
  deliveryAddress: RoadieAddress;
  items: Array<{
    description: string;
    weight: number; // lbs
    length: number;
    width: number;
    height: number;
  }>;
}): Promise<RoadieEstimateResult[]> {
  const times = buildTimeWindows();

  const body = {
    items: params.items.map((item) => ({
      description: item.description,
      weight: item.weight,
      length: item.length,
      width: item.width,
      height: item.height,
      quantity: 1,
    })),
    pickup_location: {
      address: {
        name: params.pickupAddress.name,
        street1: params.pickupAddress.street1,
        street2: params.pickupAddress.street2 || undefined,
        city: params.pickupAddress.city,
        state: params.pickupAddress.state,
        zip: params.pickupAddress.zip,
      },
      contact: {
        name: params.pickupAddress.name,
        phone: sanitizePhone(params.pickupAddress.phone),
      },
    },
    delivery_location: {
      address: {
        name: params.deliveryAddress.name,
        street1: params.deliveryAddress.street1,
        street2: params.deliveryAddress.street2 || undefined,
        city: params.deliveryAddress.city,
        state: params.deliveryAddress.state,
        zip: params.deliveryAddress.zip,
      },
      contact: {
        name: params.deliveryAddress.name,
        phone: sanitizePhone(params.deliveryAddress.phone),
      },
    },
    pickup_after: times.pickup_after,
    pickup_before: times.pickup_before,
    deliver_after: times.deliver_after,
    deliver_before: times.deliver_before,
  };

  try {
    const data = await roadieFetch<{
      price?: number;
      distance?: number;
      size?: string;
    }>("/estimates", { method: "POST", body });

    if (data.price == null) return [];

    return [
      {
        price: data.price,
        distance: data.distance ?? 0,
        currency: "USD",
      },
    ];
  } catch (e) {
    // Roadie rejects routes > ~350 miles or invalid addresses gracefully
    console.error("Roadie estimate error:", e);
    return [];
  }
}

// ── createShipment ─────────────────────────────────────────────
export async function createShipment(params: {
  referenceId: string; // orderId
  pickupAddress: RoadieAddress;
  deliveryAddress: RoadieAddress;
  items: Array<{
    description: string;
    weight: number;
    length: number;
    width: number;
    height: number;
  }>;
  signatureRequired?: boolean;
  notificationsEnabled?: boolean;
}): Promise<RoadieShipmentResult> {
  const times = buildTimeWindows();

  const body = {
    reference_id: params.referenceId,
    items: params.items.map((item) => ({
      description: item.description,
      weight: item.weight,
      length: item.length,
      width: item.width,
      height: item.height,
      quantity: 1,
    })),
    pickup_location: {
      address: {
        name: params.pickupAddress.name,
        street1: params.pickupAddress.street1,
        street2: params.pickupAddress.street2 || undefined,
        city: params.pickupAddress.city,
        state: params.pickupAddress.state,
        zip: params.pickupAddress.zip,
      },
      contact: {
        name: params.pickupAddress.name,
        phone: sanitizePhone(params.pickupAddress.phone),
      },
    },
    delivery_location: {
      address: {
        name: params.deliveryAddress.name,
        street1: params.deliveryAddress.street1,
        street2: params.deliveryAddress.street2 || undefined,
        city: params.deliveryAddress.city,
        state: params.deliveryAddress.state,
        zip: params.deliveryAddress.zip,
      },
      contact: {
        name: params.deliveryAddress.name,
        phone: sanitizePhone(params.deliveryAddress.phone),
      },
    },
    pickup_after: times.pickup_after,
    pickup_before: times.pickup_before,
    deliver_after: times.deliver_after,
    deliver_before: times.deliver_before,
    options: {
      signature_required: params.signatureRequired ?? false,
      notifications_enabled: params.notificationsEnabled ?? true,
      over_21_required: false,
    },
  };

  const data = await roadieFetch<{
    id?: number;
    tracking_number?: string;
    price?: number;
    status?: string;
  }>("/shipments", { method: "POST", body });

  if (!data.id) {
    throw new Error("Roadie createShipment returned no shipment data");
  }

  const shipmentId = String(data.id);

  // Fetch barcode label (PNG)
  let labelData = "";
  try {
    const labelRes = await fetch(
      `${ROADIE_BASE_URL}/shipments/${shipmentId}/label`,
      {
        headers: {
          Authorization: `Bearer ${getConfig().apiKey}`,
        },
      }
    );
    if (labelRes.ok) {
      const labelBuf = await labelRes.arrayBuffer();
      labelData = Buffer.from(labelBuf).toString("base64");
    }
  } catch {
    // Label fetch is non-critical — barcode may not be available yet
    console.warn("Could not fetch Roadie barcode label for shipment", shipmentId);
  }

  return {
    trackingNumber: data.tracking_number || shipmentId,
    shipmentId,
    labelData,
    totalCharge: data.price ?? 0,
  };
}

// ── trackShipment ──────────────────────────────────────────────
// Uses shipment ID, not tracking number (Roadie API requirement)
export async function trackShipment(params: {
  shipmentId: string;
}): Promise<RoadieTrackingResult> {
  const data = await roadieFetch<{
    id?: number;
    status?: string;
    tracking_number?: string;
    estimated_delivery?: string;
    delivered_at?: string;
    driver?: {
      name?: string;
      phone?: string;
      vehicle?: {
        make?: string;
        model?: string;
        color?: string;
        license_plate?: string;
      };
    };
    events?: Array<{
      occurred_at?: string;
      description?: string;
      location?: {
        city?: string;
        state?: string;
        zip?: string;
      };
    }>;
  }>(`/shipments/${encodeURIComponent(params.shipmentId)}`);

  const status = data.status || "unknown";
  const statusDescription =
    STATUS_DESCRIPTIONS[status] || `Status: ${status}`;

  let estimatedDelivery: string | null = null;
  if (data.delivered_at) {
    estimatedDelivery = data.delivered_at;
  } else if (data.estimated_delivery) {
    estimatedDelivery = data.estimated_delivery;
  }

  const events: RoadieTrackingEvent[] = (data.events || []).map((e) => ({
    timestamp: e.occurred_at || "",
    description: e.description || "",
    city: e.location?.city || "",
    stateOrProvince: e.location?.state || "",
    postalCode: e.location?.zip || "",
    country: "US",
  }));

  const driver = data.driver
    ? {
        name: data.driver.name || "",
        phone: data.driver.phone || "",
        vehicle: data.driver.vehicle
          ? `${data.driver.vehicle.color || ""} ${data.driver.vehicle.make || ""} ${data.driver.vehicle.model || ""}`.trim()
          : undefined,
      }
    : undefined;

  return {
    status,
    statusDescription,
    estimatedDelivery,
    events,
    driver,
  };
}

// ── voidShipment ───────────────────────────────────────────────
// Only works before driver confirms pickup.
export async function voidShipment(params: {
  shipmentId: string;
}): Promise<{ success: boolean; message: string }> {
  try {
    await roadieFetch(
      `/shipments/${encodeURIComponent(params.shipmentId)}`,
      { method: "DELETE" }
    );
    return {
      success: true,
      message: "Roadie shipment canceled",
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to cancel Roadie shipment";
    // Check if driver already picked up
    if (msg.includes("422") || msg.includes("cannot") || msg.includes("picked up")) {
      return {
        success: false,
        message: "Cannot cancel: driver has already picked up the package",
      };
    }
    return {
      success: false,
      message: msg,
    };
  }
}
