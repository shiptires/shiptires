"use client";

import { useState, useEffect, useCallback } from "react";

interface RateResult {
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

interface TireSize {
  size: string;
  weight: number | null;
  diameterOverall: number | null;
  sectionWidth: number | null;
}

interface WarehouseOption {
  id: string;
  distributor_name: string;
  location_name: string;
  postal_code: string;
  is_default: boolean;
  active: boolean;
}

const CARRIER_LABELS: Record<string, string> = {
  fedex: "FedEx",
  ups: "UPS",
  shipstation: "ShipStation",
  roadie: "Roadie",
};

const SOURCE_LABELS: Record<string, string> = {
  fedex: "FedEx Direct",
  ups: "UPS Direct",
  shipstation: "ShipStation",
  roadie: "Roadie",
};

export default function QuoteCalculator() {
  // Tire selector state
  const [brands, setBrands] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [sizes, setSizes] = useState<TireSize[]>([]);
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [qty, setQty] = useState("4");
  const [tireLoading, setTireLoading] = useState(false);

  // Warehouse state
  const [warehouses, setWarehouses] = useState<WarehouseOption[]>([]);
  const [warehouseId, setWarehouseId] = useState("");
  const [customFromZip, setCustomFromZip] = useState("");

  // Shipping fields
  const [toZip, setToZip] = useState("");
  const [toCity, setToCity] = useState("");
  const [toState, setToState] = useState("");
  const [weight, setWeight] = useState("");
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [residential, setResidential] = useState(true);
  const [rates, setRates] = useState<RateResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [autoFilled, setAutoFilled] = useState(false);
  const [showAllServices, setShowAllServices] = useState(false);

  // Rate source toggles
  const [availableSources, setAvailableSources] = useState<string[]>([]);
  const [selectedSources, setSelectedSources] = useState<string[]>(["fedex"]);

  // Load available rate sources
  useEffect(() => {
    fetch("/api/admin/shipping/carriers")
      .then((r) => r.json())
      .then((d) => {
        if (d.sources?.length) {
          setAvailableSources(d.sources);
          // Default to first direct source (exclude shipstation and roadie)
          const direct = d.sources.filter((s: string) => s !== "shipstation" && s !== "roadie");
          if (direct.length) setSelectedSources(direct);
          else setSelectedSources(d.sources.filter((s: string) => s !== "roadie"));
        }
      })
      .catch(() => {});
  }, []);

  // Load warehouses on mount
  useEffect(() => {
    fetch("/api/admin/warehouses")
      .then((r) => r.json())
      .then((d) => {
        if (d.warehouses?.length) {
          const active = d.warehouses.filter((w: WarehouseOption) => w.active);
          setWarehouses(active);
          const defaultWh = active.find((w: WarehouseOption) => w.is_default);
          if (defaultWh) setWarehouseId(defaultWh.id);
          else if (active.length > 0) setWarehouseId(active[0].id);
        }
      })
      .catch(() => {});
  }, []);

  // Load brands on mount
  useEffect(() => {
    fetch("/api/admin/shipping/tire-lookup")
      .then((r) => r.json())
      .then((d) => setBrands(d.brands || []))
      .catch(() => {});
  }, []);

  // Load models when brand changes
  useEffect(() => {
    if (!selectedBrand) { setModels([]); return; }
    setSelectedModel("");
    setSelectedSize("");
    setSizes([]);
    setTireLoading(true);
    fetch(`/api/admin/shipping/tire-lookup?brand=${encodeURIComponent(selectedBrand)}`)
      .then((r) => r.json())
      .then((d) => setModels(d.models || []))
      .catch(() => {})
      .finally(() => setTireLoading(false));
  }, [selectedBrand]);

  // Load sizes when model changes
  useEffect(() => {
    if (!selectedBrand || !selectedModel) { setSizes([]); return; }
    setSelectedSize("");
    setTireLoading(true);
    fetch(`/api/admin/shipping/tire-lookup?brand=${encodeURIComponent(selectedBrand)}&model=${encodeURIComponent(selectedModel)}`)
      .then((r) => r.json())
      .then((d) => setSizes(d.sizes || []))
      .catch(() => {})
      .finally(() => setTireLoading(false));
  }, [selectedBrand, selectedModel]);

  // Auto-fill weight and dimensions when size is selected
  // Each tire ships as its own package with its own label
  const autoFillFromTire = useCallback((sizeStr: string) => {
    const tire = sizes.find((s) => s.size === sizeStr);
    if (!tire) return;

    // Per-tire weight (+ ~2 lbs packaging)
    if (tire.weight) {
      const perTireWeight = Math.ceil((tire.weight + 2) * 10) / 10;
      setWeight(String(perTireWeight));
    }

    // Per-tire dimensions
    if (tire.diameterOverall) {
      const boxSide = Math.ceil(tire.diameterOverall + 2);
      setLength(String(boxSide));
      setWidth(String(boxSide));
    }
    if (tire.sectionWidth) {
      const sectionInches = tire.sectionWidth / 25.4;
      const boxHeight = Math.ceil(sectionInches + 3);
      setHeight(String(boxHeight));
    }

    setAutoFilled(true);
  }, [sizes]);

  useEffect(() => {
    if (selectedSize) {
      autoFillFromTire(selectedSize);
    }
  }, [selectedSize, autoFillFromTire]);

  // Re-fill is no longer needed when qty changes since weight/dims are per-tire

  function getFromPostalCode(): string {
    if (warehouseId === "custom") return customFromZip;
    const wh = warehouses.find((w) => w.id === warehouseId);
    return wh?.postal_code || "95811";
  }

  async function handleGetRates(e: React.FormEvent) {
    e.preventDefault();
    if (!toZip || !weight) return;
    if (warehouseId === "custom" && !customFromZip) return;
    setLoading(true);
    setError("");
    setRates([]);

    try {
      const body: Record<string, unknown> = {
        fromPostalCode: getFromPostalCode(),
        toPostalCode: toZip,
        toCity: toCity || "",
        toState: toState || "",
        toCountry: "US",
        weight: { value: parseFloat(weight), units: "pounds" },
        packageCount: parseInt(qty) || 1,
        residential,
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

      const res = await fetch("/api/admin/shipping/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to get rates");
      setRates(data.rates || []);
      if (data.errors?.length) {
        const errMsgs = data.errors.map((e: { source: string; error: string }) =>
          `${e.source}: ${e.error}`
        ).join("; ");
        setError(errMsgs);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to get rates");
    } finally {
      setLoading(false);
    }
  }

  const GROUND_KEYWORDS = ["ground", "home delivery", "parcel select", "surepost", "smartpost", "economy", "freight", "same-day", "roadie"];
  const isGroundService = (name: string) =>
    GROUND_KEYWORDS.some((kw) => name.toLowerCase().includes(kw));

  const filteredRates = showAllServices
    ? rates
    : rates.filter((r) => isGroundService(r.serviceName));

  const selectedTireInfo = sizes.find((s) => s.size === selectedSize);

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="px-5 py-4 border-b border-gray-200">
        <h2 className="font-semibold text-gray-900">Quick Rate Calculator</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Select a tire to auto-fill weight and dimensions, or enter manually
        </p>
      </div>

      <form onSubmit={handleGetRates} className="p-5 space-y-5">
        {/* ── Tire Selector ── */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Tire Lookup
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <label className="text-sm">
              <span className="text-gray-500 block mb-1">Brand</span>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white"
              >
                <option value="">Select brand...</option>
                {brands.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </label>

            <label className="text-sm">
              <span className="text-gray-500 block mb-1">Model</span>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                disabled={!selectedBrand || models.length === 0}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white disabled:bg-gray-100 disabled:text-gray-400"
              >
                <option value="">{tireLoading ? "Loading..." : "Select model..."}</option>
                {models.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </label>

            <label className="text-sm">
              <span className="text-gray-500 block mb-1">Size</span>
              <select
                value={selectedSize}
                onChange={(e) => setSelectedSize(e.target.value)}
                disabled={!selectedModel || sizes.length === 0}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white disabled:bg-gray-100 disabled:text-gray-400"
              >
                <option value="">{tireLoading ? "Loading..." : "Select size..."}</option>
                {sizes.map((s) => (
                  <option key={s.size} value={s.size}>
                    {s.size}{s.weight ? ` (${s.weight} lbs)` : ""}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm">
              <span className="text-gray-500 block mb-1">Qty</span>
              <select
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white"
              >
                <option value="1">1 tire</option>
                <option value="2">2 tires</option>
                <option value="4">4 tires</option>
                <option value="5">5 tires (+ spare)</option>
                <option value="6">6 tires</option>
              </select>
            </label>
          </div>

          {autoFilled && selectedTireInfo && (
            <p className="text-xs text-green-700 bg-green-50 rounded px-3 py-1.5">
              Auto-filled: {selectedBrand} {selectedModel} {selectedSize}
              {selectedTireInfo.weight ? ` — ${selectedTireInfo.weight} lbs/tire` : ""}
              {selectedTireInfo.diameterOverall ? ` — ${selectedTireInfo.diameterOverall}" diameter` : ""}
              {` — ${qty} package${qty !== "1" ? "s" : ""} (1 tire per label)`}
            </p>
          )}
        </div>

        {/* ── Destination ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <label className="text-sm">
            <span className="text-gray-500 block mb-1">Ship From</span>
            <select
              value={warehouseId}
              onChange={(e) => { setWarehouseId(e.target.value); setCustomFromZip(""); }}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white"
            >
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.distributor_name} — {w.location_name}
                </option>
              ))}
              {warehouses.length === 0 && (
                <option value="">Sacramento, CA (default)</option>
              )}
              <option value="custom">Custom ZIP...</option>
            </select>
            {warehouseId === "custom" && (
              <input
                type="text"
                value={customFromZip}
                onChange={(e) => setCustomFromZip(e.target.value)}
                placeholder="e.g. 90210"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm mt-1"
                maxLength={10}
              />
            )}
          </label>

          <label className="text-sm">
            <span className="text-gray-500 block mb-1">
              Destination ZIP <span className="text-red-400">*</span>
            </span>
            <input
              type="text"
              value={toZip}
              onChange={(e) => setToZip(e.target.value)}
              placeholder="e.g. 10001"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              required
            />
          </label>

          <label className="text-sm">
            <span className="text-gray-500 block mb-1">City</span>
            <input
              type="text"
              value={toCity}
              onChange={(e) => setToCity(e.target.value)}
              placeholder="Optional"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            />
          </label>

          <label className="text-sm">
            <span className="text-gray-500 block mb-1">State</span>
            <input
              type="text"
              value={toState}
              onChange={(e) => setToState(e.target.value)}
              placeholder="e.g. NY"
              maxLength={2}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm uppercase"
            />
          </label>

          <label className="text-sm flex items-end pb-2 gap-2">
            <input
              type="checkbox"
              checked={residential}
              onChange={(e) => setResidential(e.target.checked)}
              className="accent-safety-orange"
            />
            <span className="text-gray-600">Residential</span>
          </label>
        </div>

        {/* ── Package Details ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <label className="text-sm">
            <span className="text-gray-500 block mb-1">
              Weight/pkg (lbs) <span className="text-red-400">*</span>
            </span>
            <input
              type="number"
              value={weight}
              onChange={(e) => { setWeight(e.target.value); setAutoFilled(false); }}
              min="0.1"
              step="0.1"
              className={`w-full border rounded px-3 py-2 text-sm ${autoFilled ? "border-green-400 bg-green-50" : "border-gray-300"}`}
              required
            />
          </label>

          <label className="text-sm">
            <span className="text-gray-500 block mb-1">L (in)</span>
            <input
              type="number"
              value={length}
              onChange={(e) => { setLength(e.target.value); setAutoFilled(false); }}
              min="0"
              className={`w-full border rounded px-3 py-2 text-sm ${autoFilled ? "border-green-400 bg-green-50" : "border-gray-300"}`}
            />
          </label>

          <label className="text-sm">
            <span className="text-gray-500 block mb-1">W (in)</span>
            <input
              type="number"
              value={width}
              onChange={(e) => { setWidth(e.target.value); setAutoFilled(false); }}
              min="0"
              className={`w-full border rounded px-3 py-2 text-sm ${autoFilled ? "border-green-400 bg-green-50" : "border-gray-300"}`}
            />
          </label>

          <label className="text-sm">
            <span className="text-gray-500 block mb-1">H (in)</span>
            <input
              type="number"
              value={height}
              onChange={(e) => { setHeight(e.target.value); setAutoFilled(false); }}
              min="0"
              className={`w-full border rounded px-3 py-2 text-sm ${autoFilled ? "border-green-400 bg-green-50" : "border-gray-300"}`}
            />
          </label>
        </div>

        {/* ── Rate Sources ── */}
        {availableSources.length > 1 && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">Rate sources:</span>
            {availableSources.map((src) => (
              <label key={src} className="text-sm flex items-center gap-1.5 relative group">
                <input
                  type="checkbox"
                  checked={selectedSources.includes(src)}
                  disabled={src === "roadie"}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedSources((prev) => [...prev, src]);
                    } else {
                      setSelectedSources((prev) => prev.filter((s) => s !== src));
                    }
                  }}
                  className="accent-safety-orange disabled:opacity-50"
                />
                <span className={`${src === "roadie" ? "text-gray-400" : "text-gray-700"}`}>
                  {SOURCE_LABELS[src] || src}
                </span>
                {src === "roadie" && (
                  <span className="invisible group-hover:visible absolute left-0 top-full mt-1 bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                    Requires full addresses — use order rates
                  </span>
                )}
              </label>
            ))}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !toZip || !weight || selectedSources.length === 0}
          className="px-5 py-2.5 bg-safety-orange text-white text-sm font-medium rounded hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Getting Rates..." : "Get Shipping Rates"}
        </button>
      </form>

      {error && (
        <div className="mx-5 mb-5 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {rates.length > 0 && (
        <div className="border-t border-gray-200">
          <div className="px-5 py-3 bg-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <p className="text-sm font-medium text-gray-700">
                {filteredRates.length} rate{filteredRates.length !== 1 ? "s" : ""} found
              </p>
              <button
                type="button"
                onClick={() => setShowAllServices(!showAllServices)}
                className="text-xs text-gray-500 hover:text-gray-700 underline"
              >
                {showAllServices ? `Ground only (${rates.filter((r) => isGroundService(r.serviceName)).length})` : `Show all (${rates.length})`}
              </button>
            </div>
            {selectedBrand && selectedModel && selectedSize && (
              <p className="text-xs text-gray-500">
                {selectedBrand} {selectedModel} {selectedSize} x{qty}
              </p>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2.5 px-5 font-medium text-gray-500">Service</th>
                  <th className="text-left py-2.5 px-5 font-medium text-gray-500">Carrier</th>
                  <th className="text-left py-2.5 px-5 font-medium text-gray-500">Source</th>
                  <th className="text-right py-2.5 px-5 font-medium text-gray-500">Transit</th>
                  <th className="text-right py-2.5 px-5 font-medium text-gray-500">Total</th>
                </tr>
              </thead>
              <tbody>
                {filteredRates.map((rate, i) => (
                  <tr
                    key={`${rate.source}-${rate.carrier}-${rate.serviceCode}`}
                    className={`border-b border-gray-100 hover:bg-gray-50 ${i === 0 ? "bg-green-50/50" : ""}`}
                  >
                    <td className="py-2.5 px-5 text-gray-900">
                      {rate.serviceName}
                      {i === 0 && <span className="ml-2 text-xs text-green-600 font-medium">Best</span>}
                    </td>
                    <td className="py-2.5 px-5 text-gray-500">
                      {CARRIER_LABELS[rate.carrier || rate.carrierCode] || rate.carrierCode}
                    </td>
                    <td className="py-2.5 px-5">
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
                    <td className="py-2.5 px-5 text-right text-gray-500">
                      {rate.source === "roadie"
                        ? "Same Day"
                        : rate.transitDays != null
                        ? `${rate.transitDays} day${rate.transitDays !== 1 ? "s" : ""}`
                        : "—"}
                    </td>
                    <td className="py-2.5 px-5 text-right font-semibold text-gray-900">${rate.totalCost.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
