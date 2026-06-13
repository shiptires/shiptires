"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { WAREHOUSES, DEFAULT_WAREHOUSE_ID } from "@/lib/warehouses";

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
  carrierCode: string;
  serviceCode: string;
  serviceName: string;
  shipmentCost: number;
  otherCost: number;
  totalCost: number;
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
}

type View = "form" | "rates" | "shipped";

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
}: Props) {
  const router = useRouter();

  const hasShipped = !!trackingNumber;
  const initialView: View = hasShipped ? "shipped" : "form";

  const [view, setView] = useState<View>(initialView);
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
  const [emailStatus, setEmailStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

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

  async function handleGetRates() {
    setLoading(true);
    setError("");
    try {
      const body: Record<string, unknown> = {
        orderId,
        warehouseId,
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
        carrierCode: rate.carrierCode,
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
      const res = await fetch("/api/admin/shipping/label", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create label");

      setLabelData(data.labelData || null);

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
    const blob = new Blob([byteArray], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `label-${orderId}.pdf`;
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
            <p><span className="text-gray-500">Carrier:</span> {carrier?.toUpperCase()}</p>
            {shipmentCost != null && (
              <p><span className="text-gray-500">Cost:</span> ${shipmentCost.toFixed(2)}</p>
            )}
            {shippedAt && (
              <p><span className="text-gray-500">Shipped:</span> {new Date(shippedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {labelData && (
              <button onClick={handleDownloadLabel} className="text-xs px-3 py-1.5 bg-gray-900 text-white rounded hover:bg-gray-700 transition-colors">
                Download Label
              </button>
            )}
            <button
              onClick={handleSendEmail}
              disabled={emailStatus === "sending"}
              className="text-xs px-3 py-1.5 bg-safety-orange text-white rounded hover:bg-orange-700 disabled:bg-gray-300 transition-colors"
            >
              {emailStatus === "sending" ? "Sending..." : emailStatus === "sent" ? "Sent ✓" : "Send Tracking Email"}
            </button>
            <button
              onClick={handleVoid}
              disabled={loading}
              className="text-xs px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-300 transition-colors"
            >
              Void Label
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
                {WAREHOUSES.map((w) => (
                  <option key={w.id} value={w.id}>{w.label}</option>
                ))}
              </select>
            </label>
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
          <button
            onClick={handleGetRates}
            disabled={loading || !weight}
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
                    <th className="py-2 px-3 text-right font-medium text-gray-500">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {rates.map((rate, i) => (
                    <tr
                      key={`${rate.carrierCode}-${rate.serviceCode}`}
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
                      <td className="py-2 px-3 text-gray-500">{rate.carrierCode}</td>
                      <td className="py-2 px-3 text-right font-medium">${rate.totalCost.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
              {loading ? "Creating Label..." : "Create Label"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
