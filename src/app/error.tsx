"use client";

import Link from "next/link";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="bg-gray-50 min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="text-6xl font-heading font-bold text-gray-200">Oops</div>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Something Went Wrong</h1>
        <p className="mt-2 text-gray-500">
          We hit an unexpected error. Try again or browse our tire catalog.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-safety-orange px-6 py-3 text-sm font-bold text-white hover:bg-safety-orange/90 transition-colors"
          >
            Try Again
          </button>
          <Link
            href="/tires"
            className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-gray-300 px-6 py-3 text-sm font-bold text-gray-700 hover:border-gray-400 hover:bg-white transition-colors"
          >
            Browse Tires
          </Link>
        </div>

        <p className="mt-8 text-sm text-gray-400">
          Need help?{" "}
          <a href="tel:+12792388473" className="text-safety-orange hover:underline">
            Call (279) 238-TIRE
          </a>
        </p>
      </div>
    </div>
  );
}
