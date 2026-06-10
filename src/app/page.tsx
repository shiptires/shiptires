import Link from "next/link";
import { tireCategories } from "@/data/tire-categories";
import { getStats, getAllBrands, brandSummaryToBrand } from "@/lib/db";
import SearchPanel from "@/components/SearchPanel";
import type { Metadata } from "next";

const countryCode: Record<string, string> = {
  France: "FR",
  "United States": "US",
  Japan: "JP",
  Germany: "DE",
  Italy: "IT",
  "South Korea": "KR",
  "United Kingdom": "GB",
  Taiwan: "TW",
  Singapore: "SG",
};

export const metadata: Metadata = {
  title: "Tires Shipped Free. Near You.",
  alternates: { canonical: "https://ship.tires" },
};

const faqItems = [
  {
    q: "How does free shipping work?",
    a: "Every tire order ships free to anywhere in the continental US. We use major carriers and most orders arrive in 3-7 business days.",
  },
  {
    q: "Can you ship tires to my installer?",
    a: "Yes. Provide your installer's address at checkout and we ship directly to them. Many customers have tires waiting at the shop for a quick install appointment.",
  },
  {
    q: "How do I find my tire size?",
    a: "Check the sidewall of your current tires for a number like 225/65R17. You can also use our Vehicle Lookup tool to find compatible sizes by year, make, and model.",
  },
  {
    q: "Do you offer a warranty?",
    a: "All tires come with the manufacturer's warranty. Coverage varies by brand and model — check individual product pages for details.",
  },
  {
    q: "How do I get a price quote?",
    a: "Use the \"Request Quote\" button on any tire page, call or text (279) 238-8473 (TIRE), or fill out our contact form. We respond within a few hours.",
  },
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqItems.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.a,
    },
  })),
};

const typeIcons: Record<string, string> = {
  "all-season": "M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z",
  winter: "M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z",
  summer: "M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z",
  performance: "M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z",
  "all-terrain": "M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3H21m-3.75 3H21",
  "mud-terrain": "M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3H21m-3.75 3H21",
  highway: "M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z",
  touring: "M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12",
};

export const dynamic = "force-dynamic";

