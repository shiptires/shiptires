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

    // Validate tire size format
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
        <label htmlFor="tire-size" className="block text-sm font-medium text-gray-700 mb-1">
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
            className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-blue focus:ring-2 focus:ring-blue/20 focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-lg bg-orange px-6 py-3 text-sm font-bold text-white hover:bg-orange-dark transition-colors"
          >
            Search
          </button>
        </div>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
      <p className="text-xs text-gray-500">
        Find your tire size on the sidewall of your current tires. Format: Width/AspectRatioRDiameter
      </p>
    </form>
  );
}
