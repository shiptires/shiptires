"use client";

import { useState, useEffect, useCallback } from "react";
import { usePlaidLink } from "react-plaid-link";

interface DealerTire {
  id: number;
  make_name: string;
  model_name: string;
  size: string;
  width: string;
  aspect_ratio: string;
  rim_size: string;
  load_rating: string;
  speed_rating: string;
  season: string;
  category: string;
  image_url: string | null;
  wholesale_price: number | null;
}

interface CartItem {
  tireId: number;
  brand: string;
  model: string;
  size: string;
  price: number;
  quantity: number;
  image: string | null;
  brandSlug: string;
  modelSlug: string;
  loadIndex: number;
  speedRating: string;
}

const CART_KEY = "ship-tires-dealer-cart";

function getCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

function toSlug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default function DealerTireBrowser() {
  const [query, setQuery] = useState("");
  const [size, setSize] = useState("");
  const [brand, setBrand] = useState("");
  const [tires, setTires] = useState<DealerTire[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState("");

  useEffect(() => {
    setCart(getCart());
  }, []);

  const search = useCallback(async (p: number = 1) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (size) params.set("size", size);
    if (brand) params.set("brand", brand);
    params.set("page", p.toString());

    try {
      const res = await fetch(`/api/dealer/tires?${params}`);
      const data = await res.json();
      setTires(data.tires || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
      setPage(p);
    } catch {
      setTires([]);
    } finally {
      setLoading(false);
    }
  }, [query, size, brand]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    search(1);
  }

  function addToCart(tire: DealerTire) {
    if (!tire.wholesale_price) return;

    const updated = [...cart];
    const existing = updated.find((c) => c.tireId === tire.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      updated.push({
        tireId: tire.id,
        brand: tire.make_name,
        model: tire.model_name,
        size: tire.size,
        price: tire.wholesale_price,
        quantity: 1,
        image: tire.image_url,
        brandSlug: toSlug(tire.make_name),
        modelSlug: toSlug(tire.model_name),
        loadIndex: parseInt(tire.load_rating) || 0,
        speedRating: tire.speed_rating || "",
      });
    }
    setCart(updated);
    saveCart(updated);
  }

  function removeFromCart(tireId: number) {
    const updated = cart.filter((c) => c.tireId !== tireId);
    setCart(updated);
    saveCart(updated);
  }

  function updateQuantity(tireId: number, qty: number) {
    if (qty < 1) return removeFromCart(tireId);
    const updated = cart.map((c) => (c.tireId === tireId ? { ...c, quantity: qty } : c));
    setCart(updated);
    saveCart(updated);
  }

  const cartTotal = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);
  const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0);

  async function fetchLinkToken() {
    try {
      const res = await fetch("/api/plaid/create-link-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.link_token) {
        setLinkToken(data.link_token);
      } else {
        setCheckoutError("Failed to initialize payment. Please try again.");
      }
    } catch {
      setCheckoutError("Failed to initialize payment. Please try again.");
    }
  }

  async function handleCheckout() {
    if (cart.length === 0) return;
    setCheckoutError("");
    if (!linkToken) {
      await fetchLinkToken();
    }
    // Plaid Link will be opened by the usePlaidLink hook once linkToken is set
  }

  const { open: openPlaid, ready: plaidReady } = usePlaidLink({
    token: linkToken,
    onSuccess: async (publicToken: string, metadata: { accounts: { id: string }[] }) => {
      const accountId = metadata.accounts[0]?.id;
      if (!accountId) return;

      setCheckoutLoading(true);
      setCheckoutError("");

      try {
        const res = await fetch("/api/dealer/checkout/create-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: cart,
            public_token: publicToken,
            account_id: accountId,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Payment failed");

        saveCart([]);
        setCart([]);
        window.location.href = "/dealer/dashboard/orders?success=true";
      } catch (err) {
        setCheckoutError(err instanceof Error ? err.message : "Payment failed. Please try again.");
      } finally {
        setCheckoutLoading(false);
      }
    },
    onExit: () => {
      setCheckoutLoading(false);
    },
  });

  // Auto-open Plaid Link when token becomes available after checkout button click
  useEffect(() => {
    if (linkToken && plaidReady) {
      openPlaid();
    }
  }, [linkToken, plaidReady, openPlaid]);

  return (
    <div className="flex gap-6">
      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Search */}
        <form onSubmit={handleSearch} className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap gap-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by keyword..."
              className="flex-1 min-w-[200px] rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
            />
            <input
              type="text"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              placeholder="Size (e.g. 225/65R17)"
              className="w-44 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
            />
            <input
              type="text"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="Brand"
              className="w-36 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-gray-900 px-5 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </div>
        </form>

        {/* Results */}
        {total > 0 && (
          <p className="text-sm text-gray-500 mb-3">{total.toLocaleString()} tires found</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {tires.map((tire) => (
            <div key={tire.id} className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col">
              {tire.image_url && (
                <img
                  src={tire.image_url}
                  alt={`${tire.make_name} ${tire.model_name}`}
                  className="w-full h-32 object-contain mb-3"
                />
              )}
              <h3 className="font-semibold text-gray-900 text-sm">
                {tire.make_name} {tire.model_name}
              </h3>
              <p className="text-xs text-gray-500 mt-1">{tire.size}</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tire.season && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{tire.season}</span>
                )}
                {tire.load_rating && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">LI: {tire.load_rating}</span>
                )}
                {tire.speed_rating && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">SR: {tire.speed_rating}</span>
                )}
              </div>
              <div className="mt-auto pt-3 flex items-center justify-between">
                {tire.wholesale_price ? (
                  <>
                    <span className="text-lg font-bold text-gray-900">${tire.wholesale_price.toFixed(2)}</span>
                    <button
                      onClick={() => addToCart(tire)}
                      className="rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-orange-600 transition-colors"
                    >
                      Add to Cart
                    </button>
                  </>
                ) : (
                  <span className="text-sm text-gray-400">Price unavailable</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {tires.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-400 text-sm">
            Search for tires by size, brand, or keyword to see wholesale prices.
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => search(page - 1)}
              disabled={page <= 1}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded disabled:opacity-30 hover:bg-gray-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => search(page + 1)}
              disabled={page >= totalPages}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded disabled:opacity-30 hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Cart Sidebar - Desktop */}
      <div className="hidden lg:block w-80 shrink-0">
        <div className="bg-white rounded-lg border border-gray-200 p-4 sticky top-4">
          <h2 className="font-semibold text-gray-900 mb-3">
            Cart ({cartCount} {cartCount === 1 ? "tire" : "tires"})
          </h2>

          {cart.length === 0 ? (
            <p className="text-sm text-gray-400">Your cart is empty</p>
          ) : (
            <>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {cart.map((item) => (
                  <div key={item.tireId} className="border-b border-gray-100 pb-3">
                    <p className="text-sm font-medium text-gray-900">{item.brand} {item.model}</p>
                    <p className="text-xs text-gray-500">{item.size}</p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.tireId, item.quantity - 1)}
                          className="w-6 h-6 rounded border border-gray-300 text-gray-600 flex items-center justify-center text-xs hover:bg-gray-50"
                        >
                          -
                        </button>
                        <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.tireId, item.quantity + 1)}
                          className="w-6 h-6 rounded border border-gray-300 text-gray-600 flex items-center justify-center text-xs hover:bg-gray-50"
                        >
                          +
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                        <button
                          onClick={() => removeFromCart(item.tireId)}
                          className="text-xs text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-3 border-t border-gray-200">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-semibold text-gray-900">Total</span>
                  <span className="text-lg font-bold text-gray-900">${cartTotal.toFixed(2)}</span>
                </div>
                {checkoutError && (
                  <p className="text-xs text-red-600 mb-2">{checkoutError}</p>
                )}
                <button
                  onClick={handleCheckout}
                  disabled={checkoutLoading}
                  className="w-full rounded-lg bg-orange-500 py-2.5 text-sm font-bold text-white hover:bg-orange-600 disabled:opacity-50 transition-colors"
                >
                  {checkoutLoading ? "Processing..." : "Pay with Bank Account"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mobile Cart FAB */}
      {cart.length > 0 && (
        <button
          onClick={() => setCartOpen(!cartOpen)}
          className="lg:hidden fixed bottom-4 right-4 z-50 bg-orange-500 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
          </svg>
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {cartCount}
          </span>
        </button>
      )}

      {/* Mobile Cart Drawer */}
      {cartOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="fixed inset-0 bg-black/50" onClick={() => setCartOpen(false)} />
          <div className="fixed right-0 inset-y-0 w-80 max-w-full bg-white shadow-xl p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Cart ({cartCount})</h2>
              <button onClick={() => setCartOpen(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {cart.map((item) => (
              <div key={item.tireId} className="border-b border-gray-100 pb-3 mb-3">
                <p className="text-sm font-medium text-gray-900">{item.brand} {item.model}</p>
                <p className="text-xs text-gray-500">{item.size}</p>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQuantity(item.tireId, item.quantity - 1)} className="w-6 h-6 rounded border border-gray-300 text-gray-600 flex items-center justify-center text-xs">-</button>
                    <span className="text-sm font-medium">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.tireId, item.quantity + 1)} className="w-6 h-6 rounded border border-gray-300 text-gray-600 flex items-center justify-center text-xs">+</button>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                    <button onClick={() => removeFromCart(item.tireId)} className="text-xs text-red-500">Remove</button>
                  </div>
                </div>
              </div>
            ))}
            <div className="mt-4 pt-3 border-t border-gray-200">
              <div className="flex justify-between items-center mb-3">
                <span className="font-semibold">Total</span>
                <span className="text-lg font-bold">${cartTotal.toFixed(2)}</span>
              </div>
              <button
                onClick={handleCheckout}
                disabled={checkoutLoading}
                className="w-full rounded-lg bg-orange-500 py-2.5 text-sm font-bold text-white hover:bg-orange-600 disabled:opacity-50"
              >
                {checkoutLoading ? "Processing..." : "Pay with Bank Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
