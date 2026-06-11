import Link from "next/link";
import Image from "next/image";
import { tireCategories } from "@/data/tire-categories";
import { getStats, getAllBrands, getTopBrandsForType, brandSummaryToBrand, getModelsByBrand, modelSummaryToModel } from "@/lib/db";
import { getActiveRebates } from "@/lib/rebates";
import { getLogoUrl } from "@/lib/api-helpers";
import { getBrandLogo } from "@/lib/curated-brands";
import SearchPanel from "@/components/SearchPanel";
import TireCard from "@/components/TireCard";
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
  title: "Shop Tires Online — Ship Free to Your Door | Ship.Tires",
  description:
    "Shop tires from Michelin, Goodyear, Bridgestone, Continental, Pirelli, BFGoodrich, Cooper, Hankook, Yokohama & 34 top brands. Find tires for Honda, Toyota, Ford, Chevrolet, BMW, Nissan, Jeep & all vehicles. Ship free to Los Angeles, New York, Houston, Chicago, Phoenix & nationwide.",
  alternates: { canonical: "https://ship.tires" },
};

const faqItems = [
  {
    q: "How does free shipping work at Ship.Tires?",
    a: "Every tire you shop at Ship.Tires ships free to anywhere in the continental US — Los Angeles, New York, Houston, Chicago, Phoenix, and everywhere in between. We use major carriers like UPS, FedEx, and freight services. Most orders arrive in 3-7 business days.",
  },
  {
    q: "Can you ship tires to my installer?",
    a: "Yes. Shop your tires online, provide your installer's address at checkout, and we ship directly to them. Many customers have tires waiting at the shop for a quick install appointment. We ship to installers in every major city.",
  },
  {
    q: "How do I find my tire size?",
    a: "Check the sidewall of your current tires for a number like 225/65R17. You can also use our Vehicle Lookup tool to find compatible sizes by year, make, and model — works for Honda, Toyota, Ford, Chevrolet, BMW, Nissan, Jeep, Tesla, and all vehicle brands.",
  },
  {
    q: "What tire brands do you carry?",
    a: "We carry 34 curated tire brands including Michelin, Goodyear, Bridgestone, Continental, Pirelli, BFGoodrich, Hankook, Yokohama, Cooper, Toyo, Falken, Firestone, Kumho, Nexen, Nitto, Dunlop, Nokian, General, Maxxis, Radar, Ironman, Sumitomo, Uniroyal, Kelly, Mastercraft, Federal, Kenda, Laufenn, Milestar, Sailun, Westlake, Mickey Thompson, Achilles, and Fuzion. Shop any brand and ship free.",
  },
  {
    q: "Can I shop tires by my vehicle?",
    a: "Yes. Enter your year, make, and model in our Vehicle Lookup tool. We support all major vehicle brands: Honda Civic, Honda Accord, Honda CR-V, Toyota Camry, Toyota RAV4, Ford F-150, Chevrolet Silverado, BMW 3 Series, Nissan Altima, Jeep Wrangler, Tesla Model 3, and thousands more.",
  },
  {
    q: "Do you offer a warranty?",
    a: "All tires come with the manufacturer's warranty. Michelin, Goodyear, Bridgestone, Continental, and other major brands offer mileage warranties ranging from 40,000 to 90,000 miles. Check individual product pages for details.",
  },
  {
    q: "How do I place an order?",
    a: "Shop tires by brand, size, or vehicle. Add tires to your cart and check out online — we ship free. You can also call or text (279) 238-8473 (TIRE) to order by phone.",
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

export const revalidate = 300;

export default async function HomePage() {
  const dbTimeout = <T,>(p: Promise<T>, fallback: T, ms = 15000): Promise<T> =>
    Promise.race([p, new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms))]);

  const stats = await dbTimeout(getStats(), { brandCount: 34, modelCount: 800, tireCount: 307000 });
  const brandRows = await dbTimeout(getAllBrands(), []);
  const brands = brandRows.map(brandSummaryToBrand);
  const rebates = await dbTimeout(getActiveRebates(), []);

  // Pre-fetch top brands for each tire category (async DB calls)
  const categoryBrandsMap = new Map<string, ReturnType<typeof brandSummaryToBrand>[]>();
  for (const cat of tireCategories) {
    const typeBrandRows = await dbTimeout(getTopBrandsForType(cat.type), []);
    categoryBrandsMap.set(cat.type, typeBrandRows.map(brandSummaryToBrand));
  }

  // Fetch featured tire models from top brands for the showcase
  const showcaseBrands = ["michelin", "goodyear", "bridgestone", "continental", "cooper", "pirelli", "radar"];
  const featuredTires: { brand: ReturnType<typeof brandSummaryToBrand>; models: ReturnType<typeof modelSummaryToModel>[] }[] = [];
  for (const slug of showcaseBrands) {
    const brand = brands.find((b) => b.slug === slug);
    if (!brand) continue;
    const modelRows = await dbTimeout(getModelsByBrand(slug), []);
    // Filter out commercial/retread/specialty models, prefer models with prices and images
    const consumerModels = modelRows.filter((m) => {
      const name = m.model_name.toLowerCase();
      return !name.includes("retread") && !name.includes("pre-mold")
        && !name.includes("skid steer") && !name.includes("miner")
        && !name.includes("precure") && !name.includes("recap");
    });
    // Prefer models with prices, then by tire_count
    const sorted = [...consumerModels].sort((a, b) => {
      const aHasPrice = (a.min_price ?? 0) > 0 ? 1 : 0;
      const bHasPrice = (b.min_price ?? 0) > 0 ? 1 : 0;
      if (bHasPrice !== aHasPrice) return bHasPrice - aHasPrice;
      return (b.tire_count ?? 0) - (a.tire_count ?? 0);
    });
    const models = sorted.slice(0, 2).map(modelSummaryToModel);
    if (models.length > 0) {
      featuredTires.push({ brand, models });
    }
  }

  const brandCount = String(stats.brandCount || 34);
  const modelCount = String(stats.modelCount ? stats.modelCount.toLocaleString() + "+" : "1,000+");
  const tireCount = stats.tireCount ? (stats.tireCount >= 1000 ? `${Math.floor(stats.tireCount / 1000)}K+` : String(stats.tireCount)) : "100K+";

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
                Shop tires by vehicle or size. We ship every order free to your door
                or directly to your installer&mdash;anywhere in the continental US.
                Find tires for Honda, Toyota, Ford, Chevy, BMW, Nissan, Jeep & more.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                {[
                  { num: brandCount, label: "Top Brands" },
                  { num: modelCount, label: "of Models" },
                  { num: tireCount, label: "Tires in Stock" },
                  { num: "Free", label: "Shipping Always" },
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
              <Link href="/tires/size/225-65r17" className="hover:text-safety-orange transition-colors">225/65R17</Link>
              <span className="text-label-white/20">&middot;</span>
              <Link href="/tires/size/265-70r16" className="hover:text-safety-orange transition-colors">265/70R16</Link>
              <span className="text-label-white/20">&middot;</span>
              <Link href="/tires/size/205-55r16" className="hover:text-safety-orange transition-colors">205/55R16</Link>
              <span className="text-label-white/20">&middot;</span>
              <Link href="/tires/size/235-45r18" className="font-bold text-safety-orange hover:text-safety-orange/80 transition-colors">235/45R18</Link>
              <span className="text-label-white/20">&middot;</span>
              <Link href="/tires/size/275-55r20" className="hover:text-safety-orange transition-colors">275/55R20</Link>
              <span className="text-label-white/20">&middot;</span>
              <Link href="/tires/size/195-65r15" className="hover:text-safety-orange transition-colors">195/65R15</Link>
              <span className="text-label-white/20">&middot;</span>
              <Link href="/tires/size/245-40r19" className="font-bold text-safety-orange hover:text-safety-orange/80 transition-colors">245/40R19</Link>
              <span className="text-label-white/20">&middot;</span>
              <Link href="/tires/size/33x1250r15" className="hover:text-safety-orange transition-colors">33X12.50R15</Link>
              <span className="text-label-white/20">&middot;</span>
              <Link href="/tires/size/215-55r17" className="hover:text-safety-orange transition-colors">215/55R17</Link>
              <span className="text-label-white/20">&middot;</span>
              <Link href="/tires/size/255-70r18" className="hover:text-safety-orange transition-colors">255/70R18</Link>
              <span className="text-label-white/20">&middot;</span>
              <Link href="/tires/size/285-45r22" className="font-bold text-safety-orange hover:text-safety-orange/80 transition-colors">285/45R22</Link>
              <span className="text-label-white/20">&middot;</span>
              <Link href="/tires/size/245-65r17" className="hover:text-safety-orange transition-colors">245/65R17</Link>
              <span className="text-label-white/20">&middot;</span>
              <Link href="/tires/size/275-60r20" className="hover:text-safety-orange transition-colors">275/60R20</Link>
            </span>
          ))}
        </div>
      </section>

      {/* SECTION 2.5: FEATURED TIRES — Top Brands Showcase */}
      {featuredTires.length > 0 && (
        <section className="py-14 sm:py-16 bg-white border-t border-ink-grey/10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-[10px] font-display uppercase tracking-[0.3em] text-ink-grey mb-2">Featured</div>
            <h2 className="font-display text-2xl sm:text-3xl text-rubber tracking-tight mb-3">
              Top Tires from Leading Brands
            </h2>
            <p className="text-ink-grey mb-8 max-w-2xl">
              Shop best-selling tires from the most trusted names in the industry. Every tire ships free to your door or installer.
            </p>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {featuredTires.flatMap(({ brand, models }) =>
                models.map((model) => (
                  <TireCard
                    key={`${brand.slug}-${model.slug}`}
                    model={model}
                    brandSlug={brand.slug}
                    brandName={brand.name}
                    brandLogo={brand.logoUrl || getBrandLogo(brand.name)}
                  />
                ))
              ).slice(0, 8)}
            </div>
            <div className="mt-8 text-center">
              <Link
                href="/tires"
                className="inline-flex items-center gap-2 rounded-md bg-safety-orange px-8 py-3 text-sm font-bold text-white hover:bg-safety-orange/90 transition-colors"
              >
                Shop All Brands
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* SECTION 3: TIRE CATEGORIES — Full Descriptions + Brands */}
      <section className="py-14 sm:py-16 bg-white border-t border-ink-grey/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-[10px] font-display uppercase tracking-[0.3em] text-ink-grey mb-2">Contents</div>
          <h2 className="font-display text-2xl sm:text-3xl text-rubber tracking-tight mb-10">
            Shop Tires by Type — Ship Free
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {tireCategories.map((cat) => {
              // Get pre-fetched top brands for this tire type
              const typeBrands = categoryBrandsMap.get(cat.type) || [];

              // Build the correct search URL for this type
              const searchUrl = (() => {
                switch (cat.type) {
                  case "all-season": return "/search?season=All-Season";
                  case "winter": return "/search?season=Winter";
                  case "summer": return "/search?season=Summer";
                  case "performance": return "/search?category=performance";
                  case "all-terrain": return `/search?terrain=${encodeURIComponent("All-Terrain (A/T)")}`;
                  case "mud-terrain": return `/search?terrain=${encodeURIComponent("Mud-Terrain (M/T)")}`;
                  case "highway": return `/search?terrain=${encodeURIComponent("Highway Terrain (H/T)")}`;
                  case "touring": return "/search?category=touring";
                  default: return "/search";
                }
              })();

              return (
                <Link
                  key={cat.slug}
                  href={searchUrl}
                  className="group rounded-xl border border-ink-grey/15 bg-label-white overflow-hidden hover:border-safety-orange/30 hover:shadow-md transition-all"
                >
                  {/* Tire image */}
                  <div className="relative h-44 sm:h-52 bg-gradient-to-b from-gray-100 to-white overflow-hidden">
                    <Image
                      src={cat.image}
                      alt={cat.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute bottom-3 left-4 right-4">
                      <h3 className="font-display text-xl text-white drop-shadow-lg">
                        {cat.name}
                      </h3>
                    </div>
                  </div>

                  <div className="p-5">
                    <p className="text-sm text-ink-grey leading-relaxed line-clamp-2">
                      {cat.description}
                    </p>

                    {/* Top brands row */}
                    {typeBrands.length > 0 && (
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {typeBrands.slice(0, 4).map((b) => (
                          <span
                            key={b.slug}
                            className="inline-flex items-center gap-1 rounded-md border border-ink-grey/10 bg-white px-2 py-1 text-[10px] font-bold text-rubber"
                          >
                            {b.logoUrl && (
                              <Image
                                src={b.logoUrl}
                                alt={b.name}
                                width={14}
                                height={14}
                                className="h-3.5 w-3.5 object-contain"
                              />
                            )}
                            {b.name}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-safety-orange group-hover:underline">
                      Shop {cat.name} — Ship Free
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                      </svg>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 4: BRANDS — Table Grid */}
      <section className="py-14 sm:py-16 bg-label-white border-t border-ink-grey/10">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-[10px] font-display uppercase tracking-[0.3em] text-ink-grey mb-2">Shop</div>
          <h2 className="font-display text-2xl sm:text-3xl text-rubber tracking-tight pb-4 border-b-2 border-rubber">
            Shop Top Tire Brands. Ship Free.
          </h2>
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4">
            {(() => {
              const priorityOrder = [
                "MICHELIN", "GOODYEAR", "BRIDGESTONE", "CONTINENTAL", "PIRELLI",
                "COOPER", "HANKOOK", "YOKOHAMA", "TOYO", "FIRESTONE",
                "BFGOODRICH", "FALKEN", "RADAR", "NITTO", "KUMHO", "NEXEN",
              ];
              const priorityRank = new Map(priorityOrder.map((n, i) => [n, i + 1]));
              return [...brands]
                .sort((a, b) => {
                  const aR = priorityRank.get(a.name.toUpperCase()) ?? 999;
                  const bR = priorityRank.get(b.name.toUpperCase()) ?? 999;
                  if (aR !== bR) return aR - bR;
                  return (b.tireCount ?? 0) - (a.tireCount ?? 0);
                })
                .slice(0, 16)
                .map((brand) => {
                  const logo = brand.logoUrl || getLogoUrl(brand.domain);
                  return (
                    <Link
                      key={brand.slug}
                      href={`/tires/${brand.slug}`}
                      className="group flex flex-col items-center justify-center rounded-lg border border-ink-grey/15 bg-white p-5 transition-all hover:border-safety-orange/40 hover:shadow-md"
                    >
                      <Image
                        src={logo}
                        alt={brand.name}
                        width={120}
                        height={80}
                        className="h-12 sm:h-16 w-auto object-contain mb-3"
                      />
                      <span className="font-display text-xs sm:text-sm uppercase text-rubber group-hover:text-safety-orange transition-colors text-center">
                        {brand.name}
                      </span>
                      <span className="font-mono text-[10px] tracking-wider text-ink-grey/50 mt-1">
                        {(brand.modelCount ?? 0) > 0 ? `${brand.modelCount} models` : "Shop Tires →"}
                      </span>
                    </Link>
                  );
                });
            })()}
          </div>
          {brands.length > 12 && (
            <div className="mt-4 text-center font-mono text-xs text-ink-grey/60">
              + {brands.length - 12} more brands available
            </div>
          )}
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

      {/* SECTION 5.5: REBATES */}
      {rebates.length > 0 && (
        <section className="py-14 sm:py-16 bg-label-white border-t border-ink-grey/10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-[10px] font-display uppercase tracking-[0.3em] text-ink-grey mb-2">Promotions</div>
            <h2 className="font-display text-2xl sm:text-3xl text-rubber tracking-tight mb-8">
              Current Tire Rebates
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {rebates.slice(0, 6).map((rebate) => (
                <div
                  key={rebate.id}
                  className="rounded-xl border border-ink-grey/15 bg-white overflow-hidden hover:shadow-md transition-shadow"
                >
                  {rebate.imagePreviewUrl && (
                    <div className="relative h-40 bg-gray-50">
                      <Image
                        src={rebate.imagePreviewUrl}
                        alt={rebate.name}
                        fill
                        className="object-contain p-2"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase text-safety-orange">
                        Save ${rebate.amount}
                      </span>
                      <span className="text-[10px] font-mono text-ink-grey/60">
                        Ends {new Date(rebate.endDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                    <h3 className="mt-1 font-display text-sm text-rubber leading-tight">
                      {rebate.name}
                    </h3>
                    <p className="mt-1 text-xs text-ink-grey line-clamp-2">
                      {rebate.description}
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <Link
                        href={`/tires/${rebate.brandName.toLowerCase().replace(/\s+/g, "-")}`}
                        className="inline-flex items-center rounded-md bg-safety-orange px-3 py-1.5 text-xs font-bold text-white hover:bg-safety-orange/90 transition-colors"
                      >
                        Shop {rebate.brandName}
                      </Link>
                      {rebate.formUrl && (
                        <a
                          href={rebate.formUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center rounded-md border border-ink-grey/20 px-3 py-1.5 text-xs font-medium text-ink-grey hover:bg-gray-50 transition-colors"
                        >
                          Rebate Form
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* SECTION 5.7: SHOP BY VEHICLE — AEO/AI Optimization */}
      <section className="py-14 sm:py-16 bg-white border-t border-ink-grey/10">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-[10px] font-display uppercase tracking-[0.3em] text-ink-grey mb-2 text-center">Shop by Vehicle</div>
          <h2 className="font-display text-2xl sm:text-3xl text-rubber tracking-tight text-center">
            Shop Tires for Your Vehicle — Ship Free
          </h2>
          <p className="mt-3 text-center text-ink-grey max-w-2xl mx-auto">
            Find the right tires for your car, truck, or SUV. Enter your year, make, and model to see compatible sizes from hundreds of brands.
          </p>
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[
              "Honda", "Toyota", "Ford", "Chevrolet", "Nissan", "BMW",
              "Mercedes-Benz", "Hyundai", "Kia", "Jeep", "Ram", "GMC",
              "Subaru", "Volkswagen", "Audi", "Lexus", "Mazda", "Tesla",
              "Dodge", "Buick", "Cadillac", "Chrysler", "Acura", "Infiniti",
              "Volvo", "Land Rover", "Porsche", "Lincoln", "Genesis", "Mitsubishi",
              "MINI", "Alfa Romeo",
            ].map((make) => (
              <Link
                key={make}
                href={`/vehicle-lookup?make=${encodeURIComponent(make)}`}
                className="rounded-lg border border-ink-grey/15 bg-label-white px-4 py-3 text-sm font-bold text-rubber hover:border-safety-orange/40 hover:bg-white transition-all text-center"
              >
                Shop {make} Tires
              </Link>
            ))}
          </div>
          <div className="mt-6 text-center">
            <Link
              href="/vehicle-lookup"
              className="inline-flex items-center gap-2 text-sm font-bold text-safety-orange hover:underline"
            >
              Find Tires by Year, Make & Model
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 5.8: SHIP TO YOUR CITY — Location SEO */}
      <section className="py-14 sm:py-16 bg-label-white border-t border-ink-grey/10">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-[10px] font-display uppercase tracking-[0.3em] text-ink-grey mb-2 text-center">Nationwide Shipping</div>
          <h2 className="font-display text-2xl sm:text-3xl text-rubber tracking-tight text-center">
            Shop Tires Online — Ship Free to Any City
          </h2>
          <p className="mt-3 text-center text-ink-grey max-w-2xl mx-auto">
            We ship tires free to every city in the continental US. Order online from hundreds of brands and get your tires delivered in 3-7 business days.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {([
              ["Los Angeles", "/locations/california/los-angeles"],
              ["New York", "/locations/new-york/new-york"],
              ["Chicago", "/locations/illinois/chicago"],
              ["Houston", "/locations/texas/houston"],
              ["Phoenix", "/locations/arizona/phoenix"],
              ["Philadelphia", "/locations/pennsylvania/philadelphia"],
              ["San Antonio", "/locations/texas/san-antonio"],
              ["San Diego", "/locations/california/san-diego"],
              ["Dallas", "/locations/texas/dallas"],
              ["San Jose", "/locations/california/san-jose"],
              ["Austin", "/locations/texas/austin"],
              ["Jacksonville", "/locations/florida/jacksonville"],
              ["Fort Worth", "/locations/texas/fort-worth"],
              ["Columbus", "/locations/ohio/columbus"],
              ["Charlotte", "/locations/north-carolina/charlotte"],
              ["Indianapolis", "/locations/indiana/indianapolis"],
              ["San Francisco", "/locations/california/san-francisco"],
              ["Seattle", "/locations/washington/seattle"],
              ["Denver", "/locations/colorado/denver"],
              ["Nashville", "/locations/tennessee/nashville"],
              ["Oklahoma City", "/locations/oklahoma/oklahoma-city"],
              ["El Paso", "/locations/texas/el-paso"],
              ["Washington DC", "/locations/district-of-columbia/washington"],
              ["Las Vegas", "/locations/nevada/las-vegas"],
              ["Portland", "/locations/oregon/portland"],
              ["Memphis", "/locations/tennessee/memphis"],
              ["Louisville", "/locations/kentucky/louisville"],
              ["Baltimore", "/locations/maryland/baltimore"],
              ["Milwaukee", "/locations/wisconsin/milwaukee"],
              ["Albuquerque", "/locations/new-mexico/albuquerque"],
              ["Tucson", "/locations/arizona/tucson"],
              ["Fresno", "/locations/california/fresno"],
              ["Sacramento", "/locations/california/sacramento"],
              ["Mesa", "/locations/arizona/mesa"],
              ["Kansas City", "/locations/missouri/kansas-city"],
              ["Atlanta", "/locations/georgia/atlanta"],
              ["Omaha", "/locations/nebraska/omaha"],
              ["Colorado Springs", "/locations/colorado/colorado-springs"],
              ["Raleigh", "/locations/north-carolina/raleigh"],
              ["Miami", "/locations/florida/miami"],
              ["Tampa", "/locations/florida/tampa"],
              ["Minneapolis", "/locations/minnesota/minneapolis"],
              ["Detroit", "/locations/michigan/detroit"],
              ["Cleveland", "/locations/ohio/cleveland"],
              ["St. Louis", "/locations/missouri/st-louis"],
              ["Pittsburgh", "/locations/pennsylvania/pittsburgh"],
              ["Orlando", "/locations/florida/orlando"],
              ["Cincinnati", "/locations/ohio/cincinnati"],
              ["Newark", "/locations/new-jersey/newark"],
              ["Boston", "/locations/massachusetts/boston"],
            ] as const).map(([city, href]) => (
              <Link
                key={city}
                href={href}
                className="rounded-full border border-ink-grey/10 bg-white px-3 py-1 text-xs text-ink-grey hover:border-safety-orange/40 hover:text-safety-orange transition-colors"
              >
                Ship to {city}
              </Link>
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
            Ready to Shop? We Ship Free.
          </h2>
          <p className="mt-3 text-ink-grey">
            Shop hundreds of top tire brands, find your size, and order online. Every tire ships free
            to your door or installer. Tires for Honda, Toyota, Ford, Chevy, BMW & all vehicles.
          </p>
          <div className="mt-6 font-mono text-2xl sm:text-3xl font-semibold text-rubber">
            <a href="tel:+12792388473" className="hover:text-safety-orange transition-colors">
              (279) 238-8473 <span className="text-safety-orange">(TIRE)</span>
            </a>
          </div>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/tires"
              className="inline-flex items-center gap-2 rounded-md bg-safety-orange px-8 py-3 text-sm font-bold text-white hover:bg-safety-orange/90 transition-colors"
            >
              Shop All Tires
            </Link>
            <Link
              href="/vehicle-lookup"
              className="inline-flex items-center gap-2 rounded-md border-2 border-rubber px-8 py-3 text-sm font-bold text-rubber hover:bg-rubber hover:text-label-white transition-colors"
            >
              Find Tires by Vehicle
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
