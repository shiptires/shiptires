"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import CartIcon from "@/components/CartIcon";

const navigation = [
  { name: "Tires", href: "/tires" },
  { name: "Vehicle Lookup", href: "/vehicle-lookup" },
  { name: "Shipping", href: "/shipping" },
  { name: "About", href: "/about" },
  { name: "Blog", href: "/blog" },
  { name: "FAQ", href: "/faq" },
  { name: "Contact", href: "/contact" },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50">
      {/* Freight manifest banner */}
      <div className="bg-rubber text-label-white text-center text-xs sm:text-sm py-1.5 px-4 font-mono">
        <span className="inline-flex items-center gap-1.5 sm:gap-2">
          <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
          </svg>
          <span className="sm:hidden">FREE SHIPPING &mdash; <a href="tel:+12792388473" className="underline">(279) 238-8473</a></span>
          <span className="hidden sm:inline">FREE SHIPPING ON ALL ORDERS &mdash; Call or Text{" "}<a href="tel:+12792388473" className="underline font-semibold">(279) 238-8473 (TIRE)</a></span>
        </span>
      </div>

      <div className="bg-rubber shadow-lg border-b border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 items-center lg:h-24">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link href="/" className="block">
                <Image
                  src="/logo.png"
                  alt="Ship.Tires — Tires Shipped Free"
                  width={400}
                  height={200}
                  className="h-16 w-auto lg:h-20"
                  priority
                  unoptimized
                />
              </Link>
            </div>

            {/* Desktop Navigation + CTA */}
            <div className="hidden lg:flex lg:items-center lg:gap-1 lg:ml-auto">
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
