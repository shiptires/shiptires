import VehicleLookup from "@/components/VehicleLookup";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Find Tires by Vehicle — Year, Make, Model Lookup",
  description:
    "Find the right tire size for your vehicle. Enter your year, make, and model to see compatible tire sizes and matching tires. Free shipping on all orders.",
  alternates: { canonical: "https://ship.tires/vehicle-lookup" },
};

export default function VehicleLookupPage() {
  return (
    <div className="bg-gray-50">
      <div className="bg-navy py-12 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold sm:text-4xl">Shop & Ship Tires by Vehicle — Free Delivery</h1>
          <p className="mt-3 text-lg text-gray-300">
            Select your year, make, and model to find compatible tire sizes.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-white p-8 shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Vehicle Tire Finder</h2>
          <VehicleLookup />
        </div>

        <div className="mt-8 rounded-xl bg-blue/5 border border-blue/20 p-6">
          <h3 className="font-bold text-gray-900">How to Find Your Tire Size</h3>
          <ul className="mt-3 space-y-2 text-sm text-gray-600">
            <li className="flex gap-2">
              <span className="font-bold text-blue">1.</span>
              Check the sidewall of your current tires for a number like 225/65R17
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-blue">2.</span>
              Look inside the driver&apos;s door jamb for a tire information sticker
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-blue">3.</span>
              Check your vehicle owner&apos;s manual
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-blue">4.</span>
              Use the vehicle lookup tool above to search by year, make, and model
            </li>
          </ul>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-500">
            Can&apos;t find your tire size?{" "}
            <a href="tel:+12792388473" className="font-bold text-orange hover:underline">
              Call/Text (279) 238-8473 (TIRE)
            </a>{" "}
            and our tire experts will help.
          </p>
        </div>
      </div>
    </div>
  );
}
