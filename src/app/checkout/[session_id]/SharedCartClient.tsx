"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "@/contexts/CartContext";
import type { CartItem } from "@/lib/types";

interface SharedCartClientProps {
  items: CartItem[];
  subtotal: number;
  totalItems: number;
}

export default function SharedCartClient({ items, subtotal, totalItems }: SharedCartClientProps) {
  const { setItems } = useCart();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setItems(items);
    setLoaded(true);
  }, [items, setItems]);

  return (
    <div className="bg-gray-50 min-h-[60vh]">
      <div className="bg-navy py-10 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold">Your Order</h1>
          <p className="mt-1 text-gray-400">
            {totalItems} tire{totalItems !== 1 ? "s" : ""} pre-selected for you
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900">Order Summary</h2>
          <ul className="mt-4 space-y-3">
            {items.map((item, i) => (
              <li key={i} className="flex items-start justify-between py-3 border-b border-gray-100 last:border-0">
                <div>
                  <h3 className="font-medium text-gray-900">{item.brand} {item.model}</h3>
                  <p className="text-sm text-gray-500">
                    Size: {item.size} &middot; Qty: {item.quantity}
                  </p>
                </div>
                <span className="font-bold text-gray-900">${(item.price * item.quantity).toFixed(2)}</span>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex justify-between border-t border-gray-200 pt-4">
            <span className="text-sm text-gray-500">Shipping</span>
            <span className="text-sm font-medium text-green-600">Free</span>
          </div>
          <div className="mt-2 flex justify-between">
            <span className="font-bold text-gray-900">Total</span>
            <span className="font-bold text-lg text-gray-900">${subtotal.toFixed(2)}</span>
          </div>

          <Link
            href="/checkout"
            className={`mt-6 block w-full rounded-lg bg-orange py-3 text-center text-sm font-bold text-white hover:bg-orange-dark transition-colors ${!loaded ? "opacity-50 pointer-events-none" : ""}`}
          >
            Proceed to Checkout
          </Link>
          <p className="mt-3 text-center text-xs text-gray-400">
            Free shipping on all orders. Secure checkout via Stripe.
          </p>
        </div>
      </div>
    </div>
  );
}
