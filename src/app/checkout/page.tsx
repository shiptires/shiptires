"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { HANDLING_FEE, calculateOrderFees } from "@/lib/tire-fees";
import type { ShippingAddress } from "@/lib/types";

function OrderFeeSummary({ subtotal, totalItems, state }: { subtotal: number; totalItems: number; state: string }) {
  const fees = useMemo(() => {
    const s = state.trim().toUpperCase();
    if (s.length !== 2) return null;
    return calculateOrderFees(s, totalItems, subtotal);
  }, [state, totalItems, subtotal]);

  const tireFeePerTire = fees?.tireFeePerTire ?? 0;
  const tireFeeTotal = fees?.tireFeeTotal ?? 0;
  const taxRate = fees?.taxRate ?? 0;
  const taxAmount = fees?.taxAmount ?? 0;
  const estimatedTotal = fees ? fees.total : subtotal + HANDLING_FEE;
  const stateUpper = state.trim().toUpperCase();

  return (
    <dl className="mt-4 space-y-3 border-t border-gray-200 pt-4">
      <div className="flex justify-between text-sm">
        <dt className="text-gray-500">Subtotal ({totalItems} tires)</dt>
        <dd className="font-medium text-gray-900">${subtotal.toFixed(2)}</dd>
      </div>
      {tireFeePerTire > 0 && (
        <div className="flex justify-between text-sm">
          <dt className="text-gray-500">{stateUpper} Tire Disposal Fee</dt>
          <dd className="font-medium text-gray-900">${tireFeeTotal.toFixed(2)}</dd>
        </div>
      )}
      <div className="flex justify-between text-sm">
        <dt className="text-gray-500">Handling Fee</dt>
        <dd className="font-medium text-gray-900">${HANDLING_FEE.toFixed(2)}</dd>
      </div>
      <div className="flex justify-between text-sm">
        <dt className="text-gray-500">Shipping</dt>
        <dd className="font-medium text-green-600">Free</dd>
      </div>
      {taxRate > 0 ? (
        <div className="flex justify-between text-sm">
          <dt className="text-gray-500">Est. Tax ({(taxRate * 100).toFixed(2)}%)</dt>
          <dd className="font-medium text-gray-900">${taxAmount.toFixed(2)}</dd>
        </div>
      ) : fees && taxRate === 0 ? (
        <div className="flex justify-between text-sm">
          <dt className="text-gray-500">Tax</dt>
          <dd className="font-medium text-gray-900">$0.00</dd>
        </div>
      ) : null}
      <div className="flex justify-between text-sm">
        <dt className="text-gray-500">Estimated Delivery</dt>
        <dd className="font-medium text-gray-900">3-7 business days</dd>
      </div>
      <div className="border-t border-gray-200 pt-3 flex justify-between">
        <dt className="font-bold text-gray-900">Estimated Total</dt>
        <dd className="font-bold text-lg text-gray-900">${estimatedTotal.toFixed(2)}</dd>
      </div>
    </dl>
  );
}

