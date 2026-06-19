"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function EbayOrderSync() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    imported: number;
    skipped: number;
    errors: Array<{ orderId: string; error: string }>;
  } | null>(null);
  const [error, setError] = useState("");

  async function handleSync() {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/admin/ebay/orders/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sinceDays: 30 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sync failed");
      setResult(data);
      if (data.imported > 0) {
        router.refresh();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sync failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleSync}
        disabled={loading}
        className="text-sm px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
      >
        {loading ? "Syncing..." : "Sync eBay Orders"}
      </button>
      {result && (
        <span className="text-sm text-gray-600">
          {result.imported} imported, {result.skipped} skipped
          {result.errors.length > 0 && `, ${result.errors.length} errors`}
        </span>
      )}
      {error && <span className="text-sm text-red-600">{error}</span>}
    </div>
  );
}
