"use client";

import Link from "next/link";
import { useCart } from "@/contexts/CartContext";

export default function CartPage() {
  const { items, removeItem, updateQuantity, subtotal, totalItems } = useCart();

  if (items.length === 0) {
    return (
      <div className="bg-gray-50 min-h-[60vh]">
        <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 lg:px-8">
          <svg className="mx-auto h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
          </svg>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">Your cart is empty</h1>
          <p className="mt-2 text-gray-500">Browse our catalog to find the perfect tires.</p>
          <Link href="/tires" className="mt-6 inline-block rounded-lg bg-orange px-6 py-3 text-sm font-bold text-white hover:bg-orange-dark transition-colors">
            Browse Tires
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-[60vh]">
      <div className="bg-navy py-10 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold">Your Cart</h1>
          <p className="mt-1 text-gray-400">{totalItems} tire{totalItems !== 1 ? "s" : ""} in your cart</p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div
                key={`${item.brandSlug}-${item.modelSlug}-${item.size}`}
                className="rounded-xl bg-white border border-gray-200 p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900">
                      {item.brand} {item.model}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Size: {item.size} &middot; Load: {item.loadIndex} &middot; Speed: {item.speedRating}
                    </p>
                    <p className="mt-1 text-sm font-bold text-gray-900">${item.price.toFixed(2)}/tire</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center rounded-lg border border-gray-300">
                      <button
                        onClick={() => updateQuantity(item.brandSlug, item.modelSlug, item.size, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className="px-3 py-1.5 text-sm font-bold text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed rounded-l-lg"
                      >
                        &minus;
                      </button>
                      <span className="px-3 py-1.5 text-sm font-bold text-gray-900 min-w-[32px] text-center border-x border-gray-300">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.brandSlug, item.modelSlug, item.size, item.quantity + 1)}
                        className="px-3 py-1.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-r-lg"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(item.brandSlug, item.modelSlug, item.size)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                      aria-label="Remove item"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
                  <span className="text-xs text-green-600 font-medium">Free shipping</span>
                  <span className="font-bold text-gray-900">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-32 rounded-xl bg-white border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900">Order Summary</h3>
              <dl className="mt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <dt className="text-gray-500">Subtotal ({totalItems} tires)</dt>
                  <dd className="font-medium text-gray-900">${subtotal.toFixed(2)}</dd>
                </div>
                <div className="flex justify-between text-sm">
                  <dt className="text-gray-500">Shipping</dt>
                  <dd className="font-medium text-green-600">Free</dd>
                </div>
                <div className="border-t border-gray-200 pt-3 flex justify-between">
                  <dt className="font-bold text-gray-900">Total</dt>
                  <dd className="font-bold text-lg text-gray-900">${subtotal.toFixed(2)}</dd>
                </div>
              </dl>
              <Link
                href="/checkout"
                className="mt-6 block w-full rounded-lg bg-orange py-3 text-center text-sm font-bold text-white hover:bg-orange-dark transition-colors"
              >
                Proceed to Checkout
              </Link>
              <Link
                href="/tires"
                className="mt-3 block w-full rounded-lg border border-gray-300 py-3 text-center text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
