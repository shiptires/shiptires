import { notFound } from "next/navigation";
import Link from "next/link";
import { states } from "@/data/locations";
import {
  findStateByAbbr,
  cityToSlug,
  getZipsForCity,
  findCityInState,
} from "@/lib/installer-utils";
import { getStateClimate, getCityTier } from "@/lib/location-seo";
import type { Metadata } from "next";

export const revalidate = 3600;

type Params = { state: string; city: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { state, city } = await params;
  const stateData = findStateByAbbr(state);
  if (!stateData) return {};

  const cityData = stateData.cities.find(
    (c) => cityToSlug(c.name) === city
  );
  const displayCity = cityData?.name ?? city.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    title: `Tire Installers in ${displayCity}, ${stateData.abbreviation} — Ship.Tires`,
    description: `Find tire installers across all zip codes in ${displayCity}, ${stateData.abbreviation}. Buy tires online with free shipping to any installer in ${displayCity}.`,
    alternates: {
      canonical: `https://ship.tires/installers/${state}/${city}`,
    },
  };
}

export function generateStaticParams() {
  const params: Params[] = [];

  for (const stateData of states) {
    const abbr = stateData.abbreviation.toLowerCase();
    for (const cityData of stateData.cities) {
      params.push({
        state: abbr,
        city: cityToSlug(cityData.name),
      });
    }
  }

  return params;
}

export default async function InstallerCityPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { state, city } = await params;

  const stateData = findStateByAbbr(state);
  if (!stateData) notFound();

  const cityData = findCityInState(
    stateData,
    city.replace(/-/g, " ")
  );

  // Try to match city by slug
  const cityMatch =
    cityData ??
    stateData.cities.find((c) => cityToSlug(c.name) === city);

  // Get all zips for this city
  const displayCity =
    cityMatch?.name ??
    city.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const zips = getZipsForCity(displayCity, stateData.abbreviation);
  if (zips.length === 0) notFound();

  const climate = getStateClimate(stateData.slug);
  const tier = cityMatch
    ? getCityTier(cityMatch.population)
    : "mid";

  const introTexts: Record<string, string> = {
    metro: `${displayCity} is one of ${stateData.name}'s largest metro areas, with ${zips.length} zip codes served by local tire installers. With ${climate}, choosing the right tires is critical for the millions of drivers navigating ${displayCity} roads. Browse all zip codes below to find tire shops near your exact location.`,
    large: `Find tire installers across ${displayCity}, ${stateData.abbreviation} — covering ${zips.length} zip codes. ${displayCity} drivers deal with ${climate}, making quality tire selection essential. Ship.Tires delivers free to any installer in every zip code listed below.`,
    mid: `Ship.Tires covers all ${zips.length} zip codes in ${displayCity}, ${stateData.abbreviation}. With ${climate} to contend with, local tire shops help keep ${displayCity} drivers safe on the road. Pick your zip code below to find nearby installers.`,
    small: `Even in ${displayCity}, ${stateData.abbreviation}, Ship.Tires ships free to any installer. Browse ${zips.length > 1 ? `all ${zips.length} zip codes` : "the zip code"} below to find tire shops near you. With ${climate}, the right tires make all the difference.`,
  };

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
            <Link
              href={`/installers/${state}`}
              className="hover:text-white"
            >
              {stateData.name}
            </Link>
            <span>/</span>
            <span className="text-gray-300">{displayCity}</span>
          </div>
          <h1 className="mt-4 text-3xl font-bold sm:text-4xl">
            Tire Installers in {displayCity},{" "}
            {stateData.abbreviation}
          </h1>
          <p className="mt-2 text-lg text-gray-300">
            {zips.length} zip code{zips.length !== 1 ? "s" : ""} with
            free shipping to any installer
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* SEO Intro */}
        <p className="max-w-3xl text-gray-600 leading-relaxed">
          {introTexts[tier]}
        </p>

        {/* Zip Code Grid */}
        <div className="mt-10">
          <h2 className="text-2xl font-bold text-gray-900">
            All Zip Codes in {displayCity},{" "}
            {stateData.abbreviation}
          </h2>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {zips.map((z) => (
              <Link
                key={z}
                href={`/installers/${state}/${city}/${z}`}
                className="rounded-lg border border-gray-200 bg-white p-4 text-center hover:shadow-md hover:border-blue transition-all"
              >
                <span className="block text-lg font-mono font-bold text-gray-900">
                  {z}
                </span>
                <span className="block mt-1 text-xs text-gray-500">
                  Find installers
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* How it works */}
        <div className="mt-16 rounded-xl bg-white border border-gray-200 p-8">
          <h2 className="text-xl font-bold text-gray-900">
            How Ship.Tires + Local Installation Works
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {[
              {
                step: "1",
                title: "Shop Tires Online",
                desc: `Browse 60,000+ tires from 130+ brands. Every order ships free to ${displayCity}.`,
              },
              {
                step: "2",
                title: "Ship to Any Installer",
                desc: "At checkout, enter your installer's address. We ship directly to them.",
              },
              {
                step: "3",
                title: "Get Installed",
                desc: "Schedule your appointment. Tires are waiting when you arrive.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-navy text-white font-bold text-lg">
                  {item.step}
                </div>
                <h3 className="mt-3 text-base font-bold text-gray-900">
                  {item.title}
                </h3>
                <p className="mt-1 text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Browse other cities in state */}
        <div className="mt-16">
          <h2 className="text-xl font-bold text-gray-900">
            Other Cities in {stateData.name}
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {stateData.cities
              .filter(
                (c) => cityToSlug(c.name) !== city
              )
              .slice(0, 20)
              .map((c) => (
                <Link
                  key={c.slug}
                  href={`/installers/${state}/${cityToSlug(c.name)}`}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:border-blue hover:text-blue transition-colors"
                >
                  {c.name}
                </Link>
              ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 rounded-xl bg-navy p-8 text-center text-white">
          <h3 className="text-xl font-bold">
            Ready to Buy Tires in {displayCity}?
          </h3>
          <p className="mt-2 text-gray-400">
            Free shipping to your door or any installer in{" "}
            {displayCity}, {stateData.abbreviation}.
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
