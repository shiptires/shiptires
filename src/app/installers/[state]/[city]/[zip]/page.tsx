import { notFound } from "next/navigation";
import Link from "next/link";
import zipcodes from "zipcodes";
import { getAllBrands, brandSummaryToBrand, getStats } from "@/lib/db";
import { states } from "@/data/locations";
import {
  getInstallersForZip,
  findStateByAbbr,
  cityToSlug,
  getZipsForCity,
  zipToInstallerUrl,
} from "@/lib/installer-utils";
import type { PlaceResult } from "@/lib/installer-utils";
import type { Metadata } from "next";

export const revalidate = 3600;

type Params = { state: string; city: string; zip: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { state, city, zip } = await params;
  const location = zipcodes.lookup(zip);
  if (!location) return {};

  const stateData = findStateByAbbr(state);
  const displayCity = location.city;
  const displayState = stateData?.name ?? location.state;

  return {
    title: `Tire & Wheel Shops in ${displayCity}, ${location.state} ${zip} — Ship.Tires`,
    description: `Find tire installers and shops near ${zip} in ${displayCity}, ${displayState}. Compare ratings and reviews. Buy tires online with free shipping to any installer.`,
    alternates: {
      canonical: `https://ship.tires/installers/${state}/${city}/${zip}`,
    },
  };
}

// Installer zip pages are ISR-only (generated on first visit, cached for 5 min).
// They're still in the sitemap so Google will discover and index them.
// Pre-building ~500 zip pages at build time was causing consistent timeouts
// due to Google Places API + resource contention with 19 workers.
export const dynamicParams = true;
export function generateStaticParams(): Params[] {
  return [];
}

