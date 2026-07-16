"use client";

import { useState } from "react";
import { useCart } from "@/contexts/CartContext";
import PaymentIcons from "@/components/PaymentIcons";

interface QuantityPickerProps {
  price: number;
  brand: string;
  brandSlug: string;
  model: string;
  modelSlug: string;
  size: string;
  loadIndex: number;
  speedRating: string;
  image?: string;
  tireId?: number;
}

const QTY_OPTIONS = [1, 2, 4] as const;

export default function QuantityPicker({
  price,
  brand,
  brandSlug,
  model,
  modelSlug,
  size,
  loadIndex,
  speedRating,
  image,
  tireId,
}: QuantityPickerProps) {
  const { addItem, setCartOpen } = useCart();
  const [qty, setQty] = useState<number>(4);

  const total = Math.round(price * qty * 100) / 100;

  const handleAdd = () => {
    addItem({
      brand,
      brandSlug,
      model,
      modelSlug,
      size,
      price,
      quantity: qty,
      loadIndex,
      speedRating,
      image,
      tireId,
    });
    setCartOpen(true);

  };

  return (
    <div id="quantity-picker" className="mt-5 rounded-xl bg-gray-50 border border-gray-200 p-5 space-y-4">
      {/* Price per tire */}
      <div>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold text-gray-900">${price.toFixed(2)}</span>
          <span className="text-lg text-gray-500">/tire</span>
        </div>
      </div>

      {/* Quantity selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Quantity
        </label>
        <div className="flex gap-2">
          {QTY_OPTIONS.map((n) => (
            <button
              key={n}
              onClick={() => setQty(n)}
              className={`flex-1 rounded-lg border-2 py-2.5 text-center font-bold transition-colors ${
                qty === n
                  ? "border-safety-orange bg-safety-orange/5 text-safety-orange"
                  : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Total */}
      <div className="flex items-center justify-between border-t border-gray-200 pt-3">
        <span className="text-sm font-medium text-gray-600">
          {qty} {qty === 1 ? "tire" : "tires"} total
        </span>
        <span className="text-xl font-bold text-gray-900">${total}</span>
      </div>

      <p className="text-sm font-medium text-green-600">
        Free shipping included
      </p>

      {/* Add to Cart */}
      <button
        onClick={handleAdd}
        className="w-full flex items-center justify-center gap-2 rounded-xl px-6 py-4 text-lg font-bold text-white transition-colors bg-safety-orange hover:bg-safety-orange/90"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
          />
        </svg>
        Add {qty} to Cart
      </button>

      {/* Accepted payment methods */}
      <PaymentIcons compact />
    </div>
  );
}
