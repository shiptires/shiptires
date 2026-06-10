import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { racingArticles } from "@/data/racing-articles";
import type { Metadata } from "next";

const seriesLabels: Record<string, string> = {
  f1: "Formula 1",
  "le-mans": "Le Mans",
  wec: "WEC",
  indycar: "IndyCar",
  nascar: "NASCAR",
  general: "Racing",
};

export async function generateStaticParams() {
  return racingArticles.map((article) => ({
    series: article.series,
    slug: article.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ series: string; slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = racingArticles.find((a) => a.slug === slug);
  if (!article) return {};

  return {
    title: article.title,
    description: article.excerpt,
  };
}

function formatContent(content: string): string {
  const paragraphs = content
    .replace(/\r\n/g, "\n")
    .split(/\n\n+/)
    .filter((p) => p.trim().length > 0);

  return paragraphs
    .map((paragraph, i) => {
      if (i === 0) {
        return `<p class="first-paragraph text-lg leading-relaxed text-gray-800 font-medium">${paragraph.trim()}</p>`;
      }
      return `<p>${paragraph.trim()}</p>`;
    })
    .join("");
}

export default async function RacingArticlePage({
  params,
}: {
  params: Promise<{ series: string; slug: string }>;
}) {
  const { series, slug } = await params;
  const article = racingArticles.find(
    (a) => a.slug === slug && a.series === series
  );

  if (!article) notFound();

  const seriesLabel = seriesLabels[series] || "Racing";
  const formattedContent = formatContent(article.content);

  const relatedArticles = racingArticles
    .filter((a) => a.series === series && a.slug !== slug)
    .slice(0, 3);

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
              href={`/racing/${series}`}
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
              Back to {seriesLabel}
            </Link>

            <div className="mt-4">
              <span className="inline-block rounded-full bg-orange px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
                {seriesLabel}
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

          {/* Article content */}
          <article className="rounded-xl bg-white border border-gray-200 p-8 sm:p-10 shadow-sm">
            <div
              className="prose prose-lg max-w-none prose-headings:font-black prose-headings:text-gray-900 prose-p:text-gray-700 prose-p:leading-[1.9] prose-p:text-[17px] prose-a:text-orange prose-a:no-underline hover:prose-a:underline [&>p+p]:mt-6"
              dangerouslySetInnerHTML={{ __html: formattedContent }}
            />
          </article>

          {/* Tags */}
          {article.tags.length > 0 && (
            <div className="mt-8">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500">
                Tags
              </h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {article.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Related Articles */}
          {relatedArticles.length > 0 && (
            <div className="mt-14">
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                More from {seriesLabel}
              </h2>
              <p className="mt-2 text-gray-500">
                Continue exploring {seriesLabel} tire strategy and technology.
              </p>
              <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {relatedArticles.map((related) => (
                  <Link
                    key={related.slug}
                    href={`/racing/${related.series}/${related.slug}`}
                    className="group overflow-hidden rounded-xl bg-white border border-gray-200 shadow-sm transition-all hover:shadow-lg hover:border-orange/30"
                  >
                    <div className="relative h-44 overflow-hidden">
                      <Image
                        src={related.image}
                        alt={related.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      <div className="absolute top-3 left-3">
                        <span className="rounded-full bg-orange px-2.5 py-1 text-[10px] font-bold uppercase text-white tracking-wider">
                          {seriesLabel}
                        </span>
                      </div>
                    </div>
                    <div className="p-5">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{related.date}</span>
                        <span>&middot;</span>
                        <span>{related.readTime}</span>
                      </div>
                      <h3 className="mt-2 font-bold text-gray-900 group-hover:text-orange transition-colors">
                        {related.title}
                      </h3>
                      <p className="mt-2 text-sm text-gray-500 line-clamp-2">
                        {related.excerpt}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="mt-14 rounded-xl bg-navy p-8 text-center text-white relative overflow-hidden">
            <div className="absolute inset-0 racing-stripe" />
            <div className="relative">
              <h2 className="text-xl font-black">
                Need Help Finding Tires?
              </h2>
              <p className="mt-2 text-gray-400">
                Our experts can help you find the perfect tires for your
                vehicle.
              </p>
              <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <Link
                  href="/tires"
                  className="rounded-lg bg-orange px-6 py-3 text-sm font-bold text-white hover:bg-orange-light transition-colors"
                >
                  Browse Tires
                </Link>
                <a
                  href="tel:+12792388473"
                  className="rounded-lg border border-gray-600 px-6 py-3 text-sm font-bold text-white hover:bg-navy-light transition-colors"
                >
                  Call/Text (279) 238-8473 (TIRE)
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
