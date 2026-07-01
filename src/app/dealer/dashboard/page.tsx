"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface DealerInfo {
  id: string;
  business_name: string;
  email: string;
  contact_name: string;
}

interface OrderSummary {
  total_orders: number;
  total_spent: number;
  recent_orders: Array<{
    id: string;
    total: number;
    status: string;
    created_at: string;
    items: Array<{ brand: string; model: string; size: string; qty: number }>;
  }>;
}

export default function DealerDashboardPage() {
  const [dealer, setDealer] = useState<DealerInfo | null>(null);
  const [stats, setStats] = useState<OrderSummary | null>(null);

  useEffect(() => {
    fetch("/api/dealer/auth/verify")
      .then((r) => r.json())
      .then((d) => { if (d.authenticated) setDealer(d.dealer); });

    fetch("/api/dealer/orders")
      .then((r) => r.json())
      .then((d) => {
        if (d.orders) {
          const orders = d.orders;
          setStats({
            total_orders: orders.length,
            total_spent: orders.reduce((s: number, o: { total: number }) => s + o.total, 0),
            recent_orders: orders.slice(0, 5),
          });
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome{dealer ? `, ${dealer.contact_name}` : ""}
        </h1>
        {dealer && (
          <p className="mt-1 text-sm text-gray-500">{dealer.business_name}</p>
        )}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Orders</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{stats?.total_orders ?? 0}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Spent</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            ${(stats?.total_spent ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Recent Activity</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {stats?.recent_orders?.length ? `${stats.recent_orders.length} recent` : "No orders yet"}
          </p>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/dealer/dashboard/tires"
          className="bg-white rounded-lg border border-gray-200 p-5 hover:border-orange-300 hover:shadow-sm transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center group-hover:bg-orange-200 transition-colors">
              <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-900">Browse Tires</p>
              <p className="text-sm text-gray-500">Search inventory at wholesale prices</p>
            </div>
          </div>
        </Link>
        <Link
          href="/dealer/dashboard/orders"
          className="bg-white rounded-lg border border-gray-200 p-5 hover:border-orange-300 hover:shadow-sm transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-900">View Orders</p>
              <p className="text-sm text-gray-500">Track order status and history</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent Orders */}
      {stats && stats.recent_orders.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Recent Orders</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {stats.recent_orders.map((order) => (
              <div key={order.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {order.items?.map((i) => `${i.brand} ${i.model}`).join(", ") || "Order"}
                  </p>
                  <p className="text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">${order.total.toFixed(2)}</p>
                  <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${
                    order.status === "paid" ? "bg-green-100 text-green-700" :
                    order.status === "shipped" ? "bg-blue-100 text-blue-700" :
                    order.status === "delivered" ? "bg-gray-100 text-gray-700" :
                    "bg-yellow-100 text-yellow-700"
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
