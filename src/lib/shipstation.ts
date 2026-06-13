const BASE_URL = "https://ssapi.shipstation.com";

let _authHeader: string | null = null;

function getAuthHeader(): string {
  if (!_authHeader) {
    const key = process.env.SHIPSTATION_API_KEY;
    const secret = process.env.SHIPSTATION_API_SECRET;
    if (!key || !secret) {
      throw new Error("SHIPSTATION_API_KEY and SHIPSTATION_API_SECRET must be set");
    }
    _authHeader = "Basic " + Buffer.from(`${key}:${secret}`).toString("base64");
  }
  return _authHeader;
}

// ── Rate limiter (40 requests / minute) ──────────────────────
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 40;
let requestTimestamps: number[] = [];

async function waitForSlot(): Promise<void> {
  const now = Date.now();
  requestTimestamps = requestTimestamps.filter((t) => now - t < WINDOW_MS);
  if (requestTimestamps.length >= MAX_REQUESTS) {
    const oldest = requestTimestamps[0];
    const waitMs = WINDOW_MS - (now - oldest) + 50;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
    return waitForSlot();
  }
  requestTimestamps.push(Date.now());
}

// ── Core fetch wrapper ───────────────────────────────────────
async function shipstationFetch<T>(
  path: string,
  options: { method?: string; body?: unknown } = {}
): Promise<T> {
  await waitForSlot();

  const res = await fetch(`${BASE_URL}${path}`, {
    method: options.method || "GET",
    headers: {
      Authorization: getAuthHeader(),
      "Content-Type": "application/json",
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ShipStation ${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}

// ── Types ────────────────────────────────────────────────────
export interface Carrier {
  name: string;
  code: string;
  accountNumber: string;
  requiresFundedAccount: boolean;
  balance: number;
  primary: boolean;
  shippingProviderId: number;
}

export interface Service {
  carrierCode: string;
  code: string;
  name: string;
  domestic: boolean;
  international: boolean;
}

export interface RateRequest {
  carrierCode: string;
  fromPostalCode: string;
  toState: string;
  toCountry: string;
  toPostalCode: string;
  toCity: string;
  weight: { value: number; units: "pounds" | "ounces" | "grams" };
  dimensions?: { length: number; width: number; height: number; units: "inches" | "centimeters" };
  confirmation?: string;
  residential?: boolean;
}

export interface Rate {
  serviceName: string;
  serviceCode: string;
  shipmentCost: number;
  otherCost: number;
}

export interface LabelRequest {
  carrierCode: string;
  serviceCode: string;
  packageCode?: string;
  confirmation?: string;
  shipDate: string;
  weight: { value: number; units: "pounds" | "ounces" | "grams" };
  dimensions?: { length: number; width: number; height: number; units: "inches" | "centimeters" };
  shipFrom: Address;
  shipTo: Address;
  testLabel: boolean;
}

export interface Address {
  name: string;
  company?: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
}

export interface LabelResponse {
  shipmentId: number;
  shipmentCost: number;
  insuranceCost: number;
  trackingNumber: string;
  labelData: string; // base64 PDF
  formData: unknown;
}

export interface VoidResponse {
  approved: boolean;
  message: string;
}

// ── API helpers ──────────────────────────────────────────────

export function listCarriers(): Promise<Carrier[]> {
  return shipstationFetch<Carrier[]>("/carriers");
}

export function listServices(carrierCode: string): Promise<Service[]> {
  return shipstationFetch<Service[]>(
    `/carriers/listservices?carrierCode=${encodeURIComponent(carrierCode)}`
  );
}

export function getRates(params: RateRequest): Promise<Rate[]> {
  return shipstationFetch<Rate[]>("/shipments/getrates", {
    method: "POST",
    body: params,
  });
}

export function createLabel(params: LabelRequest): Promise<LabelResponse> {
  return shipstationFetch<LabelResponse>("/shipments/createlabel", {
    method: "POST",
    body: params,
  });
}

export function voidLabel(shipmentId: number): Promise<VoidResponse> {
  return shipstationFetch<VoidResponse>("/shipments/voidlabel", {
    method: "POST",
    body: { shipmentId },
  });
}
