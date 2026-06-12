"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import CartIcon from "@/components/CartIcon";
import UserMenu from "@/components/UserMenu";

const navigation = [
  { name: "Tires", href: "/tires" },
  { name: "Vehicle Lookup", href: "/vehicle-lookup" },
  { name: "Shipping", href: "/shipping" },
  { name: "About", href: "/about" },
  { name: "Blog", href: "/blog" },
  { name: "FAQ", href: "/faq" },
  { name: "Contact", href: "/contact" },
];

export default function Header({ brandCount, modelCount, tireCount }: { brandCount?: number; modelCount?: number; tireCount?: number } = {}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const brands = brandCount ? `${brandCount}` : "120+";
  const models = modelCount ? `${Math.floor(modelCount / 100) * 100}+` : "800+";
  const tires = tireCount ? `${Math.floor(tireCount / 1000)}K+` : "120K+";

  return (
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
          <div className="flex h-28 items-center lg:h-32">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link href="/" className="block">
                <Image
                  src="/logo.png"
                  alt="Ship.Tires — Tires Shipped Free"
                  width={400}
                  height={200}
                  className="h-24 w-auto lg:h-28 brightness-150"
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

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="border-t border-white/10 lg:hidden bg-rubber">
            <div className="space-y-1 px-4 pb-4 pt-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-md px-3 py-2 text-base font-medium text-white/70 hover:bg-white/10 hover:text-white transition-all"
                >
                  {item.name}
                </Link>
              ))}
              <a
                href="tel:+12792388473"
                className="flex items-center gap-2 rounded-md px-3 py-2 text-base font-mono font-semibold text-safety-orange"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                </svg>
                (279) 238-8473 (TIRE)
              </a>
              <Link
                href="/tires"
                onClick={() => setMobileMenuOpen(false)}
                className="mt-2 flex items-center justify-center rounded-md bg-safety-orange px-4 py-3 text-sm font-bold text-white"
              >
                Shop All Tires
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
