"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function BrandSizeLookup({ brandSlug, brandName }: { brandSlug: string; brandName: string }) {
  const [size, setSize] = useState("");
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleaned = size.trim().replace(/\s+/g, "");
    // Match pattern like 225/65R17 or 225/65r17
    const match = cleaned.match(/^(\d{2,3})\/(\d{2,3})[Rr](\d{2,3})$/);
    if (match) {
      const sizeSlug = `${match[1]}-${match[2]}r${match[3]}`.toLowerCase();
      router.push(`/tires/size/${sizeSlug}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        type="text"
        value={size}
        onChange={(e) => setSize(e.target.value)}
        placeholder="e.g. 225/65R17"
        className="w-40 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-mono text-gray-900 placeholder:text-gray-400 focus:border-blue focus:outline-none focus:ring-1 focus:ring-blue"
      />
      <button
        type="submit"
        className="rounded-lg bg-orange px-4 py-2 text-sm font-bold text-white hover:bg-orange-light transition-colors"
      >
        Find Tires
      </button>
    </form>
  );
}
