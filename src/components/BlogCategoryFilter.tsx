"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { BlogPost, BlogCategory } from "@/lib/types";

const CATEGORIES: { id: BlogCategory | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "tire-guides", label: "Tire Guides" },
  { id: "tire-types", label: "Tire Types" },
  { id: "tire-maintenance", label: "Maintenance" },
  { id: "exotic-cars", label: "Exotic Cars" },
  { id: "performance", label: "Performance" },
  { id: "seasonal", label: "Seasonal" },
  { id: "shopping", label: "Shopping" },
  { id: "safety", label: "Safety" },
  { id: "tech", label: "Technology" },
];

interface BlogCategoryFilterProps {
  posts: BlogPost[];
}

export default function BlogCategoryFilter({ posts }: BlogCategoryFilterProps) {
  const [active, setActive] = useState<BlogCategory | "all">("all");

  const filtered = active === "all"
    ? posts
    : posts.filter((p) => p.category === active);

  return (
    <div>
      {/* Category tabs */}
      <div className="mb-8 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {CATEGORIES.map((cat) => {
          const count = cat.id === "all" ? posts.length : posts.filter((p) => p.category === cat.id).length;
          if (cat.id !== "all" && count === 0) return null;
          return (
            <button
              key={cat.id}
              onClick={() => setActive(cat.id)}
              className={`flex-shrink-0 rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
                active === cat.id
                  ? "bg-navy text-white shadow-lg shadow-navy/25"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {cat.label}
              <span className={`ml-1.5 text-xs ${active === cat.id ? "text-white/70" : "text-gray-400"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Posts grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="group overflow-hidden rounded-2xl bg-white border border-gray-200 shadow-sm transition-all hover:shadow-lg hover:border-safety-orange/30"
          >
            <div className="relative h-48 overflow-hidden">
              <Image
                src={post.image}
                alt={post.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            </div>
            <div className="p-5">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span>{post.date}</span>
                <span>&middot;</span>
                <span>{post.readTime}</span>
              </div>
              <h2 className="mt-2 text-base font-bold text-gray-900 group-hover:text-safety-orange transition-colors line-clamp-2">
                {post.title}
              </h2>
              <p className="mt-2 text-sm text-gray-500 line-clamp-2">{post.excerpt}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-safety-orange uppercase tracking-wider">
                Read More
                <svg className="h-3 w-3 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </span>
            </div>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No articles in this category yet.</p>
        </div>
      )}
    </div>
  );
}
