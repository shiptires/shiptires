// ── Unified Carrier Interface ──────────────────────────────────
// Abstracts FedEx, UPS, and Roadie behind a common interface so
// API routes don't need to know which carrier they're talking to.

import * as fedex from "./fedex";
import * as ups from "./ups";
import * as shipstation from "./shipstation";
import * as roadie from "./roadie";

// ── Shared types ───────────────────────────────────────────────
export type CarrierName = "fedex" | "ups" | "roadie" | "shipstation";
export type RateSource = "fedex" | "ups" | "shipstation" | "roadie";

export interface CarrierRate {
  carrier: CarrierName;
  source: RateSource; // "fedex" direct or "shipstation" walleted
  serviceCode: string;
  serviceName: string;
  totalCost: number;
  currency: string;
  transitDays: number | null;
  estimatedDistance?: number; // miles (from Roadie estimate)
}

export interface ShipmentResult {
  trackingNumber: string;
  labelData: string; // base64 PDF or PNG
  shipmentId: string;
  totalCharge: number;
  labelFormat?: "pdf" | "png";
}

export interface VoidResult {
  success: boolean;
  message: string;
}

export interface TrackingEvent {
  timestamp: string;
  description: string;
  city: string;
  stateOrProvince: string;
  postalCode: string;
  country: string;
}

export interface TrackingInfo {
  status: string;
  statusDescription: string;
  estimatedDelivery: string | null;
  events: TrackingEvent[];
  driver?: {
    name: string;
    phone: string;
    vehicle?: string;
  };
}

