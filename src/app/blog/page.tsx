import Link from "next/link";
import Image from "next/image";
import { blogPosts } from "@/data/blog-posts";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tire Blog — Guides, Tips & Expert Advice",
  description:
    "Learn about tire sizes, types, maintenance, and more. Expert tire guides from the Ship.Tires team.",
  alternates: { canonical: "https://ship.tires/blog" },
};

export default function BlogPage() {
  return (
    <div className="bg-gray-50">
      <div className="relative bg-navy py-14 text-white overflow-hidden">
        <div className="absolute inset-0 racing-stripe" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-widest text-orange">Knowledge Base</p>
          <h1 className="mt-2 text-3xl font-black sm:text-4xl tracking-tight">Tire Blog</h1>
          <p className="mt-3 text-lg text-gray-400">
            Guides, tips, and expert advice on tires and tire shopping.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {blogPosts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group overflow-hidden rounded-xl bg-white border border-gray-200 shadow-sm transition-all hover:shadow-lg hover:border-orange/30"
            >
              <div className="relative h-52 overflow-hidden">
                <Image
                  src={post.image}
                  alt={post.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{post.date}</span>
                  <span>&middot;</span>
                  <span>{post.readTime}</span>
                </div>
                <h2 className="mt-2 text-lg font-bold text-gray-900 group-hover:text-orange transition-colors">
                  {post.title}
                </h2>
                <p className="mt-2 text-sm text-gray-500 line-clamp-2">{post.excerpt}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-orange uppercase tracking-wider">
                  Read More
                  <svg className="h-3 w-3 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
