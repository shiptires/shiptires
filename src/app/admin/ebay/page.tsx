"use client";

import { useState, useEffect, useCallback } from "react";

const BRANDS = [
  "ADVANTA", "BFGOODRICH", "BRIDGESTONE", "CONTINENTAL", "COOPER",
  "DUNLOP", "FALKEN", "FIRESTONE", "GENERAL", "GOODYEAR",
  "HOOSIER", "KENDA", "KUMHO", "LAUFENN",
  "MAXXIS", "MICHELIN", "MICKEY THOMPSON", "NANKANG", "NEXEN",
  "NITTO", "NOKIAN", "PIRELLI", "POWER KING", "RADAR",
  "RANGE FINDER", "RIKEN", "SUMITOMO", "TOYO", "UNIROYAL",
  "VITOUR", "VOGUE", "VREDESTEIN", "YOKOHAMA",
];

const SEASONS = ["All-Season", "Summer", "Winter", "All-Weather"];
const TERRAINS = ["Highway", "All-Terrain (A/T)", "Mud-Terrain (M/T)", "Rugged Terrain"];

interface FilterModel {
  name: string;
  count: number;
  season: string | null;
  terrain: string | null;
}

interface FilterSize {
  width: string;
  aspectRatio: string;
  rimSize: string;
  count: number;
}

interface SyncStatus {
  configured: boolean;
  policiesConfigured: boolean;
  authenticated: boolean;
  inventoryCount: number;
  error: string | null;
}

interface SyncResult {
  synced: number;
  skipped: number;
  revised: number;
  duplicatesInBatch: number;
  errors: Array<{ sku: string; error: string }>;
  total: number;
  existingOnEbay: number;
  existingSkuCount: number;
  dryRun: boolean;
  debug?: {
    ebayTitles: string[];
    ebaySkus: string[];
    generatedTitles: string[];
    generatedSkus: string[];
  };
}

interface EbayListing {
  itemId: string;
  sku: string;
  title: string;
  price: number;
  quantity: number;
  imageUrl: string;
}

type Tab = "sync" | "manage" | "distributor";

// ── Distributor pricing constants ──────────────────────────
// eBay FVF 13.25% on (price + shipping + tax). Avg tax ~7.5%.
// Formula: price = (cost + shipping×1.1325 + $15) / 0.8376
// Targets flat $15 net profit per tire after all fees.
const DIST_SHIPPING_TIERS = [
  { maxWeight: 25, cost: 40 },    // under 25 lbs
  { maxWeight: 50, cost: 55 },    // 25-50 lbs
  { maxWeight: 75, cost: 72 },    // 50-75 lbs
  { maxWeight: Infinity, cost: 99 }, // over 75 lbs
];
const DIST_SHIPPING_DEFAULT = 55; // fallback when weight unknown
const EBAY_FVF = 0.1325;
const EBAY_FVF_TAX = 0.009938;   // FVF on avg sales tax (13.25% × 7.5%)
const EBAY_MISC = 0.02;          // payment processing + buffer
const EBAY_SHIPPING_FVF = 1.1325; // shipping × (1 + FVF)
const EBAY_PRICE_FACTOR = 1 - EBAY_FVF - EBAY_FVF_TAX - EBAY_MISC; // ~0.8376
const MARGIN_LOW = 10;            // cost ≤ $50
const MARGIN_HIGH = 15;           // cost > $50
const MARGIN_THRESHOLD = 50;

function getMargin(cost: number): number {
  return cost <= MARGIN_THRESHOLD ? MARGIN_LOW : MARGIN_HIGH;
}

function getShippingForWeight(weightLbs: number | null): number {
  if (!weightLbs || weightLbs <= 0) return DIST_SHIPPING_DEFAULT;
  for (const tier of DIST_SHIPPING_TIERS) {
    if (weightLbs <= tier.maxWeight) return tier.cost;
  }
  return DIST_SHIPPING_TIERS[DIST_SHIPPING_TIERS.length - 1].cost;
}

function calcDistPrice(cost: number, shipping = DIST_SHIPPING_DEFAULT): number {
  const margin = getMargin(cost);
  return Math.round(((cost + shipping * EBAY_SHIPPING_FVF + margin) / EBAY_PRICE_FACTOR) * 100) / 100;
}

interface DistributorItem {
  id: string;
  brand: string;
  model: string;
  size: string;
  quantity: number;
  cost: number;
  partNumber: string;
  ebayPrice: number;
  dbMatch: "pending" | "found" | "not_found";
  tireId?: number;
  status: "pending" | "uploaded" | "error";
  error?: string;
}

interface DistSyncResult {
  synced: number;
  revised: number;
  skipped: number;
  errors: Array<{ sku: string; error: string }>;
  total: number;
  dryRun: boolean;
  itemResults: Array<{
    brand: string;
    model: string;
    size: string;
    status: string;
    ebayPrice?: number;
    error?: string;
    tireId?: number;
    itemId?: string;
  }>;
}