export default function HomePage() {
  const stats = getStats();
  const brandRows = getAllBrands();
  const brands = brandRows.map(brandSummaryToBrand);

  const brandCount = stats.brandCount.toLocaleString();
  const modelCount = `${Math.floor(stats.modelCount / 100) * 100}+`;
  const tireCount = `${Math.floor(stats.tireCount / 1000)}K+`;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* SECTION 1: HERO — Two-Column Grid */}
      <section className="bg-label-white py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10 lg:gap-14 items-start">
            {/* Left column — Headline & Stats */}
            <div className="flex flex-col justify-center">
              <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-ink-grey mb-4">
                Nationwide tire freight &middot; Est. Sacramento, CA
              </div>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-rubber tracking-tight leading-[0.95] mb-5">
                Tires shipped free.{" "}
                <span className="text-safety-orange">Near you.</span>
              </h1>
              <p className="text-lg text-ink-grey leading-relaxed mb-8 max-w-lg">
                Search by vehicle or tire size. We ship every order free to your door
                or directly to your installer&mdash;anywhere in the continental US.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                {[
                  { num: brandCount, label: "Brands" },
                  { num: modelCount, label: "Models" },
                  { num: tireCount, label: "Tires" },
                  { num: "$0", label: "Shipping" },
                ].map((s) => (
                  <div key={s.label}>
                    <div className="font-mono text-3xl sm:text-4xl font-bold text-rubber leading-none">
                      {s.num}
                    </div>
                    <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-ink-grey mt-1">
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right column — Shipping Label Card */}
            <div className="relative border-2 border-rubber shadow-[8px_8px_0_#141414] bg-white overflow-hidden">
              {/* FREE SHIPPING stamp overlay */}
              <div className="absolute top-3 right-3 sm:top-4 sm:right-4 stamp text-[10px] sm:text-sm pointer-events-none select-none z-10">
                FREE SHIPPING
              </div>

              {/* Header row */}
              <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b-2 border-rubber">
                <span className="font-display text-sm tracking-wide text-rubber">Ship.Tires</span>
                <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-ink-grey">
                  Priority &middot; Ground
                </span>
              </div>

              {/* FROM row */}
              <div className="hidden sm:grid grid-cols-[88px_1fr] border-b border-dashed border-ink-grey/20">
                <div className="px-4 py-3 border-r border-dashed border-ink-grey/20 text-[10px] font-mono uppercase tracking-[0.2em] text-ink-grey flex items-center">
                  From
                </div>
                <div className="px-4 py-3">
                  <div className="font-display text-xs uppercase tracking-wide text-rubber">
                    Ship.Tires National Fulfillment Network
                  </div>
                </div>
              </div>
              <div className="sm:hidden px-4 py-3 border-b border-dashed border-ink-grey/20">
                <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-ink-grey mb-1">From</div>
                <div className="font-display text-xs uppercase tracking-wide text-rubber">
                  Ship.Tires National Fulfillment
                </div>
              </div>

              {/* TO row */}
              <div className="hidden sm:grid grid-cols-[88px_1fr] border-b border-dashed border-ink-grey/20">
                <div className="px-4 py-3 border-r border-dashed border-ink-grey/20 text-[10px] font-mono uppercase tracking-[0.2em] text-ink-grey flex items-center">
                  To
                </div>
                <div className="px-4 py-3">
                  <div className="font-display text-xs uppercase tracking-wide text-rubber">
                    Your Door &mdash; or Your Local Installer
                  </div>
                </div>
              </div>
              <div className="sm:hidden px-4 py-3 border-b border-dashed border-ink-grey/20">
                <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-ink-grey mb-1">To</div>
                <div className="font-display text-xs uppercase tracking-wide text-rubber">
                  Your Door or Installer
                </div>
              </div>

              {/* CONTENTS row — SearchPanel */}
              <div className="hidden sm:grid grid-cols-[88px_1fr] border-b border-dashed border-ink-grey/20">
                <div className="px-4 py-3 border-r border-dashed border-ink-grey/20 text-[10px] font-mono uppercase tracking-[0.2em] text-ink-grey flex items-start pt-5">
                  Contents
                </div>
                <div className="p-4">
                  <SearchPanel />
                </div>
              </div>
              <div className="sm:hidden px-3 py-3 border-b border-dashed border-ink-grey/20">
                <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-ink-grey mb-2">Contents</div>
                <SearchPanel />
              </div>

              {/* Find my tires CTA */}
              <div className="px-5 py-4">
                <Link
                  href="/tires"
                  className="block w-full text-center rounded bg-safety-orange px-6 py-3 text-sm font-bold uppercase tracking-wide text-white hover:bg-safety-orange/90 transition-colors"
                >
                  Find My Tires
                </Link>
              </div>

              {/* Barcode */}
              <div className="mx-5 barcode" aria-hidden="true" />

              {/* Tracking number */}
              <div className="text-center py-3 text-[10px] font-mono tracking-[0.2em] text-ink-grey/50">
                SHP&middot;TIRE&middot;0279&middot;2388&middot;473
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: HOW IT WORKS — Manifest Line Items */}
      <section className="py-14 sm:py-16 bg-label-white border-t border-ink-grey/10">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-[10px] font-display uppercase tracking-[0.3em] text-ink-grey mb-2">Process</div>
          <h2 className="font-display text-2xl sm:text-3xl text-rubber tracking-tight pb-4 border-b-2 border-rubber">
            How It Works
          </h2>
          <div className="mt-8 space-y-0">
            {[
              { line: "01", title: "Search", desc: `Look up tires by vehicle or size. Browse ${brandCount} brands and ${modelCount} models.` },
              { line: "02", title: "Add to Cart", desc: "Pick your tires and add them to your cart — or call/text (279) 238-8473 to order." },
              { line: "03", title: "Ship", desc: "Every order ships free. Deliver to your door or directly to your installer." },
              { line: "04", title: "Install", desc: "Drop them off at any local tire shop, or have them waiting when you arrive." },
            ].map((item, idx) => (
              <div
                key={item.line}
                className={`flex items-start gap-4 sm:gap-6 py-5 ${idx < 3 ? "border-b border-ink-grey/10" : ""}`}
              >
                <div className="text-sm font-mono font-semibold text-safety-orange w-14 flex-shrink-0 text-right">
                  LN {item.line}
                </div>
                <div>
                  <h3 className="font-display text-lg uppercase text-rubber">{item.title}</h3>
                  <p className="mt-1 text-sm text-ink-grey leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TIRE SIZE SCROLLING STRIP */}
      <section className="bg-rubber py-4 overflow-hidden" aria-hidden="true">
        <div className="flex whitespace-nowrap ticker-scroll">
          {Array.from({ length: 2 }).map((_, i) => (
            <span key={i} className="flex items-center gap-6 mr-6 text-sm font-mono text-label-white/60 tracking-wide">
              <span>225/65R17</span>
              <span className="text-label-white/20">&middot;</span>
              <span>265/70R16</span>
              <span className="text-label-white/20">&middot;</span>
              <span>205/55R16</span>
              <span className="text-label-white/20">&middot;</span>
              <span className="font-bold text-safety-orange">235/45R18</span>
              <span className="text-label-white/20">&middot;</span>
              <span>275/55R20</span>
              <span className="text-label-white/20">&middot;</span>
              <span>195/65R15</span>
              <span className="text-label-white/20">&middot;</span>
              <span className="font-bold text-safety-orange">245/40R19</span>
              <span className="text-label-white/20">&middot;</span>
              <span>33X12.50R15</span>
              <span className="text-label-white/20">&middot;</span>
              <span>215/55R17</span>
              <span className="text-label-white/20">&middot;</span>
              <span>255/70R18</span>
              <span className="text-label-white/20">&middot;</span>
              <span className="font-bold text-safety-orange">285/45R22</span>
              <span className="text-label-white/20">&middot;</span>
              <span>245/65R17</span>
              <span className="text-label-white/20">&middot;</span>
              <span>275/60R20</span>
            </span>
          ))}
        </div>
      </section>

      {/* SECTION 3: TIRE CATEGORIES — Contents Grid */}
      <section className="py-14 sm:py-16 bg-white border-t border-ink-grey/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-[10px] font-display uppercase tracking-[0.3em] text-ink-grey mb-2">Contents</div>
          <h2 className="font-display text-2xl sm:text-3xl text-rubber tracking-tight">
            Shop by Tire Type
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {tireCategories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/search?type=${cat.type}`}
                className="group flex items-start gap-4 rounded-lg border border-ink-grey/15 bg-label-white p-5 transition-all hover:border-safety-orange/40 hover:shadow-sm"
              >
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md border border-ink-grey/15 bg-white">
                  <svg className="h-5 w-5 text-ink-grey group-hover:text-safety-orange transition-colors" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d={typeIcons[cat.type] || typeIcons["all-season"]} />
                  </svg>
                </div>
                <div className="min-w-0">
                  <h3 className="font-display text-sm text-rubber group-hover:text-safety-orange transition-colors">
                    {cat.name}
                  </h3>
                  <p className="mt-1 text-xs text-ink-grey line-clamp-2">{cat.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4: BRANDS — Table Grid */}
      <section className="py-14 sm:py-16 bg-label-white border-t border-ink-grey/10">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-[10px] font-display uppercase tracking-[0.3em] text-ink-grey mb-2">Carriers</div>
          <h2 className="font-display text-2xl sm:text-3xl text-rubber tracking-tight pb-4 border-b-2 border-rubber">
            {brandCount} Brands. Shipped Free.
          </h2>
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 border-l border-t border-ink-grey/15">
            {brands.slice(0, 8).map((brand) => (
              <Link
                key={brand.slug}
                href={`/tires/${brand.slug}`}
                className="group flex items-center justify-between px-4 py-3 border-r border-b border-ink-grey/15 hover:text-safety-orange transition-colors"
              >
                <span className="font-bold text-sm uppercase text-rubber group-hover:text-safety-orange transition-colors">
                  {brand.name}
                </span>
                <span className="font-mono text-[10px] tracking-wider text-ink-grey/50">
                  {brand.tireCount} tires
                </span>
              </Link>
            ))}
          </div>
          <div className="mt-4 text-center font-mono text-xs text-ink-grey/60">
            + {brands.length - 8} more brands available
          </div>
          <div className="mt-6 text-center">
            <Link
              href="/tires"
              className="inline-flex items-center gap-2 rounded-md border border-rubber px-6 py-3 text-sm font-bold text-rubber hover:bg-rubber hover:text-label-white transition-colors"
            >
              View All Brands
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 5: WHY SHIP.TIRES — Specifications */}
      <section className="py-14 sm:py-16 bg-white border-t border-ink-grey/10">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-[10px] font-display uppercase tracking-[0.3em] text-ink-grey mb-2 text-center">Specifications</div>
          <h2 className="text-center font-display text-2xl sm:text-3xl text-rubber tracking-tight">
            Why Ship.Tires?
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-0 sm:grid-cols-2">
            {[
              { title: "Free Shipping", desc: "Every order ships free to anywhere in the continental US. No minimum, no exceptions.", icon: "M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" },
              { title: "Ship to Installer", desc: "Send tires straight to your preferred shop. They'll be ready when you arrive.", icon: "M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" },
              { title: "3-7 Day Delivery", desc: "Most orders arrive within 3-7 business days via major carriers.", icon: "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" },
              { title: "Expert Guidance", desc: "Not sure what you need? Call or text — we'll help you find the right fit.", icon: "M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" },
            ].map((item, idx) => (
              <div key={item.title} className={`flex items-start gap-4 p-5 sm:p-6 ${idx < 2 ? "border-b border-ink-grey/10" : ""} ${idx % 2 === 0 ? "sm:border-r border-ink-grey/10" : ""}`}>
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-safety-orange/10">
                  <svg className="h-5 w-5 text-safety-orange" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                  </svg>
                </div>
                <div>
                  <h3 className="font-display text-sm text-rubber">{item.title}</h3>
                  <p className="mt-1 text-sm text-ink-grey">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 6: FAQ */}
      <section className="py-14 sm:py-16 bg-label-white border-t border-ink-grey/10">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-[10px] font-display uppercase tracking-[0.3em] text-ink-grey mb-2 text-center">Support</div>
          <h2 className="font-display text-2xl sm:text-3xl text-rubber text-center tracking-tight">
            Frequently Asked Questions
          </h2>
          <div className="mt-8 space-y-3">
            {faqItems.map((item) => (
              <details key={item.q} className="group rounded-lg border border-ink-grey/15 bg-white hover:border-ink-grey/30 transition-colors">
                <summary className="flex cursor-pointer items-center justify-between px-5 py-4 text-sm font-bold text-rubber">
                  {item.q}
                  <svg className="h-4 w-4 flex-shrink-0 text-ink-grey transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </summary>
                <div className="px-5 pb-4 text-sm text-ink-grey leading-relaxed">{item.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 7: CTA */}
      <section className="bg-kraft/40 py-14 border-t border-ink-grey/10">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="font-display text-2xl sm:text-3xl text-rubber tracking-tight">
            Get a free quote.
          </h2>
          <p className="mt-3 text-ink-grey">
            Call or text us to order, or request a quote online. We&apos;ll find the right tires and ship them free.
          </p>
          <div className="mt-6 font-mono text-2xl sm:text-3xl font-semibold text-rubber">
            <a href="tel:+12792388473" className="hover:text-safety-orange transition-colors">
              (279) 238-8473 <span className="text-safety-orange">(TIRE)</span>
            </a>
          </div>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <a
              href="tel:+12792388473"
              className="inline-flex items-center gap-2 rounded-md bg-safety-orange px-8 py-3 text-sm font-bold text-white hover:bg-safety-orange/90 transition-colors"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
              </svg>
              Call / Text Now
            </a>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-md border-2 border-rubber px-8 py-3 text-sm font-bold text-rubber hover:bg-rubber hover:text-label-white transition-colors"
            >
              Request a Free Quote
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
