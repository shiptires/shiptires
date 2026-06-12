"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useParams } from "next/navigation";

interface OrderDetail {
  id: string;
  created_at: string;
  status: string;
  total: number;
  customer_name: string;
  customer_email: string;
  shipping_address: {
    firstName: string;
    lastName: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    zip: string;
  } | null;
  items: { brand: string; model: string; size: string; qty: number; price: number }[];
}

const STATUS_STEPS = ["paid", "shipped", "delivered"];

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user || !id) return;
    fetch(`/api/account/orders?id=${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Order not found");
        return r.json();
      })
      .then((data) => {
        setOrder(data.order);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, [user, id]);

  if (loading) {
    return <div className="animate-pulse text-gray-400 py-12 text-center">Loading order...</div>;
  }

  if (error || !order) {
    return (
      <div className="rounded-xl bg-white border border-gray-200 p-12 shadow-sm text-center">
        <h2 className="text-lg font-bold text-gray-900">Order not found</h2>
        <Link href="/account/orders" className="mt-4 inline-block text-sm text-orange hover:underline">
          Back to orders
        </Link>
      </div>
    );
  }

  const currentStep = STATUS_STEPS.indexOf(order.status);

  return (
    <div className="space-y-6">
      <Link href="/account/orders" className="text-sm text-orange hover:underline">
        &larr; Back to orders
      </Link>

      <div className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Order Details</h2>
          <span className="text-sm text-gray-500">{formatDate(order.created_at)}</span>
        </div>

        {/* Status timeline */}
        <div className="mt-6">
          <div className="flex items-center gap-0">
            {STATUS_STEPS.map((step, i) => {
              const isActive = i <= currentStep;
              const isCurrent = i === currentStep;
              return (
                <div key={step} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                        isActive
                          ? isCurrent
                            ? "bg-orange text-white"
                            : "bg-green-500 text-white"
                          : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      {isActive && !isCurrent ? (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </svg>
                      ) : (
                        i + 1
                      )}
                    </div>
                    <span className={`mt-1.5 text-xs font-medium ${isActive ? "text-gray-900" : "text-gray-400"}`}>
                      {step.charAt(0).toUpperCase() + step.slice(1)}
                    </span>
                  </div>
                  {i < STATUS_STEPS.length - 1 && (
                    <div className={`h-0.5 flex-1 ${i < currentStep ? "bg-green-500" : "bg-gray-200"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-4">Items</h3>
        <div className="space-y-3">
          {order.items.map((item, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-gray-700">
                {item.brand} {item.model} ({item.size}) &times; {item.qty}
              </span>
              <span className="font-medium text-gray-900">
                ${(item.price * item.qty).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 border-t border-gray-200 pt-3 flex justify-between">
          <span className="font-bold text-gray-900">Total</span>
          <span className="font-bold text-gray-900">${order.total?.toFixed(2) ?? "—"}</span>
        </div>
      </div>

      {/* Shipping */}
      {order.shipping_address && (
        <div className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-3">Shipping Address</h3>
          <p className="text-sm text-gray-700">
            {order.shipping_address.firstName} {order.shipping_address.lastName}
          </p>
          <p className="text-sm text-gray-500">
            {order.shipping_address.address1}
            {order.shipping_address.address2 && `, ${order.shipping_address.address2}`}
          </p>
          <p className="text-sm text-gray-500">
            {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.zip}
          </p>
        </div>
      )}

      <p className="text-sm text-gray-400">
        Questions? Call or text <a href="tel:+12792388473" className="text-orange hover:underline">(279) 238-8473</a>
      </p>
    </div>
  );
}
