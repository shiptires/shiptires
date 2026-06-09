"use client";

import { useState } from "react";
import VehicleLookup from "@/components/VehicleLookup";
import SizeSearch from "@/components/SizeSearch";

export default function SearchPanel() {
  const [tab, setTab] = useState<"vehicle" | "size">("vehicle");

  return (
    <div className="rounded-lg bg-white border-2 border-dashed border-ink-grey/30 p-5 sm:p-6">
      <div className="mb-1 text-[10px] font-display uppercase tracking-[0.2em] text-ink-grey">
        Contents Lookup
      </div>
      <div className="mb-5">
        <div className="flex rounded-md border border-ink-grey/20 p-0.5">
          <button
            type="button"
            onClick={() => setTab("vehicle")}
            className={`flex-1 rounded-[5px] py-2 text-center text-sm font-bold transition-all ${
              tab === "vehicle"
                ? "bg-rubber text-label-white"
                : "text-ink-grey hover:text-rubber"
            }`}
          >
            Shop by Vehicle
          </button>
          <button
            type="button"
            onClick={() => setTab("size")}
            className={`flex-1 rounded-[5px] py-2 text-center text-sm font-bold transition-all ${
              tab === "size"
                ? "bg-rubber text-label-white"
                : "text-ink-grey hover:text-rubber"
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
