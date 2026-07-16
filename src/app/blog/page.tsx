import Link from "next/link";
import Image from "next/image";
import { blogPosts } from "@/data/blog-posts";
import BlogCategoryFilter from "@/components/BlogCategoryFilter";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tire Blog — Guides, Tips & Expert Advice",
  description:
    "Learn about tire sizes, types, maintenance, exotic car tires, and more. Expert tire guides from the Ship.Tires team.",
  alternates: { canonical: "https://ship.tires/blog" },
};

export default function BlogPage() {
  // Featured post — most recent
  const featured = blogPosts[blogPosts.length - 1];
  const rest = blogPosts.filter((p) => p.slug !== featured.slug);

  return (
    <div className="bg-gray-50">
      <div className="relative bg-navy py-14 text-white overflow-hidden">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-widest text-safety-orange">Knowledge Base</p>
          <h1 className="mt-2 text-3xl font-black sm:text-4xl tracking-tight">Tire Blog</h1>
          <p className="mt-3 text-lg text-gray-400">
            {blogPosts.length} articles — guides, tips, and expert advice on tires and driving.
          </p>
        </div>
      </div>

      {/* Featured post */}
      <div className="mx-auto max-w-7xl px-4 -mt-8 sm:px-6 lg:px-8 relative z-10">
        <Link
          href={`/blog/${featured.slug}`}
          className="group block overflow-hidden rounded-2xl bg-white border border-gray-200 shadow-lg hover:shadow-xl transition-all"
        >
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="relative h-56 md:h-auto overflow-hidden">
              <Image
                src={featured.image}
                alt={featured.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            </div>
            <div className="p-6 sm:p-8 flex flex-col justify-center">
              <span className="text-xs font-bold text-safety-orange uppercase tracking-wider">Featured</span>
              <h2 className="mt-2 text-2xl font-black text-gray-900 group-hover:text-safety-orange transition-colors">
                {featured.title}
              </h2>
              <p className="mt-3 text-gray-500 line-clamp-3">{featured.excerpt}</p>
              <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
                <span>{featured.date}</span>
                <span>&middot;</span>
                <span>{featured.readTime}</span>
              </div>
            </div>
          </div>
        </Link>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Category filter + grid */}
        <BlogCategoryFilter posts={rest} />
      </div>
    </div>
  );
}
