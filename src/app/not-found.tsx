import Link from "next/link";

export default function NotFound() {
  return (
    <div className="bg-gray-50 min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="text-8xl font-heading font-bold text-gray-200">404</div>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Page Not Found</h1>
        <p className="mt-2 text-gray-500">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/tires"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-safety-orange px-6 py-3 text-sm font-bold text-white hover:bg-safety-orange/90 transition-colors"
          >
            Browse Tires
          </Link>
          <Link
            href="/search"
            className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-gray-300 px-6 py-3 text-sm font-bold text-gray-700 hover:border-gray-400 hover:bg-white transition-colors"
          >
            Search
          </Link>
        </div>

        <div className="mt-10 border-t border-gray-200 pt-6">
          <p className="text-sm font-medium text-gray-500 mb-3">Popular pages</p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { href: "/tires/michelin", label: "Michelin" },
              { href: "/tires/goodyear", label: "Goodyear" },
              { href: "/tires/bridgestone", label: "Bridgestone" },
              { href: "/tires/continental", label: "Continental" },
              { href: "/locations", label: "Locations" },
              { href: "/vehicle-lookup", label: "Vehicle Lookup" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full bg-white border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:border-safety-orange/40 hover:text-gray-900 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
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
