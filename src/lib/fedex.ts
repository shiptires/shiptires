// ── FedEx REST API Direct Integration ──────────────────────────
// Docs: https://developer.fedex.com/api/en-us/catalog.html
// Auth: OAuth2 client credentials flow

// Use sandbox when FEDEX_SANDBOX=true, production otherwise
const FEDEX_BASE_URL = process.env.FEDEX_SANDBOX === "true"
  ? "https://apis-sandbox.fedex.com"
  : "https://apis.fedex.com";

// ── Token cache ────────────────────────────────────────────────
let _token: string | null = null;
let _tokenExpiry = 0;

// Track API uses a separate FedEx project with its own credentials
let _trackToken: string | null = null;
let _trackTokenExpiry = 0;

function getCredentials() {
  const clientId = process.env.FEDEX_CLIENT_ID;
  const clientSecret = process.env.FEDEX_CLIENT_SECRET;
  const accountNumber = process.env.FEDEX_ACCOUNT_NUMBER;
  if (!clientId || !clientSecret || !accountNumber) {
    throw new Error(
      "FEDEX_CLIENT_ID, FEDEX_CLIENT_SECRET, and FEDEX_ACCOUNT_NUMBER must be set"
    );
  }
  return { clientId, clientSecret, accountNumber };
}

function getTrackCredentials() {
  // Track API lives in a separate FedEx project — use dedicated keys if set,
  // otherwise fall back to the main Ship/Rate keys.
  const clientId = process.env.FEDEX_TRACK_CLIENT_ID || process.env.FEDEX_CLIENT_ID;
  const clientSecret = process.env.FEDEX_TRACK_CLIENT_SECRET || process.env.FEDEX_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("FedEx Track credentials not configured");
  }
  return { clientId, clientSecret };
}

