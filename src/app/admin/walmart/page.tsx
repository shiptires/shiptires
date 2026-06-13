"use client";

import { useState, useEffect } from "react";

const BRANDS = [
  "ADVANTA", "BFGOODRICH", "BRIDGESTONE", "CONTINENTAL", "COOPER",
  "DUNLOP", "FALKEN", "FIRESTONE", "GENERAL", "GOODYEAR",
  "HANKOOK", "HOOSIER", "KENDA", "KUMHO", "LAUFENN",
  "MAXXIS", "MICHELIN", "MICKEY THOMPSON", "NANKANG", "NEXEN",
  "NITTO", "NOKIAN", "PIRELLI", "POWER KING", "RADAR",
  "RANGE FINDER", "RIKEN", "SUMITOMO", "TOYO", "UNIROYAL",
  "VITOUR", "VOGUE", "VREDESTEIN", "YOKOHAMA",
];

interface SyncStatus {
  configured: boolean;
  authenticated: boolean;
  error: string | null;
}

interface SyncResult {
  synced: number;
  skipped: number;
  errors: Array<{ sku: string; error: string }>;
  total: number;
  dryRun: boolean;
}

export default function WalmartPage() {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [selectedBrands, setSelectedBrands] = useState<Set<string>>(new Set());
  const [dryRun, setDryRun] = useState(true);
  const [limit, setLimit] = useState(500);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    fetchStatus();
  }, []);

  async function fetchStatus() {
    setStatusLoading(true);
    try {
      const res = await fetch("/api/admin/walmart/status");
      if (!res.ok) throw new Error("Failed to load status");
      const data = await res.json();
      setStatus(data);
    } catch (e) {
      setStatus({
        configured: false,
        authenticated: false,
        error: e instanceof Error ? e.message : "Failed to load status",
      });
    } finally {
      setStatusLoading(false);
    }
  }

  function toggleBrand(brand: string) {
    setSelectedBrands((prev) => {
      const next = new Set(prev);
      if (next.has(brand)) next.delete(brand);
      else next.add(brand);
      return next;
    });
  }

  function selectAll() {
    setSelectedBrands(new Set(BRANDS));
  }

  function selectNone() {
    setSelectedBrands(new Set());
  }

  async function startSync() {
    setSyncing(true);
    setSyncResult(null);
    setSyncError(null);

    try {
      const body: Record<string, unknown> = {
        dryRun,
        limit,
        offset: 0,
      };
      if (selectedBrands.size > 0 && selectedBrands.size < BRANDS.length) {
        body.brandSlugs = Array.from(selectedBrands);
      }

      const res = await fetch("/api/admin/walmart/sync", {
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

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Walmart Integration</h1>

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
              <span className={`w-2 h-2 rounded-full ${status.authenticated ? "bg-green-500" : "bg-red-500"}`} />
              <span className="text-gray-700">Authentication: {status.authenticated ? "Connected" : "Not connected"}</span>
            </div>
            {status.error && (
              <p className="text-red-600 mt-2">{status.error}</p>
            )}
          </div>
        ) : null}
      </div>

      {/* Sync controls */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">Sync to Walmart</h2>

        <div className="flex flex-wrap items-center gap-4 mb-4">
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={dryRun}
              onChange={(e) => setDryRun(e.target.checked)}
              className="rounded border-gray-300 text-safety-orange focus:ring-safety-orange"
            />
            Dry Run
            <span className="text-xs text-gray-400">(preview only, no Walmart changes)</span>
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

        {/* Brand selection */}
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm font-medium text-gray-700">Brands:</span>
            <button onClick={selectAll} className="text-xs text-safety-orange hover:text-orange-700">Select All</button>
            <button onClick={selectNone} className="text-xs text-gray-500 hover:text-gray-700">Clear</button>
            <span className="text-xs text-gray-400">
              {selectedBrands.size === 0 ? "(all brands)" : `${selectedBrands.size} selected`}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {BRANDS.map((brand) => (
              <button
                key={brand}
                onClick={() => toggleBrand(brand)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  selectedBrands.has(brand)
                    ? "bg-safety-orange text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {brand}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={startSync}
          disabled={syncing}
          className="px-4 py-2 bg-safety-orange text-white rounded font-medium text-sm hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {syncing ? "Syncing..." : dryRun ? "Preview Sync" : "Sync to Walmart"}
        </button>
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            <div>
              <p className="text-xs text-gray-500">Total in DB</p>
              <p className="text-lg font-semibold text-gray-900">{syncResult.total.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">{syncResult.dryRun ? "Would Sync" : "Synced"}</p>
              <p className="text-lg font-semibold text-green-600">{syncResult.synced.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Skipped</p>
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
        </div>
      )}
    </div>
  );
}
