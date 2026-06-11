"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ModelOption {
  name: string;
  slug: string;
  type: string;
  sizeCount: number;
}

export default function BrandModelPicker({
  brandSlug,
  brandName,
  models,
}: {
  brandSlug: string;
  brandName: string;
  models: ModelOption[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState("");
  const [filter, setFilter] = useState("");

  const filtered = filter
    ? models.filter((m) => m.name.toLowerCase().includes(filter.toLowerCase()))
    : models;

  return (
    <div>
      <input
        type="text"
        placeholder={`Search ${models.length} models...`}
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue focus:outline-none"
      />
      <select
        value={selected}
        onChange={(e) => {
          setSelected(e.target.value);
          if (e.target.value) {
            router.push(`/tires/${brandSlug}/${e.target.value}`);
          }
        }}
        className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 bg-white focus:border-blue focus:outline-none"
      >
        <option value="">Select a {brandName} model...</option>
        {filtered.map((m) => (
          <option key={m.slug} value={m.slug}>
            {m.name} ({m.sizeCount} sizes)
          </option>
        ))}
      </select>
      {selected && (
        <button
          onClick={() => router.push(`/tires/${brandSlug}/${selected}`)}
          className="mt-2 w-full rounded-lg bg-safety-orange px-4 py-2.5 text-sm font-bold text-white hover:opacity-90 transition-opacity"
        >
          Shop This Model
        </button>
      )}
    </div>
  );
}