export default function EbayPage() {
  const [activeTab, setActiveTab] = useState<Tab>("sync");

  // Sync tab state
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [filterWidth, setFilterWidth] = useState("");
  const [filterAspect, setFilterAspect] = useState("");
  const [filterRim, setFilterRim] = useState("");
  const [filterSeason, setFilterSeason] = useState("");
  const [filterTerrain, setFilterTerrain] = useState("");
  const [filterMinPrice, setFilterMinPrice] = useState("");
  const [filterMaxPrice, setFilterMaxPrice] = useState("");
  const [dryRun, setDryRun] = useState(true);
  const [limit, setLimit] = useState(500);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [brandModels, setBrandModels] = useState<FilterModel[]>([]);
  const [brandSizes, setBrandSizes] = useState<FilterSize[]>([]);
  const [filtersLoading, setFiltersLoading] = useState(false);

  // Manage tab state
  const [listings, setListings] = useState<EbayListing[]>([]);
  const [listingsLoading, setListingsLoading] = useState(false);
  const [listingsError, setListingsError] = useState<string | null>(null);
  const [listingsPage, setListingsPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEntries, setTotalEntries] = useState(0);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [editingPrice, setEditingPrice] = useState<string | null>(null);
  const [editPriceValue, setEditPriceValue] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Bulk price modal
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [bulkAdjustType, setBulkAdjustType] = useState<"percent" | "amount">("percent");
  const [bulkAdjustDirection, setBulkAdjustDirection] = useState<"increase" | "decrease">("decrease");
  const [bulkAdjustValue, setBulkAdjustValue] = useState("");

  // Confirmation modal
  const [confirmAction, setConfirmAction] = useState<{ type: string; message: string; onConfirm: () => void } | null>(null);

  // Bulk list state
  const [bulkListing, setBulkListing] = useState(false);
  const [bulkDryRun, setBulkDryRun] = useState(true);
  const [bulkResult, setBulkResult] = useState<{
    dryRun: boolean;
    totalInventory: number;
    uniqueTires: number;
    alreadyListed: number;
    listed: number;
    revised: number;
    skipped: number;
    noMatch: number;
    noImages: number;
    catalogMatched: number;
    errorCount: number;
    errors: Array<{ tireId: number; error: string }>;
  } | null>(null);
  const [bulkError, setBulkError] = useState<string | null>(null);

  // Distributor tab state
  const [distBrand, setDistBrand] = useState("BFGoodrich");
  const [distModel, setDistModel] = useState("");
  const [distSize, setDistSize] = useState("");
  const [distQty, setDistQty] = useState("4");
  const [distCost, setDistCost] = useState("");
  const [distPartNum, setDistPartNum] = useState("");
  const [distItems, setDistItems] = useState<DistributorItem[]>([]);
  const [distDryRun, setDistDryRun] = useState(true);
  const [distSyncing, setDistSyncing] = useState(false);
  const [distResult, setDistResult] = useState<DistSyncResult | null>(null);
  const [distError, setDistError] = useState<string | null>(null);
  const [distChecking, setDistChecking] = useState(false);
  const [distDistributors, setDistDistributors] = useState<Array<{ id: string; name: string; default_shipping_cost: number }>>([]);
  const [distSelectedDistributor, setDistSelectedDistributor] = useState("");

  useEffect(() => {
    fetchStatus();
    // Fetch distributors for the distributor tab dropdown
    fetch("/api/admin/distributors")
      .then((r) => r.json())
      .then((data) => {
        const dists = data.distributors || [];
        setDistDistributors(dists);
        if (dists.length > 0) setDistSelectedDistributor(dists[0].id);
      })
      .catch(() => {});
  }, []);

  const fetchListings = useCallback(async (page = 1) => {
    setListingsLoading(true);
    setListingsError(null);
    try {
      const res = await fetch(`/api/admin/ebay/listings?page=${page}&limit=50`);
      if (!res.ok) throw new Error("Failed to load listings");
      const data = await res.json();
      setListings(data.items || []);
      setTotalPages(data.totalPages || 1);
      setTotalEntries(data.totalEntries || 0);
      setListingsPage(page);
      setSelectedItems(new Set());
    } catch (e) {
      setListingsError(e instanceof Error ? e.message : "Failed to load listings");
    } finally {
      setListingsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "manage") {
      fetchListings(1);
    }
  }, [activeTab, fetchListings]);

  async function fetchStatus() {
    setStatusLoading(true);
    try {
      const res = await fetch("/api/admin/ebay/status");
      if (!res.ok) throw new Error("Failed to load status");
      const data = await res.json();
      setStatus(data);
    } catch (e) {
      setStatus({
        configured: false,
        policiesConfigured: false,
        authenticated: false,
        inventoryCount: 0,
        error: e instanceof Error ? e.message : "Failed to load status",
      });
    } finally {
      setStatusLoading(false);
    }
  }

  // Fetch models/sizes when brand changes
  useEffect(() => {
    if (!selectedBrand) {
      setBrandModels([]);
      setBrandSizes([]);
      setSelectedModel("");
      return;
    }
    setFiltersLoading(true);
    setSelectedModel("");
    fetch(`/api/admin/ebay/filters?brand=${encodeURIComponent(selectedBrand)}`)
      .then((r) => r.json())
      .then((data) => {
        setBrandModels(data.models || []);
        setBrandSizes(data.sizes || []);
      })
      .catch(() => {
        setBrandModels([]);
        setBrandSizes([]);
      })
      .finally(() => setFiltersLoading(false));
  }, [selectedBrand]);

  // Derive unique widths, aspects, rims from brand sizes
  const availableWidths = [...new Set(brandSizes.map((s) => s.width))].sort((a, b) => Number(a) - Number(b));
  const availableAspects = [...new Set(brandSizes.filter((s) => !filterWidth || s.width === filterWidth).map((s) => s.aspectRatio))].sort((a, b) => Number(a) - Number(b));
  const availableRims = [...new Set(brandSizes.filter((s) => (!filterWidth || s.width === filterWidth) && (!filterAspect || s.aspectRatio === filterAspect)).map((s) => s.rimSize))].sort((a, b) => Number(a) - Number(b));

  async function startSync() {
    setSyncing(true);
    setSyncResult(null);
    setSyncError(null);

    try {
      const body: Record<string, unknown> = { dryRun, limit };

      // Brand → slug
      if (selectedBrand) {
        body.brand = selectedBrand.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      }
      if (selectedModel) body.model = selectedModel;
      if (filterWidth) body.width = filterWidth;
      if (filterAspect) body.aspectRatio = filterAspect;
      if (filterRim) body.rimSize = filterRim;
      if (filterSeason) body.season = filterSeason;
      if (filterTerrain) body.terrain = filterTerrain;
      if (filterMinPrice) body.minPrice = parseFloat(filterMinPrice);
      if (filterMaxPrice) body.maxPrice = parseFloat(filterMaxPrice);

      const res = await fetch("/api/admin/ebay/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Sync failed (${res.status})`);
      }

      const data: SyncResult = await res.json();
      setSyncResult(data);

      if (!dryRun) fetchStatus();
    } catch (e) {
      setSyncError(e instanceof Error ? e.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  }

  // ── Manage Listings Actions ──────────────────────────────────

  function toggleItemSelection(itemId: string) {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedItems.size === listings.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(listings.map((l) => l.itemId)));
    }
  }

  async function handleEndItem(itemId: string) {
    setConfirmAction({
      type: "end",
      message: "Are you sure you want to end this listing?",
      onConfirm: async () => {
        setConfirmAction(null);
        setActionLoading(true);
        setActionMessage(null);
        try {
          const res = await fetch("/api/admin/ebay/end", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ itemIds: [itemId] }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error);
          setActionMessage({ type: "success", text: `Ended 1 listing` });
          fetchListings(listingsPage);
        } catch (e) {
          setActionMessage({ type: "error", text: e instanceof Error ? e.message : "Failed to end listing" });
        } finally {
          setActionLoading(false);
        }
      },
    });
  }

  async function handleEndSelected() {
    const count = selectedItems.size;
    setConfirmAction({
      type: "end",
      message: `Are you sure you want to end ${count} listing${count > 1 ? "s" : ""}? This cannot be undone.`,
      onConfirm: async () => {
        setConfirmAction(null);
        setActionLoading(true);
        setActionMessage(null);
        try {
          const res = await fetch("/api/admin/ebay/end", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ itemIds: Array.from(selectedItems) }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error);
          const msg = data.errors?.length
            ? `Ended ${data.ended}, ${data.errors.length} failed`
            : `Ended ${data.ended} listing${data.ended > 1 ? "s" : ""}`;
          setActionMessage({ type: data.errors?.length ? "error" : "success", text: msg });
          fetchListings(listingsPage);
        } catch (e) {
          setActionMessage({ type: "error", text: e instanceof Error ? e.message : "Failed to end listings" });
        } finally {
          setActionLoading(false);
        }
      },
    });
  }

  async function handleEndAll() {
    setConfirmAction({
      type: "end",
      message: "Are you sure you want to END ALL active eBay listings? This will remove every listing from your store. This cannot be undone.",
      onConfirm: async () => {
        setConfirmAction(null);
        setActionLoading(true);
        setActionMessage({ type: "success", text: "Ending all listings... this may take a few minutes." });
        try {
          const res = await fetch("/api/admin/ebay/end", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ endAll: true }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error);
          const msg = data.errors?.length
            ? `Found ${data.totalFound}. Ended ${data.ended}, ${data.errors.length} failed.`
            : `Ended all ${data.ended} listing${data.ended !== 1 ? "s" : ""}.`;
          setActionMessage({ type: data.errors?.length ? "error" : "success", text: msg });
          setSelectedItems(new Set());
          fetchListings(1);
        } catch (e) {
          setActionMessage({ type: "error", text: e instanceof Error ? e.message : "Failed to end all listings" });
        } finally {
          setActionLoading(false);
        }
      },
    });
  }

  async function handleInlinePrice(itemId: string) {
    const newPrice = parseFloat(editPriceValue);
    if (isNaN(newPrice) || newPrice <= 0) {
      setEditingPrice(null);
      return;
    }
    setActionLoading(true);
    setActionMessage(null);
    try {
      const res = await fetch("/api/admin/ebay/price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemIds: [itemId], adjustType: "set", value: newPrice }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setActionMessage({ type: "success", text: `Price updated to $${newPrice.toFixed(2)}` });
      // Update local state
      setListings((prev) =>
        prev.map((l) => (l.itemId === itemId ? { ...l, price: newPrice } : l))
      );
    } catch (e) {
      setActionMessage({ type: "error", text: e instanceof Error ? e.message : "Failed to update price" });
    } finally {
      setActionLoading(false);
      setEditingPrice(null);
    }
  }

  async function handleBulkPriceAdjust() {
    const val = parseFloat(bulkAdjustValue);
    if (isNaN(val) || val <= 0) return;

    const adjustedValue = bulkAdjustDirection === "decrease" ? -val : val;
    const itemIds = Array.from(selectedItems);

    setShowPriceModal(false);
    setActionLoading(true);
    setActionMessage(null);
    try {
      const res = await fetch("/api/admin/ebay/price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemIds, adjustType: bulkAdjustType, value: adjustedValue }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const msg = data.errors?.length
        ? `Revised ${data.revised}, ${data.errors.length} failed`
        : `Revised ${data.revised} listing${data.revised > 1 ? "s" : ""}`;
      setActionMessage({ type: data.errors?.length ? "error" : "success", text: msg });
      fetchListings(listingsPage);
    } catch (e) {
      setActionMessage({ type: "error", text: e instanceof Error ? e.message : "Failed to adjust prices" });
    } finally {
      setActionLoading(false);
    }
  }

  async function startBulkList() {
    setBulkListing(true);
    setBulkResult(null);
    setBulkError(null);
    try {
      const res = await fetch("/api/admin/ebay/bulk-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dryRun: bulkDryRun }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Bulk list failed (${res.status})`);
      }
      const data = await res.json();
      setBulkResult(data);
      if (!bulkDryRun) fetchStatus();
    } catch (e) {
      setBulkError(e instanceof Error ? e.message : "Bulk list failed");
    } finally {
      setBulkListing(false);
    }
  }

  const totalValue = listings.reduce((sum, l) => sum + l.price, 0);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">eBay Integration</h1>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab("sync")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "sync"
              ? "border-safety-orange text-safety-orange"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Sync
        </button>
        <button
          onClick={() => setActiveTab("manage")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "manage"
              ? "border-safety-orange text-safety-orange"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Manage Listings
        </button>
        <button
          onClick={() => setActiveTab("distributor")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "distributor"
              ? "border-safety-orange text-safety-orange"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Distributor
        </button>
      </div>

      {/* ═══════════════ SYNC TAB ═══════════════ */}
      {activeTab === "sync" && (
        <>
          {/* Status card */}
          <div className="bg-white rounded-lg border border-gray-200 p-5 mb-6">
            <h2 className="font-semibold text-gray-900 mb-3">Connection Status</h2>
            {statusLoading ? (
              <p className="text-sm text-gray-400">Loading...</p>
            ) : status ? (
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${status.configured ? "bg-green-500" : "bg-red-500"}`} />
                  <span className="text-gray-700">API Credentials: {status.configured ? "Configured" : "Not configured"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${status.policiesConfigured ? "bg-green-500" : "bg-yellow-500"}`} />
                  <span className="text-gray-700">Business Policies: {status.policiesConfigured ? "Configured" : "Not configured"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${status.authenticated ? "bg-green-500" : "bg-red-500"}`} />
                  <span className="text-gray-700">Authentication: {status.authenticated ? "Connected" : "Not connected"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-gray-700">eBay Inventory Items: {status.inventoryCount.toLocaleString()}</span>
                </div>
                {status.error && (
                  <p className="text-red-600 mt-2">{status.error}</p>
                )}
              </div>
            ) : null}
          </div>

          {/* Bulk List All Inventory */}
          <div className="bg-white rounded-lg border-2 border-green-200 p-5 mb-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="font-semibold text-gray-900">List All Inventory on eBay</h2>
                <p className="text-xs text-gray-500 mt-1">
                  Lists every in-stock distributor item that matches a tire in the catalog. Uses distributor cost-based pricing with eBay fee markup.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={bulkDryRun}
                  onChange={(e) => setBulkDryRun(e.target.checked)}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                Dry Run
              </label>
              <button
                onClick={startBulkList}
                disabled={bulkListing}
                className={`px-6 py-2.5 rounded-lg text-sm font-semibold text-white ${
                  bulkListing
                    ? "bg-gray-400 cursor-not-allowed"
                    : bulkDryRun
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {bulkListing
                  ? "Processing..."
                  : bulkDryRun
                  ? "Preview All"
                  : "List All on eBay"}
              </button>
            </div>

            {bulkError && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                {bulkError}
              </div>
            )}

            {bulkResult && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="font-semibold text-gray-900 mb-2">
                  {bulkResult.dryRun ? "Preview Results" : "Listing Results"}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Total Inventory:</span>{" "}
                    <span className="font-medium">{bulkResult.totalInventory.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Unique Tires:</span>{" "}
                    <span className="font-medium">{bulkResult.uniqueTires.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-green-600 font-medium">
                      {bulkResult.dryRun ? "Would List" : "Listed"}: {bulkResult.listed}
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-600 font-medium">
                      Revised: {bulkResult.revised}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Already on eBay:</span>{" "}
                    <span className="font-medium">{bulkResult.alreadyListed}</span>
                  </div>
                  {bulkResult.catalogMatched > 0 && (
                  <div>
                    <span className="text-blue-600">Catalog Matched (by brand+size): {bulkResult.catalogMatched}</span>
                  </div>
                  )}
                  <div>
                    <span className="text-yellow-600">No Catalog Match: {bulkResult.noMatch}</span>
                  </div>
                  <div>
                    <span className="text-yellow-600">No Images: {bulkResult.noImages}</span>
                  </div>
                  <div>
                    <span className="text-red-600">Errors: {bulkResult.errorCount}</span>
                  </div>
                </div>

                {bulkResult.noMatch > 0 && (
                  <p className="mt-2 text-xs text-gray-500">
                    {bulkResult.noMatch} items have no matching tire in the catalog (no images/specs available). Add these tires to the catalog to list them.
                  </p>
                )}

                {bulkResult.errors.length > 0 && (
                  <div className="mt-3 max-h-32 overflow-y-auto text-xs text-red-600 space-y-1">
                    {bulkResult.errors.map((e, i) => (
                      <p key={i}>Tire {e.tireId}: {e.error}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sync controls */}
          <div className="bg-white rounded-lg border border-gray-200 p-5 mb-6">
            <h2 className="font-semibold text-gray-900 mb-4">Sync to eBay (Catalog)</h2>

            {/* Options row */}
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={dryRun}
                  onChange={(e) => setDryRun(e.target.checked)}
                  className="rounded border-gray-300 text-safety-orange focus:ring-safety-orange"
                />
                Dry Run
                <span className="text-xs text-gray-400">(preview only, no eBay changes)</span>
              </label>

              <label className="flex items-center gap-2 text-sm text-gray-700">
                Limit:
                <input
                  type="number"
                  value={limit}
                  onChange={(e) => setLimit(Math.max(1, parseInt(e.target.value) || 500))}
                  className="w-24 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-safety-orange focus:border-safety-orange"
                  min={1}
                  max={50000}
                />
              </label>
            </div>

            {/* Filters */}
            <div className="space-y-3 mb-4">
              {/* Row 1: Brand + Model */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Brand</label>
                  <select
                    value={selectedBrand}
                    onChange={(e) => setSelectedBrand(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-safety-orange focus:border-safety-orange"
                  >
                    <option value="">All Brands</option>
                    {BRANDS.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Model {filtersLoading && selectedBrand ? "(loading...)" : ""}
                  </label>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    disabled={!selectedBrand || brandModels.length === 0}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-safety-orange focus:border-safety-orange disabled:bg-gray-50 disabled:text-gray-400"
                  >
                    <option value="">All Models</option>
                    {brandModels.map((m) => (
                      <option key={m.name} value={m.name}>
                        {m.name} ({m.count})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Size filters */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Width</label>
                  <select
                    value={filterWidth}
                    onChange={(e) => { setFilterWidth(e.target.value); setFilterAspect(""); setFilterRim(""); }}
                    disabled={!selectedBrand}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-safety-orange focus:border-safety-orange disabled:bg-gray-50 disabled:text-gray-400"
                  >
                    <option value="">Any</option>
                    {availableWidths.map((w) => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Aspect Ratio</label>
                  <select
                    value={filterAspect}
                    onChange={(e) => { setFilterAspect(e.target.value); setFilterRim(""); }}
                    disabled={!selectedBrand}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-safety-orange focus:border-safety-orange disabled:bg-gray-50 disabled:text-gray-400"
                  >
                    <option value="">Any</option>
                    {availableAspects.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Rim Size</label>
                  <select
                    value={filterRim}
                    onChange={(e) => setFilterRim(e.target.value)}
                    disabled={!selectedBrand}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-safety-orange focus:border-safety-orange disabled:bg-gray-50 disabled:text-gray-400"
                  >
                    <option value="">Any</option>
                    {availableRims.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 3: Season, Terrain, Price Range */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Season</label>
                  <select
                    value={filterSeason}
                    onChange={(e) => setFilterSeason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-safety-orange focus:border-safety-orange"
                  >
                    <option value="">Any</option>
                    {SEASONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Terrain</label>
                  <select
                    value={filterTerrain}
                    onChange={(e) => setFilterTerrain(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-safety-orange focus:border-safety-orange"
                  >
                    <option value="">Any</option>
                    {TERRAINS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Min Price (MAP)</label>
                  <input
                    type="number"
                    value={filterMinPrice}
                    onChange={(e) => setFilterMinPrice(e.target.value)}
                    placeholder="$0"
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-safety-orange focus:border-safety-orange"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Max Price (MAP)</label>
                  <input
                    type="number"
                    value={filterMaxPrice}
                    onChange={(e) => setFilterMaxPrice(e.target.value)}
                    placeholder="$999"
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-safety-orange focus:border-safety-orange"
                  />
                </div>
              </div>
            </div>

            {/* Sync button */}
            <div className="flex items-center gap-3">
              <button
                onClick={startSync}
                disabled={syncing}
                className="px-4 py-2 bg-safety-orange text-white rounded font-medium text-sm hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {syncing ? "Syncing..." : dryRun ? "Preview Sync" : "Sync to eBay"}
              </button>
              {(selectedBrand || filterSeason || filterTerrain || filterMinPrice || filterMaxPrice) && (
                <button
                  onClick={() => {
                    setSelectedBrand("");
                    setSelectedModel("");
                    setFilterWidth("");
                    setFilterAspect("");
                    setFilterRim("");
                    setFilterSeason("");
                    setFilterTerrain("");
                    setFilterMinPrice("");
                    setFilterMaxPrice("");
                  }}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Clear all filters
                </button>
              )}
            </div>
          </div>

          {/* Sync results */}
          {syncError && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-5 py-4 text-sm text-red-700 mb-6">
              <p className="font-medium">Sync Error</p>
              <p className="mt-1 text-red-600">{syncError}</p>
            </div>
          )}

          {syncResult && (
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-900 mb-3">
                {syncResult.dryRun ? "Dry Run Results" : "Sync Results"}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500">Total in DB</p>
                  <p className="text-lg font-semibold text-gray-900">{syncResult.total.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Existing on eBay</p>
                  <p className="text-lg font-semibold text-gray-500">{(syncResult.existingOnEbay || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">{syncResult.dryRun ? "Would Sync" : "Synced (New)"}</p>
                  <p className="text-lg font-semibold text-green-600">{syncResult.synced.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Revised (Existing)</p>
                  <p className="text-lg font-semibold text-blue-600">{(syncResult.revised || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Duplicates Skipped</p>
                  <p className="text-lg font-semibold text-orange-500">{(syncResult.duplicatesInBatch || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Skipped (Other)</p>
                  <p className="text-lg font-semibold text-yellow-600">{syncResult.skipped.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Errors</p>
                  <p className="text-lg font-semibold text-red-600">{syncResult.errors.length}</p>
                </div>
              </div>

              {syncResult.errors.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Errors ({syncResult.errors.length})</h3>
                  <div className="max-h-60 overflow-y-auto border border-gray-200 rounded">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="text-left py-1.5 px-3 font-medium text-gray-500">SKU</th>
                          <th className="text-left py-1.5 px-3 font-medium text-gray-500">Error</th>
                        </tr>
                      </thead>
                      <tbody>
                        {syncResult.errors.map((err, i) => (
                          <tr key={i} className="border-b border-gray-100">
                            <td className="py-1.5 px-3 font-mono text-gray-700">{err.sku}</td>
                            <td className="py-1.5 px-3 text-red-600">{err.error}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {syncResult.debug && (
                <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded text-xs font-mono">
                  <h3 className="text-sm font-medium text-gray-700 mb-2 font-sans">Debug: Title/SKU Comparison</h3>
                  <p className="text-gray-500 mb-1 font-sans">SKUs in eBay map: {syncResult.existingSkuCount ?? "?"}</p>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    <div>
                      <p className="font-sans font-medium text-gray-600 mb-1">eBay Titles (from API):</p>
                      {(syncResult.debug.ebayTitles || []).map((t, i) => (
                        <p key={i} className="text-gray-700 truncate" title={t}>{t}</p>
                      ))}
                      {(syncResult.debug.ebayTitles || []).length === 0 && <p className="text-gray-400 italic">none</p>}
                      <p className="font-sans font-medium text-gray-600 mt-2 mb-1">eBay SKUs:</p>
                      {(syncResult.debug.ebaySkus || []).map((s, i) => (
                        <p key={i} className="text-gray-700">{s}</p>
                      ))}
                      {(syncResult.debug.ebaySkus || []).length === 0 && <p className="text-gray-400 italic">none</p>}
                    </div>
                    <div>
                      <p className="font-sans font-medium text-gray-600 mb-1">Generated Titles (from DB):</p>
                      {(syncResult.debug.generatedTitles || []).map((t, i) => (
                        <p key={i} className="text-gray-700 truncate" title={t}>{t}</p>
                      ))}
                      {(syncResult.debug.generatedTitles || []).length === 0 && <p className="text-gray-400 italic">none</p>}
                      <p className="font-sans font-medium text-gray-600 mt-2 mb-1">Generated SKUs:</p>
                      {(syncResult.debug.generatedSkus || []).map((s, i) => (
                        <p key={i} className="text-gray-700">{s}</p>
                      ))}
                      {(syncResult.debug.generatedSkus || []).length === 0 && <p className="text-gray-400 italic">none</p>}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ═══════════════ MANAGE LISTINGS TAB ═══════════════ */}
      {activeTab === "manage" && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-xs text-gray-500">Active Listings</p>
              <p className="text-2xl font-semibold text-gray-900">{totalEntries.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-xs text-gray-500">Total Value (this page)</p>
              <p className="text-2xl font-semibold text-gray-900">${totalValue.toFixed(2)}</p>
            </div>
          </div>

          {/* Action message */}
          {actionMessage && (
            <div
              className={`rounded-lg px-4 py-3 text-sm mb-4 ${
                actionMessage.type === "success"
                  ? "bg-green-50 border border-green-200 text-green-700"
                  : "bg-red-50 border border-red-200 text-red-700"
              }`}
            >
              {actionMessage.text}
            </div>
          )}

          {/* Bulk actions bar */}
          {selectedItems.size > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 mb-4 flex flex-wrap items-center gap-3">
              <span className="text-sm text-gray-700 font-medium">
                {selectedItems.size} selected
              </span>
              <button
                onClick={handleEndSelected}
                disabled={actionLoading}
                className="px-3 py-1.5 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700 disabled:opacity-50"
              >
                End Selected
              </button>
              <button
                onClick={handleEndAll}
                disabled={actionLoading}
                className="px-3 py-1.5 bg-red-900 text-white rounded text-xs font-medium hover:bg-red-800 disabled:opacity-50"
              >
                End All Listings
              </button>
              <button
                onClick={() => {
                  setBulkAdjustValue("");
                  setShowPriceModal(true);
                }}
                disabled={actionLoading}
                className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                Adjust Price
              </button>
            </div>
          )}

          {/* Listings table */}
          {listingsLoading ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-sm text-gray-400">
              Loading listings...
            </div>
          ) : listingsError ? (
            <div className="bg-red-50 border border-red-200 rounded-lg px-5 py-4 text-sm text-red-700">
              {listingsError}
            </div>
          ) : listings.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-sm text-gray-500">
              No active listings found.
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="py-2.5 px-3 w-8">
                        <input
                          type="checkbox"
                          checked={selectedItems.size === listings.length && listings.length > 0}
                          onChange={toggleSelectAll}
                          className="rounded border-gray-300 text-safety-orange focus:ring-safety-orange"
                        />
                      </th>
                      <th className="py-2.5 px-3 w-12 text-left font-medium text-gray-500">Image</th>
                      <th className="py-2.5 px-3 text-left font-medium text-gray-500">Title</th>
                      <th className="py-2.5 px-3 text-left font-medium text-gray-500 w-28">SKU</th>
                      <th className="py-2.5 px-3 text-right font-medium text-gray-500 w-24">Price</th>
                      <th className="py-2.5 px-3 text-right font-medium text-gray-500 w-16">Qty</th>
                      <th className="py-2.5 px-3 text-right font-medium text-gray-500 w-20">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listings.map((item) => (
                      <tr key={item.itemId} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-2 px-3">
                          <input
                            type="checkbox"
                            checked={selectedItems.has(item.itemId)}
                            onChange={() => toggleItemSelection(item.itemId)}
                            className="rounded border-gray-300 text-safety-orange focus:ring-safety-orange"
                          />
                        </td>
                        <td className="py-2 px-3">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt=""
                              className="w-10 h-10 object-cover rounded border border-gray-200"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gray-100 rounded border border-gray-200" />
                          )}
                        </td>
                        <td className="py-2 px-3 text-gray-900 text-xs max-w-xs truncate" title={item.title}>
                          {item.title}
                        </td>
                        <td className="py-2 px-3 text-gray-600 font-mono text-xs">{item.sku}</td>
                        <td className="py-2 px-3 text-right">
                          {editingPrice === item.itemId ? (
                            <form
                              onSubmit={(e) => {
                                e.preventDefault();
                                handleInlinePrice(item.itemId);
                              }}
                              className="flex items-center justify-end gap-1"
                            >
                              <span className="text-gray-400 text-xs">$</span>
                              <input
                                type="number"
                                step="0.01"
                                value={editPriceValue}
                                onChange={(e) => setEditPriceValue(e.target.value)}
                                onBlur={() => handleInlinePrice(item.itemId)}
                                autoFocus
                                className="w-20 px-1.5 py-0.5 border border-gray-300 rounded text-xs text-right focus:ring-safety-orange focus:border-safety-orange"
                              />
                            </form>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingPrice(item.itemId);
                                setEditPriceValue(item.price.toFixed(2));
                              }}
                              className="text-gray-900 hover:text-safety-orange text-xs font-medium cursor-pointer"
                              title="Click to edit price"
                            >
                              ${item.price.toFixed(2)}
                            </button>
                          )}
                        </td>
                        <td className="py-2 px-3 text-right text-gray-600 text-xs">{item.quantity}</td>
                        <td className="py-2 px-3 text-right">
                          <button
                            onClick={() => handleEndItem(item.itemId)}
                            disabled={actionLoading}
                            className="text-xs text-red-600 hover:text-red-800 font-medium disabled:opacity-50"
                          >
                            End
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
                  <p className="text-xs text-gray-500">
                    Page {listingsPage} of {totalPages} ({totalEntries} total)
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => fetchListings(listingsPage - 1)}
                      disabled={listingsPage <= 1 || listingsLoading}
                      className="px-3 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => fetchListings(listingsPage + 1)}
                      disabled={listingsPage >= totalPages || listingsLoading}
                      className="px-3 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ═══════════════ DISTRIBUTOR TAB ═══════════════ */}
      {activeTab === "distributor" && (
        <>
          {/* Distributor selector */}
          <div className="bg-white rounded-lg border border-gray-200 p-5 mb-6">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">Distributor:</label>
              <select
                value={distSelectedDistributor}
                onChange={(e) => setDistSelectedDistributor(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded text-sm focus:ring-safety-orange focus:border-safety-orange"
              >
                {distDistributors.length === 0 && <option value="">No distributors — add one first</option>}
                {distDistributors.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
              <span className="text-xs text-gray-400">Items will be saved to this distributor&apos;s inventory on sync</span>
            </div>
          </div>

          {/* Input form */}
          <div className="bg-white rounded-lg border border-gray-200 p-5 mb-6">
            <h2 className="font-semibold text-gray-900 mb-4">Add Distributor Item</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Brand</label>
                <input
                  type="text"
                  value={distBrand}
                  onChange={(e) => setDistBrand(e.target.value)}
                  placeholder="BFGoodrich"
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-safety-orange focus:border-safety-orange"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Model</label>
                <input
                  type="text"
                  value={distModel}
                  onChange={(e) => setDistModel(e.target.value)}
                  placeholder="All-Terrain T/A KO2"
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-safety-orange focus:border-safety-orange"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Size</label>
                <input
                  type="text"
                  value={distSize}
                  onChange={(e) => setDistSize(e.target.value)}
                  placeholder="LT255/75R17"
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-safety-orange focus:border-safety-orange"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Qty</label>
                <input
                  type="number"
                  value={distQty}
                  onChange={(e) => setDistQty(e.target.value)}
                  min={1}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-safety-orange focus:border-safety-orange"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Cost ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={distCost}
                  onChange={(e) => setDistCost(e.target.value)}
                  placeholder="212.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-safety-orange focus:border-safety-orange"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Part# <span className="text-gray-400">(opt)</span></label>
                <input
                  type="text"
                  value={distPartNum}
                  onChange={(e) => setDistPartNum(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-safety-orange focus:border-safety-orange"
                />
              </div>
            </div>
            <button
              onClick={async () => {
                if (!distBrand || !distModel || !distSize || !distCost) return;
                const cost = parseFloat(distCost);
                if (isNaN(cost) || cost <= 0) return;
                const qty = parseInt(distQty) || 4;
                const itemId = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
                const newItem: DistributorItem = {
                  id: itemId,
                  brand: distBrand.trim(),
                  model: distModel.trim(),
                  size: distSize.trim(),
                  quantity: qty,
                  cost,
                  partNumber: distPartNum.trim(),
                  ebayPrice: calcDistPrice(cost),
                  dbMatch: "pending",
                  status: "pending",
                };
                setDistItems((prev) => [...prev, newItem]);
                // Clear size, cost, part# for next entry (keep brand/model)
                setDistSize("");
                setDistCost("");
                setDistPartNum("");

                // Auto-check DB match
                try {
                  const res = await fetch("/api/admin/ebay/distributor-sync", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      items: [{
                        brand: newItem.brand,
                        model: newItem.model,
                        size: newItem.size,
                        quantity: newItem.quantity,
                        cost: newItem.cost,
                        partNumber: newItem.partNumber || undefined,
                      }],
                      shippingCost: DIST_SHIPPING_DEFAULT,
                      dryRun: true,
                    }),
                  });
                  const data = await res.json();
                  const result = data.itemResults?.[0];
                  if (result) {
                    setDistItems((prev) =>
                      prev.map((i) =>
                        i.id === itemId
                          ? { ...i, dbMatch: result.tireId ? "found" as const : "not_found" as const, tireId: result.tireId }
                          : i
                      )
                    );
                  }
                } catch {
                  // Non-fatal — user can still check manually
                }
              }}
              disabled={!distBrand || !distModel || !distSize || !distCost}
              className="px-4 py-2 bg-safety-orange text-white rounded font-medium text-sm hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Add Item
            </button>
          </div>

          {/* Items table */}
          {distItems.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="py-2.5 px-3 text-left font-medium text-gray-500">Brand</th>
                      <th className="py-2.5 px-3 text-left font-medium text-gray-500">Model</th>
                      <th className="py-2.5 px-3 text-left font-medium text-gray-500">Size</th>
                      <th className="py-2.5 px-3 text-right font-medium text-gray-500">Qty</th>
                      <th className="py-2.5 px-3 text-right font-medium text-gray-500">Cost</th>
                      <th className="py-2.5 px-3 text-right font-medium text-gray-500">eBay Price</th>
                      <th className="py-2.5 px-3 text-center font-medium text-gray-500">DB Match</th>
                      <th className="py-2.5 px-3 text-center font-medium text-gray-500">Status</th>
                      <th className="py-2.5 px-3 w-12"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {distItems.map((item) => (
                      <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-2 px-3 text-gray-900 text-xs">{item.brand}</td>
                        <td className="py-2 px-3 text-gray-900 text-xs">{item.model}</td>
                        <td className="py-2 px-3 text-gray-700 font-mono text-xs">{item.size}</td>
                        <td className="py-2 px-3 text-right text-gray-700 text-xs">{item.quantity}</td>
                        <td className="py-2 px-3 text-right text-gray-700 text-xs">${item.cost.toFixed(2)}</td>
                        <td className="py-2 px-3 text-right font-medium text-gray-900 text-xs">${item.ebayPrice.toFixed(2)}</td>
                        <td className="py-2 px-3 text-center">
                          {item.dbMatch === "pending" && (
                            <span className="text-gray-400 text-xs">--</span>
                          )}
                          {item.dbMatch === "found" && (
                            <span className="text-green-600" title={`Tire ID: ${item.tireId}`}>&#10003;</span>
                          )}
                          {item.dbMatch === "not_found" && (
                            <span className="text-yellow-500" title="Not found in DB">&#9888;</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-center">
                          {item.status === "pending" && (
                            <span className="inline-block px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs">Pending</span>
                          )}
                          {item.status === "uploaded" && (
                            <span className="inline-block px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs">Uploaded</span>
                          )}
                          {item.status === "error" && (
                            <span className="inline-block px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs" title={item.error}>Error</span>
                          )}
                        </td>
                        <td className="py-2 px-3">
                          <button
                            onClick={() => setDistItems((prev) => prev.filter((i) => i.id !== item.id))}
                            className="text-xs text-red-500 hover:text-red-700"
                            title="Remove"
                          >
                            &#10005;
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Action bar */}
          {distItems.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-5 mb-6">
              <div className="flex flex-wrap items-center gap-4">
                <button
                  onClick={async () => {
                    setDistChecking(true);
                    try {
                      // Use dry run to check DB matches
                      const res = await fetch("/api/admin/ebay/distributor-sync", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          items: distItems.map((i) => ({
                            brand: i.brand,
                            model: i.model,
                            size: i.size,
                            quantity: i.quantity,
                            cost: i.cost,
                            partNumber: i.partNumber || undefined,
                          })),
                          shippingCost: DIST_SHIPPING_DEFAULT,
                          dryRun: true,
                        }),
                      });
                      const data = await res.json();
                      if (!res.ok) throw new Error(data.error);
                      // Update items with DB match info
                      if (data.itemResults) {
                        setDistItems((prev) =>
                          prev.map((item, idx) => {
                            const result = data.itemResults[idx];
                            if (!result) return item;
                            return {
                              ...item,
                              dbMatch: result.tireId ? "found" as const : "not_found" as const,
                              tireId: result.tireId,
                            };
                          })
                        );
                      }
                    } catch (e) {
                      setDistError(e instanceof Error ? e.message : "Check failed");
                    } finally {
                      setDistChecking(false);
                    }
                  }}
                  disabled={distChecking || distSyncing}
                  className="px-4 py-2 bg-blue-600 text-white rounded font-medium text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {distChecking ? "Checking..." : "Check DB Matches"}
                </button>

                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={distDryRun}
                    onChange={(e) => setDistDryRun(e.target.checked)}
                    className="rounded border-gray-300 text-safety-orange focus:ring-safety-orange"
                  />
                  Dry Run
                </label>

                <button
                  onClick={async () => {
                    setDistSyncing(true);
                    setDistResult(null);
                    setDistError(null);
                    try {
                      const pendingItems = distItems.filter((i) => i.status === "pending");
                      if (pendingItems.length === 0) {
                        setDistError("No pending items to sync");
                        return;
                      }
                      const res = await fetch("/api/admin/ebay/distributor-sync", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          items: pendingItems.map((i) => ({
                            brand: i.brand,
                            model: i.model,
                            size: i.size,
                            quantity: i.quantity,
                            cost: i.cost,
                            partNumber: i.partNumber || undefined,
                          })),
                          shippingCost: DIST_SHIPPING_DEFAULT,
                          dryRun: distDryRun,
                          distributorId: distSelectedDistributor || undefined,
                        }),
                      });
                      const data: DistSyncResult = await res.json();
                      if (!res.ok) throw new Error((data as unknown as { error: string }).error);
                      setDistResult(data);

                      // Update item statuses from results
                      if (data.itemResults) {
                        const pendingIds = pendingItems.map((i) => i.id);
                        setDistItems((prev) =>
                          prev.map((item) => {
                            const pendingIdx = pendingIds.indexOf(item.id);
                            if (pendingIdx === -1) return item;
                            const result = data.itemResults[pendingIdx];
                            if (!result) return item;
                            return {
                              ...item,
                              dbMatch: result.tireId ? "found" as const : "not_found" as const,
                              tireId: result.tireId,
                              status: distDryRun
                                ? item.status
                                : result.status === "synced" || result.status === "revised"
                                ? "uploaded" as const
                                : result.status === "error"
                                ? "error" as const
                                : item.status,
                              error: result.error,
                            };
                          })
                        );
                      }
                    } catch (e) {
                      setDistError(e instanceof Error ? e.message : "Sync failed");
                    } finally {
                      setDistSyncing(false);
                    }
                  }}
                  disabled={distSyncing || distChecking || distItems.filter((i) => i.status === "pending").length === 0}
                  className="px-4 py-2 bg-safety-orange text-white rounded font-medium text-sm hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {distSyncing ? "Syncing..." : distDryRun ? "Preview Sync" : "Sync to eBay"}
                </button>

                <button
                  onClick={() => {
                    setDistItems([]);
                    setDistResult(null);
                    setDistError(null);
                  }}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Clear All
                </button>
              </div>
            </div>
          )}

          {/* Distributor sync error */}
          {distError && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-5 py-4 text-sm text-red-700 mb-6">
              <p className="font-medium">Error</p>
              <p className="mt-1 text-red-600">{distError}</p>
            </div>
          )}

          {/* Distributor sync results */}
          {distResult && (
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-900 mb-3">
                {distResult.dryRun ? "Dry Run Results" : "Sync Results"}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500">Total Items</p>
                  <p className="text-lg font-semibold text-gray-900">{distResult.total}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">{distResult.dryRun ? "Would Sync" : "Synced"}</p>
                  <p className="text-lg font-semibold text-green-600">{distResult.synced}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Revised</p>
                  <p className="text-lg font-semibold text-blue-600">{distResult.revised}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Skipped</p>
                  <p className="text-lg font-semibold text-yellow-600">{distResult.skipped}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Errors</p>
                  <p className="text-lg font-semibold text-red-600">{distResult.errors.length}</p>
                </div>
              </div>
              {distResult.errors.length > 0 && (
                <div className="mt-3">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Errors</h3>
                  <div className="max-h-40 overflow-y-auto border border-gray-200 rounded">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="text-left py-1.5 px-3 font-medium text-gray-500">SKU</th>
                          <th className="text-left py-1.5 px-3 font-medium text-gray-500">Error</th>
                        </tr>
                      </thead>
                      <tbody>
                        {distResult.errors.map((err, i) => (
                          <tr key={i} className="border-b border-gray-100">
                            <td className="py-1.5 px-3 font-mono text-gray-700">{err.sku}</td>
                            <td className="py-1.5 px-3 text-red-600">{err.error}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Pricing formula reference */}
          {distItems.length === 0 && (
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-5 text-sm text-gray-600">
              <h3 className="font-medium text-gray-800 mb-2">Pricing Formula — Tiered Net Profit</h3>
              <p className="font-mono text-xs mb-2">
                eBay Price = (Cost + Shipping × {EBAY_SHIPPING_FVF} + Margin) / {EBAY_PRICE_FACTOR.toFixed(4)}
              </p>
              <p className="text-xs text-gray-500 mb-2">
                eBay FVF: {(EBAY_FVF * 100).toFixed(2)}% | FVF on Tax: {(EBAY_FVF_TAX * 100).toFixed(2)}% | Misc: {(EBAY_MISC * 100)}%
              </p>
              <p className="text-xs font-medium text-gray-700 mb-2">
                Cost &le; ${MARGIN_THRESHOLD}: ${MARGIN_LOW}/tire net profit &nbsp;|&nbsp; Cost &gt; ${MARGIN_THRESHOLD}: ${MARGIN_HIGH}/tire net profit
              </p>
              <div className="text-xs text-gray-500 mb-3">
                <p className="font-medium text-gray-700 mb-1">Weight-Based Shipping:</p>
                <p>&lt;25 lbs: $40 | 25-50 lbs: $55 | 50-75 lbs: $72 | 75+ lbs: $99</p>
              </div>
              <div className="mt-3 space-y-1 text-xs">
                <p>Example: $35 cost (budget, $40 ship) &rarr; ${calcDistPrice(35, 40).toFixed(2)} (${MARGIN_LOW} margin)</p>
                <p>Example: $50 cost (light, $40 ship) &rarr; ${calcDistPrice(50, 40).toFixed(2)} (${MARGIN_LOW} margin)</p>
                <p>Example: $100 cost (mid, $55 ship) &rarr; ${calcDistPrice(100, 55).toFixed(2)} (${MARGIN_HIGH} margin)</p>
                <p>Example: $200 cost (heavy, $72 ship) &rarr; ${calcDistPrice(200, 72).toFixed(2)} (${MARGIN_HIGH} margin)</p>
              </div>
            </div>
          )}
        </>
      )}

      {/* ═══════════════ BULK PRICE MODAL ═══════════════ */}
      {showPriceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Adjust Price</h3>
            <p className="text-sm text-gray-600 mb-4">
              Adjust price for {selectedItems.size} selected listing{selectedItems.size > 1 ? "s" : ""}.
            </p>

            <div className="space-y-3 mb-5">
              <div className="flex gap-2">
                <select
                  value={bulkAdjustDirection}
                  onChange={(e) => setBulkAdjustDirection(e.target.value as "increase" | "decrease")}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:ring-safety-orange focus:border-safety-orange"
                >
                  <option value="increase">Increase</option>
                  <option value="decrease">Decrease</option>
                </select>
                <select
                  value={bulkAdjustType}
                  onChange={(e) => setBulkAdjustType(e.target.value as "percent" | "amount")}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:ring-safety-orange focus:border-safety-orange"
                >
                  <option value="percent">by %</option>
                  <option value="amount">by $</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">{bulkAdjustType === "percent" ? "%" : "$"}</span>
                <input
                  type="number"
                  step={bulkAdjustType === "percent" ? "1" : "0.01"}
                  min="0"
                  value={bulkAdjustValue}
                  onChange={(e) => setBulkAdjustValue(e.target.value)}
                  placeholder={bulkAdjustType === "percent" ? "5" : "2.00"}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:ring-safety-orange focus:border-safety-orange"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowPriceModal(false)}
                className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkPriceAdjust}
                disabled={!bulkAdjustValue || parseFloat(bulkAdjustValue) <= 0}
                className="px-4 py-2 bg-safety-orange text-white rounded text-sm font-medium hover:bg-orange-600 disabled:opacity-50"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ CONFIRMATION MODAL ═══════════════ */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Action</h3>
            <p className="text-sm text-gray-600 mb-5">{confirmAction.message}</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction.onConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded text-sm font-medium hover:bg-red-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
