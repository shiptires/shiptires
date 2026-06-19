"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DEFAULT_WAREHOUSE_ID } from "@/lib/warehouses";

interface ShippingAddress {
  name?: string;
  street1?: string;
  line1?: string;
  address1?: string;
  street2?: string;
  line2?: string;
  address2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  postal_code?: string;
  zip?: string;
  country?: string;
}

interface RateOption {
  carrier: string;
  carrierCode: string;
  source: string;
  serviceCode: string;
  serviceName: string;
  shipmentCost: number;
  otherCost: number;
  totalCost: number;
  transitDays: number | null;
  estimatedDistance?: number;
}

interface WarehouseOption {
  id: string;
  distributor_name: string;
  location_name: string;
  postal_code: string;
  is_default: boolean;
  active: boolean;
}

interface TrackingInfo {
  status: string;
  statusDescription: string;
  estimatedDelivery: string | null;
  events: Array<{
    timestamp: string;
    description: string;
    city: string;
    stateOrProvince: string;
  }>;
  driver?: {
    name: string;
    phone: string;
    vehicle?: string;
  };
}

interface Props {
  orderId: string;
  orderStatus: string;
  shippingAddress: ShippingAddress | null;
  customerEmail: string;
  customerName: string;
  trackingNumber: string | null;
  carrier: string | null;
  serviceCode: string | null;
  shipmentCost: number | null;
  shipmentId: string | null;
  shippedAt: string | null;
  tireId?: number;
  orderSource?: string;
  externalOrderId?: string;
}

type View = "form" | "rates" | "shipped";

const CARRIER_LABELS: Record<string, string> = {
  fedex: "FedEx",
  ups: "UPS",
  roadie: "Roadie",
};

