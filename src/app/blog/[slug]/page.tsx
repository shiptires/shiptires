import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { blogPosts } from "@/data/blog-posts";
import type { Metadata } from "next";

const CATEGORY_LABELS: Record<string, string> = {
  "tire-guides": "Tire Guides",
  "tire-types": "Tire Types",
  "tire-maintenance": "Maintenance",
  "exotic-cars": "Exotic Cars",
  "performance": "Performance",
  "seasonal": "Seasonal",
  "shopping": "Shopping",
  "safety": "Safety",
  "tech": "Technology",
};

export async function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);
  if (!post) return {};

  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `https://ship.tires/blog/${slug}` },
  };
}

const KEYWORD_LINKS: [RegExp, string][] = [
  // Site name
  [/\bShip\.Tires\b/g, '<a href="/" class="text-safety-orange font-semibold hover:underline">Ship.Tires</a>'],
  // Major brands -> brand pages
  [/\bMichelin\b(?!\s+Pilot\b)(?!\s+Defender\b)(?!\s+CrossClimate\b)(?!\s+Primacy\b)/g, '<a href="/tires/michelin" class="text-safety-orange hover:underline">Michelin</a>'],
  [/\bBridgestone\b/g, '<a href="/tires/bridgestone" class="text-safety-orange hover:underline">Bridgestone</a>'],
  [/\bGoodyear\b/g, '<a href="/tires/goodyear" class="text-safety-orange hover:underline">Goodyear</a>'],
  [/\bContinental\b(?!\s+GT\b)/g, '<a href="/tires/continental" class="text-safety-orange hover:underline">Continental</a>'],
  [/\bPirelli\b/g, '<a href="/tires/pirelli" class="text-safety-orange hover:underline">Pirelli</a>'],
  [/\bCooper Tires\b/g, '<a href="/tires/cooper" class="text-safety-orange hover:underline">Cooper Tires</a>'],
  [/\bHankook\b/g, '<a href="/tires/hankook" class="text-safety-orange hover:underline">Hankook</a>'],
  [/\bYokohama\b/g, '<a href="/tires/yokohama" class="text-safety-orange hover:underline">Yokohama</a>'],
  [/\bToyo Tires\b/g, '<a href="/tires/toyo" class="text-safety-orange hover:underline">Toyo Tires</a>'],
  [/\bFalken\b/g, '<a href="/tires/falken" class="text-safety-orange hover:underline">Falken</a>'],
  [/\bBFGoodrich\b/g, '<a href="/tires/bfgoodrich" class="text-safety-orange hover:underline">BFGoodrich</a>'],
  [/\bNitto\b/g, '<a href="/tires/nitto" class="text-safety-orange hover:underline">Nitto</a>'],
  [/\bKumho\b/g, '<a href="/tires/kumho" class="text-safety-orange hover:underline">Kumho</a>'],
  [/\bFirestone\b/g, '<a href="/tires/firestone" class="text-safety-orange hover:underline">Firestone</a>'],
  [/\bDunlop\b/g, '<a href="/tires/dunlop" class="text-safety-orange hover:underline">Dunlop</a>'],
  [/\bGeneral Tire\b/g, '<a href="/tires/general" class="text-safety-orange hover:underline">General Tire</a>'],
  [/\bNexen\b/g, '<a href="/tires/nexen" class="text-safety-orange hover:underline">Nexen</a>'],
  [/\bMickey Thompson\b/g, '<a href="/tires/mickey-thompson" class="text-safety-orange hover:underline">Mickey Thompson</a>'],
  // Vehicle makes -> vehicle pages
  [/\bToyota\b(?!\s+Motor)/g, '<a href="/tires/vehicle/toyota" class="text-safety-orange hover:underline">Toyota</a>'],
  [/\bHonda\b/g, '<a href="/tires/vehicle/honda" class="text-safety-orange hover:underline">Honda</a>'],
  [/\bFord\b(?!\s+Motor)/g, '<a href="/tires/vehicle/ford" class="text-safety-orange hover:underline">Ford</a>'],
  [/\bChevrolet\b/g, '<a href="/tires/vehicle/chevrolet" class="text-safety-orange hover:underline">Chevrolet</a>'],
  [/\bBMW\b/g, '<a href="/tires/vehicle/bmw" class="text-safety-orange hover:underline">BMW</a>'],
  [/\bPorsche\b/g, '<a href="/tires/vehicle/porsche" class="text-safety-orange hover:underline">Porsche</a>'],
  [/\bFerrari\b/g, '<a href="/tires/vehicle/ferrari" class="text-safety-orange hover:underline">Ferrari</a>'],
  [/\bLamborghini\b/g, '<a href="/tires/vehicle/lamborghini" class="text-safety-orange hover:underline">Lamborghini</a>'],
  [/\bMcLaren\b/g, '<a href="/tires/vehicle/mclaren" class="text-safety-orange hover:underline">McLaren</a>'],
  [/\bSubaru\b/g, '<a href="/tires/vehicle/subaru" class="text-safety-orange hover:underline">Subaru</a>'],
  [/\bTesla\b/g, '<a href="/tires/vehicle/tesla" class="text-safety-orange hover:underline">Tesla</a>'],
  [/\bJeep\b/g, '<a href="/tires/vehicle/jeep" class="text-safety-orange hover:underline">Jeep</a>'],
  [/\bRam\b(?=\s+\d)/g, '<a href="/tires/vehicle/ram" class="text-safety-orange hover:underline">Ram</a>'],
  [/\bAston Martin\b/g, '<a href="/tires/vehicle/aston-martin" class="text-safety-orange hover:underline">Aston Martin</a>'],
  [/\bRolls-Royce\b/g, '<a href="/tires/vehicle/rolls-royce" class="text-safety-orange hover:underline">Rolls-Royce</a>'],
  [/\bBentley\b/g, '<a href="/tires/vehicle/bentley" class="text-safety-orange hover:underline">Bentley</a>'],
  [/\bMaserati\b/g, '<a href="/tires/vehicle/maserati" class="text-safety-orange hover:underline">Maserati</a>'],
  [/\bBugatti\b/g, '<a href="/tires/vehicle/bugatti" class="text-safety-orange hover:underline">Bugatti</a>'],
];

