"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function InstallersPage() {
  const [zip, setZip] = useState("");
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleaned = zip.replace(/\D/g, "").slice(0, 5);
    if (cleaned.length === 5) {
      router.push(`/installers/${cleaned}`);
    }
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-navy py-16 text-white">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold sm:text-4xl">
            Find Tire Installers Near You
          </h1>
          <p className="mt-3 text-lg text-gray-300">
            Enter your zip code to find tire shops nearby. Buy tires online and we&apos;ll
            ship them free to your chosen installer.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 flex items-center justify-center gap-3">
            <input
              type="text"
              value={zip}
              onChange={(e) => setZip(e.target.value.replace(/\D/g, "").slice(0, 5))}
              placeholder="Enter zip code"
              maxLength={5}
              className="w-40 rounded-lg border-2 border-white/20 bg-white/10 px-4 py-3 text-center text-xl font-mono font-bold text-white placeholder:text-gray-500 focus:border-safety-orange focus:outline-none"
            />
            <button
              type="submit"
              disabled={zip.length !== 5}
              className="rounded-lg bg-safety-orange px-6 py-3 text-sm font-bold text-white hover:bg-safety-orange/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Find Installers
            </button>
          </form>
        </div>
      </div>

      {/* How it works */}
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-center text-2xl font-bold text-gray-900">
          How It Works
        </h2>
        <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-3">
          {[
            {
              step: "1",
              title: "Shop Tires Online",
              desc: "Browse 60,000+ tires from 130+ brands. Every order ships free.",
              icon: "M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z",
            },
            {
              step: "2",
              title: "Ship to Any Installer",
              desc: "At checkout, enter your installer's address. We ship directly to them.",
              icon: "M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12",
            },
            {
              step: "3",
              title: "Get Installed",
              desc: "Schedule your appointment. Tires are waiting when you arrive.",
              icon: "M11.42 15.17l-5.384-3.192a.75.75 0 00-1.098.664v6.356a.75.75 0 001.098.664l5.384-3.192a.75.75 0 000-1.3zm8.58 0l-5.384-3.192a.75.75 0 00-1.098.664v6.356a.75.75 0 001.098.664l5.384-3.192a.75.75 0 000-1.3z",
            },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-navy">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-bold text-gray-900">{item.title}</h3>
              <p className="mt-2 text-sm text-gray-600">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Popular areas */}
        <div className="mt-16">
          <h2 className="text-center text-2xl font-bold text-gray-900">
            Popular Areas
          </h2>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { zip: "90001", label: "Los Angeles, CA" },
              { zip: "10001", label: "New York, NY" },
              { zip: "60601", label: "Chicago, IL" },
              { zip: "77001", label: "Houston, TX" },
              { zip: "85001", label: "Phoenix, AZ" },
              { zip: "19101", label: "Philadelphia, PA" },
              { zip: "78201", label: "San Antonio, TX" },
              { zip: "92101", label: "San Diego, CA" },
              { zip: "75201", label: "Dallas, TX" },
              { zip: "95624", label: "Sacramento, CA" },
              { zip: "32801", label: "Orlando, FL" },
              { zip: "30301", label: "Atlanta, GA" },
            ].map((area) => (
              <Link
                key={area.zip}
                href={`/installers/${area.zip}`}
                className="rounded-lg border border-gray-200 bg-white p-4 text-center hover:shadow-md hover:border-blue transition-all"
              >
                <span className="block text-sm font-bold text-gray-900">{area.label}</span>
                <span className="block mt-1 text-xs font-mono text-gray-400">{area.zip}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 rounded-xl bg-navy p-8 text-center text-white">
          <h3 className="text-xl font-bold">Ready to Buy Tires?</h3>
          <p className="mt-2 text-gray-400">
            Browse our full catalog. Free shipping to your door or any installer nationwide.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/tires"
              className="inline-flex items-center gap-2 rounded-lg bg-safety-orange px-6 py-3 text-sm font-bold text-white hover:bg-safety-orange/90 transition-colors"
            >
              Shop All Tires
            </Link>
            <a
              href="tel:+12792388473"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-600 px-6 py-3 text-sm font-bold text-white hover:bg-navy-light transition-colors"
            >
              Call/Text (279) 238-8473
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
