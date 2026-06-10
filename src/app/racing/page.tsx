import Link from "next/link";
import Image from "next/image";
import { racingArticles } from "@/data/racing-articles";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Racing Hub — Tire Strategy, Tech & Motorsport Intelligence | Ship.Tires",
  description:
    "Your source for racing tire intelligence. F1 tire strategy, Le Mans endurance tech, NASCAR rubber science, and how racing technology powers your everyday tires.",
  alternates: { canonical: "https://ship.tires/racing" },
};

const series = [
  {
    name: "Formula 1",
    slug: "f1",
    href: "/racing/f1",
    image: "https://images.unsplash.com/photo-1684779343332-5a8f8d53b75f?w=600&q=70",
    desc: "Tire strategy breakdowns, compound analysis, and pit stop intelligence for every Grand Prix.",
  },
  {
    name: "Le Mans / WEC",
    slug: "le-mans",
    href: "/racing/le-mans",
    image: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=600&q=70",
    desc: "Endurance tire science, hypercar technology, and the rubber that survives 24 hours of racing.",
  },
  {
    name: "NASCAR",
    slug: "nascar",
    href: "/racing/nascar",
    image: "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=600&q=70",
    desc: "Stock car tire strategy, Goodyear Eagle technology, and oval vs road course rubber.",
  },
  {
    name: "IndyCar",
    slug: "indycar",
    href: "/racing/indycar",
    image: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=600&q=70",
    desc: "Firestone tire tech, primary vs alternate compounds, and open-wheel tire intelligence.",
  },
];

export default function RacingHubPage() {
  const latestArticles = [...racingArticles]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6);

  return (
    <div className="bg-gray-50">
      {/* Hero */}
      <div className="relative bg-navy text-white overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1684779343332-5a8f8d53b75f?w=1600&q=80"
          alt="Racing tire technology"
          fill
          priority
          className="object-cover opacity-20"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-navy via-navy/80 to-orange/10" />
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-orange to-transparent" />

        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-orange/30 bg-orange/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-orange mb-6">
              <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Racing Intelligence
            </div>
            <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
              Ship.Tires <span className="text-orange">Racing Hub</span>
            </h1>
            <p className="mt-4 text-lg text-gray-400 max-w-2xl">
              Where motorsport meets the road. Tire strategy breakdowns, racing technology deep dives,
              and how the rubber that wins races powers the tires on your vehicle.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/racing-tech" className="rounded-lg bg-orange px-5 py-2.5 text-sm font-bold text-white hover:bg-orange-light transition-colors">
                Racing Tech Center
              </Link>
              <Link href="/rankings" className="rounded-lg border border-gray-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-navy-light transition-colors">
                Tire Rankings
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Series Grid */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Browse by Series</h2>
          <p className="mt-2 text-gray-500">Dive into tire strategy and technology across the world&apos;s biggest racing series.</p>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {series.map((s) => (
              <Link
                key={s.slug}
                href={s.href}
                className="group relative overflow-hidden rounded-xl bg-navy h-64 border border-transparent hover:border-orange/50 transition-all"
              >
                <Image
                  src={s.image}
                  alt={s.name}
                  fill
                  className="object-cover opacity-35 group-hover:opacity-25 group-hover:scale-105 transition-all duration-500"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy-dark via-navy/60 to-transparent" />
                <div className="relative flex h-full flex-col justify-end p-6">
                  <h3 className="text-xl font-black text-white">{s.name}</h3>
                  <p className="mt-2 text-sm text-gray-400 line-clamp-2">{s.desc}</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-orange uppercase tracking-wider">
                    Explore
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

      {/* Quick Links */}
      <section className="py-8 bg-navy relative overflow-hidden">
        <div className="absolute inset-0 racing-stripe" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <Link href="/racing-tech" className="group flex items-center gap-4 rounded-xl border border-gray-700 bg-navy-light p-5 hover:border-orange/50 transition-colors">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange/10 border border-orange/20">
                <svg className="h-6 w-6 text-orange" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-white group-hover:text-orange transition-colors">Racing Tech Center</h3>
                <p className="text-sm text-gray-500">How racing R&D shapes your tires</p>
              </div>
            </Link>
            <Link href="/rankings" className="group flex items-center gap-4 rounded-xl border border-gray-700 bg-navy-light p-5 hover:border-orange/50 transition-colors">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange/10 border border-orange/20">
                <svg className="h-6 w-6 text-orange" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0016.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.003 6.003 0 01-4.52 0" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-white group-hover:text-orange transition-colors">Tire Performance Index</h3>
                <p className="text-sm text-gray-500">Rankings powered by racing data</p>
              </div>
            </Link>
            <Link href="/tires" className="group flex items-center gap-4 rounded-xl border border-gray-700 bg-navy-light p-5 hover:border-orange/50 transition-colors">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange/10 border border-orange/20">
                <svg className="h-6 w-6 text-orange" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-white group-hover:text-orange transition-colors">Shop Tires</h3>
                <p className="text-sm text-gray-500">Find race-inspired rubber for your ride</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Latest Articles */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Latest Racing Intel</h2>
          <p className="mt-2 text-gray-500">Fresh tire strategy and technology analysis.</p>
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {latestArticles.map((article) => (
              <Link
                key={article.slug}
                href={`/racing/${article.series}/${article.slug}`}
                className="group overflow-hidden rounded-xl bg-white border border-gray-200 shadow-sm transition-all hover:shadow-lg hover:border-orange/30"
              >
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={article.image}
                    alt={article.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute top-3 left-3">
                    <span className="rounded-full bg-orange px-2.5 py-1 text-[10px] font-bold uppercase text-white tracking-wider">
                      {article.series === "le-mans" ? "Le Mans" : article.series.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{article.date}</span>
                    <span>&middot;</span>
                    <span>{article.readTime}</span>
                  </div>
                  <h3 className="mt-2 font-bold text-gray-900 group-hover:text-orange transition-colors">
                    {article.title}
                  </h3>
                  <p className="mt-2 text-sm text-gray-500 line-clamp-2">{article.excerpt}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-orange py-14 relative overflow-hidden">
        <div className="absolute inset-0 checkered-accent opacity-50" />
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black text-white tracking-tight">Race-Inspired Tires. Shipped Free.</h2>
          <p className="mt-3 text-lg text-white/90">
            The same technology that wins races is in the tires we ship to your door.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/tires" className="inline-flex items-center gap-2 rounded-lg bg-white px-8 py-3 text-sm font-bold text-orange shadow-lg hover:bg-gray-50 transition-colors">
              Shop Performance Tires
            </Link>
            <a href="tel:+12792388473" className="inline-flex items-center gap-2 rounded-lg border-2 border-white px-8 py-3 text-sm font-bold text-white hover:bg-white/10 transition-colors">
              Call/Text (279) 238-8473 (TIRE)
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
