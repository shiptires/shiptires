"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

interface Order {
  id: string;
  created_at: string;
  status: string;
  total: number;
  items: { brand: string; model: string; size: string; qty: number; price: number }[];
  customer_name: string;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function statusLabel(status: string) {
  const map: Record<string, { label: string; color: string }> = {
    paid: { label: "Paid", color: "bg-green-100 text-green-800" },
    shipped: { label: "Shipped", color: "bg-blue-100 text-blue-800" },
    delivered: { label: "Delivered", color: "bg-gray-100 text-gray-800" },
    pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800" },
    cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800" },
  };
  const s = map[status] || { label: status, color: "bg-gray-100 text-gray-700" };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${s.color}`}>
      {s.label}
    </span>
  );
}

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetch("/api/account/orders")
      .then((r) => r.json())
      .then((data) => {
        setOrders(data.orders || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user]);

  if (loading) {
    return <div className="animate-pulse text-gray-400 py-12 text-center">Loading orders...</div>;
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-xl bg-white border border-gray-200 p-12 shadow-sm text-center">
        <h2 className="text-lg font-bold text-gray-900">No orders yet</h2>
        <p className="mt-2 text-sm text-gray-500">Your order history will appear here after your first purchase.</p>
        <Link href="/tires" className="mt-4 inline-block rounded-lg bg-orange px-6 py-3 text-sm font-bold text-white hover:bg-orange-dark transition-colors">
          Shop Tires
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-bold text-gray-900 mb-4">Order History</h2>
      <div className="space-y-4">
        {orders.map((order) => (
          <Link
            key={order.id}
            href={`/account/orders/${order.id}`}
            className="block rounded-xl bg-white border border-gray-200 p-5 shadow-sm hover:border-orange transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {formatDate(order.created_at)}
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="text-right">
                {statusLabel(order.status)}
                <p className="mt-1 text-sm font-bold text-gray-900">
                  ${order.total?.toFixed(2) ?? "—"}
                </p>
              </div>
            </div>
            <div className="mt-3 text-xs text-gray-500">
              {order.items.slice(0, 2).map((item, i) => (
                <span key={i}>
                  {i > 0 && " · "}
                  {item.brand} {item.model} ({item.size}) x{item.qty}
                </span>
              ))}
              {order.items.length > 2 && <span> +{order.items.length - 2} more</span>}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
