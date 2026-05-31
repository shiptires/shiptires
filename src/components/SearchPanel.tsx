"use client";

import { useState } from "react";
import VehicleLookup from "@/components/VehicleLookup";
import SizeSearch from "@/components/SizeSearch";

export default function SearchPanel() {
  const [tab, setTab] = useState<"vehicle" | "size">("vehicle");

  return (
    <div className="rounded-2xl bg-white/95 backdrop-blur-sm p-6 shadow-2xl border border-white/20">
      <div className="mb-6">
        <div className="flex rounded-lg bg-gray-100 p-1">
          <button
            type="button"
            onClick={() => setTab("vehicle")}
            className={`flex-1 rounded-md py-2 text-center text-sm font-bold transition-all ${
              tab === "vehicle"
                ? "bg-white text-navy shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Shop by Vehicle
          </button>
          <button
            type="button"
            onClick={() => setTab("size")}
            className={`flex-1 rounded-md py-2 text-center text-sm font-bold transition-all ${
              tab === "size"
                ? "bg-white text-navy shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Shop by Size
          </button>
        </div>
      </div>
      {tab === "vehicle" ? <VehicleLookup /> : <SizeSearch />}
    </div>
  );
}
