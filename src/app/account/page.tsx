"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export default function AccountDashboard() {
  const { profile, loading } = useAuth();

  if (loading || !profile) {
    return <div className="animate-pulse text-gray-400 py-12 text-center">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Quick links */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link
          href="/account/orders"
          className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm hover:border-safety-orange/30 hover:shadow-md transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-safety-orange/10 text-safety-orange">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 group-hover:text-safety-orange transition-colors">Orders</h3>
              <p className="text-xs text-gray-500">View history &amp; tracking</p>
            </div>
          </div>
        </Link>
        <Link
          href="/account/profile"
          className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm hover:border-safety-orange/30 hover:shadow-md transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-safety-orange/10 text-safety-orange">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 group-hover:text-safety-orange transition-colors">Profile</h3>
              <p className="text-xs text-gray-500">Name, phone, addresses</p>
            </div>
          </div>
        </Link>
        <Link
          href="/account/vehicles"
          className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm hover:border-safety-orange/30 hover:shadow-md transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-safety-orange/10 text-safety-orange">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 group-hover:text-safety-orange transition-colors">Vehicles</h3>
              <p className="text-xs text-gray-500">Manage saved vehicles</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Saved vehicles preview */}
      {profile.vehicles && profile.vehicles.length > 0 && (
        <div className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-3">Your Vehicles</h3>
          <div className="space-y-2">
            {profile.vehicles.slice(0, 3).map((v, i) => (
              <div key={i} className="flex items-center justify-between text-sm rounded-lg bg-gray-50 px-4 py-3">
                <span className="text-gray-700 font-medium">
                  {v.year} {v.make} {v.model}
                </span>
                {v.tire_size && (
                  <Link href={`/tires/size/${v.tire_size}`} className="text-safety-orange text-xs font-bold hover:underline">
                    Shop {v.tire_size}
                  </Link>
                )}
              </div>
            ))}
          </div>
          {profile.vehicles.length > 3 && (
            <Link href="/account/vehicles" className="mt-3 inline-block text-sm text-safety-orange font-medium hover:underline">
              View all {profile.vehicles.length} vehicles &rarr;
            </Link>
          )}
        </div>
      )}

      {/* Quick actions */}
      <div className="rounded-xl bg-navy p-6 text-white">
        <h3 className="font-bold">Need Tires?</h3>
        <p className="mt-1 text-sm text-gray-400">Find the perfect tires for your vehicle.</p>
        <div className="mt-4 flex gap-3">
          <Link href="/tires" className="rounded-lg bg-safety-orange px-4 py-2 text-sm font-bold text-white hover:bg-safety-orange/90 transition-colors">
            Browse Tires
          </Link>
          <Link href="/vehicle-lookup" className="rounded-lg border border-gray-600 px-4 py-2 text-sm font-bold text-white hover:bg-white/10 transition-colors">
            Find by Vehicle
          </Link>
        </div>
      </div>
    </div>
  );
}
