import Link from "next/link";
import Image from "next/image";
import { racingTechArticles } from "@/data/racing-tech";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Racing Tech Center — How Racing R&D Powers Your Tires | Ship.Tires",
  description:
    "Discover how tire technology developed for Formula 1, Le Mans, and professional motorsport shapes the tires on your everyday vehicle. Deep dives into compounds, wet-weather engineering, heat management, and more.",
  alternates: { canonical: "https://ship.tires/racing-tech" },
};

const categoryColors: Record<string, string> = {
  compounds: "bg-purple-600",
  "wet-weather": "bg-blue-600",
  temperature: "bg-amber-600",
  engineering: "bg-green-600",
  consumer: "bg-orange",
};

const categoryLabels: Record<string, string> = {
  compounds: "Compounds",
  "wet-weather": "Wet Weather",
  temperature: "Temperature",
  engineering: "Engineering",
  consumer: "Consumer",
};

const categories = [
  { key: "all", label: "All" },
  { key: "compounds", label: "Compounds" },
  { key: "wet-weather", label: "Wet Weather" },
  { key: "temperature", label: "Temperature" },
  { key: "engineering", label: "Engineering" },
  { key: "consumer", label: "Consumer Impact" },
];

export default function RacingTechCenterPage() {
  const sortedArticles = [...racingTechArticles].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="bg-gray-50">
      {/* Hero */}
      <div className="relative bg-navy text-white overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1504215680853-026ed2a45def?w=1600&q=80"
          alt="Racing tire technology and engineering"
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
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5"
                />
              </svg>
              Racing Technology
            </div>
            <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
              Racing Tech <span className="text-orange">Center</span>
            </h1>
            <p className="mt-4 text-lg text-gray-400 max-w-2xl">
              How the technology that wins races shapes the tires on your
              vehicle.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/racing"
                className="inline-flex items-center gap-2 rounded-lg border border-gray-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-navy-light transition-colors"
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
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter (visual only — server component, shows all) */}
      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-2 py-4">
            {categories.map((cat) => (
              <span
                key={cat.key}
                className={`rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${
                  cat.key === "all"
                    ? "bg-orange text-white"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {cat.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Article Grid */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {sortedArticles.map((article) => (
              <Link
                key={article.slug}
                href={`/racing-tech/${article.slug}`}
                className="group flex flex-col overflow-hidden rounded-xl bg-white border border-gray-200 shadow-sm transition-all hover:shadow-lg hover:border-orange/30"
              >
                {/* Image with category badge */}
                <div className="relative h-52 overflow-hidden">
                  <Image
                    src={article.image}
                    alt={article.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute top-3 left-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase text-white tracking-wider ${
                        categoryColors[article.category] || "bg-gray-600"
                      }`}
                    >
                      {categoryLabels[article.category] || article.category}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{article.date}</span>
                    <span>&middot;</span>
                    <span>{article.readTime}</span>
                  </div>
                  <h2 className="mt-2 text-lg font-bold text-gray-900 group-hover:text-orange transition-colors">
                    {article.title}
                  </h2>
                  <p className="mt-2 text-sm text-gray-500 line-clamp-2">
                    {article.excerpt}
                  </p>

                  {/* Consumer Takeaway */}
                  <div className="mt-auto pt-4">
                    <div className="rounded-lg bg-orange/5 border border-orange/10 p-3">
                      <div className="flex items-start gap-2">
                        <svg
                          className="mt-0.5 h-4 w-4 flex-shrink-0 text-orange"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18"
                          />
                        </svg>
                        <p className="text-xs text-gray-600 line-clamp-2">
                          {article.consumerTakeaway}
                        </p>
                      </div>
                    </div>
                  </div>
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
          <h2 className="text-3xl font-black text-white tracking-tight">
            Race-Proven Technology. On Your Vehicle.
          </h2>
          <p className="mt-3 text-lg text-white/90">
            Shop tires built with the same technology that dominates the world&apos;s
            toughest circuits.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/tires"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-8 py-3 text-sm font-bold text-orange shadow-lg hover:bg-gray-50 transition-colors"
            >
              Shop Performance Tires
            </Link>
            <a
              href="tel:+12792388473"
              className="inline-flex items-center gap-2 rounded-lg border-2 border-white px-8 py-3 text-sm font-bold text-white hover:bg-white/10 transition-colors"
            >
              Call/Text (279) 238-8473 (TIRE)
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
