"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useCart, TIRE_PROTECTION_PRICE } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { calculateOrderFees } from "@/lib/tire-fees";
import type { ShippingAddress } from "@/lib/types";
import PlaidPayButton from "@/components/PlaidPayButton";

function StepIndicator({ current }: { current: number }) {
  const steps = ["Cart", "Shipping", "Payment"];
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {steps.map((step, i) => (
        <div key={step} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                i < current
                  ? "bg-green-500 text-white"
                  : i === current
                    ? "bg-safety-orange text-white"
                    : "bg-gray-200 text-gray-500"
              }`}
            >
              {i < current ? (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              ) : (
                i + 1
              )}
            </div>
            <span className={`mt-1 text-xs font-medium ${i === current ? "text-safety-orange" : "text-gray-500"}`}>
              {step}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`h-0.5 w-12 sm:w-20 mx-2 mb-5 ${i < current ? "bg-green-500" : "bg-gray-200"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

function TrustBadges() {
  return (
    <div className="mt-6 space-y-3 border-t border-gray-200 pt-4">
      <div className="flex items-center gap-2 text-xs text-gray-600">
        <svg className="h-4 w-4 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
        </svg>
        <span>256-bit SSL Encrypted</span>
      </div>
      <div className="flex items-center gap-2 text-xs text-gray-600">
        <svg className="h-4 w-4 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
        </svg>
        <span>Free Shipping &mdash; All Orders</span>
      </div>
      <div className="flex items-center gap-2 text-xs text-gray-600">
        <svg className="h-4 w-4 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
        </svg>
        <span>30-Day Returns</span>
      </div>
      <div className="flex items-center gap-2 text-xs text-gray-600">
        <svg className="h-4 w-4 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
        </svg>
        <span>Manufacturer Warranty</span>
      </div>
    </div>
  );
}

function OrderFeeSummary({ subtotal, totalItems, state, protectionTotal }: { subtotal: number; totalItems: number; state: string; protectionTotal: number }) {
  const fees = useMemo(() => {
    const s = state.trim().toUpperCase();
    if (s.length !== 2) return null;
    return calculateOrderFees(s, totalItems, subtotal);
  }, [state, totalItems, subtotal]);

  const tireFeePerTire = fees?.tireFeePerTire ?? 0;
  const tireFeeTotal = fees?.tireFeeTotal ?? 0;
  const taxRate = fees?.taxRate ?? 0;
  const taxAmount = fees?.taxAmount ?? 0;
  const baseTotal = fees ? fees.total : subtotal;
  const estimatedTotal = baseTotal + protectionTotal;
  const stateUpper = state.trim().toUpperCase();

  return (
    <dl className="mt-4 space-y-3 border-t border-gray-200 pt-4">
      <div className="flex justify-between text-sm">
        <dt className="text-gray-500">Subtotal ({totalItems} tires)</dt>
        <dd className="font-medium text-gray-900">${subtotal.toFixed(2)}</dd>
      </div>
      {protectionTotal > 0 && (
        <div className="flex justify-between text-sm">
          <dt className="text-gray-500">Tire Protection Plan</dt>
          <dd className="font-medium text-gray-900">${protectionTotal.toFixed(2)}</dd>
        </div>
      )}
      {tireFeePerTire > 0 && (
        <div className="flex justify-between text-sm">
          <dt className="text-gray-500">{stateUpper} Tire Disposal Fee</dt>
          <dd className="font-medium text-gray-900">${tireFeeTotal.toFixed(2)}</dd>
        </div>
      )}
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
  const { items, subtotal, totalItems, tireProtection, setTireProtection, protectionTotal } = useCart();
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [linkToken, setLinkToken] = useState<string | null>(null);
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

  // Fetch Plaid link token
  const fetchLinkToken = useCallback(async () => {
    try {
      const res = await fetch("/api/plaid/create-link-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id || undefined }),
      });
      const data = await res.json();
      if (data.link_token) {
        setLinkToken(data.link_token);
      } else {
        setError("Failed to initialize payment. Please try again.");
      }
    } catch {
      setError("Failed to initialize payment. Please try again.");
    }
  }, [user?.id]);

  // Validate form before opening Plaid Link
  const isFormValid = !!(
    form.firstName &&
    form.lastName &&
    form.email &&
    form.phone &&
    form.address1 &&
    form.city &&
    form.state &&
    form.zip &&
    agreedToTerms
  );

  const handlePayClick = async () => {
    if (!isFormValid) {
      setError("Please fill in all shipping fields and agree to the return policy.");
      return;
    }
    setError("");
    if (!linkToken) {
      await fetchLinkToken();
    }
  };

  // Fetch link token when form becomes valid
  useEffect(() => {
    if (isFormValid && !linkToken) {
      fetchLinkToken();
    }
  }, [isFormValid, linkToken, fetchLinkToken]);

  const handlePlaidSuccess = async (publicToken: string, accountId: string) => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/plaid/process-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          public_token: publicToken,
          account_id: accountId,
          shipping: form,
          items,
          tireProtection,
          auth_user_id: user?.id || "",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Payment failed");

      window.location.href = `/checkout/success?order_id=${data.orderId}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  };

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
        <StepIndicator current={1} />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
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
                    autoComplete="given-name"
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
                    autoComplete="family-name"
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
                    autoComplete="email"
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
                    autoComplete="tel"
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
                    autoComplete="address-line1"
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
                    autoComplete="address-line2"
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
                    autoComplete="address-level2"
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
                      autoComplete="address-level1"
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
                      autoComplete="postal-code"
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

              {/* Tire Protection Plan */}
              <div className={`mt-4 rounded-lg border-2 p-4 transition-colors ${tireProtection ? "border-green-500 bg-green-50" : "border-gray-200 bg-gray-50"}`}>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tireProtection}
                    onChange={(e) => setTireProtection(e.target.checked)}
                    className="mt-0.5 h-5 w-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-gray-900">Tire Protection Plan</span>
                      <span className="text-sm font-bold text-gray-900">${TIRE_PROTECTION_PRICE.toFixed(2)}/tire</span>
                    </div>
                    <p className="mt-1 text-xs text-gray-600">
                      Covers nails, potholes &amp; road debris &mdash; repair or replace for 36 months.
                    </p>
                    {tireProtection && (
                      <p className="mt-1 text-xs font-medium text-green-700">
                        {totalItems} tires &times; ${TIRE_PROTECTION_PRICE.toFixed(2)} = ${protectionTotal.toFixed(2)}
                      </p>
                    )}
                    <Link
                      href="/tire-protection"
                      target="_blank"
                      className="mt-1 inline-block text-xs font-medium text-safety-orange hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      See Details &rarr;
                    </Link>
                  </div>
                </label>
              </div>

              <OrderFeeSummary subtotal={subtotal} totalItems={totalItems} state={form.state} protectionTotal={protectionTotal} />

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

              <div className="mt-5" onClick={!isFormValid ? handlePayClick : undefined}>
                <PlaidPayButton
                  linkToken={linkToken}
                  onSuccess={handlePlaidSuccess}
                  onExit={() => setLoading(false)}
                  disabled={!isFormValid}
                  loading={loading}
                />
              </div>
              {!agreedToTerms && (
                <p className="mt-2 text-center text-xs text-red-500">
                  Please agree to the return policy to continue
                </p>
              )}
              <p className="mt-3 text-center text-xs text-gray-400">
                Secure ACH bank payment &mdash; powered by Plaid
              </p>

              <TrustBadges />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
