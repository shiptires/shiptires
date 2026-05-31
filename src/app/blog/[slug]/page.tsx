import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { blogPosts } from "@/data/blog-posts";
import type { Metadata } from "next";

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

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);

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

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <div className="bg-gray-50">
        {/* Hero header with image */}
        <div className="relative bg-navy text-white">
          <Image
            src={post.image}
            alt={post.title}
            fill
            className="object-cover opacity-20"
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/80 to-navy/60" />
          <div className="relative mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
            <Link href="/blog" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-orange transition-colors">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              Back to Blog
            </Link>
            <h1 className="mt-4 text-3xl font-black sm:text-4xl tracking-tight">{post.title}</h1>
            <div className="mt-3 flex items-center gap-3 text-sm text-gray-400">
              <span className="font-medium text-gray-300">{post.author}</span>
              <span className="text-gray-600">&middot;</span>
              <span>{post.date}</span>
              <span className="text-gray-600">&middot;</span>
              <span>{post.readTime}</span>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          {/* Featured image */}
          <div className="relative mb-10 h-64 overflow-hidden rounded-xl sm:h-96 shadow-lg border border-gray-200">
            <Image
              src={post.image}
              alt={post.title}
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

          {/* CTA */}
          <div className="mt-10 rounded-xl bg-navy p-8 text-center text-white relative overflow-hidden">
            <div className="absolute inset-0 racing-stripe" />
            <div className="relative">
              <h2 className="text-xl font-black">Need Help Finding Tires?</h2>
              <p className="mt-2 text-gray-400">
                Our experts can help you find the perfect tires for your vehicle.
              </p>
              <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <Link href="/tires" className="rounded-lg bg-orange px-6 py-3 text-sm font-bold text-white hover:bg-orange-light transition-colors">
                  Browse Tires
                </Link>
                <a href="tel:+19164767689" className="rounded-lg border border-gray-600 px-6 py-3 text-sm font-bold text-white hover:bg-navy-light transition-colors">
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