export interface ShipAddress {
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

export interface PackageInfo {
  weight: { value: number; units: "pounds" | "ounces" };
  dimensions?: {
    length: number;
    width: number;
    height: number;
    units: "inches" | "centimeters";
  };
}

// ── Helpers to detect which carriers are configured ────────────
function isFedExConfigured(): boolean {
  return !!(
    process.env.FEDEX_CLIENT_ID &&
    process.env.FEDEX_CLIENT_SECRET &&
    process.env.FEDEX_ACCOUNT_NUMBER
  );
}

function isUPSConfigured(): boolean {
  return !!(
    process.env.UPS_CLIENT_ID &&
    process.env.UPS_CLIENT_SECRET &&
    process.env.UPS_ACCOUNT_NUMBER
  );
}

function isShipStationConfigured(): boolean {
  return !!(
    process.env.SHIPSTATION_API_KEY &&
    process.env.SHIPSTATION_API_SECRET
  );
}

export function isRoadieConfigured(): boolean {
  return !!(process.env.ROADIE_API_KEY);
}

export function getConfiguredCarriers(): CarrierName[] {
  const carriers: CarrierName[] = [];
  if (isFedExConfigured()) carriers.push("fedex");
  if (isUPSConfigured()) carriers.push("ups");
  if (isShipStationConfigured()) carriers.push("shipstation");
  if (isRoadieConfigured()) carriers.push("roadie");
  return carriers;
}

export function getAvailableSources(): RateSource[] {
  const sources: RateSource[] = [];
  if (isFedExConfigured()) sources.push("fedex");
  if (isUPSConfigured()) sources.push("ups");
  if (isShipStationConfigured()) sources.push("shipstation");
  if (isRoadieConfigured()) sources.push("roadie");
  return sources;
}

// ── getRatesFromAll ────────────────────────────────────────────
// Fetches rates from requested sources in parallel.
// If no sources specified, uses all configured sources.
export async function getRatesFromAll(params: {
  fromPostalCode: string;
  fromState?: string;
  toPostalCode: string;
  toCity?: string;
  toState?: string;
  toCountry?: string;
  weight: { value: number; units: "pounds" | "ounces" };
  dimensions?: {
    length: number;
    width: number;
    height: number;
    units: "inches" | "centimeters";
  };
  residential?: boolean;
  sources?: RateSource[];
  packageCount?: number;
  fromAddress?: ShipAddress; // full address for Roadie estimates
  toAddress?: ShipAddress;   // full address for Roadie estimates
}): Promise<{ rates: CarrierRate[]; errors: { source: string; error: string }[] }> {
  const results: CarrierRate[] = [];
  const errors: { source: string; error: string }[] = [];
  const promises: Promise<void>[] = [];
  const requestedSources = params.sources || getAvailableSources();

  const weightLbs =
    params.weight.units === "ounces"
      ? params.weight.value / 16
      : params.weight.value;

  const pkgCount = params.packageCount || 1;
  const singlePkg = {
    weight: weightLbs,
    dimensions: params.dimensions
      ? {
          length: params.dimensions.length,
          width: params.dimensions.width,
          height: params.dimensions.height,
        }
      : undefined,
  };

  // Build N identical packages (each tire ships with its own label)
  const fedexPackages = Array.from({ length: pkgCount }, () => ({
    weight: { value: singlePkg.weight, units: "LB" as const },
    ...(singlePkg.dimensions && {
      dimensions: { ...singlePkg.dimensions, units: "IN" as const },
    }),
  }));

  // FedEx Direct
  if (requestedSources.includes("fedex") && isFedExConfigured()) {
    promises.push(
      fedex
        .getRates({
          shipper: {
            postalCode: params.fromPostalCode,
            stateCode: params.fromState,
          },
          recipient: {
            postalCode: params.toPostalCode,
            city: params.toCity,
            stateCode: params.toState,
            countryCode: params.toCountry || "US",
            residential: params.residential ?? true,
          },
          packages: fedexPackages,
        })
        .then((rates) => {
          for (const r of rates) {
            results.push({
              carrier: "fedex",
              source: "fedex",
              serviceCode: r.serviceType,
              serviceName: r.serviceName,
              totalCost: r.totalCharge,
              currency: r.currency,
              transitDays: r.transitDays,
            });
          }
        })
        .catch((e) => {
          console.error("FedEx rate error:", e);
          errors.push({ source: "fedex", error: e instanceof Error ? e.message : String(e) });
        })
    );
  }

  // UPS Direct
  if (requestedSources.includes("ups") && isUPSConfigured()) {
    promises.push(
      ups
        .getRates({
          shipper: {
            postalCode: params.fromPostalCode,
            stateCode: params.fromState,
          },
          recipient: {
            postalCode: params.toPostalCode,
            city: params.toCity,
            stateCode: params.toState,
            countryCode: params.toCountry || "US",
            residential: params.residential ?? true,
          },
          packages: Array.from({ length: pkgCount }, () => ({
            weight: { value: singlePkg.weight, units: "LBS" as const },
            ...(singlePkg.dimensions && {
              dimensions: { ...singlePkg.dimensions, units: "IN" as const },
            }),
          })),
        })
        .then((rates) => {
          for (const r of rates) {
            results.push({
              carrier: "ups",
              source: "ups",
              serviceCode: r.serviceCode,
              serviceName: r.serviceName,
              totalCost: r.totalCharge,
              currency: r.currency,
              transitDays: r.transitDays,
            });
          }
        })
        .catch((e) => {
          console.error("UPS rate error:", e);
          errors.push({ source: "ups", error: e instanceof Error ? e.message : String(e) });
        })
    );
  }

  // ShipStation (all carriers configured in their account)
  if (requestedSources.includes("shipstation") && isShipStationConfigured()) {
    promises.push(
      (async () => {
        try {
          const carriers = await shipstation.listCarriers();
          const carrierCodes = carriers.map((c) => c.code);
          // ShipStation rates are per-package; multiply cost by pkgCount
          const baseParams = {
            fromPostalCode: params.fromPostalCode,
            toPostalCode: params.toPostalCode,
            toCity: params.toCity || "",
            toState: params.toState || "",
            toCountry: params.toCountry || "US",
            weight: {
              value: weightLbs,
              units: "pounds" as const,
            },
            dimensions: singlePkg.dimensions
              ? { ...singlePkg.dimensions, units: "inches" as const }
              : undefined,
            residential: params.residential ?? true,
          };
          const rateResults = await Promise.allSettled(
            carrierCodes.map((code) =>
              shipstation.getRates({ ...baseParams, carrierCode: code })
            )
          );
          for (let i = 0; i < rateResults.length; i++) {
            const result = rateResults[i];
            if (result.status === "fulfilled") {
              for (const r of result.value) {
                // Determine carrier name from carrierCode
                const code = carrierCodes[i].toLowerCase();
                const carrier: CarrierName = code.includes("fedex")
                  ? "fedex"
                  : "ups";
                results.push({
                  carrier,
                  source: "shipstation",
                  serviceCode: r.serviceCode,
                  serviceName: r.serviceName,
                  totalCost: (r.shipmentCost + r.otherCost) * pkgCount,
                  currency: "USD",
                  transitDays: null,
                });
              }
            }
          }
        } catch (e) {
          console.error("ShipStation rate error:", e);
          errors.push({ source: "shipstation", error: e instanceof Error ? e.message : String(e) });
        }
      })()
    );
  }

  // Roadie (same-day local delivery)
  // Requires full street addresses — silently skips if only postal codes
  if (requestedSources.includes("roadie") && isRoadieConfigured()) {
    const fromAddr = params.fromAddress;
    const toAddr = params.toAddress;

    if (fromAddr?.street1 && toAddr?.street1) {
      promises.push(
        roadie
          .getEstimate({
            pickupAddress: {
              name: fromAddr.name,
              street1: fromAddr.street1,
              street2: fromAddr.street2,
              city: fromAddr.city,
              state: fromAddr.state,
              zip: fromAddr.postalCode,
              phone: fromAddr.phone,
            },
            deliveryAddress: {
              name: toAddr.name,
              street1: toAddr.street1,
              street2: toAddr.street2,
              city: toAddr.city,
              state: toAddr.state,
              zip: toAddr.postalCode,
              phone: toAddr.phone,
            },
            items: [{
              description: "Tire shipment",
              weight: weightLbs,
              length: singlePkg.dimensions?.length || 30,
              width: singlePkg.dimensions?.width || 30,
              height: singlePkg.dimensions?.height || 12,
            }],
          })
          .then((estimates) => {
            for (const est of estimates) {
              const distLabel = est.distance > 0
                ? ` (~${Math.round(est.distance)} mi)`
                : "";
              results.push({
                carrier: "roadie",
                source: "roadie",
                serviceCode: "ROADIE_SAME_DAY",
                serviceName: `Roadie Same-Day${distLabel}`,
                totalCost: est.price * pkgCount,
                currency: est.currency,
                transitDays: 0,
                estimatedDistance: est.distance,
              });
            }
          })
          .catch((e) => {
            console.error("Roadie estimate error:", e);
            errors.push({ source: "roadie", error: e instanceof Error ? e.message : String(e) });
          })
      );
    }
    // If no full addresses available, silently skip (no error)
  }

  await Promise.allSettled(promises);

  // Sort by total cost ascending
  results.sort((a, b) => a.totalCost - b.totalCost);
  return { rates: results, errors };
}

// ── createShipment ─────────────────────────────────────────────
export async function createShipment(
  carrier: CarrierName,
  serviceCode: string,
  params: {
    shipFrom: ShipAddress;
    shipTo: ShipAddress;
    packages: PackageInfo[];
    roadieOptions?: {
      signatureRequired?: boolean;
      notificationsEnabled?: boolean;
    };
  }
): Promise<ShipmentResult> {
  const weightLbs = (p: PackageInfo) =>
    p.weight.units === "ounces" ? p.weight.value / 16 : p.weight.value;

  if (carrier === "fedex") {
    return fedex.createShipment({
      shipper: {
        contact: {
          personName: params.shipFrom.name,
          phoneNumber: params.shipFrom.phone,
          companyName: params.shipFrom.company,
        },
        address: {
          streetLines: [
            params.shipFrom.street1,
            params.shipFrom.street2,
          ].filter(Boolean) as string[],
          city: params.shipFrom.city,
          stateOrProvinceCode: params.shipFrom.state,
          postalCode: params.shipFrom.postalCode,
          countryCode: params.shipFrom.country || "US",
        },
      },
      recipient: {
        contact: {
          personName: params.shipTo.name,
          phoneNumber: params.shipTo.phone,
          companyName: params.shipTo.company,
        },
        address: {
          streetLines: [
            params.shipTo.street1,
            params.shipTo.street2,
          ].filter(Boolean) as string[],
          city: params.shipTo.city,
          stateOrProvinceCode: params.shipTo.state,
          postalCode: params.shipTo.postalCode,
          countryCode: params.shipTo.country || "US",
          residential: true,
        },
      },
      serviceType: serviceCode,
      packages: params.packages.map((p) => ({
        weight: { value: weightLbs(p), units: "LB" as const },
        ...(p.dimensions && {
          dimensions: {
            length: p.dimensions.length,
            width: p.dimensions.width,
            height: p.dimensions.height,
            units: "IN" as const,
          },
        }),
      })),
    });
  }

  if (carrier === "ups") {
    return ups.createShipment({
      shipper: {
        name: params.shipFrom.name,
        phone: params.shipFrom.phone,
        company: params.shipFrom.company,
        address: {
          AddressLine: [
            params.shipFrom.street1,
            params.shipFrom.street2,
          ].filter(Boolean) as string[],
          City: params.shipFrom.city,
          StateProvinceCode: params.shipFrom.state,
          PostalCode: params.shipFrom.postalCode,
          CountryCode: params.shipFrom.country || "US",
        },
      },
      recipient: {
        name: params.shipTo.name,
        phone: params.shipTo.phone,
        company: params.shipTo.company,
        address: {
          AddressLine: [
            params.shipTo.street1,
            params.shipTo.street2,
          ].filter(Boolean) as string[],
          City: params.shipTo.city,
          StateProvinceCode: params.shipTo.state,
          PostalCode: params.shipTo.postalCode,
          CountryCode: params.shipTo.country || "US",
        },
      },
      serviceCode,
      packages: params.packages.map((p) => ({
        weight: { value: weightLbs(p), units: "LBS" as const },
        ...(p.dimensions && {
          dimensions: {
            length: p.dimensions.length,
            width: p.dimensions.width,
            height: p.dimensions.height,
            units: "IN" as const,
          },
        }),
      })),
    });
  }

  if (carrier === "shipstation") {
    const pkg = params.packages[0];
    const carriers = await shipstation.listCarriers();
    // Find the carrier code that matches the service code prefix, or use the first carrier
    const matchedCarrier = carriers.find((c) => serviceCode.toLowerCase().startsWith(c.code.toLowerCase()));
    const carrierCode = matchedCarrier?.code || carriers[0]?.code;
    if (!carrierCode) throw new Error("No carriers configured in ShipStation");

    const result = await shipstation.createLabel({
      carrierCode,
      serviceCode,
      packageCode: "package",
      shipDate: new Date().toISOString().split("T")[0],
      weight: { value: weightLbs(pkg), units: "pounds" },
      dimensions: pkg.dimensions
        ? { ...pkg.dimensions, units: pkg.dimensions.units || "inches" }
        : undefined,
      shipFrom: {
        name: params.shipFrom.name,
        company: params.shipFrom.company,
        street1: params.shipFrom.street1,
        street2: params.shipFrom.street2,
        city: params.shipFrom.city,
        state: params.shipFrom.state,
        postalCode: params.shipFrom.postalCode,
        country: params.shipFrom.country || "US",
        phone: params.shipFrom.phone,
      },
      shipTo: {
        name: params.shipTo.name,
        company: params.shipTo.company,
        street1: params.shipTo.street1,
        street2: params.shipTo.street2,
        city: params.shipTo.city,
        state: params.shipTo.state,
        postalCode: params.shipTo.postalCode,
        country: params.shipTo.country || "US",
        phone: params.shipTo.phone,
      },
      testLabel: false,
    });

    return {
      trackingNumber: result.trackingNumber,
      labelData: result.labelData,
      shipmentId: String(result.shipmentId),
      totalCharge: result.shipmentCost + result.insuranceCost,
      labelFormat: "pdf",
    };
  }

  if (carrier === "roadie") {
    const pkg = params.packages[0];
    const w = weightLbs(pkg);
    const result = await roadie.createShipment({
      referenceId: "", // Will be set by the API route with orderId
      pickupAddress: {
        name: params.shipFrom.name,
        street1: params.shipFrom.street1,
        street2: params.shipFrom.street2,
        city: params.shipFrom.city,
        state: params.shipFrom.state,
        zip: params.shipFrom.postalCode,
        phone: params.shipFrom.phone,
      },
      deliveryAddress: {
        name: params.shipTo.name,
        street1: params.shipTo.street1,
        street2: params.shipTo.street2,
        city: params.shipTo.city,
        state: params.shipTo.state,
        zip: params.shipTo.postalCode,
        phone: params.shipTo.phone,
      },
      items: [{
        description: "Tire shipment",
        weight: w,
        length: pkg.dimensions?.length || 30,
        width: pkg.dimensions?.width || 30,
        height: pkg.dimensions?.height || 12,
      }],
      signatureRequired: params.roadieOptions?.signatureRequired,
      notificationsEnabled: params.roadieOptions?.notificationsEnabled,
    });

    return {
      trackingNumber: result.trackingNumber,
      labelData: result.labelData,
      shipmentId: result.shipmentId,
      totalCharge: result.totalCharge,
      labelFormat: "png",
    };
  }

  throw new Error(`Unknown carrier: ${carrier}`);
}

// ── voidShipment ───────────────────────────────────────────────
export async function voidShipment(
  carrier: CarrierName,
  params: { trackingNumber: string; shipmentId: string }
): Promise<VoidResult> {
  if (carrier === "fedex") {
    return fedex.voidShipment({ trackingNumber: params.trackingNumber });
  }
  if (carrier === "ups") {
    return ups.voidShipment({ shipmentId: params.shipmentId });
  }
  if (carrier === "shipstation") {
    const result = await shipstation.voidLabel(Number(params.shipmentId));
    return { success: result.approved, message: result.message };
  }
  if (carrier === "roadie") {
    return roadie.voidShipment({ shipmentId: params.shipmentId });
  }
  throw new Error(`Unknown carrier: ${carrier}`);
}

// ── trackShipment ──────────────────────────────────────────────
export async function trackShipment(
  carrier: CarrierName,
  trackingNumber: string,
  shipmentId?: string
): Promise<TrackingInfo> {
  if (carrier === "fedex") {
    return fedex.trackShipment({ trackingNumber });
  }
  if (carrier === "ups") {
    return ups.trackShipment({ trackingNumber });
  }
  if (carrier === "roadie") {
    // Roadie uses shipment ID for tracking, not tracking number
    const id = shipmentId || trackingNumber;
    return roadie.trackShipment({ shipmentId: id });
  }
  throw new Error(`Unknown carrier: ${carrier}`);
}
