"use client";

import { useState } from "react";

export default function OrderTracking() {
  const [orderId, setOrderId] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "not-found">("idle");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!orderId.trim() || !email.trim()) return;

    setStatus("loading");
    // Simulate lookup delay, then show not-found with contact info
    setTimeout(() => {
      setStatus("not-found");
    }, 1500);
  }

  return (
    <div className="rounded-xl bg-white border border-gray-200 p-6 sm:p-8 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange/10 border border-orange/20">
          <svg className="h-5 w-5 text-orange" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-black text-gray-900">Track Your Order</h2>
          <p className="text-sm text-gray-500">Enter your order details to check shipment status.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="order-id" className="block text-sm font-medium text-gray-700 mb-1">
              Order Number
            </label>
            <input
              type="text"
              id="order-id"
              value={orderId}
              onChange={(e) => {
                setOrderId(e.target.value);
                setStatus("idle");
              }}
              placeholder="e.g. ST-10042"
              className="block w-full rounded-lg border border-gray-300 bg-white text-gray-900 px-4 py-2.5 text-sm placeholder:text-gray-400 focus:border-orange focus:ring-2 focus:ring-orange/20 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="order-email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              id="order-email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setStatus("idle");
              }}
              placeholder="you@example.com"
              className="block w-full rounded-lg border border-gray-300 bg-white text-gray-900 px-4 py-2.5 text-sm placeholder:text-gray-400 focus:border-orange focus:ring-2 focus:ring-orange/20 focus:outline-none"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full sm:w-auto rounded-lg bg-navy px-6 py-2.5 text-sm font-bold text-white hover:bg-navy-light transition-colors disabled:opacity-50"
        >
          {status === "loading" ? (
            <span className="inline-flex items-center gap-2">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Looking up order...
            </span>
          ) : (
            "Track Order"
          )}
        </button>
      </form>

      {status === "not-found" && (
        <div className="mt-4 rounded-lg bg-gray-50 border border-gray-200 p-4">
          <p className="text-sm text-gray-700">
            <span className="font-bold">Order not found.</span> If you recently placed an order, tracking information may not be available yet.
            For immediate assistance:
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <a
              href="tel:+12792388473"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-orange hover:underline"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
              </svg>
              Call/Text (279) 238-8473 (TIRE)
            </a>
            <a
              href="mailto:info@ship.tires"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-orange hover:underline"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
              info@ship.tires
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
