"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/contexts/CartContext";
import type { CartItem } from "@/lib/types";

interface BuyClientProps {
  item: CartItem;
  brand: string;
  model: string;
  size: string;
  price: number;
  season: string;
  imageUrl: string | null;
  productUrl: string;
}

export default function BuyClient({
  item,
  brand,
  model,
  size,
  price,
  season,
  imageUrl,
  productUrl,
}: BuyClientProps) {
  const { setItems } = useCart();
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  function handleCheckout() {
    setItems([{ ...item, quantity: qty }]);
    router.push("/checkout");
  }

  return (
    <div className="bg-gray-50 min-h-[60vh]">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-xl bg-white border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex flex-col sm:flex-row">
            {/* Image */}
            {imageUrl && (
              <div className="sm:w-64 flex-shrink-0 bg-gray-100 flex items-center justify-center p-6">
                <img
                  src={imageUrl}
                  alt={`${brand} ${model} ${size}`}
                  className="max-h-48 object-contain"
                />
              </div>
            )}

            {/* Details */}
            <div className="flex-1 p-6">
              <p className="text-sm text-gray-500 uppercase tracking-wide">
                {brand}
              </p>
              <h1 className="mt-1 text-xl font-bold text-gray-900">
                {model}
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                {size}
                {season ? ` · ${season}` : ""}
              </p>

              <p className="mt-4 text-2xl font-bold text-gray-900">
                ${price.toFixed(2)}
                <span className="text-sm font-normal text-gray-500 ml-1">
                  per tire
                </span>
              </p>

              {/* Quantity */}
              <div className="mt-4 flex items-center gap-3">
                <label
                  htmlFor="qty"
                  className="text-sm font-medium text-gray-700"
                >
                  Qty:
                </label>
                <select
                  id="qty"
                  value={qty}
                  onChange={(e) => setQty(Number(e.target.value))}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  {[1, 2, 4, 5, 6, 8].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
                <span className="text-sm text-gray-500">
                  Total: ${(price * qty).toFixed(2)}
                </span>
              </div>

              {/* Checkout button */}
              <button
                onClick={handleCheckout}
                disabled={!ready}
                className={`mt-6 w-full rounded-lg bg-orange py-3 text-sm font-bold text-white hover:bg-orange-dark transition-colors ${
                  !ready ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                Checkout Now
              </button>

              <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
                <span>Free shipping · Secure checkout via Stripe</span>
                <a
                  href={productUrl}
                  className="text-orange hover:underline"
                >
                  View full details
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
