"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { yearRange } from "@/lib/api-helpers";

interface Make {
  MakeId: number;
  MakeName: string;
}

interface Model {
  Model_ID: number;
  Model_Name: string;
}

function toSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default function VehicleLookup({ onResult }: { onResult?: (sizes: string[]) => void }) {
  const [year, setYear] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [makes, setMakes] = useState<Make[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [tireSizes, setTireSizes] = useState<string[]>([]);
  const [loading, setLoading] = useState<"makes" | "models" | "tires" | null>(null);
  const [error, setError] = useState("");
  const initialized = useRef(false);

  // Pre-populate from URL query params on mount
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const params = new URLSearchParams(window.location.search);
    const qYear = params.get("year");
    const qMake = params.get("make");
    if (qYear) setYear(qYear);
    if (qMake) setMake(qMake);
  }, []);

  useEffect(() => {
    if (!year) return;
    setModel("");
    setModels([]);
    setTireSizes([]);
    setLoading("makes");
    setError("");

    fetch(`/api/vehicle/makes?year=${year}`)
      .then((res) => res.json())
      .then((data) => {
        const sorted = (data.Results || [])
          .sort((a: Make, b: Make) => a.MakeName.localeCompare(b.MakeName));
        setMakes(sorted);
      })
      .catch(() => setError("Failed to load vehicle makes"))
      .finally(() => setLoading(null));
  }, [year]);

  useEffect(() => {
    if (!year || !make) return;
    setModel("");
    setTireSizes([]);
    setLoading("models");
    setError("");

    fetch(`/api/vehicle/models?year=${year}&make=${encodeURIComponent(make)}`)
      .then((res) => res.json())
      .then((data) => {
        const sorted = (data.Results || [])
          .sort((a: Model, b: Model) => a.Model_Name.localeCompare(b.Model_Name));
        setModels(sorted);
      })
      .catch(() => setError("Failed to load vehicle models"))
      .finally(() => setLoading(null));
  }, [year, make]);

  useEffect(() => {
    if (!year || !make || !model) return;
    setLoading("tires");
    setError("");

    fetch(`/api/vehicle/tires?year=${year}&make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`)
      .then((res) => res.json())
      .then((data) => {
        const sizes = data.sizes || [];
        setTireSizes(sizes);
        onResult?.(sizes);
      })
      .catch(() => {
        setError("Could not load tire sizes. Please call or text us for help!");
        setTireSizes([]);
      })
      .finally(() => setLoading(null));
  }, [year, make, model, onResult]);

  const makeSlug = make ? toSlug(make) : "";
  const modelSlug = model ? toSlug(model) : "";

  return (
    <div className="space-y-3">
      {/* Year */}
      <div>
        <label htmlFor="v-year" className="block text-xs font-mono uppercase tracking-wider text-ink-grey mb-1">
          Year
        </label>
        <select
          id="v-year"
          value={year}
          onChange={(e) => { setYear(e.target.value); setMake(""); }}
          className="w-full rounded-md border border-ink-grey/20 px-4 py-2.5 text-sm focus:border-safety-orange focus:ring-2 focus:ring-safety-orange/20 focus:outline-none bg-white text-rubber"
        >
          <option value="">Select Year</option>
          {yearRange.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* Make */}
      <div>
        <label htmlFor="v-make" className="block text-xs font-mono uppercase tracking-wider text-ink-grey mb-1">
          Make
        </label>
        <select
          id="v-make"
          value={make}
          onChange={(e) => setMake(e.target.value)}
          disabled={!year || loading === "makes"}
          className="w-full rounded-md border border-ink-grey/20 px-4 py-2.5 text-sm focus:border-safety-orange focus:ring-2 focus:ring-safety-orange/20 focus:outline-none bg-white text-rubber disabled:bg-label-white disabled:text-ink-grey/50 disabled:cursor-not-allowed"
        >
          <option value="">{loading === "makes" ? "Loading..." : "Select Make"}</option>
          {makes.map((m) => (
            <option key={m.MakeId} value={m.MakeName}>{m.MakeName}</option>
          ))}
        </select>
      </div>

      {/* Link to rich make page */}
      {make && !model && (
        <Link
          href={`/tires/vehicle/${makeSlug}`}
          className="flex items-center gap-2 rounded-md bg-navy/5 border border-navy/10 px-4 py-2.5 text-sm font-semibold text-navy hover:bg-navy/10 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
          View all {make} tires, models & sizes
        </Link>
      )}

      {/* Model */}
      <div>
        <label htmlFor="v-model" className="block text-xs font-mono uppercase tracking-wider text-ink-grey mb-1">
          Model
        </label>
        <select
          id="v-model"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          disabled={!make || loading === "models"}
          className="w-full rounded-md border border-ink-grey/20 px-4 py-2.5 text-sm focus:border-safety-orange focus:ring-2 focus:ring-safety-orange/20 focus:outline-none bg-white text-rubber disabled:bg-label-white disabled:text-ink-grey/50 disabled:cursor-not-allowed"
        >
          <option value="">{loading === "models" ? "Loading..." : "Select Model"}</option>
          {models.map((m) => (
            <option key={m.Model_ID} value={m.Model_Name}>{m.Model_Name}</option>
          ))}
        </select>
      </div>

      {loading === "tires" && (
        <div className="flex items-center gap-2 text-sm text-ink-grey">
          <svg className="animate-spin h-4 w-4 text-safety-orange" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Finding tire sizes...
        </div>
      )}

      {error && (
        <div className="rounded-md bg-safety-orange/5 border border-safety-orange/20 p-3 text-sm text-rubber">
          {error}
          <a href="tel:+12792388473" className="ml-1 font-mono font-semibold underline">(279) 238-8473 (TIRE)</a>
        </div>
      )}

      {tireSizes.length > 0 && (
        <div className="rounded-md border-2 border-dashed border-safety-orange/30 bg-safety-orange/5 p-4">
          <h4 className="text-xs font-mono uppercase tracking-wider text-rubber mb-2">
            Compatible sizes for {year} {make} {model}:
          </h4>
          <div className="flex flex-wrap gap-2">
            {tireSizes.map((size) => (
              <a
                key={size}
                href={`/search?size=${encodeURIComponent(size)}`}
                className="inline-flex items-center rounded-md border border-safety-orange/30 bg-white px-3 py-1 text-sm font-mono font-semibold text-rubber hover:bg-safety-orange hover:text-white transition-colors"
              >
                {size}
              </a>
            ))}
          </div>
          {/* Link to vehicle-specific page */}
          <Link
            href={year ? `/tires/vehicle/${makeSlug}/${modelSlug}/${year}` : `/tires/vehicle/${makeSlug}/${modelSlug}`}
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-safety-orange hover:underline"
          >
            Shop all {make} {model} tires
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      )}

      {year && make && model && tireSizes.length === 0 && !loading && !error && (
        <div className="rounded-md border border-ink-grey/20 bg-kraft/10 p-4 text-sm text-rubber">
          <p className="font-bold">Can&apos;t find your tire size?</p>
          <p className="mt-1">
            Call or text us at <a href="tel:+12792388473" className="font-mono font-semibold text-safety-orange underline">(279) 238-8473 (TIRE)</a> or{" "}
            <a href="/contact" className="font-semibold text-safety-orange underline">request a quote</a> — we&apos;ll find the right fit.
          </p>
        </div>
      )}
    </div>
  );
}
