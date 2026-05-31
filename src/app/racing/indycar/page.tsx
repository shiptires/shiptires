import Link from "next/link";
import Image from "next/image";
import { racingArticles } from "@/data/racing-articles";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "IndyCar Tire Tech & Firestone Analysis | Ship.Tires",
  description:
    "Firestone Firehawk tire technology, primary vs alternate compound strategy, and open-wheel racing tire analysis from the Indianapolis 500 to street circuits.",
};

export default function IndycarPage() {
  const articles = racingArticles.filter((a) => a.series === "indycar");

  return (
    <div className="bg-gray-50">
      {/* Hero */}
      <div className="relative bg-navy text-white overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1600&q=80"
          alt="IndyCar open-wheel racing tire technology"
          fill
          priority
          className="object-cover opacity-20"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-navy via-navy/80 to-orange/10" />
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-orange to-transparent" />

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <Link
            href="/racing"
            className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-orange transition-colors mb-6"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
              />
            </svg>
            Racing Hub
          </Link>
          <div className="inline-flex items-center gap-2 rounded-full border border-orange/30 bg-orange/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-orange mb-4">
            <svg
              className="h-3.5 w-3.5"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Open-Wheel Racing
          </div>
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
            IndyCar Tire Technology
          </h1>
          <p className="mt-3 text-lg text-gray-400 max-w-2xl">
            Firestone Firehawk analysis, primary vs alternate compound strategy,
            and the tire technology that powers America&apos;s fastest
            open-wheel series.
          </p>
        </div>
      </div>

      {/* Articles */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <Link
                key={article.slug}
                href={`/racing/indycar/${article.slug}`}
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
                      INDYCAR
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
                  <p className="mt-2 text-sm text-gray-500 line-clamp-2">
                    {article.excerpt}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {article.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
          {articles.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">
                More articles coming soon. Check back for the latest racing
                intel.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-orange py-14 relative overflow-hidden">
        <div className="absolute inset-0 checkered-accent opacity-50" />
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black text-white tracking-tight">
            Race-Proven Tires. Shipped Free.
          </h2>
          <p className="mt-3 text-lg text-white/90">
            Technology born on the track, delivered to your door.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/tires"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-8 py-3 text-sm font-bold text-orange shadow-lg hover:bg-gray-50 transition-colors"
            >
              Shop Performance Tires
            </Link>
            <a
              href="tel:+19164767689"
              className="inline-flex items-center gap-2 rounded-lg border-2 border-white px-8 py-3 text-sm font-bold text-white hover:bg-white/10 transition-colors"
            >
              (916) 476-7689
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
