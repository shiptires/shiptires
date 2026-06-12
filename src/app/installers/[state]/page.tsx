import { notFound, permanentRedirect } from "next/navigation";
import Link from "next/link";
import zipcodes from "zipcodes";
import { states } from "@/data/locations";
import {
  findStateByAbbr,
  cityToSlug,
  getZipsForCity,
  zipToInstallerUrl,
} from "@/lib/installer-utils";
import { getStateClimate } from "@/lib/location-seo";
import type { Metadata } from "next";

export const revalidate = 3600;

type Params = { state: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { state } = await params;

  // Don't generate metadata for legacy zip redirects
  if (/^\d{5}$/.test(state)) return {};

  const stateData = findStateByAbbr(state);
  if (!stateData) return {};

  return {
    title: `Tire Installers in ${stateData.name} — Ship.Tires`,
    description: `Find tire installers across ${stateData.name}. Browse ${stateData.cities.length} cities with free tire shipping to any installer in ${stateData.abbreviation}.`,
    alternates: {
      canonical: `https://ship.tires/installers/${state}`,
    },
  };
}

export function generateStaticParams() {
  return states.map((s) => ({
    state: s.abbreviation.toLowerCase(),
  }));
}

export default async function InstallerStatePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { state } = await params;

  // Legacy zip redirect: /installers/90001 → /installers/ca/los-angeles/90001
  if (/^\d{5}$/.test(state)) {
    const newUrl = zipToInstallerUrl(state);
    if (newUrl) {
      permanentRedirect(newUrl);
    }
    notFound();
  }

  const stateData = findStateByAbbr(state);
  if (!stateData) notFound();

  const climate = getStateClimate(stateData.slug);

  // Build city list with zip counts
  const cities = stateData.cities
    .map((c) => {
      const zips = getZipsForCity(c.name, stateData.abbreviation);
      return {
        name: c.name,
        slug: cityToSlug(c.name),
        population: c.population,
        zipCount: zips.length,
      };
    })
    .filter((c) => c.zipCount > 0)
    .sort((a, b) => b.population - a.population);

  // Total zip count across all cities in state
  const totalZips = cities.reduce((sum, c) => sum + c.zipCount, 0);

  return (
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
            <span className="text-gray-300">{stateData.name}</span>
          </div>
          <h1 className="mt-4 text-3xl font-bold sm:text-4xl">
            Tire Installers in {stateData.name}
          </h1>
          <p className="mt-2 text-lg text-gray-300">
            {cities.length} cities, {totalZips.toLocaleString()} zip codes —
            free shipping to any installer
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* SEO Intro */}
        <p className="max-w-3xl text-gray-600 leading-relaxed">
          Find tire installers across {stateData.name}. With {climate},{" "}
          {stateData.name} drivers need reliable tires year-round. Ship.Tires
          ships free to any tire shop in the state — browse {cities.length}{" "}
          cities and {totalZips.toLocaleString()} zip codes below to find
          installers near you.
        </p>

        {/* City Grid */}
        <div className="mt-10">
          <h2 className="text-2xl font-bold text-gray-900">
            Cities in {stateData.name}
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {cities.map((c) => (
              <Link
                key={c.slug}
                href={`/installers/${state}/${c.slug}`}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 hover:shadow-md hover:border-blue transition-all"
              >
                <div>
                  <span className="block text-sm font-bold text-gray-900">
                    {c.name}
                  </span>
                  <span className="block mt-0.5 text-xs text-gray-500">
                    {c.zipCount} zip code{c.zipCount !== 1 ? "s" : ""}
                  </span>
                </div>
                <svg
                  className="h-4 w-4 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.25 4.5l7.5 7.5-7.5 7.5"
                  />
                </svg>
              </Link>
            ))}
          </div>
        </div>

        {/* Browse other states */}
        <div className="mt-16">
          <h2 className="text-xl font-bold text-gray-900">
            Browse Other States
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {states
              .filter(
                (s) =>
                  s.abbreviation.toLowerCase() !== state
              )
              .map((s) => (
                <Link
                  key={s.abbreviation}
                  href={`/installers/${s.abbreviation.toLowerCase()}`}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:border-blue hover:text-blue transition-colors"
                >
                  {s.name}
                </Link>
              ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 rounded-xl bg-navy p-8 text-center text-white">
          <h3 className="text-xl font-bold">
            Ready to Buy Tires in {stateData.name}?
          </h3>
          <p className="mt-2 text-gray-400">
            Free shipping on every order to any address in{" "}
            {stateData.abbreviation}.
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
