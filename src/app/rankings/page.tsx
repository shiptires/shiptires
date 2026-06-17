import Link from "next/link";
import { tireRankings } from "@/data/tire-rankings";
import { getModelsByBrand, toSlug } from "@/lib/db/turso";
import TireImage from "@/components/TireImage";
import { sitePrice } from "@/lib/pricing";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Tire Performance Index — Racing-Informed Tire Rankings | Ship.Tires",
  description:
    "Data-driven tire rankings informed by racing technology. Find the best tires for wet weather, track days, off-road, touring, winter, EV, truck, and budget tires.",
  alternates: { canonical: "https://ship.tires/rankings" },
};

/* ---------- slug helper ---------- */
function slug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/* ---------- category icons ---------- */
const categoryIcons: Record<string, React.ReactNode> = {
  "best-wet-weather-tires": (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
    </svg>
  ),
  "best-track-day-tires": (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
  ),
  "best-all-terrain-off-road": (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.115 5.19l.319 1.913A6 6 0 008.11 10.36L9.75 12l-.387.775c-.217.433-.132.956.21 1.298l1.348 1.348c.21.21.329.497.329.795v1.089c0 .426.24.815.622 1.006l.153.076c.433.217.956.132 1.298-.21l.723-.723a8.7 8.7 0 002.288-4.042 1.087 1.087 0 00-.358-1.099l-1.33-1.108c-.251-.21-.582-.299-.905-.245l-1.17.195a1.125 1.125 0 01-.98-.314l-.295-.295a1.125 1.125 0 010-1.591l.13-.132a1.125 1.125 0 011.3-.21l.603.302a.809.809 0 001.086-1.086L14.25 7.5l1.256-.837a4.5 4.5 0 001.528-1.732l.146-.292M6.115 5.19A9 9 0 1017.18 4.64M6.115 5.19A8.965 8.965 0 0112 3c1.929 0 3.716.607 5.18 1.64" />
    </svg>
  ),
  "best-touring-long-distance": (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
    </svg>
  ),
  "best-winter-tires": (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m0 13.5V21m-6.364-2.636l1.591-1.591m9.546 0l1.591 1.591M3 12h2.25m13.5 0H21m-14.636-6.364l1.591 1.591m9.546 0l-1.591-1.591M12 8.25a3.75 3.75 0 100 7.5 3.75 3.75 0 000-7.5z" />
    </svg>
  ),
  "best-ev-tires": (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 10.5h.375c.621 0 1.125.504 1.125 1.125v2.25c0 .621-.504 1.125-1.125 1.125H21M3.75 18h15A2.25 2.25 0 0021 15.75v-6a2.25 2.25 0 00-2.25-2.25h-15A2.25 2.25 0 001.5 9.75v6A2.25 2.25 0 003.75 18z" />
    </svg>
  ),
  "best-truck-tires": (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
    </svg>
  ),
  "best-budget-tires": (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

/* ---------- rank badge colours ---------- */
function rankClasses(rank: number): string {
  switch (rank) {
    case 1:
      return "bg-amber-500 text-white";
    case 2:
      return "bg-gray-400 text-white";
    case 3:
      return "bg-amber-700 text-white";
    default:
      return "bg-gray-200 text-gray-600";
  }
}

function rankLabel(rank: number): string {
  switch (rank) {
    case 1:
      return "1st";
    case 2:
      return "2nd";
    case 3:
      return "3rd";
    default:
      return `${rank}th`;
  }
}

/* ---------- score bar width ---------- */
function scoreWidth(score: number): string {
  return `${(score / 10) * 100}%`;
}

/* ---------- dynamic stats ---------- */
const totalCategories = tireRankings.length;
const totalTires = tireRankings.reduce((sum, cat) => sum + cat.tires.length, 0);

/* ---------- ItemList schemas ---------- */
const itemListSchemas = tireRankings.map((cat) => ({
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: cat.category,
  description: cat.description,
  numberOfItems: cat.tires.length,
  itemListElement: cat.tires.map((tire) => ({
    "@type": "ListItem",
    position: tire.rank,
    name: `${tire.brand} ${tire.model}`,
    url: `https://ship.tires/tires/${slug(tire.brand)}/${slug(tire.dbModel ?? tire.model)}`,
  })),
}));

export const revalidate = 300; // 5 minutes

// Pre-fetch image + price data for all ranked tires
async function getRankingTireData() {
  const data = new Map<string, { image?: string; minPrice?: number }>();
  const brandSlugs = new Set(
    tireRankings.flatMap((cat) => cat.tires.map((t) => slug(t.brand)))
  );

  await Promise.all(
    Array.from(brandSlugs).map(async (brandSlug) => {
      try {
        const models = await getModelsByBrand(brandSlug.toUpperCase());
        for (const m of models) {
          const key = `${brandSlug}/${toSlug(m.model_name)}`;
          data.set(key, {
            image: m.thumbnail_url ?? undefined,
            minPrice: sitePrice(m.min_price),
          });
        }
      } catch {
        // ignore
      }
    })
  );

  return data;
}

export default async function RankingsPage() {
  const tireData = await getRankingTireData();
  return (
    <div className="bg-gray-50">
      {/* ItemList JSON-LD per category */}
      {itemListSchemas.map((schema) => (
        <script
          key={schema.name}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      {/* ============================== HERO ============================== */}
      <section className="relative bg-navy text-white overflow-hidden">
        {/* subtle decorative gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-navy via-navy/90 to-orange/5" />
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-orange to-transparent" />

        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="max-w-3xl">
            {/* badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-orange/30 bg-orange/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-orange mb-6">
              {/* trophy icon */}
              <svg
                className="h-4 w-4"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0016.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.003 6.003 0 01-4.52 0" />
              </svg>
              Performance Index
            </div>

            <h1 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
              Tire Performance{" "}
              <span className="text-orange">Index</span>
            </h1>

            <p className="mt-5 text-lg text-gray-400 max-w-2xl leading-relaxed">
              Data-driven rankings informed by decades of racing technology and
              real-world testing. Every score reflects the engineering that wins
              on Sunday and protects you on Monday.
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
                Back to Racing Hub
              </Link>
              <Link
                href="/tires"
                className="rounded-lg bg-orange px-5 py-2.5 text-sm font-bold text-white hover:bg-orange-light transition-colors"
              >
                Shop Tires
              </Link>
            </div>
          </div>

          {/* floating stat cards */}
          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: "Categories Ranked", value: String(totalCategories) },
              { label: "Tires Evaluated", value: String(totalTires) },
              { label: "Data Points", value: `${totalTires * 5}+` },
              { label: "Racing Series Referenced", value: "10+" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-gray-700/60 bg-navy-light/50 px-4 py-4 text-center backdrop-blur-sm"
              >
                <div className="text-2xl font-black text-orange">
                  {stat.value}
                </div>
                <div className="mt-1 text-xs font-medium uppercase tracking-wider text-gray-500">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================== JUMP LINKS ============================== */}
      <section className="border-b border-gray-200 bg-white sticky top-0 z-30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-1 overflow-x-auto py-3 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            {tireRankings.map((cat) => (
              <a
                key={cat.slug}
                href={`#${cat.slug}`}
                className="shrink-0 rounded-lg px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors whitespace-nowrap"
              >
                {cat.category}
              </a>
            ))}
          </nav>
        </div>
      </section>

      {/* ============================== RANKINGS ============================== */}
      {tireRankings.map((category, catIdx) => (
        <section
          key={category.slug}
          id={category.slug}
          className={`scroll-mt-16 ${catIdx % 2 === 0 ? "bg-gray-50" : "bg-white"}`}
        >
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
            {/* category header */}
            <div className="flex items-start gap-4 mb-3">
              <div className="mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange/10 text-orange border border-orange/20">
                {categoryIcons[category.slug]}
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight sm:text-3xl">
                  {category.category}
                </h2>
                <p className="mt-2 max-w-3xl text-gray-500 leading-relaxed">
                  {category.description}
                </p>
              </div>
            </div>

            {/* ranking cards */}
            <div className="mt-8 space-y-3">
              {category.tires.map((tire) => {
                const modelSlug = slug(tire.dbModel ?? tire.model);
                const brandSlug = slug(tire.brand);
                const info = tireData.get(`${brandSlug}/${modelSlug}`);
                return (
                <Link
                  key={`${category.slug}-${tire.rank}`}
                  href={`/tires/${brandSlug}/${modelSlug}`}
                  className={`flex items-center gap-4 rounded-xl border p-4 shadow-sm transition-all hover:shadow-md sm:p-5 ${
                    tire.rank === 1
                      ? "border-amber-300 bg-amber-50/40 ring-1 ring-amber-200/60"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  {/* rank badge */}
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-black ${rankClasses(tire.rank)}`}
                    title={rankLabel(tire.rank)}
                  >
                    #{tire.rank}
                  </div>

                  {/* tire image */}
                  <div className="hidden sm:flex h-16 w-16 shrink-0 items-center justify-center">
                    {info?.image ? (
                      <TireImage
                        src={info.image}
                        alt={`${tire.brand} ${tire.model}`}
                        width={64}
                        height={64}
                        className="h-14 w-14 object-contain"
                      />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                        <svg className="h-7 w-7 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={0.5} stroke="currentColor">
                          <circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* tire info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-gray-900">
                      {tire.brand}{" "}
                      <span className="text-gray-700">{tire.model}</span>
                    </div>
                    <p className="mt-1 text-sm text-gray-500 italic line-clamp-2">
                      {tire.racingConnection}
                    </p>
                    {info?.minPrice && info.minPrice > 0 && (
                      <div className="mt-1">
                        <span className="text-xs text-gray-400">From </span>
                        <span className="text-sm font-bold text-gray-900">${info.minPrice}</span>
                        <span className="text-xs text-gray-400">/tire</span>
                      </div>
                    )}
                  </div>

                  {/* score column */}
                  <div className="shrink-0 flex flex-col items-end gap-1.5">
                    <div className="flex items-baseline gap-0.5">
                      <span className="text-xl font-black text-orange">
                        {tire.score}
                      </span>
                      <span className="text-xs font-medium text-gray-400">
                        /10
                      </span>
                    </div>
                    {/* score bar */}
                    <div className="hidden w-24 sm:block">
                      <div className="h-1.5 w-full rounded-full bg-gray-200">
                        <div
                          className="h-1.5 rounded-full bg-orange transition-all"
                          style={{ width: scoreWidth(tire.score) }}
                        />
                      </div>
                    </div>
                  </div>
                </Link>
                );
              })}
            </div>
          </div>
        </section>
      ))}

      {/* ============================== METHODOLOGY ============================== */}
      <section className="bg-navy py-16 text-white relative overflow-hidden">
        <div className="absolute inset-0 racing-stripe" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
              How We <span className="text-orange">Rank</span>
            </h2>
            <p className="mt-4 text-gray-400 leading-relaxed">
              Our Performance Index evaluates tires across grip, durability,
              wet-weather safety, noise, tread life, and value&mdash;weighted by
              category. Every ranking cross-references
              manufacturer testing data with real-world consumer reviews and
              verified racing heritage claims.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {[
              {
                title: "Racing-Informed",
                desc: "We verify every claimed racing connection, tracing compound and tread technology back to documented motorsport programs.",
                icon: (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
                  />
                ),
              },
              {
                title: "Data-Driven",
                desc: "Scores are built from measurable test results: braking distance, hydroplaning resistance, lap times, and tread wear rates.",
                icon: (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
                  />
                ),
              },
              {
                title: "Independently Tested",
                desc: "We are not paid by any tire manufacturer. Rankings reflect unbiased evaluation free from brand sponsorship influence.",
                icon: (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                  />
                ),
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-gray-700/60 bg-navy-light/50 p-6 backdrop-blur-sm"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange/10 border border-orange/20 text-orange">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    {item.icon}
                  </svg>
                </div>
                <h3 className="mt-4 font-bold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-400">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================== QUICK LINKS ============================== */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-black text-gray-900 tracking-tight text-center">
            Explore More
          </h2>
          <p className="mt-2 text-center text-gray-500">
            Dive deeper into racing tech or find the perfect tire for your
            vehicle.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {/* Racing Hub */}
            <Link
              href="/racing"
              className="group flex items-center gap-4 rounded-xl border border-gray-200 bg-gray-50 p-6 transition-all hover:shadow-lg hover:border-orange/30"
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-orange/10 border border-orange/20 text-orange">
                <svg
                  className="h-7 w-7"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 group-hover:text-orange transition-colors">
                  Racing Hub
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  F1, Le Mans, NASCAR &amp; IndyCar tire strategy and
                  intelligence.
                </p>
              </div>
              <svg
                className="ml-auto h-5 w-5 shrink-0 text-gray-400 group-hover:text-orange group-hover:translate-x-1 transition-all"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.25 4.5l7.5 7.5-7.5 7.5"
                />
              </svg>
            </Link>

            {/* Racing Tech */}
            <Link
              href="/racing-tech"
              className="group flex items-center gap-4 rounded-xl border border-gray-200 bg-gray-50 p-6 transition-all hover:shadow-lg hover:border-orange/30"
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-orange/10 border border-orange/20 text-orange">
                <svg
                  className="h-7 w-7"
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
              </div>
              <div>
                <h3 className="font-bold text-gray-900 group-hover:text-orange transition-colors">
                  Racing Tech Center
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  How racing R&amp;D shapes the tires on your vehicle.
                </p>
              </div>
              <svg
                className="ml-auto h-5 w-5 shrink-0 text-gray-400 group-hover:text-orange group-hover:translate-x-1 transition-all"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.25 4.5l7.5 7.5-7.5 7.5"
                />
              </svg>
            </Link>

            {/* Shop Tires */}
            <Link
              href="/tires"
              className="group flex items-center gap-4 rounded-xl border border-gray-200 bg-gray-50 p-6 transition-all hover:shadow-lg hover:border-orange/30"
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-orange/10 border border-orange/20 text-orange">
                <svg
                  className="h-7 w-7"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 group-hover:text-orange transition-colors">
                  Shop Tires
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Browse race-inspired tires shipped free to your door.
                </p>
              </div>
              <svg
                className="ml-auto h-5 w-5 shrink-0 text-gray-400 group-hover:text-orange group-hover:translate-x-1 transition-all"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.25 4.5l7.5 7.5-7.5 7.5"
                />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ============================== CTA ============================== */}
      <section className="bg-orange py-14 relative overflow-hidden">
        <div className="absolute inset-0 checkered-accent opacity-50" />
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black text-white tracking-tight">
            Find Your Perfect Tire
          </h2>
          <p className="mt-3 text-lg text-white/90">
            Every tire in our rankings is available with free shipping.
            Ready to upgrade?
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/tires"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-8 py-3 text-sm font-bold text-orange shadow-lg hover:bg-gray-50 transition-colors"
            >
              Shop Tires
            </Link>
            <a
              href="tel:+12792388473"
              className="inline-flex items-center gap-2 rounded-lg border-2 border-white px-8 py-3 text-sm font-bold text-white hover:bg-white/10 transition-colors"
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
                  d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
                />
              </svg>
              Call/Text (279) 238-8473 (TIRE)
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
