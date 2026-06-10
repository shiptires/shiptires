"use client";

import Link from "next/link";
import { useCart } from "@/contexts/CartContext";

export default function CartSidebar({
  brand,
  model,
}: {
  brand: string;
  model: string;
}) {
  const { items, removeItem, updateQuantity, totalItems, subtotal } = useCart();

  // Items for this specific model
  const modelItems = items.filter(
    (i) => i.brand === brand && i.model === model
  );
  const otherItems = items.filter(
    (i) => i.brand !== brand || i.model !== model
  );

  if (totalItems === 0) {
    return (
      <div className="sticky top-32 space-y-4">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
            </svg>
            <h3 className="text-lg font-bold text-gray-900">Your Cart</h3>
          </div>
          <p className="text-sm text-gray-500">
            Your cart is empty. Select a size above and click &quot;Add to Cart&quot; to get started.
          </p>
          <div className="mt-4 rounded-lg bg-green-50 border border-green-200 px-4 py-3">
            <p className="text-xs font-bold text-green-800 uppercase tracking-wide">Free Shipping</p>
            <p className="text-xs text-green-700 mt-0.5">Every order ships free to your door or installer.</p>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm text-center">
          <p className="text-xs text-gray-500">Need help choosing?</p>
          <a href="tel:+12792388473" className="mt-1 block text-sm font-bold text-orange hover:underline">
            (279) 238-8473 (TIRE)
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="sticky top-32 space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-orange" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
            </svg>
            <h3 className="text-sm font-bold text-gray-900">Cart ({totalItems})</h3>
          </div>
          <Link href="/cart" className="text-xs text-orange hover:underline font-medium">
            View Full Cart
          </Link>
        </div>

        <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
          {/* Items from this model first */}
          {modelItems.map((item) => (
            <div key={`${item.brandSlug}-${item.modelSlug}-${item.size}`} className="px-4 py-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-gray-900 truncate">{item.brand} {item.model}</p>
                  <p className="text-xs text-gray-500 font-mono">{item.size}</p>
                </div>
                <button
                  onClick={() => removeItem(item.brandSlug, item.modelSlug, item.size)}
                  className="flex-shrink-0 text-gray-400 hover:text-red-500 transition-colors"
                  title="Remove"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => updateQuantity(item.brandSlug, item.modelSlug, item.size, Math.max(1, item.quantity - 1))}
                    className="flex h-6 w-6 items-center justify-center rounded border border-gray-300 text-xs text-gray-600 hover:bg-gray-100"
                  >
                    -
                  </button>
                  <span className="w-8 text-center text-xs font-bold">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.brandSlug, item.modelSlug, item.size, item.quantity + 1)}
                    className="flex h-6 w-6 items-center justify-center rounded border border-gray-300 text-xs text-gray-600 hover:bg-gray-100"
                  >
                    +
                  </button>
                </div>
                <span className="text-sm font-bold text-gray-900">
                  ${(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            </div>
          ))}

          {/* Other items */}
          {otherItems.map((item) => (
            <div key={`${item.brandSlug}-${item.modelSlug}-${item.size}`} className="px-4 py-3 bg-gray-50/50">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-gray-900 truncate">{item.brand} {item.model}</p>
                  <p className="text-xs text-gray-500 font-mono">{item.size}</p>
                </div>
                <button
                  onClick={() => removeItem(item.brandSlug, item.modelSlug, item.size)}
                  className="flex-shrink-0 text-gray-400 hover:text-red-500 transition-colors"
                  title="Remove"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-xs text-gray-500">Qty: {item.quantity}</span>
                <span className="text-xs font-bold text-gray-700">
                  ${(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Subtotal + Checkout */}
        <div className="border-t border-gray-200 px-5 py-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Subtotal</span>
            <span className="text-lg font-bold text-gray-900">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-green-700">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
            </svg>
            <span className="font-medium">Free shipping included</span>
          </div>
          <Link
            href="/checkout"
            className="block w-full rounded-lg bg-orange px-4 py-3 text-center text-sm font-bold text-white hover:bg-orange-dark transition-colors"
          >
            Proceed to Checkout
          </Link>
          <Link
            href="/cart"
            className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-center text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            View Cart
          </Link>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm text-center">
        <p className="text-xs text-gray-500">Need help choosing?</p>
        <a href="tel:+12792388473" className="mt-1 block text-sm font-bold text-orange hover:underline">
          (279) 238-8473 (TIRE)
        </a>
      </div>
    </div>
  );
}
