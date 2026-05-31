import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { racingTechArticles } from "@/data/racing-tech";
import type { Metadata } from "next";

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

export async function generateStaticParams() {
  return racingTechArticles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = racingTechArticles.find((a) => a.slug === slug);
  if (!article) return {};

  return {
    title: `${article.title} | Racing Tech Center | Ship.Tires`,
    description: article.excerpt,
  };
}

function formatContent(content: string): string {
  const paragraphs = content
    .replace(/\r\n/g, "\n")
    .split(/\n\n+/)
    .filter((p) => p.trim().length > 0);

  return paragraphs
    .map((p, i) => {
      if (i === 0) {
        return `<p class="first-paragraph text-lg leading-relaxed text-gray-800 font-medium">${p.trim()}</p>`;
      }
      return `<p>${p.trim()}</p>`;
    })
    .join("");
}

export default async function RacingTechArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = racingTechArticles.find((a) => a.slug === slug);

  if (!article) notFound();

  const formattedContent = formatContent(article.content);

  // Related articles: prefer same category, exclude current, limit 3
  const relatedArticles = [
    ...racingTechArticles.filter(
      (a) => a.category === article.category && a.slug !== article.slug
    ),
    ...racingTechArticles.filter(
      (a) => a.category !== article.category && a.slug !== article.slug
    ),
  ].slice(0, 3);

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt,
    author: { "@type": "Person", name: article.author },
    datePublished: article.date,
    image: article.image,
    publisher: {
      "@type": "Organization",
      name: "Ship.Tires",
      url: "https://ship.tires",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <div className="bg-gray-50">
        {/* Hero header */}
        <div className="relative bg-navy text-white">
          <Image
            src={article.image}
            alt={article.title}
            fill
            className="object-cover opacity-20"
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/80 to-navy/60" />
          <div className="relative mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
            <Link
              href="/racing-tech"
              className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-orange transition-colors"
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
              Back to Racing Tech Center
            </Link>
            <div className="mt-4">
              <span
                className={`inline-block rounded-full px-3 py-1 text-[10px] font-bold uppercase text-white tracking-wider ${
                  categoryColors[article.category] || "bg-gray-600"
                }`}
              >
                {categoryLabels[article.category] || article.category}
              </span>
            </div>
            <h1 className="mt-4 text-3xl font-black sm:text-4xl tracking-tight">
              {article.title}
            </h1>
            <div className="mt-3 flex items-center gap-3 text-sm text-gray-400">
              <span className="font-medium text-gray-300">
                {article.author}
              </span>
              <span className="text-gray-600">&middot;</span>
              <span>{article.date}</span>
              <span className="text-gray-600">&middot;</span>
              <span>{article.readTime}</span>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          {/* Featured image */}
          <div className="relative mb-10 h-64 overflow-hidden rounded-xl sm:h-96 shadow-lg border border-gray-200">
            <Image
              src={article.image}
              alt={article.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 800px"
            />
          </div>

          {/* Consumer Takeaway highlight box */}
          <div className="mb-10 rounded-xl bg-orange/5 border border-orange/20 p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-orange/10">
                <svg
                  className="h-5 w-5 text-orange"
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
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-orange">
                  Consumer Takeaway
                </p>
                <p className="mt-1 text-sm text-gray-700 leading-relaxed">
                  {article.consumerTakeaway}
                </p>
              </div>
            </div>
          </div>

          {/* Article content */}
          <article className="rounded-xl bg-white border border-gray-200 p-8 sm:p-10 shadow-sm">
            <div
              className="prose prose-lg max-w-none prose-headings:font-black prose-headings:text-gray-900 prose-p:text-gray-700 prose-p:leading-[1.9] prose-p:text-[17px] prose-a:text-orange prose-a:no-underline hover:prose-a:underline [&>p+p]:mt-6"
              dangerouslySetInnerHTML={{ __html: formattedContent }}
            />
          </article>

          {/* Related Tech Articles */}
          {relatedArticles.length > 0 && (
            <section className="mt-16">
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                More Racing Tech
              </h2>
              <p className="mt-2 text-gray-500">
                Continue exploring how motorsport technology powers your tires.
              </p>
              <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
                {relatedArticles.map((related) => (
                  <Link
                    key={related.slug}
                    href={`/racing-tech/${related.slug}`}
                    className="group overflow-hidden rounded-xl bg-white border border-gray-200 shadow-sm transition-all hover:shadow-lg hover:border-orange/30"
                  >
                    <div className="relative h-40 overflow-hidden">
                      <Image
                        src={related.image}
                        alt={related.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      <div className="absolute top-3 left-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase text-white tracking-wider ${
                            categoryColors[related.category] || "bg-gray-600"
                          }`}
                        >
                          {categoryLabels[related.category] || related.category}
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{related.date}</span>
                        <span>&middot;</span>
                        <span>{related.readTime}</span>
                      </div>
                      <h3 className="mt-2 font-bold text-gray-900 group-hover:text-orange transition-colors text-sm">
                        {related.title}
                      </h3>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* CTA */}
          <div className="mt-16 rounded-xl bg-navy p-8 text-center text-white relative overflow-hidden">
            <div className="absolute inset-0 racing-stripe" />
            <div className="relative">
              <h2 className="text-xl font-black">
                Ready for Race-Proven Tires?
              </h2>
              <p className="mt-2 text-gray-400">
                The technology in this article lives inside the tires we ship to
                your door.
              </p>
              <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <Link
                  href="/tires"
                  className="rounded-lg bg-orange px-6 py-3 text-sm font-bold text-white hover:bg-orange-light transition-colors"
                >
                  Shop Performance Tires
                </Link>
                <a
                  href="tel:+19164767689"
                  className="rounded-lg border border-gray-600 px-6 py-3 text-sm font-bold text-white hover:bg-navy-light transition-colors"
                >
                  Call (916) 476-7689
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
