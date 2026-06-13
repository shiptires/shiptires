"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STATUSES = ["pending", "checkout_sent", "paid", "shipped", "delivered", "cancelled"];

export default function OrderStatusUpdater({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: string;
}) {
  const [status, setStatus] = useState(currentStatus);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function handleUpdate() {
    if (status === currentStatus) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="text-sm border border-gray-300 rounded px-2 py-1.5 bg-white text-gray-900"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
          </option>
        ))}
      </select>
      <button
        onClick={handleUpdate}
        disabled={saving || status === currentStatus}
        className="text-sm px-3 py-1.5 bg-safety-orange text-white rounded hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        {saving ? "Saving..." : "Update"}
      </button>
    </div>
  );
}