export default function OrderShipping({
  orderId,
  orderStatus,
  shippingAddress,
  customerEmail,
  customerName,
  trackingNumber,
  carrier,
  serviceCode,
  shipmentCost,
  shipmentId,
  shippedAt,
  tireId,
  orderSource,
  externalOrderId,
}: Props) {
  const router = useRouter();

  const hasShipped = !!trackingNumber;
  const initialView: View = hasShipped ? "shipped" : "form";

  const [view, setView] = useState<View>(initialView);
  const [warehouses, setWarehouses] = useState<WarehouseOption[]>([]);
  const [warehouseId, setWarehouseId] = useState(DEFAULT_WAREHOUSE_ID);
  const [weight, setWeight] = useState("25");
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [rates, setRates] = useState<RateOption[]>([]);
  const [selectedRate, setSelectedRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [labelData, setLabelData] = useState<string | null>(null);
  const [labelFormat, setLabelFormat] = useState<"pdf" | "png">("pdf");
  const [emailStatus, setEmailStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [tracking, setTracking] = useState<TrackingInfo | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [availableSources, setAvailableSources] = useState<string[]>([]);
  const [selectedSources, setSelectedSources] = useState<string[]>(["fedex"]);
  const [roadieSignature, setRoadieSignature] = useState(false);
  const [roadieNotifications, setRoadieNotifications] = useState(true);
  const [suggesting, setSuggesting] = useState(false);
  const [suggestion, setSuggestion] = useState<{ label: string; distance: number; stock: number } | null>(null);

  // Fetch available rate sources
  useEffect(() => {
    fetch("/api/admin/shipping/carriers")
      .then((r) => r.json())
      .then((d) => {
        if (d.sources?.length) {
          setAvailableSources(d.sources);
          const direct = d.sources.filter((s: string) => s !== "shipstation" && s !== "roadie");
          if (direct.length) setSelectedSources(direct);
          else setSelectedSources(d.sources);
        }
      })
      .catch(() => {});
  }, []);

  // Fetch warehouses from API
  useEffect(() => {
    fetch("/api/admin/warehouses")
      .then((r) => r.json())
      .then((d) => {
        if (d.warehouses?.length) {
          setWarehouses(d.warehouses.filter((w: WarehouseOption) => w.active));
          const defaultWh = d.warehouses.find((w: WarehouseOption) => w.is_default);
          if (defaultWh) setWarehouseId(defaultWh.id);
        }
      })
      .catch(() => {});
  }, []);

  // Auto-fetch tracking info when shipped
  useEffect(() => {
    if (hasShipped && carrier && trackingNumber) {
      setTrackingLoading(true);
      fetch("/api/admin/shipping/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          carrier,
          trackingNumber,
          ...(carrier === "roadie" && shipmentId && { shipmentId }),
        }),
      })
        .then((r) => r.json())
        .then((d) => {
          if (d.status) setTracking(d);
        })
        .catch(() => {})
        .finally(() => setTrackingLoading(false));
    }
  }, [hasShipped, carrier, trackingNumber, shipmentId]);

  if (!shippingAddress) {
    return <p className="text-sm text-gray-400 italic">No shipping address on file</p>;
  }

  const addrLine = [
    shippingAddress.street1 || shippingAddress.line1 || shippingAddress.address1,
    shippingAddress.street2 || shippingAddress.line2 || shippingAddress.address2,
  ]
    .filter(Boolean)
    .join(", ");
  const cityLine = [
    shippingAddress.city,
    shippingAddress.state,
    shippingAddress.postalCode || shippingAddress.postal_code || shippingAddress.zip,
  ]
    .filter(Boolean)
    .join(", ");

  const isRoadieRate = (rate: RateOption) => rate.carrier === "roadie" || rate.source === "roadie";

  async function handleSuggestWarehouse() {
    if (!tireId || !shippingAddress) return;
    const customerZip = shippingAddress.postalCode || shippingAddress.postal_code || shippingAddress.zip;
    if (!customerZip) return;

    setSuggesting(true);
    setSuggestion(null);
    try {
      const res = await fetch("/api/admin/warehouses/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerZip, tireId }),
      });
      const data = await res.json();
      if (data.warehouse) {
        setWarehouseId(data.warehouse.id);
        setSuggestion({
          label: data.warehouse.label || `${data.warehouse.city}, ${data.warehouse.state}`,
          distance: data.distance,
          stock: data.stock,
        });
      } else {
        setSuggestion(null);
        setError("No stocked warehouse found for this tire.");
      }
    } catch {
      setError("Failed to find nearest warehouse");
    } finally {
      setSuggesting(false);
    }
  }

  async function handleGetRates() {
    setLoading(true);
    setError("");
    try {
      const body: Record<string, unknown> = {
        orderId,
        warehouseId,
        weight: { value: parseFloat(weight), units: "pounds" },
        sources: selectedSources,
      };
      if (length && width && height) {
        body.dimensions = {
          length: parseFloat(length),
          width: parseFloat(width),
          height: parseFloat(height),
          units: "inches",
        };
      }
      const res = await fetch("/api/admin/shipping/rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to get rates");
      setRates(data.rates);
      setSelectedRate(null);
      setView("rates");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to get rates");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateLabel() {
    if (selectedRate === null) return;
    const rate = rates[selectedRate];
    setLoading(true);
    setError("");
    try {
      const body: Record<string, unknown> = {
        orderId,
        warehouseId,
        carrier: rate.source === "shipstation" ? "shipstation" : (rate.carrier || rate.carrierCode),
        serviceCode: rate.serviceCode,
        weight: { value: parseFloat(weight), units: "pounds" },
      };
      if (length && width && height) {
        body.dimensions = {
          length: parseFloat(length),
          width: parseFloat(width),
          height: parseFloat(height),
          units: "inches",
        };
      }
      // Roadie-specific options
      if (isRoadieRate(rate)) {
        body.signatureRequired = roadieSignature;
        body.notificationsEnabled = roadieNotifications;
      }
      const res = await fetch("/api/admin/shipping/label", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create label");

      setLabelData(data.labelData || null);
      setLabelFormat(data.labelFormat || "pdf");

      // Auto-send tracking email
      try {
        await fetch("/api/admin/shipping/email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId }),
        });
      } catch {
        // Non-critical — user can resend manually
      }

      // Push fulfillment to eBay if this is an eBay order
      if (orderSource === "ebay" && externalOrderId && data.trackingNumber) {
        fetch("/api/admin/ebay/orders/fulfill", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: externalOrderId,
            trackingNumber: data.trackingNumber,
            carrier: rate.carrier || rate.carrierCode,
          }),
        }).catch(() => {
          // Non-blocking — eBay fulfillment can be retried
        });
      }

      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create label");
    } finally {
      setLoading(false);
    }
  }

  function handleDownloadLabel() {
    const data = labelData;
    if (!data) return;
    const byteChars = atob(data);
    const byteArray = new Uint8Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) {
      byteArray[i] = byteChars.charCodeAt(i);
    }
    const mimeType = labelFormat === "png" ? "image/png" : "application/pdf";
    const ext = labelFormat === "png" ? "png" : "pdf";
    const blob = new Blob([byteArray], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `label-${orderId}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleSendEmail() {
    setEmailStatus("sending");
    try {
      const res = await fetch("/api/admin/shipping/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send email");
      }
      setEmailStatus("sent");
    } catch {
      setEmailStatus("error");
    }
  }

  async function handleVoid() {
    if (!confirm("Void this label? This will revert the order to Paid status.")) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/shipping/void", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, shipmentId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to void label");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to void label");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      {/* Customer address */}
      <div className="text-sm text-gray-700">
        <p className="font-medium">{customerName}</p>
        <p>{addrLine}</p>
        <p>{cityLine}</p>
        {customerEmail && <p className="text-gray-500">{customerEmail}</p>}
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{error}</div>
      )}

      {/* ── SHIPPED STATE ── */}
      {view === "shipped" && hasShipped && (
        <div className="space-y-2">
          <div className="text-sm space-y-1">
            <p><span className="text-gray-500">Tracking:</span> <span className="font-mono font-medium">{trackingNumber}</span></p>
            <p><span className="text-gray-500">Carrier:</span> {CARRIER_LABELS[carrier || ""] || carrier?.toUpperCase()}</p>
            {shipmentCost != null && (
              <p><span className="text-gray-500">Cost:</span> ${shipmentCost.toFixed(2)}</p>
            )}
            {shippedAt && (
              <p><span className="text-gray-500">Shipped:</span> {new Date(shippedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
            )}
          </div>

          {/* Tracking status */}
          {trackingLoading && (
            <p className="text-xs text-gray-400">Loading tracking info...</p>
          )}
          {tracking && (
            <div className="bg-gray-50 rounded p-3 text-sm space-y-1">
              <p className="font-medium text-gray-900">
                {tracking.statusDescription}
              </p>
              {tracking.estimatedDelivery && (
                <p className="text-gray-500 text-xs">
                  Est. delivery: {new Date(tracking.estimatedDelivery).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                </p>
              )}
              {/* Roadie driver info */}
              {tracking.driver && (
                <div className="text-xs text-gray-600 bg-green-50 rounded px-2 py-1.5 mt-1">
                  <p>Driver: {tracking.driver.name}</p>
                  {tracking.driver.phone && <p>Phone: {tracking.driver.phone}</p>}
                  {tracking.driver.vehicle && <p>Vehicle: {tracking.driver.vehicle}</p>}
                </div>
              )}
              {tracking.events.length > 0 && (
                <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                  {tracking.events.slice(0, 5).map((evt, i) => (
                    <p key={i} className="text-xs text-gray-500">
                      {evt.description}
                      {evt.city && ` — ${evt.city}, ${evt.stateOrProvince}`}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Roadie barcode label inline */}
          {carrier === "roadie" && labelData && labelFormat === "png" && (
            <div className="mt-2">
              <p className="text-xs text-gray-500 mb-1">Barcode Label:</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`data:image/png;base64,${labelData}`}
                alt="Roadie barcode label"
                className="max-w-xs border border-gray-200 rounded"
              />
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {labelData && (
              <button onClick={handleDownloadLabel} className="text-xs px-3 py-1.5 bg-gray-900 text-white rounded hover:bg-gray-700 transition-colors">
                Download {carrier === "roadie" ? "Barcode" : "Label"}
              </button>
            )}
            <button
              onClick={handleSendEmail}
              disabled={emailStatus === "sending"}
              className="text-xs px-3 py-1.5 bg-safety-orange text-white rounded hover:bg-orange-700 disabled:bg-gray-300 transition-colors"
            >
              {emailStatus === "sending" ? "Sending..." : emailStatus === "sent" ? "Sent" : "Send Tracking Email"}
            </button>
            <button
              onClick={handleVoid}
              disabled={loading}
              className="text-xs px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-300 transition-colors"
            >
              {carrier === "roadie" ? "Cancel Delivery" : "Void Label"}
            </button>
          </div>
        </div>
      )}

      {/* ── FORM STATE ── */}
      {view === "form" && !hasShipped && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-3">
            <label className="text-sm">
              <span className="text-gray-500 block mb-1">Warehouse</span>
              <select
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1.5 text-sm bg-white"
              >
                {warehouses.length > 0
                  ? warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.distributor_name} — {w.location_name}
                      </option>
                    ))
                  : (
                      <option value={DEFAULT_WAREHOUSE_ID}>Sacramento, CA</option>
                    )
                }
              </select>
            </label>
            {tireId && (
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleSuggestWarehouse}
                  disabled={suggesting}
                  className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 transition-colors whitespace-nowrap"
                >
                  {suggesting ? "Finding..." : "Suggest Best"}
                </button>
              </div>
            )}
            <label className="text-sm">
              <span className="text-gray-500 block mb-1">Weight (lbs)</span>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1.5 w-20 text-sm"
                min="0.1"
                step="0.1"
              />
            </label>
          </div>
          {suggestion && (
            <div className="bg-blue-50 border border-blue-200 rounded px-3 py-2 text-xs text-blue-700">
              Auto-selected: <span className="font-medium">{suggestion.label}</span>
              {" "}({suggestion.distance} mi away, {suggestion.stock} in stock)
            </div>
          )}
          <div className="flex flex-wrap gap-3">
            <label className="text-sm">
              <span className="text-gray-500 block mb-1">L (in)</span>
              <input
                type="number"
                value={length}
                onChange={(e) => setLength(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1.5 w-16 text-sm"
                min="0"
              />
            </label>
            <label className="text-sm">
              <span className="text-gray-500 block mb-1">W (in)</span>
              <input
                type="number"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1.5 w-16 text-sm"
                min="0"
              />
            </label>
            <label className="text-sm">
              <span className="text-gray-500 block mb-1">H (in)</span>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1.5 w-16 text-sm"
                min="0"
              />
            </label>
          </div>
          {availableSources.length > 1 && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500">Sources:</span>
              {availableSources.map((src) => (
                <label key={src} className="text-xs flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={selectedSources.includes(src)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedSources((prev) => [...prev, src]);
                      } else {
                        setSelectedSources((prev) => prev.filter((s) => s !== src));
                      }
                    }}
                    className="accent-safety-orange"
                  />
                  <span className="text-gray-600">
                    {src === "fedex" ? "FedEx Direct" : src === "ups" ? "UPS Direct" : src === "roadie" ? "Roadie" : "ShipStation"}
                  </span>
                </label>
              ))}
            </div>
          )}
          <button
            onClick={handleGetRates}
            disabled={loading || !weight || selectedSources.length === 0}
            className="text-sm px-4 py-2 bg-safety-orange text-white rounded hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Getting Rates..." : "Get Rates"}
          </button>
        </div>
      )}

      {/* ── RATES STATE ── */}
      {view === "rates" && (
        <div className="space-y-3">
          {rates.length === 0 ? (
            <p className="text-sm text-gray-400">No rates available for this shipment.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-gray-200 rounded">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="py-2 px-3 text-left font-medium text-gray-500"></th>
                    <th className="py-2 px-3 text-left font-medium text-gray-500">Service</th>
                    <th className="py-2 px-3 text-left font-medium text-gray-500">Carrier</th>
                    <th className="py-2 px-3 text-left font-medium text-gray-500">Source</th>
                    <th className="py-2 px-3 text-right font-medium text-gray-500">Transit</th>
                    <th className="py-2 px-3 text-right font-medium text-gray-500">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {rates.map((rate, i) => (
                    <tr
                      key={`${rate.source}-${rate.carrier}-${rate.serviceCode}`}
                      className={`border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${selectedRate === i ? "bg-safety-orange/10" : ""}`}
                      onClick={() => setSelectedRate(i)}
                    >
                      <td className="py-2 px-3">
                        <input
                          type="radio"
                          name="rate"
                          checked={selectedRate === i}
                          onChange={() => setSelectedRate(i)}
                          className="accent-safety-orange"
                        />
                      </td>
                      <td className="py-2 px-3">{rate.serviceName}</td>
                      <td className="py-2 px-3 text-gray-500">
                        {CARRIER_LABELS[rate.carrier || rate.carrierCode] || rate.carrierCode}
                      </td>
                      <td className="py-2 px-3">
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                          rate.source === "shipstation"
                            ? "bg-purple-100 text-purple-700"
                            : rate.source === "roadie"
                            ? "bg-green-100 text-green-700"
                            : "bg-blue-100 text-blue-700"
                        }`}>
                          {rate.source === "shipstation" ? "ShipStation" : rate.source === "roadie" ? "Roadie" : "Direct"}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right text-gray-500">
                        {isRoadieRate(rate)
                          ? "Same Day"
                          : rate.transitDays != null
                          ? `${rate.transitDays}d`
                          : "—"}
                      </td>
                      <td className="py-2 px-3 text-right font-medium">${rate.totalCost.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Roadie info box when selected */}
          {selectedRate !== null && isRoadieRate(rates[selectedRate]) && (
            <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm space-y-2">
              <p className="text-green-800">
                A local driver will pick up and deliver today. No shipping label needed — a barcode will be generated for driver verification.
              </p>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-1.5 text-xs text-green-700">
                  <input
                    type="checkbox"
                    checked={roadieSignature}
                    onChange={(e) => setRoadieSignature(e.target.checked)}
                    className="accent-green-600"
                  />
                  Require signature
                </label>
                <label className="flex items-center gap-1.5 text-xs text-green-700">
                  <input
                    type="checkbox"
                    checked={roadieNotifications}
                    onChange={(e) => setRoadieNotifications(e.target.checked)}
                    className="accent-green-600"
                  />
                  SMS notifications to customer
                </label>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => setView("form")}
              className="text-sm px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleCreateLabel}
              disabled={loading || selectedRate === null}
              className="text-sm px-4 py-2 bg-safety-orange text-white rounded hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {loading
                ? "Creating..."
                : selectedRate !== null && isRoadieRate(rates[selectedRate])
                ? "Schedule Delivery"
                : "Create Label"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