export default function CheckoutPage() {
  const { items, subtotal, totalItems } = useCart();
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [form, setForm] = useState<ShippingAddress>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    zip: "",
  });

  // Pre-fill from profile when logged in
  useEffect(() => {
    if (!profile) return;
    const nameParts = (profile.full_name || "").split(" ");
    const defaultAddress = profile.saved_addresses?.[0];
    setForm((prev) => ({
      ...prev,
      firstName: prev.firstName || nameParts[0] || "",
      lastName: prev.lastName || nameParts.slice(1).join(" ") || "",
      email: prev.email || profile.email || "",
      phone: prev.phone || profile.phone || "",
      ...(defaultAddress && !prev.address1
        ? {
            address1: defaultAddress.address1 || "",
            address2: defaultAddress.address2 || "",
            city: defaultAddress.city || "",
            state: defaultAddress.state || "",
            zip: defaultAddress.zip || "",
          }
        : {}),
    }));
  }, [profile]);

  if (items.length === 0) {
    return (
      <div className="bg-gray-50 min-h-[60vh]">
        <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-gray-900">No items in cart</h1>
          <p className="mt-2 text-gray-500">Add tires to your cart before checking out.</p>
          <Link href="/tires" className="mt-6 inline-block rounded-lg bg-orange px-6 py-3 text-sm font-bold text-white hover:bg-orange-dark transition-colors">
            Browse Tires
          </Link>
        </div>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/checkout/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, shipping: form, auth_user_id: user?.id || "" }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create checkout session");
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-[60vh]">
      <div className="bg-navy py-10 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Link href="/cart" className="hover:text-white">Cart</Link>
            <span>/</span>
            <span className="text-gray-300">Checkout</span>
          </div>
          <h1 className="mt-4 text-3xl font-bold">Checkout</h1>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Shipping Form */}
          <div className="lg:col-span-2">
            <div className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900">Shipping Information</h2>

              {error && (
                <div className="mt-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">First Name</label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    required
                    value={form.firstName}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange focus:ring-1 focus:ring-orange outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Last Name</label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    required
                    value={form.lastName}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange focus:ring-1 focus:ring-orange outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={form.email}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange focus:ring-1 focus:ring-orange outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    required
                    value={form.phone}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange focus:ring-1 focus:ring-orange outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="address1" className="block text-sm font-medium text-gray-700">Address</label>
                  <input
                    type="text"
                    id="address1"
                    name="address1"
                    required
                    value={form.address1}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange focus:ring-1 focus:ring-orange outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="address2" className="block text-sm font-medium text-gray-700">Apartment, suite, etc. (optional)</label>
                  <input
                    type="text"
                    id="address2"
                    name="address2"
                    value={form.address2}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange focus:ring-1 focus:ring-orange outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700">City</label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    required
                    value={form.city}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange focus:ring-1 focus:ring-orange outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="state" className="block text-sm font-medium text-gray-700">State</label>
                    <input
                      type="text"
                      id="state"
                      name="state"
                      required
                      maxLength={2}
                      placeholder="CA"
                      value={form.state}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange focus:ring-1 focus:ring-orange outline-none uppercase"
                    />
                  </div>
                  <div>
                    <label htmlFor="zip" className="block text-sm font-medium text-gray-700">ZIP Code</label>
                    <input
                      type="text"
                      id="zip"
                      name="zip"
                      required
                      maxLength={10}
                      value={form.zip}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange focus:ring-1 focus:ring-orange outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-32 rounded-xl bg-white border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900">Order Summary</h3>
              <ul className="mt-4 space-y-4">
                {items.map((item) => (
                  <li key={`${item.brandSlug}-${item.modelSlug}-${item.size}`} className="flex gap-3">
                    {item.image ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={item.image}
                        alt={`${item.brand} ${item.model}`}
                        width={56}
                        height={56}
                        className="w-14 h-14 rounded-md object-contain bg-gray-50 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-md bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" strokeWidth="1.5"/><path strokeWidth="1.5" d="M12 2a15.3 15.3 0 0 1 0 20M12 2a15.3 15.3 0 0 0 0 20"/></svg>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.brand} {item.model}</p>
                      <p className="text-xs text-gray-500">{item.size} &middot; Load: {item.loadIndex} &middot; Speed: {item.speedRating}</p>
                      <div className="mt-1 flex justify-between items-baseline">
                        <span className="text-xs text-gray-500">&times;{item.quantity} @ ${Number(item.price).toFixed(2)}/ea</span>
                        <span className="text-sm font-bold text-gray-900">${(Number(item.price) * item.quantity).toFixed(2)}</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              <OrderFeeSummary subtotal={subtotal} totalItems={totalItems} state={form.state} />

              {/* Terms & Return Policy */}
              <label className="mt-5 flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-orange focus:ring-orange"
                />
                <span className="text-xs text-gray-600 leading-snug">
                  I agree to the{" "}
                  <Link href="/returns" target="_blank" className="text-orange underline hover:text-orange-dark">
                    Return &amp; Refund Policy
                  </Link>{" "}
                  and{" "}
                  <Link href="/shipping" target="_blank" className="text-orange underline hover:text-orange-dark">
                    Shipping Policy
                  </Link>. Tires may be returned within 30 days if unmounted and unused.
                </span>
              </label>

              <button
                type="submit"
                disabled={loading || !agreedToTerms}
                className="mt-5 block w-full rounded-lg bg-orange py-3 text-center text-sm font-bold text-white hover:bg-orange-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Processing..." : "Pay with Stripe"}
              </button>
              {!agreedToTerms && (
                <p className="mt-2 text-center text-xs text-red-500">
                  Please agree to the return policy to continue
                </p>
              )}
              <p className="mt-3 text-center text-xs text-gray-400">
                Secure checkout powered by Stripe
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
