"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import CartIcon from "@/components/CartIcon";
import UserMenu from "@/components/UserMenu";
import { SearchResultSkeleton } from "@/components/Skeleton";

const navigation = [
  { name: "Tires", href: "/tires" },
  { name: "Shop by Vehicle", href: "/vehicle-lookup" },
  { name: "Shipping", href: "/shipping" },
];

interface SearchResult {
  brand: string;
  brand_slug: string;
  model: string;
  model_slug: string;
  size: string;
  price: number;
  url: string;
  thumbnail?: string | null;
}

interface VehicleResult {
  year?: string;
  make: string;
  model: string;
  sizes: string[];
  url: string;
}

function SearchModal({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [vehicle, setVehicle] = useState<VehicleResult | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    inputRef.current?.focus();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const doSearch = useCallback(async (q: string) => {
    const thisRequest = ++requestIdRef.current;
    if (q.length < 2) {
      setResults([]);
      setVehicle(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/tires/search?q=${encodeURIComponent(q)}&limit=5`);
      if (requestIdRef.current !== thisRequest) return; // stale response
      const data = await res.json();
      setResults(data.results || []);
      setVehicle(data.vehicle || null);
    } catch {
      if (requestIdRef.current !== thisRequest) return;
      setResults([]);
      setVehicle(null);
    }
    setLoading(false);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val), 300);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && query.trim().length >= 2) {
      // If vehicle detected, go to vehicle page
      if (vehicle) {
        onClose();
        window.location.href = vehicle.url;
        return;
      }
      onClose();
      window.location.href = `/search?q=${encodeURIComponent(query.trim())}`;
    }
  };

  return (
    <div className="fixed inset-0 z-[60] animate-fade-in">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative mx-auto mt-20 w-full max-w-lg px-4">
        <div className="rounded-xl bg-white shadow-2xl overflow-hidden">
          {/* Search input */}
          <div className="flex items-center gap-3 border-b border-gray-200 px-4 py-3">
            <svg className="h-5 w-5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              placeholder="Search by vehicle, size, or brand (e.g. 2018 Camry)"
              value={query}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              className="flex-1 text-sm outline-none placeholder:text-gray-400"
            />
            <button onClick={onClose} className="text-xs text-gray-400 hover:text-gray-600 font-medium">
              ESC
            </button>
          </div>

          {/* Results */}
          {(loading || results.length > 0 || vehicle || query.length >= 2) && (
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="px-1">
                  <SearchResultSkeleton />
                  <SearchResultSkeleton />
                  <SearchResultSkeleton />
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {/* Vehicle match */}
                  {vehicle && (
                    <Link
                      href={vehicle.url}
                      onClick={onClose}
                      className="flex items-center gap-3 px-4 py-3 bg-orange-50 hover:bg-orange-100 transition-colors"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 flex-shrink-0">
                        <svg className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0H21M3.375 14.25h3.053c.29 0 .574.074.826.213l2.396 1.325a2.25 2.25 0 0 0 1.1.287h4.5c.435 0 .858-.148 1.2-.42l1.95-1.56a1.5 1.5 0 0 1 .938-.33h1.787c.415 0 .816.146 1.133.413l.7.588A1.125 1.125 0 0 1 23.25 15.75V17.25a1.125 1.125 0 0 1-1.125 1.125H21M3.375 14.25V5.625A1.125 1.125 0 0 1 4.5 4.5h7.628a1.125 1.125 0 0 1 .897.448l1.95 2.6a1.125 1.125 0 0 0 .897.448H19.5a1.125 1.125 0 0 1 1.125 1.125v5.125" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900">
                          Shop tires for {vehicle.year ? `${vehicle.year} ` : ""}{vehicle.make} {vehicle.model}
                        </p>
                        <p className="text-xs text-gray-600">
                          Sizes: {vehicle.sizes.slice(0, 3).join(", ")}{vehicle.sizes.length > 3 ? ` +${vehicle.sizes.length - 3} more` : ""}
                        </p>
                      </div>
                      <svg className="h-5 w-5 text-orange-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                      </svg>
                    </Link>
                  )}
                  {/* Tire results */}
                  {results.length > 0 ? (
                    <>
                      {results.map((r, i) => (
                        <Link
                          key={i}
                          href={r.url || `/tires/${r.brand_slug}/${r.model_slug}`}
                          onClick={onClose}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                            {r.thumbnail ? (
                              <img
                                src={r.thumbnail}
                                alt={`${r.brand} ${r.model}`}
                                className="h-10 w-10 object-contain"
                              />
                            ) : (
                              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <circle cx="12" cy="12" r="9" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {r.brand} {r.model}
                            </p>
                            <p className="text-xs text-gray-500 font-mono">{r.size}</p>
                          </div>
                          {r.price > 0 && (
                            <span className="text-sm font-bold text-safety-orange flex-shrink-0">
                              ${r.price.toFixed(2)}
                            </span>
                          )}
                        </Link>
                      ))}
                      {/* View all results link */}
                      <Link
                        href={vehicle ? vehicle.url : `/search?q=${encodeURIComponent(query.trim())}`}
                        onClick={onClose}
                        className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-safety-orange hover:bg-safety-orange/5 transition-colors"
                      >
                        {vehicle ? `View all tires for ${vehicle.make} ${vehicle.model}` : "View all results"}
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                        </svg>
                      </Link>
                    </>
                  ) : !vehicle && query.length >= 2 ? (
                    <div className="px-4 py-6 text-center text-sm text-gray-500">
                      No tires found for &ldquo;{query}&rdquo;
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Header({ brandCount, modelCount, tireCount }: { brandCount?: number; modelCount?: number; tireCount?: number } = {}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const brands = brandCount ? `${brandCount}` : "120+";
  const models = modelCount ? `${Math.floor(modelCount / 100) * 100}+` : "800+";
  const tires = tireCount ? `${Math.floor(tireCount / 1000)}K+` : "120K+";

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  return (
    <>
      <header className="sticky top-0 z-50">
        {/* Scrolling ticker banner */}
        <div className="bg-rubber text-label-white text-xs py-1.5 font-mono overflow-hidden border-b-[3px] border-safety-orange">
          <div className="flex whitespace-nowrap ticker-scroll">
            {Array.from({ length: 2 }).map((_, i) => (
              <span key={i} className="flex items-center gap-6 mr-6 tracking-wide">
                <span>■ SHOP ALL TIRES — SHIP FREE</span>
                <span className="text-ink-grey/50">·</span>
                <span>FREE SHIPPING — CONTINENTAL US</span>
                <span className="text-ink-grey/50">·</span>
                <span>EST. TRANSIT <span className="font-bold">3–7 BUSINESS DAYS</span></span>
                <span className="text-ink-grey/50">·</span>
                <span>SHIP TO HOME OR INSTALLER</span>
                <span className="text-ink-grey/50">·</span>
                <span>CALL/TEXT <a href="tel:+12792388473" className="font-bold underline">(279) 238-8473</a></span>
                <span className="text-ink-grey/50">·</span>
                <span>SHOP {brands} BRANDS · {models} MODELS · {tires} TIRES</span>
              </span>
            ))}
          </div>
        </div>

        <div className="bg-rubber shadow-lg border-b border-white/10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-32 items-center sm:h-36 lg:h-40">
              {/* Logo */}
              <div className="flex-shrink-0">
                <Link href="/" className="block">
                  <Image
                    src="/logo.png"
                    alt="Ship.Tires — Tires Shipped Free"
                    width={400}
                    height={200}
                    className="h-28 w-auto sm:h-32 lg:h-36 brightness-150"
                    priority
                  />
                </Link>
              </div>

              {/* Desktop Navigation + CTA */}
              <div className="hidden lg:flex lg:items-center lg:gap-1 lg:ml-8">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="rounded-md px-2.5 py-2 text-sm font-medium text-white/70 transition-all hover:bg-white/10 hover:text-white whitespace-nowrap"
                  >
                    {item.name}
                  </Link>
                ))}
                <a
                  href="tel:+12792388473"
                  className="inline-flex items-center gap-1.5 ml-3 text-sm font-mono font-semibold text-white/80 hover:text-safety-orange transition-colors whitespace-nowrap"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                  </svg>
                  (279) 238-8473
                </a>
                {/* Search icon */}
                <button
                  onClick={() => setSearchOpen(true)}
                  className="rounded-md p-2 text-white/70 hover:bg-white/10 hover:text-white transition-all ml-1"
                  aria-label="Search tires"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                  </svg>
                </button>
                <UserMenu />
                <CartIcon />
                <Link
                  href="/tires"
                  className="inline-flex items-center gap-2 rounded-md bg-safety-orange px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-safety-orange/90 ml-2 whitespace-nowrap"
                >
                  Shop Tires
                </Link>
              </div>

              {/* Mobile right side */}
              <div className="flex items-center gap-3 ml-auto lg:hidden">
                {/* Mobile search icon */}
                <button
                  onClick={() => setSearchOpen(true)}
                  className="inline-flex items-center justify-center rounded-md p-2 text-white/70 hover:text-white"
                  aria-label="Search tires"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                  </svg>
                </button>
                <UserMenu />
                <CartIcon />
                <Link
                  href="/tires"
                  className="inline-flex items-center justify-center rounded-md bg-safety-orange px-3 py-2 text-xs font-bold text-white"
                >
                  Shop
                </Link>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="inline-flex items-center justify-center rounded-md p-2 text-white/70 hover:bg-white/10 hover:text-white"
                  aria-label="Toggle menu"
                >
                  {mobileMenuOpen ? (
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[51] lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 animate-fade-in"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Menu panel */}
          <div className="absolute inset-y-0 right-0 w-72 bg-rubber shadow-2xl animate-slide-in-right">
            <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
              <span className="text-sm font-bold text-white">Menu</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-md p-2 text-white/70 hover:text-white"
                aria-label="Close menu"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-1 px-4 pt-4 pb-6">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-md px-3 py-3 text-base font-medium text-white/70 hover:bg-white/10 hover:text-white transition-all"
                >
                  {item.name}
                </Link>
              ))}
              <a
                href="tel:+12792388473"
                className="flex items-center gap-2 rounded-md px-3 py-3 text-base font-mono font-semibold text-safety-orange"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                </svg>
                (279) 238-8473 (TIRE)
              </a>
              <Link
                href="/tires"
                onClick={() => setMobileMenuOpen(false)}
                className="mt-4 flex items-center justify-center rounded-md bg-safety-orange px-4 py-3 text-sm font-bold text-white"
              >
                Shop All Tires
              </Link>
              <Link
                href="/vehicle-lookup"
                onClick={() => setMobileMenuOpen(false)}
                className="mt-2 flex items-center justify-center rounded-md border border-white/20 px-4 py-3 text-sm font-bold text-white hover:bg-white/10 transition-colors"
              >
                Shop by Vehicle
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Search Modal */}
      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
    </>
  );
}
