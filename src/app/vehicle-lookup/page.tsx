import VehicleLookup from "@/components/VehicleLookup";
import Link from "next/link";
import type { Metadata } from "next";
import { vehicleMakes } from "@/data/vehicle-content";

export const metadata: Metadata = {
  title: "Shop Tires by Vehicle — Find Tires for Your Car, Truck, or SUV | Ship Free",
  description:
    "Find the right tires for your vehicle. Enter your year, make, and model to see compatible tire sizes from Honda, Toyota, Ford, Chevrolet, BMW, and 600+ brands. Free shipping on all orders.",
  alternates: { canonical: "https://ship.tires/vehicle-lookup" },
};

export default function VehicleLookupPage() {
  return (
    <div className="bg-gray-50">
      <div className="bg-navy py-12 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold sm:text-4xl lg:text-5xl">Shop by Vehicle</h1>
          <p className="mt-3 text-lg text-gray-300">
            Shop Tires for Your Vehicle — Ship Free
          </p>
          <p className="mt-2 text-gray-400">
            Find the right tires for your car, truck, or SUV. Enter your year, make, and model to see compatible sizes from hundreds of brands.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Vehicle Lookup Tool */}
        <div className="mx-auto max-w-2xl">
          <div className="rounded-2xl bg-white p-8 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Find Tires by Year, Make & Model</h2>
            <VehicleLookup />
          </div>
        </div>

        {/* Shop by Make Grid */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Shop Tires by Make</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {vehicleMakes.map((make) => (
              <Link
                key={make.slug}
                href={`/tires/vehicle/${make.slug}`}
                className="group flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm hover:shadow-md hover:border-safety-orange transition-all"
              >
                <span className="text-sm font-bold text-gray-900 group-hover:text-safety-orange transition-colors">
                  Shop {make.name} Tires
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* How to find size */}
        <div className="mt-12 mx-auto max-w-2xl">
          <div className="rounded-xl bg-blue/5 border border-blue/20 p-6">
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
              <a href="tel:+12792388473" className="font-bold text-safety-orange hover:underline">
                Call/Text (279) 238-TIRE
              </a>{" "}
              and our tire experts will help.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
