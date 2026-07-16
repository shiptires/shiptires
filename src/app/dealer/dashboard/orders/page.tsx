"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

interface DealerOrder {
  id: string;
  payment_id: string | null;
  stripe_session_id?: string;
  items: Array<{ brand: string; model: string; size: string; qty: number; price: number }>;
  total: number;
  status: string;
  shipping_address: Record<string, string> | null;
  tracking_number: string | null;
  created_at: string;
}

export default function DealerOrdersPage() {
  const [orders, setOrders] = useState<DealerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const showSuccess = searchParams.get("success") === "true";

  useEffect(() => {
    fetch("/api/dealer/orders")
      .then((r) => r.json())
      .then((d) => {
        setOrders(d.orders || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const statusColors: Record<string, string> = {
    pending_payment: "bg-amber-100 text-amber-700",
    paid: "bg-green-100 text-green-700",
    processing: "bg-yellow-100 text-yellow-700",
    shipped: "bg-blue-100 text-blue-700",
    delivered: "bg-gray-100 text-gray-700",
    cancelled: "bg-red-100 text-red-700",
    returned: "bg-red-100 text-red-700",
    payment_failed: "bg-red-100 text-red-700",
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Orders</h1>

      {showSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-700">
          Order placed successfully! It will appear below shortly.
        </div>
      )}

      {loading ? (
        <p className="text-sm text-gray-400">Loading orders...</p>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <p className="text-gray-500">No orders yet. Browse tires to place your first order.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-500">Date</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Items</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Total</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">Status</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">Tracking</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((order) => (
                <>
                  <tr
                    key={order.id}
                    onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                    className="hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-4 py-3 text-gray-900">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {order.items?.length ? `${order.items.length} item${order.items.length > 1 ? "s" : ""}` : "-"}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">
                      ${Number(order.total).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[order.status] || "bg-gray-100 text-gray-600"}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-500">
                      {order.tracking_number || "-"}
                    </td>
                  </tr>
                  {expandedId === order.id && order.items && (
                    <tr key={`${order.id}-detail`}>
                      <td colSpan={5} className="px-4 py-3 bg-gray-50">
                        <div className="space-y-1">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-xs text-gray-600">
                              <span>{item.brand} {item.model} ({item.size}) x{item.qty}</span>
                              <span>${(item.price * item.qty).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
