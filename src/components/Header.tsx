"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

const navigation = [
  { name: "Tires", href: "/tires" },
  { name: "Vehicle Lookup", href: "/vehicle-lookup" },
  { name: "Shipping", href: "/shipping" },
  { name: "About", href: "/about" },
  { name: "Racing", href: "/racing" },
  { name: "Blog", href: "/blog" },
  { name: "FAQ", href: "/faq" },
  { name: "Contact", href: "/contact" },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50">
      {/* GT racing banner */}
      <div className="bg-orange text-white text-center text-xs sm:text-sm font-bold py-1.5 px-4 tracking-wider uppercase relative overflow-hidden">
        <div className="absolute inset-0 checkered-accent opacity-30" />
        <span className="relative inline-flex items-center gap-2">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
          </svg>
          Free Shipping Nationwide &mdash; Call{" "}
          <a href="tel:+19164767689" className="underline">(916) 476-7689</a>
        </span>
      </div>

      <div className="bg-navy shadow-lg border-b border-orange/20 relative">
        {/* Subtle bottom glow */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange/30 to-transparent" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-28 items-center justify-between lg:h-32">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link href="/" className="block">
                <Image
                  src="/logo.png"
                  alt="Ship.Tires - Tires Delivered Fast"
                  width={300}
                  height={150}
                  className="h-24 w-auto lg:h-28"
                  priority
                />
              </Link>
            </div>

            {/* Desktop Navigation — GT Menu */}
            <nav className="hidden lg:flex lg:items-center lg:gap-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="rounded-md px-3 py-2 text-sm font-medium text-gray-300 transition-all hover:bg-orange/10 hover:text-white"
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* CTA Button */}
            <div className="hidden lg:flex lg:items-center lg:gap-4">
              <a
                href="tel:+19164767689"
                className="text-sm font-medium text-gray-400 hover:text-white transition-colors"
              >
                (916) 476-7689
              </a>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-lg bg-orange px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-orange-light red-glow"
              >
                Get a Quote
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center gap-3 lg:hidden">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-lg bg-orange px-3 py-2 text-xs font-bold text-white"
              >
                Quote
              </Link>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center rounded-lg p-2 text-gray-300 hover:bg-navy-light hover:text-white"
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

        {/* Mobile Menu — GT style */}
        {mobileMenuOpen && (
          <div className="border-t border-orange/10 lg:hidden bg-navy-dark/95 backdrop-blur-sm">
            <div className="space-y-1 px-4 pb-4 pt-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-orange/10 hover:text-white transition-all"
                >
                  {item.name}
                </Link>
              ))}
              <a
                href="tel:+19164767689"
                className="block rounded-md px-3 py-2 text-base font-medium text-orange hover:bg-orange/10"
              >
                Call (916) 476-7689
              </a>
              <Link
                href="/contact"
                onClick={() => setMobileMenuOpen(false)}
                className="mt-2 flex items-center justify-center rounded-lg bg-orange px-4 py-3 text-sm font-bold text-white red-glow"
              >
                Get a Free Quote
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
