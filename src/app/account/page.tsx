"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export default function AccountDashboard() {
  const { profile, loading } = useAuth();

  if (loading) {
    return <div className="animate-pulse text-gray-400 py-12 text-center">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900">
          Welcome{profile?.full_name ? `, ${profile.full_name}` : ""}
        </h2>
        <p className="mt-1 text-sm text-gray-500">{profile?.email}</p>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link
          href="/account/orders"
          className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm hover:border-orange transition-colors"
        >
          <h3 className="font-bold text-gray-900">Orders</h3>
          <p className="mt-1 text-sm text-gray-500">View order history and tracking</p>
        </Link>
        <Link
          href="/account/profile"
          className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm hover:border-orange transition-colors"
        >
          <h3 className="font-bold text-gray-900">Profile</h3>
          <p className="mt-1 text-sm text-gray-500">Edit name, phone, addresses</p>
        </Link>
        <Link
          href="/account/vehicles"
          className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm hover:border-orange transition-colors"
        >
          <h3 className="font-bold text-gray-900">Vehicles</h3>
          <p className="mt-1 text-sm text-gray-500">Manage saved vehicles</p>
        </Link>
      </div>

      {/* Saved vehicles preview */}
      {profile?.vehicles && profile.vehicles.length > 0 && (
        <div className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-3">Your Vehicles</h3>
          <div className="space-y-2">
            {profile.vehicles.slice(0, 3).map((v, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">
                  {v.year} {v.make} {v.model}
                </span>
                {v.tire_size && (
                  <span className="text-gray-400 font-mono text-xs">{v.tire_size}</span>
                )}
              </div>
            ))}
          </div>
          {profile.vehicles.length > 3 && (
            <Link href="/account/vehicles" className="mt-2 inline-block text-sm text-orange hover:underline">
              View all {profile.vehicles.length} vehicles
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
