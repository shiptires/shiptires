"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SizeSearch() {
  const [size, setSize] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = size.trim().toUpperCase();

    const valid = /^\d{3}\/\d{2,3}R\d{2}$/i.test(trimmed);
    if (!valid) {
      setError("Enter a valid tire size (e.g., 225/65R17)");
      return;
    }

    setError("");
    router.push(`/search?size=${encodeURIComponent(trimmed)}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label htmlFor="tire-size" className="block text-xs font-mono uppercase tracking-wider text-ink-grey mb-1">
          Enter Tire Size
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            id="tire-size"
            value={size}
            onChange={(e) => {
              setSize(e.target.value);
              setError("");
            }}
            placeholder="225/65R17"
            className="flex-1 rounded-md border border-ink-grey/20 bg-white text-rubber font-mono px-4 py-2.5 text-sm placeholder:text-ink-grey/40 focus:border-safety-orange focus:ring-2 focus:ring-safety-orange/20 focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-md bg-safety-orange px-6 py-2.5 text-sm font-bold text-white hover:bg-safety-orange/90 transition-colors"
          >
            Search
          </button>
        </div>
        {error && <p className="mt-1 text-sm text-safety-orange">{error}</p>}
      </div>
      <p className="text-xs text-ink-grey font-mono">
        Find your tire size on the sidewall. Format: Width/AspectRatioRDiameter
      </p>
    </form>
  );
}