export default async function InstallerZipPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { state, city, zip } = await params;

  if (!/^\d{5}$/.test(zip)) notFound();

  const location = zipcodes.lookup(zip);
  if (!location) notFound();

  // Validate state/city match the zip
  const stateData = findStateByAbbr(state);
  if (!stateData) notFound();

  // Find matching city in locations data
  const cityMatch = stateData.cities.find(
    (c) => c.name.toLowerCase() === location.city.toLowerCase()
  );

  // Fetch installers — checks Supabase cache first, falls back to Google Places
  const cachedResult = await getInstallersForZip(zip);
  const installers = cachedResult?.installers ?? [];

  // Get nearby zip codes for coverage display
  const nearbyZips = (zipcodes.radius(zip, 10) || []) as string[];

  // Get popular brands from DB
  const brandRows = await getAllBrands();
  const topBrands = brandRows
    .sort((a, b) => b.tire_count - a.tire_count)
    .slice(0, 12)
    .map(brandSummaryToBrand);

  const dbStats = await getStats();

  // Schema.org markup
  const canonicalUrl = `https://ship.tires/installers/${state}/${city}/${zip}`;
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Tire & Wheel Shops in ${location.city}, ${location.state} ${zip}`,
    description: `Find tire installation shops near ${zip} in ${location.city}, ${location.state}.`,
    url: canonicalUrl,
    ...(installers.length > 0 && {
      hasPart: installers.slice(0, 5).map((inst) => ({
        "@type": "LocalBusiness",
        name: inst.name,
        address: inst.address,
        geo: {
          "@type": "GeoCoordinates",
          latitude: inst.lat,
          longitude: inst.lng,
        },
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: inst.rating,
          reviewCount: inst.totalRatings,
        },
      })),
    }),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />

      <div className="bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="bg-navy py-12 text-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Link href="/" className="hover:text-white">
                Home
              </Link>
              <span>/</span>
              <Link href="/installers" className="hover:text-white">
                Installers
              </Link>
              <span>/</span>
              <Link
                href={`/installers/${state}`}
                className="hover:text-white"
              >
                {stateData.name}
              </Link>
              <span>/</span>
              <Link
                href={`/installers/${state}/${city}`}
                className="hover:text-white"
              >
                {location.city}
              </Link>
              <span>/</span>
              <span className="text-gray-300">{zip}</span>
            </div>
            <h1 className="mt-4 text-3xl font-bold sm:text-4xl">
              Tire &amp; Wheel Shops in {location.city},{" "}
              {location.state} {zip}
            </h1>
            <p className="mt-2 text-lg text-gray-300">
              Buy tires online, ship free to any installer
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-10">
              {/* How it works */}
              <div className="rounded-xl bg-white border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900">
                  How Ship.Tires + Local Installation Works
                </h2>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {[
                    {
                      step: "1",
                      title: "Buy Online",
                      desc: "Choose from 60,000+ tires. Free shipping on every order.",
                    },
                    {
                      step: "2",
                      title: "Ship to Installer",
                      desc: "We ship directly to any tire shop near you.",
                    },
                    {
                      step: "3",
                      title: "Get Installed",
                      desc: "Your installer mounts and balances — you drive away.",
                    },
                  ].map((item) => (
                    <div key={item.step} className="text-center">
                      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-navy text-white font-bold">
                        {item.step}
                      </div>
                      <h3 className="mt-2 text-sm font-bold text-gray-900">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-xs text-gray-500">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Google Places Results */}
              {installers.length > 0 ? (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Tire Shops Near {zip} ({installers.length})
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Ratings and reviews from Google. Buy tires from Ship.Tires
                    and ship to any of these installers for free.
                  </p>
                  <div className="mt-6 space-y-4">
                    {installers.map((inst: PlaceResult) => (
                      <div
                        key={inst.placeId}
                        className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">
                              {inst.name}
                            </h3>
                            <p className="mt-0.5 text-sm text-gray-500">
                              {inst.address}
                            </p>
                          </div>
                          {inst.distanceMiles != null && (
                            <span className="flex-shrink-0 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                              {inst.distanceMiles} mi
                            </span>
                          )}
                        </div>
                        <div className="mt-3 flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <RatingStars rating={inst.rating} />
                            <span className="ml-1 text-sm font-bold text-gray-900">
                              {inst.rating}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            ({inst.totalRatings.toLocaleString()} reviews)
                          </span>
                          {inst.openNow !== undefined && (
                            <span
                              className={`text-xs font-medium ${inst.openNow ? "text-green-600" : "text-red-500"}`}
                            >
                              {inst.openNow ? "Open Now" : "Closed"}
                            </span>
                          )}
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                          <a
                            href={`https://www.google.com/maps/place/?q=place_id:${inst.placeId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center rounded-md bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200 transition-colors"
                          >
                            View on Google Maps
                          </a>
                          <Link
                            href="/tires"
                            className="inline-flex items-center rounded-md bg-navy px-3 py-1.5 text-xs font-bold text-white hover:bg-navy-light transition-colors"
                          >
                            Shop Tires to Ship Here
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Tire Installation Near {location.city}, {location.state}
                  </h2>
                  <div className="mt-4 rounded-xl bg-white border border-gray-200 p-6">
                    <p className="text-gray-600">
                      Ship.Tires delivers free to any address in{" "}
                      {location.city}, {location.state} — including local tire
                      shops and installation centers. Search Google Maps for
                      &quot;tire installation near {zip}&quot; to find a shop,
                      then enter their address at checkout and we&apos;ll ship
                      your tires directly to them.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <a
                        href={`https://www.google.com/maps/search/tire+installation+near+${zip}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-lg bg-navy px-4 py-2 text-sm font-bold text-white hover:bg-navy-light transition-colors"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
                          />
                        </svg>
                        Find Installers on Google Maps
                      </a>
                      <Link
                        href="/tires"
                        className="inline-flex items-center gap-2 rounded-lg bg-safety-orange px-4 py-2 text-sm font-bold text-white hover:bg-safety-orange/90 transition-colors"
                      >
                        Shop Tires — Free Shipping to {zip}
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* Nearby zip codes */}
              {nearbyZips.length > 1 && (
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Zip Codes We Ship To Near {zip}
                  </h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {nearbyZips
                      .filter((z) => z !== zip)
                      .slice(0, 30)
                      .map((z) => {
                        const info = zipcodes.lookup(z);
                        const href = info
                          ? zipToInstallerUrl(z) ?? `/installers/${z}`
                          : `/installers/${z}`;
                        return (
                          <Link
                            key={z}
                            href={href}
                            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-mono text-gray-700 hover:border-blue hover:text-blue transition-colors"
                            title={
                              info ? `${info.city}, ${info.state}` : z
                            }
                          >
                            {z}
                          </Link>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Location card */}
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="text-sm font-bold uppercase text-gray-500">
                  Shipping To
                </h3>
                <p className="mt-2 text-2xl font-bold text-gray-900">
                  {location.city}, {location.state} {zip}
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  Free shipping — every order, no minimum
                </p>
                <div className="mt-4 rounded-lg bg-green-50 border border-green-200 p-3">
                  <p className="text-sm font-medium text-green-800">
                    Estimated delivery: 3-7 business days
                  </p>
                </div>
              </div>

              {/* Popular brands */}
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="text-sm font-bold uppercase text-gray-500">
                  Popular Brands Available
                </h3>
                <div className="mt-3 space-y-2">
                  {topBrands.map((brand) => (
                    <Link
                      key={brand.slug}
                      href={`/tires/${brand.slug}`}
                      className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-sm font-medium text-gray-900">
                        {brand.name}
                      </span>
                      <span className="text-xs text-gray-400">
                        {brand.tireCount} tires
                      </span>
                    </Link>
                  ))}
                </div>
                <Link
                  href="/tires"
                  className="mt-4 block rounded-lg bg-navy px-4 py-2 text-center text-sm font-bold text-white hover:bg-navy-light transition-colors"
                >
                  View All {dbStats.brandCount} Brands
                </Link>
              </div>

              {/* Browse other zips in this city */}
              {cityMatch && (
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                  <h3 className="text-sm font-bold uppercase text-gray-500">
                    More Zip Codes in {location.city}
                  </h3>
                  <p className="mt-2 text-sm text-gray-600">
                    View all installer options across {location.city}.
                  </p>
                  <Link
                    href={`/installers/${state}/${city}`}
                    className="mt-3 block rounded-lg bg-gray-100 px-4 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
                  >
                    All {location.city} Zip Codes
                  </Link>
                </div>
              )}

              {/* CTA */}
              <div className="rounded-xl bg-navy p-6 text-white">
                <h3 className="text-lg font-bold">Need Help?</h3>
                <p className="mt-1 text-sm text-gray-400">
                  Our tire experts can recommend the right tires and help
                  coordinate installation.
                </p>
                <a
                  href="tel:+12792388473"
                  className="mt-4 block rounded-lg bg-safety-orange px-4 py-2 text-center text-sm font-bold text-white hover:bg-safety-orange/90 transition-colors"
                >
                  Call/Text (279) 238-8473
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function RatingStars({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.3;
  const stars = [];

  for (let i = 0; i < 5; i++) {
    if (i < full) {
      stars.push(
        <svg
          key={i}
          className="h-4 w-4 text-yellow-400"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      );
    } else if (i === full && hasHalf) {
      stars.push(
        <svg
          key={i}
          className="h-4 w-4 text-yellow-400"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <defs>
            <linearGradient id={`half-${i}`}>
              <stop offset="50%" stopColor="currentColor" />
              <stop offset="50%" stopColor="#D1D5DB" />
            </linearGradient>
          </defs>
          <path
            fill={`url(#half-${i})`}
            d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
          />
        </svg>
      );
    } else {
      stars.push(
        <svg
          key={i}
          className="h-4 w-4 text-gray-300"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      );
    }
  }

  return <div className="flex">{stars}</div>;
}
