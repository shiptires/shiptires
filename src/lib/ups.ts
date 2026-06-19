// ── UPS REST API Direct Integration ────────────────────────────
// Docs: https://developer.ups.com/api/reference
// Auth: OAuth2 client credentials flow

// Use CIE sandbox when UPS_SANDBOX=true, production otherwise
const UPS_BASE_URL = process.env.UPS_SANDBOX === "true"
  ? "https://wwwcie.ups.com"
  : "https://onlinetools.ups.com";

// ── Token cache ────────────────────────────────────────────────
let _token: string | null = null;
let _tokenExpiry = 0;

function getCredentials() {
  const clientId = process.env.UPS_CLIENT_ID;
  const clientSecret = process.env.UPS_CLIENT_SECRET;
  const accountNumber = process.env.UPS_ACCOUNT_NUMBER;
  if (!clientId || !clientSecret || !accountNumber) {
    throw new Error(
      "UPS_CLIENT_ID, UPS_CLIENT_SECRET, and UPS_ACCOUNT_NUMBER must be set"
    );
  }
  return { clientId, clientSecret, accountNumber };
}

async function getToken(): Promise<string> {
  if (_token && Date.now() < _tokenExpiry) return _token;

  const { clientId, clientSecret } = getCredentials();

  const res = await fetch(`${UPS_BASE_URL}/security/v1/oauth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " + Buffer.from(`${clientId}:${clientSecret}`).toString("base64"),
    },
    body: new URLSearchParams({ grant_type: "client_credentials" }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`UPS auth failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  _token = data.access_token;
  _tokenExpiry = Date.now() + (data.expires_in - 300) * 1000;
  return _token!;
}

async function upsFetch<T>(
  path: string,
  options: { method?: string; body?: unknown } = {}
): Promise<T> {
  const token = await getToken();

  const res = await fetch(`${UPS_BASE_URL}${path}`, {
    method: options.method || "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      transId: crypto.randomUUID(),
      transactionSrc: "ship-tires",
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`UPS ${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}

// ── Types ──────────────────────────────────────────────────────
export interface UPSAddress {
  AddressLine: string[];
  City: string;
  StateProvinceCode: string;
  PostalCode: string;
  CountryCode: string;
}

export interface UPSPackage {
  weight: { value: number; units: "LBS" | "KGS" };
  dimensions?: { length: number; width: number; height: number; units: "IN" | "CM" };
}

export interface UPSRateResult {
  serviceCode: string;
  serviceName: string;
  totalCharge: number;
  currency: string;
  transitDays: number | null;
}

export interface UPSShipmentResult {
  trackingNumber: string;
  labelData: string; // base64
  shipmentId: string;
  totalCharge: number;
}

export interface UPSTrackingEvent {
  timestamp: string;
  description: string;
  city: string;
  stateOrProvince: string;
  postalCode: string;
  country: string;
}

export interface UPSTrackingResult {
  status: string;
  statusDescription: string;
  estimatedDelivery: string | null;
  events: UPSTrackingEvent[];
}

// ── Service name map ───────────────────────────────────────────
const SERVICE_NAMES: Record<string, string> = {
  "03": "UPS Ground",
  "12": "UPS 3 Day Select",
  "02": "UPS 2nd Day Air",
  "59": "UPS 2nd Day Air A.M.",
  "01": "UPS Next Day Air",
  "13": "UPS Next Day Air Saver",
  "14": "UPS Next Day Air Early",
  "65": "UPS Saver",
  "92": "UPS SurePost Less Than 1 lb",
  "93": "UPS SurePost 1 lb or Greater",
  "94": "UPS SurePost BPM",
  "95": "UPS SurePost Media Mail",
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
  packages: UPSPackage[];
}): Promise<UPSRateResult[]> {
  const { accountNumber } = getCredentials();

  const body = {
    RateRequest: {
      Request: {
        SubVersion: "2403",
      },
      Shipment: {
        Shipper: {
          ShipperNumber: accountNumber,
          Address: {
            PostalCode: params.shipper.postalCode,
            CountryCode: params.shipper.countryCode || "US",
            ...(params.shipper.stateCode && {
              StateProvinceCode: params.shipper.stateCode,
            }),
          },
        },
        ShipTo: {
          Address: {
            PostalCode: params.recipient.postalCode,
            CountryCode: params.recipient.countryCode || "US",
            ...(params.recipient.city && { City: params.recipient.city }),
            ...(params.recipient.stateCode && {
              StateProvinceCode: params.recipient.stateCode,
            }),
            ...(params.recipient.residential && {
              ResidentialAddressIndicator: "",
            }),
          },
        },
        ShipFrom: {
          Address: {
            PostalCode: params.shipper.postalCode,
            CountryCode: params.shipper.countryCode || "US",
            ...(params.shipper.stateCode && {
              StateProvinceCode: params.shipper.stateCode,
            }),
          },
        },
        Package: params.packages.map((pkg) => ({
          PackagingType: { Code: "02", Description: "Customer Supplied" },
          PackageWeight: {
            UnitOfMeasurement: { Code: pkg.weight.units, Description: pkg.weight.units === "LBS" ? "Pounds" : "Kilograms" },
            Weight: String(pkg.weight.value),
          },
          ...(pkg.dimensions && {
            Dimensions: {
              UnitOfMeasurement: { Code: pkg.dimensions.units, Description: pkg.dimensions.units === "IN" ? "Inches" : "Centimeters" },
              Length: String(pkg.dimensions.length),
              Width: String(pkg.dimensions.width),
              Height: String(pkg.dimensions.height),
            },
          }),
        })),
      },
    },
  };

  // Use "Shop" request type to get all available service rates
  const data = await upsFetch<{
    RateResponse?: {
      RatedShipment?: Array<{
        Service?: { Code?: string };
        TotalCharges?: { MonetaryValue?: string; CurrencyCode?: string };
        GuaranteedDelivery?: { BusinessDaysInTransit?: string };
        TimeInTransit?: {
          ServiceSummary?: {
            EstimatedArrival?: {
              BusinessDaysInTransit?: string;
            };
          };
        };
      }>;
    };
  }>("/api/rating/v2403/Shop", { method: "POST", body });

  const rated = data.RateResponse?.RatedShipment;
  if (!Array.isArray(rated)) return [];

  return rated.map((r) => {
    const serviceCode = r.Service?.Code || "";
    const totalStr = r.TotalCharges?.MonetaryValue || "0";

    let transitDays: number | null = null;
    const guarDays = r.GuaranteedDelivery?.BusinessDaysInTransit;
    const transitSummaryDays =
      r.TimeInTransit?.ServiceSummary?.EstimatedArrival?.BusinessDaysInTransit;
    if (guarDays) transitDays = parseInt(guarDays);
    else if (transitSummaryDays) transitDays = parseInt(transitSummaryDays);

    return {
      serviceCode,
      serviceName: SERVICE_NAMES[serviceCode] || `UPS Service ${serviceCode}`,
      totalCharge: parseFloat(totalStr),
      currency: r.TotalCharges?.CurrencyCode || "USD",
      transitDays: isNaN(transitDays as number) ? null : transitDays,
    };
  });
}

// ── createShipment ─────────────────────────────────────────────
export async function createShipment(params: {
  shipper: {
    name: string;
    phone?: string;
    company?: string;
    address: UPSAddress;
  };
  recipient: {
    name: string;
    phone?: string;
    company?: string;
    address: UPSAddress;
  };
  serviceCode: string;
  packages: UPSPackage[];
  labelFormat?: "PDF" | "GIF" | "PNG";
}): Promise<UPSShipmentResult> {
  const { accountNumber } = getCredentials();

  const body = {
    ShipmentRequest: {
      Request: { SubVersion: "2409" },
      Shipment: {
        Shipper: {
          Name: params.shipper.company || params.shipper.name,
          ShipperNumber: accountNumber,
          Phone: params.shipper.phone
            ? { Number: params.shipper.phone }
            : undefined,
          Address: params.shipper.address,
        },
        ShipTo: {
          Name: params.shipper.company || params.recipient.name,
          AttentionName: params.recipient.name,
          Phone: params.recipient.phone
            ? { Number: params.recipient.phone }
            : undefined,
          Address: params.recipient.address,
        },
        ShipFrom: {
          Name: params.shipper.company || params.shipper.name,
          Phone: params.shipper.phone
            ? { Number: params.shipper.phone }
            : undefined,
          Address: params.shipper.address,
        },
        PaymentInformation: {
          ShipmentCharge: [
            {
              Type: "01", // Transportation
              BillShipper: { AccountNumber: accountNumber },
            },
          ],
        },
        Service: {
          Code: params.serviceCode,
          Description: SERVICE_NAMES[params.serviceCode] || "",
        },
        Package: params.packages.map((pkg) => ({
          Packaging: { Code: "02", Description: "Customer Supplied" },
          PackageWeight: {
            UnitOfMeasurement: { Code: pkg.weight.units },
            Weight: String(pkg.weight.value),
          },
          ...(pkg.dimensions && {
            Dimensions: {
              UnitOfMeasurement: { Code: pkg.dimensions.units },
              Length: String(pkg.dimensions.length),
              Width: String(pkg.dimensions.width),
              Height: String(pkg.dimensions.height),
            },
          }),
        })),
      },
      LabelSpecification: {
        LabelImageFormat: {
          Code: params.labelFormat || "PDF",
        },
        LabelStockSize: { Width: "4", Height: "6" },
      },
    },
  };

  const data = await upsFetch<{
    ShipmentResponse?: {
      ShipmentResults?: {
        ShipmentIdentificationNumber?: string;
        ShipmentCharges?: {
          TotalCharges?: { MonetaryValue?: string };
        };
        PackageResults?:
          | Array<{
              TrackingNumber?: string;
              ShippingLabel?: {
                GraphicImage?: string; // base64
              };
            }>
          | {
              TrackingNumber?: string;
              ShippingLabel?: {
                GraphicImage?: string;
              };
            };
      };
    };
  }>("/api/shipments/v2409/ship", { method: "POST", body });

  const results = data.ShipmentResponse?.ShipmentResults;
  if (!results) {
    throw new Error("UPS createShipment returned no results");
  }

  const pkgResults = Array.isArray(results.PackageResults)
    ? results.PackageResults
    : results.PackageResults
      ? [results.PackageResults]
      : [];

  const tracking =
    pkgResults[0]?.TrackingNumber ||
    results.ShipmentIdentificationNumber ||
    "";

  const labelData = pkgResults[0]?.ShippingLabel?.GraphicImage || "";

  const totalCharge = parseFloat(
    results.ShipmentCharges?.TotalCharges?.MonetaryValue || "0"
  );

  return {
    trackingNumber: tracking,
    labelData,
    shipmentId: results.ShipmentIdentificationNumber || tracking,
    totalCharge,
  };
}

// ── voidShipment ───────────────────────────────────────────────
export async function voidShipment(params: {
  shipmentId: string;
}): Promise<{ success: boolean; message: string }> {
  try {
    const data = await upsFetch<{
      VoidShipmentResponse?: {
        SummaryResult?: {
          Status?: { Description?: string; CodeDescription?: string };
        };
      };
    }>(
      `/api/shipments/v2409/void/cancel/${encodeURIComponent(params.shipmentId)}`,
      { method: "DELETE" }
    );

    const status =
      data.VoidShipmentResponse?.SummaryResult?.Status;
    return {
      success: true,
      message: status?.Description || status?.CodeDescription || "Shipment voided",
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
}): Promise<UPSTrackingResult> {
  const data = await upsFetch<{
    trackResponse?: {
      shipment?: Array<{
        package?: Array<{
          currentStatus?: {
            code?: string;
            description?: string;
          };
          deliveryDate?: Array<{ date?: string }>;
          activity?: Array<{
            date?: string;
            time?: string;
            status?: { description?: string };
            location?: {
              address?: {
                city?: string;
                stateProvince?: string;
                postalCode?: string;
                country?: string;
              };
            };
          }>;
        }>;
      }>;
    };
  }>(
    `/api/track/v1/details/${encodeURIComponent(params.trackingNumber)}`,
    { method: "GET" }
  );

  const pkg = data.trackResponse?.shipment?.[0]?.package?.[0];
  if (!pkg) {
    throw new Error("No tracking information found");
  }

  const status = pkg.currentStatus;

  let estimatedDelivery: string | null = null;
  if (pkg.deliveryDate?.[0]?.date) {
    estimatedDelivery = pkg.deliveryDate[0].date;
  }

  const events: UPSTrackingEvent[] = (pkg.activity || []).map((a) => ({
    timestamp: a.date && a.time ? `${a.date} ${a.time}` : a.date || "",
    description: a.status?.description || "",
    city: a.location?.address?.city || "",
    stateOrProvince: a.location?.address?.stateProvince || "",
    postalCode: a.location?.address?.postalCode || "",
    country: a.location?.address?.country || "",
  }));

  return {
    status: status?.code || "UNKNOWN",
    statusDescription: status?.description || "Unknown",
    estimatedDelivery,
    events,
  };
}