async function getToken(): Promise<string> {
  if (_token && Date.now() < _tokenExpiry) return _token;

  const { clientId, clientSecret } = getCredentials();

  const res = await fetch(`${FEDEX_BASE_URL}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`FedEx auth failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  _token = data.access_token;
  // Token expires in ~3600s; refresh 5 min early
  _tokenExpiry = Date.now() + (data.expires_in - 300) * 1000;
  return _token!;
}

async function getTrackToken(): Promise<string> {
  if (_trackToken && Date.now() < _trackTokenExpiry) return _trackToken;

  const { clientId, clientSecret } = getTrackCredentials();

  const res = await fetch(`${FEDEX_BASE_URL}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`FedEx Track auth failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  _trackToken = data.access_token;
  _trackTokenExpiry = Date.now() + (data.expires_in - 300) * 1000;
  return _trackToken!;
}

async function fedexFetch<T>(
  path: string,
  options: { method?: string; body?: unknown; useTrackToken?: boolean } = {}
): Promise<T> {
  const token = options.useTrackToken ? await getTrackToken() : await getToken();

  const res = await fetch(`${FEDEX_BASE_URL}${path}`, {
    method: options.method || "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`FedEx ${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}

// ── Types ──────────────────────────────────────────────────────
export interface FedExAddress {
  streetLines: string[];
  city: string;
  stateOrProvinceCode: string;
  postalCode: string;
  countryCode: string;
  residential?: boolean;
}

export interface FedExContact {
  personName: string;
  phoneNumber?: string;
  companyName?: string;
}

export interface FedExPackage {
  weight: { value: number; units: "LB" | "KG" };
  dimensions?: { length: number; width: number; height: number; units: "IN" | "CM" };
}

export interface FedExRateResult {
  serviceType: string;
  serviceName: string;
  totalCharge: number;
  currency: string;
  transitDays: number | null;
}

export interface FedExShipmentResult {
  trackingNumber: string;
  labelData: string; // base64 PDF
  shipmentId: string;
  totalCharge: number;
}

export interface FedExTrackingEvent {
  timestamp: string;
  description: string;
  city: string;
  stateOrProvince: string;
  postalCode: string;
  country: string;
}

export interface FedExTrackingResult {
  status: string;
  statusDescription: string;
  estimatedDelivery: string | null;
  events: FedExTrackingEvent[];
}

// ── Service name map ───────────────────────────────────────────
const SERVICE_NAMES: Record<string, string> = {
  FEDEX_GROUND: "FedEx Ground",
  GROUND_HOME_DELIVERY: "FedEx Home Delivery",
  FEDEX_EXPRESS_SAVER: "FedEx Express Saver",
  FEDEX_2_DAY: "FedEx 2Day",
  FEDEX_2_DAY_AM: "FedEx 2Day A.M.",
  STANDARD_OVERNIGHT: "FedEx Standard Overnight",
  PRIORITY_OVERNIGHT: "FedEx Priority Overnight",
  FIRST_OVERNIGHT: "FedEx First Overnight",
  FEDEX_FREIGHT_ECONOMY: "FedEx Freight Economy",
  FEDEX_FREIGHT_PRIORITY: "FedEx Freight Priority",
  FEDEX_FIRST_FREIGHT: "FedEx First Freight",
  FEDEX_3_DAY_FREIGHT: "FedEx 3-Day Freight",
  FEDEX_2_DAY_FREIGHT: "FedEx 2-Day Freight",
  FEDEX_1_DAY_FREIGHT: "FedEx 1-Day Freight",
  SMART_POST: "FedEx Ground Economy",
  FEDEX_GROUND_ECONOMY: "FedEx Ground Economy",
};

// ── getRates ───────────────────────────────────────────────────
export async function getRates(params: {
  shipper: { postalCode: string; countryCode?: string; stateCode?: string };
  recipient: {
    postalCode: string;
    city?: string;
    stateCode?: string;
    countryCode?: string;
    residential?: boolean;
  };
  packages: FedExPackage[];
}): Promise<FedExRateResult[]> {
  const { accountNumber } = getCredentials();

  const body = {
    accountNumber: { value: accountNumber },
    rateRequestControlParameters: {
      returnTransitTimes: true,
      rateSortOrder: "COMMITASCENDING",
    },
    requestedShipment: {
      shipper: {
        address: {
          postalCode: params.shipper.postalCode,
          countryCode: params.shipper.countryCode || "US",
          ...(params.shipper.stateCode && {
            stateOrProvinceCode: params.shipper.stateCode,
          }),
        },
      },
      recipient: {
        address: {
          postalCode: params.recipient.postalCode,
          countryCode: params.recipient.countryCode || "US",
          ...(params.recipient.city && { city: params.recipient.city }),
          ...(params.recipient.stateCode && {
            stateOrProvinceCode: params.recipient.stateCode,
          }),
          residential: params.recipient.residential ?? true,
        },
      },
      pickupType: "DROPOFF_AT_FEDEX_LOCATION",
      rateRequestType: ["ACCOUNT", "LIST"],
      // Include SmartPost / Ground Economy if hub ID is configured
      ...(process.env.FEDEX_SMARTPOST_HUB_ID && {
        smartPostInfoDetail: {
          hubId: process.env.FEDEX_SMARTPOST_HUB_ID,
          indicia: "PARCEL_SELECT",
        },
      }),
      requestedPackageLineItems: params.packages.map((pkg) => ({
        weight: { value: pkg.weight.value, units: pkg.weight.units },
        ...(pkg.dimensions && {
          dimensions: {
            length: pkg.dimensions.length,
            width: pkg.dimensions.width,
            height: pkg.dimensions.height,
            units: pkg.dimensions.units,
          },
        }),
      })),
    },
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = await fedexFetch<{ output?: { rateReplyDetails?: Record<string, any>[] } }>(
    "/rate/v1/rates/quotes",
    { method: "POST", body }
  );

  const details = data.output?.rateReplyDetails;
  if (!Array.isArray(details)) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return details.map((d: Record<string, any>) => {
    const serviceType = d.serviceType as string;
    const ratedPkgs = d.ratedShipmentDetails as Record<string, unknown>[] | undefined;
    // Prefer ACCOUNT rates over LIST rates
    const rateDetail =
      ratedPkgs?.find((r) => r.rateType === "ACCOUNT") || ratedPkgs?.[0];
    const totalCharges = rateDetail?.totalNetCharge as number | undefined;

    // Transit time — calculate from delivery date vs today
    const commit = d.commit as Record<string, unknown> | undefined;
    let transitDays: number | null = null;
    if (commit?.dateDetail) {
      const dateDetail = commit.dateDetail as Record<string, string>;
      // dayFormat is a delivery date like "2026-06-18T08:00:00"
      if (dateDetail.dayFormat) {
        const deliveryDate = new Date(dateDetail.dayFormat);
        if (!isNaN(deliveryDate.getTime())) {
          const now = new Date();
          const diffMs = deliveryDate.getTime() - now.getTime();
          transitDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
        }
      }
    }
    if (transitDays === null && commit?.transitDays) {
      const td = commit.transitDays as Record<string, unknown>;
      if (typeof td.days === "number") transitDays = td.days;
      else if (typeof td === "string") {
        const match = (td as unknown as string).match(/(\d+)/);
        if (match) transitDays = parseInt(match[1]);
      }
    }

    return {
      serviceType,
      serviceName: SERVICE_NAMES[serviceType] || serviceType,
      totalCharge: totalCharges ?? 0,
      currency: "USD",
      transitDays,
    };
  });
}

// ── createShipment ─────────────────────────────────────────────
export async function createShipment(params: {
  shipper: { contact: FedExContact; address: FedExAddress };
  recipient: { contact: FedExContact; address: FedExAddress };
  serviceType: string;
  packages: FedExPackage[];
  labelFormat?: "PDF" | "PNG";
}): Promise<FedExShipmentResult> {
  const { accountNumber } = getCredentials();

  const body = {
    accountNumber: { value: accountNumber },
    labelResponseOptions: "URL_ONLY",
    requestedShipment: {
      shipper: {
        contact: {
          personName: params.shipper.contact.personName,
          phoneNumber: params.shipper.contact.phoneNumber || "",
          companyName: params.shipper.contact.companyName || "",
        },
        address: params.shipper.address,
      },
      recipients: [
        {
          contact: {
            personName: params.recipient.contact.personName,
            phoneNumber: params.recipient.contact.phoneNumber || "",
            companyName: params.recipient.contact.companyName || "",
          },
          address: params.recipient.address,
        },
      ],
      pickupType: "DROPOFF_AT_FEDEX_LOCATION",
      serviceType: params.serviceType,
      packagingType: "YOUR_PACKAGING",
      shippingChargesPayment: {
        paymentType: "SENDER",
        payor: {
          responsibleParty: { accountNumber: { value: accountNumber } },
        },
      },
      labelSpecification: {
        labelFormatType: "COMMON2D",
        imageType: params.labelFormat || "PDF",
        labelStockType: "PAPER_4X6",
      },
      requestedPackageLineItems: params.packages.map((pkg, i) => ({
        sequenceNumber: i + 1,
        weight: { value: pkg.weight.value, units: pkg.weight.units },
        ...(pkg.dimensions && {
          dimensions: {
            length: pkg.dimensions.length,
            width: pkg.dimensions.width,
            height: pkg.dimensions.height,
            units: pkg.dimensions.units,
          },
        }),
      })),
    },
  };

  const data = await fedexFetch<{
    output?: {
      transactionShipments?: Array<{
        masterTrackingNumber: string;
        shipmentId?: string;
        pieceResponses?: Array<{
          trackingNumber: string;
          packageDocuments?: Array<{
            encodedLabel?: string;
            url?: string;
          }>;
        }>;
        completedShipmentDetail?: {
          shipmentRating?: {
            shipmentRateDetails?: Array<{
              totalNetCharge?: number;
            }>;
          };
        };
      }>;
    };
  }>("/ship/v1/shipments", { method: "POST", body });

  const shipment = data.output?.transactionShipments?.[0];
  if (!shipment) {
    throw new Error("FedEx createShipment returned no shipment data");
  }

  const tracking =
    shipment.pieceResponses?.[0]?.trackingNumber ||
    shipment.masterTrackingNumber;

  // Get label — either encoded directly or via URL
  let labelData = "";
  const doc = shipment.pieceResponses?.[0]?.packageDocuments?.[0];
  if (doc?.encodedLabel) {
    labelData = doc.encodedLabel;
  } else if (doc?.url) {
    // Fetch the label from the URL
    const labelRes = await fetch(doc.url);
    const labelBuf = await labelRes.arrayBuffer();
    labelData = Buffer.from(labelBuf).toString("base64");
  }

  const totalCharge =
    shipment.completedShipmentDetail?.shipmentRating?.shipmentRateDetails?.[0]
      ?.totalNetCharge ?? 0;

  return {
    trackingNumber: tracking,
    labelData,
    shipmentId: shipment.shipmentId || tracking,
    totalCharge,
  };
}

// ── voidShipment ───────────────────────────────────────────────
export async function voidShipment(params: {
  trackingNumber: string;
}): Promise<{ success: boolean; message: string }> {
  const { accountNumber } = getCredentials();

  try {
    const body = {
      accountNumber: { value: accountNumber },
      trackingNumber: params.trackingNumber,
    };

    const data = await fedexFetch<{
      output?: {
        cancelledShipment: boolean;
        message?: string;
      };
    }>("/ship/v1/shipments/cancel", { method: "PUT", body });

    return {
      success: data.output?.cancelledShipment ?? false,
      message: data.output?.message || "Shipment cancelled",
    };
  } catch (e) {
    return {
      success: false,
      message: e instanceof Error ? e.message : "Failed to void shipment",
    };
  }
}

// ── trackShipment ──────────────────────────────────────────────
export async function trackShipment(params: {
  trackingNumber: string;
}): Promise<FedExTrackingResult> {
  const body = {
    includeDetailedScans: true,
    trackingInfo: [
      {
        trackingNumberInfo: {
          trackingNumber: params.trackingNumber,
        },
      },
    ],
  };

  const data = await fedexFetch<{
    output?: {
      completeTrackResults?: Array<{
        trackResults?: Array<{
          latestStatusDetail?: {
            code?: string;
            description?: string;
            statusByLocale?: string;
          };
          estimatedDeliveryTimeWindow?: {
            window?: { ends?: string };
          };
          dateAndTimes?: Array<{
            type?: string;
            dateTime?: string;
          }>;
          scanEvents?: Array<{
            date?: string;
            eventDescription?: string;
            scanLocation?: {
              city?: string;
              stateOrProvinceCode?: string;
              postalCode?: string;
              countryCode?: string;
            };
          }>;
        }>;
      }>;
    };
  }>("/track/v1/trackingnumbers", { method: "POST", body, useTrackToken: true });

  const trackResult =
    data.output?.completeTrackResults?.[0]?.trackResults?.[0];
  if (!trackResult) {
    throw new Error("No tracking information found");
  }

  const status = trackResult.latestStatusDetail;

  // Estimated delivery
  let estimatedDelivery: string | null = null;
  const estWindow = trackResult.estimatedDeliveryTimeWindow?.window?.ends;
  if (estWindow) {
    estimatedDelivery = estWindow;
  } else {
    const estDate = trackResult.dateAndTimes?.find(
      (d) => d.type === "ESTIMATED_DELIVERY"
    );
    if (estDate?.dateTime) estimatedDelivery = estDate.dateTime;
  }

  const events: FedExTrackingEvent[] = (trackResult.scanEvents || []).map(
    (e) => ({
      timestamp: e.date || "",
      description: e.eventDescription || "",
      city: e.scanLocation?.city || "",
      stateOrProvince: e.scanLocation?.stateOrProvinceCode || "",
      postalCode: e.scanLocation?.postalCode || "",
      country: e.scanLocation?.countryCode || "",
    })
  );

  return {
    status: status?.code || "UNKNOWN",
    statusDescription:
      status?.statusByLocale || status?.description || "Unknown",
    estimatedDelivery,
    events,
  };
}
