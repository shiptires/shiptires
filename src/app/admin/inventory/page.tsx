"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const STRIPE_FEE = 0.06;   // BNPL worst-case (card is 3% → extra margin)
const MARGIN_THRESHOLD_LOW = 50;
const MARGIN_THRESHOLD_HIGH = 200;
const SITE_MARGIN_LOW = 10;    // cost ≤ $50
const SITE_MARGIN_MID = 15;    // cost $51-$200
const SITE_MARGIN_HIGH = 20;   // cost > $200
const SHIPPING_TIERS = [
  { maxWeight: 25, cost: 40 },
  { maxWeight: 50, cost: 55 },
  { maxWeight: 75, cost: 72 },
  { maxWeight: Infinity, cost: 99 },
];
const DEFAULT_SHIPPING = 55;

function getShipping(weightLbs: number | null | undefined): number {
  if (!weightLbs || weightLbs <= 0) return DEFAULT_SHIPPING;
  for (const tier of SHIPPING_TIERS) {
    if (weightLbs <= tier.maxWeight) return tier.cost;
  }
  return SHIPPING_TIERS[SHIPPING_TIERS.length - 1].cost;
}

function calcSitePrice(cost: number, shipping: number): number {
  const margin = cost <= MARGIN_THRESHOLD_LOW ? SITE_MARGIN_LOW
    : cost <= MARGIN_THRESHOLD_HIGH ? SITE_MARGIN_MID
    : SITE_MARGIN_HIGH;
  return Math.round(((cost + shipping + margin) / (1 - STRIPE_FEE)) * 100) / 100;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

interface Distributor {
  id: string;
  name: string;
  slug: string;
  default_shipping_cost: number;
  active: boolean;
}

interface InventoryItem {
  id: string;
  distributor_id: string;
  tire_id: number;
  cost: number;
  quantity: number;
  part_number: string | null;
  brand: string;
  model: string;
  size: string;
  manufacturer: string | null;
  description: string | null;
  fet: number;
  map_pricing: number;
  warehouse_quantities: Record<string, number> | null;
  location_costs: Record<string, number> | null;
  updated_at: string;
}

interface Stats {
  totalSKUs: number;
  totalUnits: number;
  brands: string[];
}

function toSlug(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default function InventoryPage() {
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [activeDistributor, setActiveDistributor] = useState<string>("all");
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [stats, setStats] = useState<Stats>({ totalSKUs: 0, totalUnits: 0, brands: [] });
  const [expandedStock, setExpandedStock] = useState<string | null>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);
  const PAGE_SIZE = 50;

  // Multi-file warehouse upload state
  const [showUpload, setShowUpload] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<Array<{ file: File; warehouseCode: string; rowCount: number | null }>>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ ok: boolean; message: string } | null>(null);

  // Load distributors on mount
  useEffect(() => {
    fetch("/api/admin/distributors")
      .then((r) => r.json())
      .then((d) => {
        const active = (d.distributors || []).filter((dist: Distributor) => dist.active);
        setDistributors(active);
        if (active.length === 1) {
          setActiveDistributor(active[0].id);
        }
      })
      .catch(() => {});
  }, []);

  const fetchInventory = useCallback(async (distributorId: string, offset: number, q: string, brand: string) => {
    setLoading(true);
    try {
      if (distributorId === "all") {
        const allItems: InventoryItem[] = [];
        let allTotal = 0;
        for (const dist of distributors) {
          const params = new URLSearchParams({ limit: "1000", offset: "0" });
          if (q) params.set("search", q);
          if (brand) params.set("brand", brand);
          const res = await fetch(`/api/admin/distributors/${dist.id}/inventory?${params}`);
          if (res.ok) {
            const data = await res.json();
            allItems.push(...(data.items || []));
            allTotal += data.total || 0;
          }
        }
        allItems.sort((a, b) => a.brand.localeCompare(b.brand) || a.model.localeCompare(b.model) || a.size.localeCompare(b.size));
        setTotal(allTotal);
        setInventory(allItems.slice(offset, offset + PAGE_SIZE));

        // Only compute brands from unfiltered results for the dropdown
        if (!brand) {
          const brands = [...new Set(allItems.map((i) => i.brand))].sort();
          const totalUnits = allItems.reduce((s, i) => s + i.quantity, 0);
          setStats({ totalSKUs: allTotal, totalUnits, brands });
        }
      } else {
        const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(offset) });
        if (q) params.set("search", q);
        if (brand) params.set("brand", brand);
        const res = await fetch(`/api/admin/distributors/${distributorId}/inventory?${params}`);
        if (!res.ok) throw new Error("Failed to load");
        const data = await res.json();
        setInventory(data.items || []);
        setTotal(data.total || 0);

        // Only fetch stats (brands list) when no brand filter is active — for the dropdown
        if (!brand) {
          const statsRes = await fetch(`/api/admin/distributors/${distributorId}`);
          if (statsRes.ok) {
            const statsData = await statsRes.json();
            const s = statsData.stats;
            if (s) {
              setStats({ totalSKUs: s.totalItems, totalUnits: s.totalQuantity, brands: (s.brands || []).sort() });
            }
          }
        }
      }
    } catch {
      setInventory([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [distributors]);

  // Fetch when distributor, page, or brand changes
  useEffect(() => {
    if (distributors.length > 0 || activeDistributor !== "all") {
      fetchInventory(activeDistributor, page, search, selectedBrand);
    }
  }, [activeDistributor, page, selectedBrand, fetchInventory, distributors.length]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSearch(q: string) {
    setSearch(q);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setPage(0);
      fetchInventory(activeDistributor, 0, q, selectedBrand);
    }, 300);
  }

  function handleTabChange(distributorId: string) {
    setActiveDistributor(distributorId);
    setPage(0);
    setSearch("");
    setSelectedBrand("");
    setExpandedStock(null);
  }

  function handleBrandChange(brand: string) {
    setSelectedBrand(brand);
    setPage(0);
  }

  function extractWarehouseCode(filename: string): string {
    const base = filename.replace(/\.csv$/i, "").trim();
    const match = base.match(/^ShipTires[_-]?(.+)$/i);
    if (match) return match[1].toUpperCase();
    if (/^[A-Za-z]{2,5}$/.test(base)) return base.toUpperCase();
    return base.replace(/[^a-zA-Z0-9]/g, "").toUpperCase() || "UNKNOWN";
  }

  function handleFilesDrop(fileList: FileList | null) {
    if (!fileList) return;
    const newFiles: Array<{ file: File; warehouseCode: string; rowCount: number | null }> = [];
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (!file.name.toLowerCase().endsWith(".csv")) continue;
      const warehouseCode = extractWarehouseCode(file.name);
      newFiles.push({ file, warehouseCode, rowCount: null });
      // Count rows asynchronously
      file.text().then((text) => {
        const lines = text.split("\n").filter((l) => l.trim()).length;
        setUploadFiles((prev) =>
          prev.map((f) => f.file === file ? { ...f, rowCount: Math.max(0, lines - 1) } : f)
        );
      });
    }
    setUploadFiles((prev) => [...prev, ...newFiles]);
    setUploadResult(null);
  }

  async function handleWarehouseUpload() {
    if (uploadFiles.length === 0 || activeDistributor === "all") return;
    setUploading(true);
    setUploadResult(null);
    try {
      const formData = new FormData();
      for (const { file, warehouseCode } of uploadFiles) {
        formData.append(warehouseCode, file);
      }
      const res = await fetch(
        `/api/admin/distributors/${activeDistributor}/inventory/warehouse-upload`,
        { method: "POST", body: formData }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setUploadResult({
        ok: true,
        message: `${data.matched} matched, ${data.unmatched} unmatched, ${data.zeroed} zeroed out of ${data.totalRows} total rows`,
      });
      setUploadFiles([]);
      // Refresh inventory
      fetchInventory(activeDistributor, 0, search, selectedBrand);
    } catch (e) {
      setUploadResult({ ok: false, message: e instanceof Error ? e.message : "Upload failed" });
    } finally {
      setUploading(false);
    }
  }

  function getItemShipping(item: InventoryItem): number {
    // Use weight-based shipping; admin doesn't have weight yet, use default
    return DEFAULT_SHIPPING;
  }

  function getDistributorName(distributorId: string): string {
    return distributors.find((d) => d.id === distributorId)?.name || "Unknown";
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
        {activeDistributor !== "all" && (
          <button
            onClick={() => setShowUpload(!showUpload)}
            className="text-sm px-3 py-1.5 bg-safety-orange text-white rounded hover:bg-orange-700 transition-colors"
          >
            {showUpload ? "Hide Upload" : "Upload Warehouse CSVs"}
          </button>
        )}
      </div>

      {/* Multi-File Warehouse Upload Panel */}
      {showUpload && activeDistributor !== "all" && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Upload Per-Warehouse CSVs</h3>
          <p className="text-xs text-gray-500 mb-3">
            Select multiple CSV files (e.g., ShipTiresAZ.csv, ShipTiresNH.csv). Warehouse codes are auto-detected from filenames.
          </p>
          <input
            type="file"
            multiple
            accept=".csv"
            onChange={(e) => handleFilesDrop(e.target.files)}
            className="text-sm text-gray-600 mb-3 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
          />
          {uploadFiles.length > 0 && (
            <div className="space-y-2 mb-3">
              <div className="grid grid-cols-3 gap-2">
                {uploadFiles.map((uf, i) => (
                  <div key={i} className="flex items-center justify-between bg-gray-50 rounded px-3 py-2 text-xs">
                    <div>
                      <span className="font-semibold text-gray-900">{uf.warehouseCode}</span>
                      <span className="text-gray-500 ml-1.5">{uf.file.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {uf.rowCount !== null && (
                        <span className="text-gray-400">{uf.rowCount.toLocaleString()} rows</span>
                      )}
                      <button
                        onClick={() => setUploadFiles((prev) => prev.filter((_, j) => j !== i))}
                        className="text-gray-400 hover:text-red-500"
                      >
                        &times;
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleWarehouseUpload}
                  disabled={uploading}
                  className="text-sm px-4 py-2 bg-safety-orange text-white rounded hover:bg-orange-700 disabled:bg-gray-300 transition-colors"
                >
                  {uploading ? "Processing..." : `Upload ${uploadFiles.length} File${uploadFiles.length !== 1 ? "s" : ""}`}
                </button>
                <button
                  onClick={() => { setUploadFiles([]); setUploadResult(null); }}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Clear
                </button>
              </div>
            </div>
          )}
          {uploadResult && (
            <div className={`text-xs rounded px-3 py-2 ${uploadResult.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
              {uploadResult.message}
            </div>
          )}
        </div>
      )}

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Total SKUs</p>
          <p className="text-2xl font-semibold text-gray-900">{stats.totalSKUs.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Total Units</p>
          <p className="text-2xl font-semibold text-gray-900">{stats.totalUnits.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Brands in Stock</p>
          <p className="text-2xl font-semibold text-gray-900">{stats.brands.length}</p>
        </div>
      </div>

      {/* Distributor Tabs */}
      <div className="flex items-center gap-1 mb-4 border-b border-gray-200">
        {distributors.map((dist) => (
          <button
            key={dist.id}
            onClick={() => handleTabChange(dist.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeDistributor === dist.id
                ? "border-safety-orange text-safety-orange"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            {dist.name}
          </button>
        ))}
        {distributors.length > 1 && (
          <button
            onClick={() => handleTabChange("all")}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeDistributor === "all"
                ? "border-safety-orange text-safety-orange"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            All Distributors
          </button>
        )}
      </div>

      {/* Filters Row */}
      <div className="flex items-center gap-3 mb-4">
        {/* Brand Dropdown */}
        <select
          value={selectedBrand}
          onChange={(e) => handleBrandChange(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded text-sm text-gray-900 bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 min-w-[200px]"
        >
          <option value="">All Brands ({stats.brands.length})</option>
          {stats.brands.map((brand) => (
            <option key={brand} value={brand}>{brand}</option>
          ))}
        </select>

        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search model, size, part number..."
          className="px-3 py-2 border border-gray-300 rounded text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 flex-1"
        />

        {(search || selectedBrand) && (
          <button
            onClick={() => {
              setSearch("");
              setSelectedBrand("");
              setPage(0);
              fetchInventory(activeDistributor, 0, "", "");
            }}
            className="text-sm text-gray-500 hover:text-gray-700 whitespace-nowrap"
          >
            Clear filters
          </button>
        )}

        <span className="text-sm text-gray-400 whitespace-nowrap">
          {total.toLocaleString()} items
        </span>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-400">Loading inventory...</div>
        ) : inventory.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">
            {search || selectedBrand ? "No results for current filters" : "No inventory found. Upload a CSV or add items from the Distributors page."}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {activeDistributor === "all" && (
                      <th className="py-2.5 px-3 text-left font-medium text-gray-500">Distributor</th>
                    )}
                    <th className="py-2.5 px-3 text-left font-medium text-gray-500">Brand</th>
                    <th className="py-2.5 px-3 text-left font-medium text-gray-500">Model</th>
                    <th className="py-2.5 px-3 text-left font-medium text-gray-500">Size</th>
                    <th className="py-2.5 px-3 text-left font-medium text-gray-500">SKU / Part#</th>
                    <th className="py-2.5 px-3 text-left font-medium text-gray-500 max-w-[200px]">Description</th>
                    <th className="py-2.5 px-3 text-right font-medium text-gray-500">Cost</th>
                    <th className="py-2.5 px-3 text-right font-medium text-gray-500">FET</th>
                    <th className="py-2.5 px-3 text-right font-medium text-gray-500">MAP</th>
                    <th className="py-2.5 px-3 text-right font-medium text-gray-500">Site Price</th>
                    <th className="py-2.5 px-3 text-right font-medium text-gray-500">Qty</th>
                    <th className="py-2.5 px-3 text-center font-medium text-gray-500">Warehouse</th>
                    <th className="py-2.5 px-3 text-center font-medium text-gray-500">View</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map((item) => (
                    <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                      {activeDistributor === "all" && (
                        <td className="py-2.5 px-3 text-xs text-gray-500">{getDistributorName(item.distributor_id)}</td>
                      )}
                      <td className="py-2.5 px-3 font-medium text-gray-900 text-xs">{item.brand}</td>
                      <td className="py-2.5 px-3 text-gray-700 text-xs">{item.model || <span className="text-gray-300">—</span>}</td>
                      <td className="py-2.5 px-3 text-gray-900 font-mono text-xs">{item.size}</td>
                      <td className="py-2.5 px-3 text-gray-500 font-mono text-xs">{item.part_number || "—"}</td>
                      <td className="py-2.5 px-3 text-gray-600 text-xs max-w-[200px] truncate" title={item.description || ""}>
                        {item.description || <span className="text-gray-300">—</span>}
                      </td>
                      <td className="py-2.5 px-3 text-right text-gray-700 text-xs">{formatCurrency(item.cost)}</td>
                      <td className="py-2.5 px-3 text-right text-gray-500 text-xs">
                        {item.fet > 0 ? formatCurrency(item.fet) : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="py-2.5 px-3 text-right text-gray-500 text-xs">
                        {item.map_pricing > 0 ? formatCurrency(item.map_pricing) : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium text-gray-900 text-xs">
                        {formatCurrency(calcSitePrice(item.cost, getItemShipping(item)))}
                      </td>
                      <td className="py-2.5 px-3 text-right text-gray-900 text-xs font-medium">{item.quantity}</td>
                      <td className="py-2.5 px-3 text-center text-xs relative">
                        {item.warehouse_quantities && Object.keys(item.warehouse_quantities).filter((k) => (item.warehouse_quantities as Record<string, number>)[k] > 0).length > 0 ? (
                          <button
                            onClick={() => setExpandedStock(expandedStock === item.id ? null : item.id)}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                            title="View warehouse breakdown"
                          >
                            {Object.values(item.warehouse_quantities).filter((q) => q > 0).length} loc
                          </button>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                        {expandedStock === item.id && item.warehouse_quantities && (() => {
                          const lc = item.location_costs || {};
                          const hasLocationCosts = Object.keys(lc).length > 0;
                          const stockedEntries = Object.entries(item.warehouse_quantities)
                            .filter(([, qty]) => qty > 0)
                            .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }));
                          const costValues = Object.values(lc).filter((c) => c > 0);
                          const bestCost = costValues.length > 0 ? Math.min(...costValues) : null;
                          const bestCodes = bestCost != null
                            ? Object.entries(lc).filter(([, c]) => c === bestCost).map(([code]) => code)
                            : [];
                          return (
                            <div className="absolute z-10 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-left text-xs text-gray-700 max-h-64 overflow-y-auto min-w-[220px]">
                              <p className="font-semibold text-gray-900 mb-1.5 border-b border-gray-100 pb-1">
                                {hasLocationCosts ? "Warehouse Stock & Pricing" : "Warehouse Stock"}
                              </p>
                              {stockedEntries.map(([code, qty]) => (
                                <div key={code} className="flex justify-between py-0.5 px-1 gap-4">
                                  <span className="text-gray-600">{code}</span>
                                  <div className="flex gap-3">
                                    <span className="text-gray-900">{qty} units</span>
                                    {hasLocationCosts && lc[code] != null && (
                                      <span className={`font-medium ${lc[code] === bestCost ? "text-green-600" : "text-gray-500"}`}>
                                        {formatCurrency(lc[code])}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                              <div className="flex justify-between py-0.5 px-1 mt-1 border-t border-gray-100 pt-1 font-semibold">
                                <span>Total</span>
                                <span>{Object.values(item.warehouse_quantities).reduce((s, q) => s + q, 0)} units</span>
                              </div>
                              {bestCost != null && (
                                <div className="mt-1 pt-1 border-t border-gray-100 text-green-700 font-medium">
                                  Best: {formatCurrency(bestCost)} ({bestCodes.join(", ")})
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </td>
                      <td className="py-2.5 px-3 text-center text-xs">
                        {item.brand && item.model ? (
                          <a
                            href={`/tires/${toSlug(item.brand)}/${toSlug(item.model)}/${item.tire_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            View
                          </a>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination with page numbers */}
            {total > PAGE_SIZE && (() => {
              const currentPage = Math.floor(page / PAGE_SIZE) + 1;
              const totalPages = Math.ceil(total / PAGE_SIZE);
              // Show up to 7 page buttons around current page
              const startPage = Math.max(1, currentPage - 3);
              const endPage = Math.min(totalPages, startPage + 6);

              return (
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
                  <p className="text-xs text-gray-500">
                    Page {currentPage} of {totalPages} ({total.toLocaleString()} items)
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPage(0)}
                      disabled={currentPage === 1}
                      className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                    >
                      First
                    </button>
                    <button
                      onClick={() => setPage(Math.max(0, page - PAGE_SIZE))}
                      disabled={currentPage === 1}
                      className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                    >
                      Prev
                    </button>
                    {startPage > 1 && <span className="text-xs text-gray-400 px-1">...</span>}
                    {Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i).map((p) => (
                      <button
                        key={p}
                        onClick={() => setPage((p - 1) * PAGE_SIZE)}
                        className={`px-2.5 py-1 text-xs rounded border ${
                          p === currentPage
                            ? "bg-safety-orange text-white border-safety-orange"
                            : "bg-white border-gray-300 hover:bg-gray-50 text-gray-700"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                    {endPage < totalPages && <span className="text-xs text-gray-400 px-1">...</span>}
                    <button
                      onClick={() => setPage(page + PAGE_SIZE)}
                      disabled={currentPage === totalPages}
                      className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                    <button
                      onClick={() => setPage((totalPages - 1) * PAGE_SIZE)}
                      disabled={currentPage === totalPages}
                      className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                    >
                      Last
                    </button>
                  </div>
                </div>
              );
            })()}
          </>
        )}
      </div>
    </div>
  );
}
