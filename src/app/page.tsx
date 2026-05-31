import Link from "next/link";
import Image from "next/image";
import { brands } from "@/data/brands";
import { tireCategories } from "@/data/tire-categories";
import SearchPanel from "@/components/SearchPanel";

const faqItems = [
  {
    q: "How does free shipping work?",
    a: "Every tire order ships free to anywhere in the continental United States. We ship via major carriers and most orders arrive within 3-7 business days.",
  },
  {
    q: "Can you ship tires to my installer?",
    a: "Yes! Just provide your installer's address during checkout and we'll ship directly to them. Many customers have tires waiting at their shop for a quick install appointment.",
  },
  {
    q: "How do I find my tire size?",
    a: "Check the sidewall of your current tires for a number like 225/65R17. You can also use our Vehicle Lookup tool to find compatible sizes by year, make, and model.",
  },
  {
    q: "Do you offer a warranty?",
    a: "All tires come with the manufacturer's warranty. Warranty coverage varies by brand and model — check individual product pages for details.",
  },
  {
    q: "How do I get a price quote?",
    a: "Use the 'Request Quote' button on any tire page, call us at (916) 476-7689, or fill out our contact form. We respond to all quote requests within a few hours.",
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

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* HERO — Gran Turismo Title Screen */}
      <section className="relative bg-navy text-white overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1684779343332-5a8f8d53b75f?w=1600&q=80"
          alt="High-performance tires on a race-ready vehicle"
          fill
          priority
          className="object-cover opacity-10"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-navy via-navy/80 to-navy" />
        <div className="absolute inset-0 bg-gradient-to-br from-orange/5 via-transparent to-transparent" />
        <div className="absolute inset-0 racing-grid" />
        <div className="absolute inset-0 scanlines" />
        {/* GT speed streak */}
        <div className="absolute inset-0 speed-streak" />
        {/* Bottom accent line */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange to-transparent gt-pulse" />

        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="text-center">
            {/* GT badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-orange/30 bg-orange/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.25em] text-orange mb-8 border-glow">
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Engineered for Performance
            </div>

            <h1 className="text-5xl font-black tracking-tight sm:text-7xl lg:text-8xl leading-none">
              TIRES DELIVERED{" "}
              <span className="text-orange">FAST.</span>
            </h1>

            <p className="mx-auto mt-8 max-w-2xl text-lg text-gray-400 leading-relaxed">
              20+ championship brands. 100+ race-proven models. Free nationwide shipping.
              Find your perfect rubber and get it delivered to your door or installer.
            </p>

            {/* GT HUD Stat Bar */}
            <div className="mx-auto mt-10 flex max-w-lg items-center justify-center gap-8 border-t border-b border-white/10 py-4">
              <div className="text-center">
                <div className="text-3xl font-black text-white">20+</div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Brands</div>
              </div>
              <div className="h-8 w-px bg-orange/30" />
              <div className="text-center">
                <div className="text-3xl font-black text-white">100+</div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Models</div>
              </div>
              <div className="h-8 w-px bg-orange/30" />
              <div className="text-center">
                <div className="text-3xl font-black text-orange">FREE</div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Shipping</div>
              </div>
            </div>
          </div>

          {/* Search Panel */}
          <div className="relative mx-auto mt-12 max-w-2xl">
            <SearchPanel />
          </div>
        </div>
      </section>

      {/* HOW IT WORKS — Pit Stop HUD */}
      <section className="py-16 bg-navy-light relative overflow-hidden">
        <div className="absolute inset-0 racing-stripe" />
        <div className="absolute inset-0 speed-lines" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-orange mb-3">Pit Strategy</p>
            <h2 className="text-3xl font-black text-white tracking-tight sm:text-4xl">
              Compare. Buy. Ship. Drive.
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-gray-500">
              Getting new tires has never been easier — just like a pit stop.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { step: "01", title: "Compare", desc: "Browse our catalog of 20+ brands and 100+ tire models. Filter by type, size, or vehicle.", icon: "M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" },
              { step: "02", title: "Buy", desc: "Request a free quote and get competitive pricing on any tire in our catalog.", icon: "M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" },
              { step: "03", title: "Ship", desc: "Free shipping nationwide. We deliver to your home or directly to your local installer.", icon: "M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" },
              { step: "04", title: "Drive", desc: "Get them installed at any local tire shop and hit the road with confidence.", icon: "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
            ].map((item) => (
              <div key={item.step} className="text-center group">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-navy border border-orange/20 group-hover:border-orange/50 transition-all duration-300 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <svg className="relative h-7 w-7 text-orange" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                  </svg>
                </div>
                <div className="mt-3 text-[10px] font-black text-orange/50 tracking-[0.3em] uppercase">{item.step}</div>
                <h3 className="mt-1 text-lg font-bold text-white">{item.title}</h3>
                <p className="mt-2 text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TIRE CATEGORIES — GT Car Select */}
      <section className="py-16 bg-navy relative overflow-hidden">
        <div className="absolute inset-0 racing-grid" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-orange mb-3">Select Your Class</p>
          <h2 className="text-3xl font-black text-white tracking-tight sm:text-4xl">Shop by Tire Type</h2>
          <p className="mt-2 text-gray-500">Every terrain. Every condition. We have the rubber to match your mission.</p>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {tireCategories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/search?type=${cat.type}`}
                className="group relative overflow-hidden rounded-xl bg-navy-dark h-52 border border-white/5 hover:border-orange/40 transition-all duration-500"
              >
                <Image
                  src={cat.image}
                  alt={cat.name}
                  fill
                  className="object-cover opacity-30 group-hover:opacity-20 group-hover:scale-110 transition-all duration-700"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy-dark via-navy/60 to-transparent" />
                {/* GT selection highlight */}
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-orange/30 rounded-xl transition-all duration-300" />
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange/0 group-hover:via-orange/50 to-transparent transition-all duration-500" />
                <div className="relative flex h-full flex-col justify-end p-5">
                  <h3 className="text-lg font-black text-white">{cat.name}</h3>
                  <p className="mt-1 text-sm text-gray-400 line-clamp-2">{cat.description}</p>
                  <span className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-orange uppercase tracking-wider">
                    Shop Now
                    <svg className="h-3 w-3 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED BRANDS — GT Manufacturer Gallery */}
      <section className="py-16 bg-navy-light relative overflow-hidden">
        <div className="absolute inset-0 speed-lines" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-orange mb-3">Manufacturers</p>
          <h2 className="text-3xl font-black text-white tracking-tight sm:text-4xl">20+ Top Tire Brands</h2>
          <p className="mt-2 text-gray-500">
            We carry all the brands you trust — shipped free, nationwide.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7">
            {brands.map((brand) => (
              <Link
                key={brand.slug}
                href={`/tires/${brand.slug}`}
                className="group flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-4 transition-all duration-300 hover:bg-white/10 hover:border-orange/40 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-orange/0 group-hover:from-orange/5 to-transparent transition-all duration-300" />
                <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-white/10 to-white/5 border border-white/10 group-hover:border-orange/30 transition-all">
                  <span className="text-sm font-black text-gray-300 group-hover:text-orange transition-colors">
                    {brand.name.charAt(0)}
                  </span>
                </div>
                <span className="relative text-xs font-medium text-gray-400 group-hover:text-orange text-center transition-colors">
                  {brand.name}
                </span>
              </Link>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link
              href="/tires"
              className="inline-flex items-center gap-2 rounded-lg border border-orange/30 bg-orange/10 px-6 py-3 text-sm font-bold text-orange hover:bg-orange/20 transition-colors"
            >
              View All Brands
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* WHY SHIP.TIRES — Carbon Fiber GT Cockpit */}
      <section className="py-16 bg-navy text-white relative overflow-hidden">
        <div className="absolute inset-0 carbon-fiber" />
        <div className="absolute inset-0 scanlines" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-orange mb-3 text-center">Performance Specs</p>
          <h2 className="text-center text-3xl font-black tracking-tight sm:text-4xl">Why Ship.Tires?</h2>
          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { title: "Free Shipping", desc: "Every order ships free to anywhere in the continental US.", icon: "M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" },
              { title: "Nationwide Coverage", desc: "Delivering to all 50 states. Ship to your home or any installer.", icon: "M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" },
              { title: "Expert Guidance", desc: "Our tire experts help you find the perfect fit. Call or chat anytime.", icon: "M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" },
              { title: "Huge Selection", desc: "20+ brands, 100+ models, 800+ sizes. We have the tire you need.", icon: "M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" },
            ].map((item) => (
              <div key={item.title} className="text-center group">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-orange/20 bg-orange/5 group-hover:bg-orange/10 group-hover:border-orange/40 transition-all duration-300">
                  <svg className="h-6 w-6 text-orange" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                  </svg>
                </div>
                <h3 className="mt-4 text-lg font-bold">{item.title}</h3>
                <p className="mt-2 text-sm text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BANNER — GT Track Section */}
      <section className="relative h-64 sm:h-80 overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1504215680853-026ed2a45def?w=1600&q=80"
          alt="Tire treads close-up"
          fill
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/80 to-transparent" />
        <div className="absolute inset-0 scanlines" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-orange via-transparent to-transparent" />
        <div className="relative flex h-full items-center">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-orange">Tires Delivered Fast</p>
            <h2 className="mt-2 text-3xl font-black text-white sm:text-5xl">
              Every Tire. Every Terrain.
            </h2>
            <p className="mt-2 max-w-lg text-gray-300">
              Whether you&apos;re carving corners on asphalt or conquering back roads in the mud, we&apos;ve got the rubber to match your mission.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ — GT Settings Menu */}
      <section className="py-16 bg-navy-light relative overflow-hidden">
        <div className="absolute inset-0 racing-grid" />
        <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-orange mb-3 text-center">Support</p>
          <h2 className="text-3xl font-black text-white text-center tracking-tight sm:text-4xl">
            Frequently Asked Questions
          </h2>
          <div className="mt-10 space-y-4">
            {faqItems.map((item) => (
              <details key={item.q} className="group rounded-xl bg-navy border border-white/10 hover:border-orange/20 transition-colors">
                <summary className="flex cursor-pointer items-center justify-between px-6 py-4 text-sm font-medium text-gray-200">
                  {item.q}
                  <svg className="h-5 w-5 text-gray-500 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </summary>
                <div className="px-6 pb-4 text-sm text-gray-400">{item.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA — GT Race Start */}
      <section className="bg-orange py-14 relative overflow-hidden">
        <div className="absolute inset-0 checkered-accent opacity-50" />
        <div className="absolute inset-0 scanlines" />
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black text-white tracking-tight sm:text-4xl">Ready to Gear Up?</h2>
          <p className="mt-3 text-lg text-white/90">
            Call us now or request a free quote. We&apos;ll find the right tires and ship them free.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <a
              href="tel:+19164767689"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-8 py-3 text-sm font-bold text-orange shadow-lg hover:bg-gray-50 transition-colors"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
              </svg>
              (916) 476-7689
            </a>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-lg border-2 border-white px-8 py-3 text-sm font-bold text-white hover:bg-white/10 transition-colors"
            >
              Request a Free Quote
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