function linkKeywords(text: string): string {
  // Track which positions are already inside links to avoid double-linking
  let result = text;
  for (const [pattern, replacement] of KEYWORD_LINKS) {
    // Only replace text that isn't already inside an <a> tag
    result = result.replace(pattern, (match, offset) => {
      // Check if this match is already inside an anchor tag
      const before = result.substring(0, offset);
      const openTags = (before.match(/<a /g) || []).length;
      const closeTags = (before.match(/<\/a>/g) || []).length;
      if (openTags > closeTags) return match; // inside a link already
      return replacement;
    });
  }
  return result;
}

function formatContent(content: string): string {
  const paragraphs = content
    .replace(/\r\n/g, "\n")
    .split(/\n\n+/)
    .filter((p) => p.trim().length > 0);

  return paragraphs
    .map((paragraph, i) => {
      const trimmed = paragraph.trim();

      // Detect headings (lines starting with ## or ###)
      if (trimmed.startsWith("### ")) {
        return `<h3 class="text-xl font-bold text-gray-900 mt-10 mb-3">${linkKeywords(trimmed.slice(4))}</h3>`;
      }
      if (trimmed.startsWith("## ")) {
        return `<h2 class="text-2xl font-bold text-gray-900 mt-12 mb-4">${linkKeywords(trimmed.slice(3))}</h2>`;
      }

      // Detect bullet lists (lines starting with - )
      if (trimmed.split("\n").every((l) => l.trim().startsWith("- ") || l.trim() === "")) {
        const items = trimmed
          .split("\n")
          .filter((l) => l.trim().startsWith("- "))
          .map((l) => `<li class="flex items-start gap-2"><svg class="h-5 w-5 mt-0.5 flex-shrink-0 text-safety-orange" fill="currentColor" viewBox="0 0 24 24"><path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clip-rule="evenodd" /></svg><span>${linkKeywords(l.trim().slice(2))}</span></li>`)
          .join("");
        return `<ul class="space-y-2 my-6">${items}</ul>`;
      }

      if (i === 0) {
        return `<p class="text-lg leading-relaxed text-gray-800 font-medium">${linkKeywords(trimmed)}</p>`;
      }
      return `<p>${linkKeywords(trimmed)}</p>`;
    })
    .join("");
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const postIndex = blogPosts.findIndex((p) => p.slug === slug);
  const post = postIndex >= 0 ? blogPosts[postIndex] : null;

  if (!post) notFound();

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    author: { "@type": "Person", name: post.author },
    datePublished: post.date,
    publisher: {
      "@type": "Organization",
      name: "Ship.Tires",
      url: "https://ship.tires",
    },
  };

  const formattedContent = formatContent(post.content);
  const categoryLabel = post.category ? CATEGORY_LABELS[post.category] || post.category : "Tire Guide";

  // Related posts — same category, excluding current, max 3
  const related = blogPosts
    .filter((p) => p.slug !== slug && p.category === post.category)
    .slice(0, 3);

  // Next / Previous
  const prevPost = postIndex > 0 ? blogPosts[postIndex - 1] : null;
  const nextPost = postIndex < blogPosts.length - 1 ? blogPosts[postIndex + 1] : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <div className="bg-gray-50">
        {/* Hero */}
        <div className="relative bg-navy text-white overflow-hidden">
          <Image
            src={post.image}
            alt={post.title}
            fill
            className="object-cover opacity-15"
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/85 to-navy/60" />
          <div className="relative mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <span>/</span>
              <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
              <span>/</span>
              <span className="text-gray-300 truncate max-w-[200px] inline-block align-bottom">{post.title}</span>
            </div>

            {/* Category badge */}
            <span className="inline-flex items-center rounded-full bg-safety-orange/20 border border-safety-orange/30 px-3 py-1 text-xs font-bold text-safety-orange uppercase tracking-wider">
              {categoryLabel}
            </span>

            <h1 className="mt-4 text-3xl font-black sm:text-4xl lg:text-5xl leading-tight tracking-tight">
              {post.title}
            </h1>

            {/* Meta */}
            <div className="mt-5 flex items-center gap-4 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-safety-orange flex items-center justify-center text-white text-xs font-bold">
                  {post.author.split(" ").map(w => w[0]).join("").slice(0, 2)}
                </div>
                <span className="font-medium text-gray-300">{post.author}</span>
              </div>
              <span className="text-gray-600">&middot;</span>
              <span>{new Date(post.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
              <span className="text-gray-600">&middot;</span>
              <span>{post.readTime}</span>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
          {/* Featured image */}
          <div className="relative -mt-16 mb-10 h-56 sm:h-80 overflow-hidden rounded-2xl shadow-2xl border border-gray-200">
            <Image
              src={post.image}
              alt={post.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 768px"
            />
          </div>

          {/* Article body */}
          <article className="rounded-2xl bg-white border border-gray-200 p-6 sm:p-10 shadow-sm">
            <div
              className="prose prose-lg max-w-none prose-headings:font-black prose-headings:text-gray-900 prose-p:text-gray-700 prose-p:leading-[1.9] prose-p:text-[17px] prose-a:text-safety-orange prose-a:no-underline hover:prose-a:underline [&>p+p]:mt-6"
              dangerouslySetInnerHTML={{ __html: formattedContent }}
            />
          </article>

          {/* Share + Tags */}
          <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl bg-white border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-gray-500 uppercase">Share</span>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(`https://ship.tires/blog/${slug}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-gray-100 p-2 hover:bg-gray-200 transition-colors"
                aria-label="Share on X"
              >
                <svg className="h-4 w-4 text-gray-600" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`https://ship.tires/blog/${slug}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-gray-100 p-2 hover:bg-gray-200 transition-colors"
                aria-label="Share on Facebook"
              >
                <svg className="h-4 w-4 text-gray-600" fill="currentColor" viewBox="0 0 24 24"><path d="M9.198 21.5h4v-8.01h3.604l.396-3.98h-4V7.5a1 1 0 0 1 1-1h3v-4h-3a5 5 0 0 0-5 5v2.01h-2l-.396 3.98h2.396v8.01Z"/></svg>
              </a>
            </div>
            {post.category && (
              <Link
                href={`/blog?category=${post.category}`}
                className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
              >
                {categoryLabel}
              </Link>
            )}
          </div>

          {/* Post navigation */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {prevPost && (
              <Link
                href={`/blog/${prevPost.slug}`}
                className="rounded-2xl bg-white border border-gray-200 p-5 hover:border-safety-orange/30 hover:shadow-md transition-all group"
              >
                <span className="text-xs font-bold text-gray-400 uppercase">&larr; Previous</span>
                <p className="mt-1 text-sm font-bold text-gray-900 group-hover:text-safety-orange transition-colors line-clamp-2">
                  {prevPost.title}
                </p>
              </Link>
            )}
            {nextPost && (
              <Link
                href={`/blog/${nextPost.slug}`}
                className={`rounded-2xl bg-white border border-gray-200 p-5 hover:border-safety-orange/30 hover:shadow-md transition-all group ${!prevPost ? "sm:col-start-2" : ""}`}
              >
                <span className="text-xs font-bold text-gray-400 uppercase">Next &rarr;</span>
                <p className="mt-1 text-sm font-bold text-gray-900 group-hover:text-safety-orange transition-colors line-clamp-2">
                  {nextPost.title}
                </p>
              </Link>
            )}
          </div>

          {/* Related posts */}
          {related.length > 0 && (
            <div className="mt-12">
              <h2 className="text-xl font-bold text-gray-900">Related Articles</h2>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                {related.map((r) => (
                  <Link
                    key={r.slug}
                    href={`/blog/${r.slug}`}
                    className="group rounded-2xl bg-white border border-gray-200 overflow-hidden hover:shadow-md hover:border-safety-orange/30 transition-all"
                  >
                    <div className="relative h-32 overflow-hidden">
                      <Image
                        src={r.image}
                        alt={r.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 640px) 100vw, 33vw"
                      />
                    </div>
                    <div className="p-4">
                      <p className="text-sm font-bold text-gray-900 group-hover:text-safety-orange transition-colors line-clamp-2">
                        {r.title}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">{r.readTime}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="mt-12 rounded-2xl bg-navy p-8 text-center text-white relative overflow-hidden">
            <div className="relative">
              <h2 className="text-xl font-black">Need Help Finding Tires?</h2>
              <p className="mt-2 text-gray-400">
                Our experts can help you find the perfect tires for your vehicle.
              </p>
              <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <Link href="/tires" className="rounded-xl bg-safety-orange px-6 py-3 text-sm font-bold text-white hover:bg-safety-orange/90 transition-colors">
                  Browse Tires
                </Link>
                <Link href="/vehicle-lookup" className="rounded-xl border border-gray-600 px-6 py-3 text-sm font-bold text-white hover:bg-navy-light transition-colors">
                  Find by Vehicle
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
