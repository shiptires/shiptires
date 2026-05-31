"use client";

import { useState, useEffect } from "react";
import { yearRange } from "@/lib/api-helpers";

interface Make {
  MakeId: number;
  MakeName: string;
}

interface Model {
  Model_ID: number;
  Model_Name: string;
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

  useEffect(() => {
    if (!year) return;
    setMake("");
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
        setError("Could not load tire sizes. Please call us for help!");
        setTireSizes([]);
      })
      .finally(() => setLoading(null));
  }, [year, make, model, onResult]);

  return (
    <div className="space-y-4">
      {/* Year */}
      <div>
        <label htmlFor="v-year" className="block text-sm font-medium text-gray-700 mb-1">
          Year
        </label>
        <select
          id="v-year"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-blue focus:ring-2 focus:ring-blue/20 focus:outline-none bg-white"
        >
          <option value="">Select Year</option>
          {yearRange.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* Make */}
      <div>
        <label htmlFor="v-make" className="block text-sm font-medium text-gray-700 mb-1">
          Make
        </label>
        <select
          id="v-make"
          value={make}
          onChange={(e) => setMake(e.target.value)}
          disabled={!year || loading === "makes"}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-blue focus:ring-2 focus:ring-blue/20 focus:outline-none bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          <option value="">{loading === "makes" ? "Loading..." : "Select Make"}</option>
          {makes.map((m) => (
            <option key={m.MakeId} value={m.MakeName}>{m.MakeName}</option>
          ))}
        </select>
      </div>

      {/* Model */}
      <div>
        <label htmlFor="v-model" className="block text-sm font-medium text-gray-700 mb-1">
          Model
        </label>
        <select
          id="v-model"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          disabled={!make || loading === "models"}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-blue focus:ring-2 focus:ring-blue/20 focus:outline-none bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          <option value="">{loading === "models" ? "Loading..." : "Select Model"}</option>
          {models.map((m) => (
            <option key={m.Model_ID} value={m.Model_Name}>{m.Model_Name}</option>
          ))}
        </select>
      </div>

      {loading === "tires" && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <svg className="animate-spin h-4 w-4 text-blue" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Finding tire sizes...
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
          <a href="tel:+19164767689" className="ml-1 font-semibold underline">Call (916) 476-7689</a>
        </div>
      )}

      {tireSizes.length > 0 && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-4">
          <h4 className="text-sm font-semibold text-green-800 mb-2">
            Compatible Tire Sizes for {year} {make} {model}:
          </h4>
          <div className="flex flex-wrap gap-2">
            {tireSizes.map((size) => (
              <a
                key={size}
                href={`/search?size=${encodeURIComponent(size)}`}
                className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800 hover:bg-green-200 transition-colors"
              >
                {size}
              </a>
            ))}
          </div>
        </div>
      )}

      {year && make && model && tireSizes.length === 0 && !loading && !error && (
        <div className="rounded-lg bg-blue/5 border border-blue/20 p-4 text-sm text-gray-700">
          <p className="font-medium">Can&apos;t find your tire size?</p>
          <p className="mt-1">
            Call us at <a href="tel:+19164767689" className="font-semibold text-blue underline">(916) 476-7689</a> or{" "}
            <a href="/contact" className="font-semibold text-blue underline">request a quote</a> — we&apos;ll find the right fit.
          </p>
        </div>
      )}
    </div>
  );
}
