import { notFound } from "next/navigation";
import Link from "next/link";
import { states } from "@/data/locations";
import { brands } from "@/data/brands";
import type { Metadata } from "next";

export async function generateStaticParams() {
  const params: { state: string; city: string }[] = [];
  for (const state of states) {
    for (const city of state.cities) {
      params.push({ state: state.slug, city: city.slug });
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ state: string; city: string }>;
}): Promise<Metadata> {
  const { state: stateSlug, city: citySlug } = await params;
  const state = states.find((s) => s.slug === stateSlug);
  const city = state?.cities.find((c) => c.slug === citySlug);
  if (!state || !city) return {};

  const cityName = city.name;
  const stateName = state.name;

  return {
    title: `Tires Shipped to ${cityName}, ${state.abbreviation} — Free Delivery`,
    description: `Buy tires online and get free shipping to ${cityName}, ${stateName}. Browse 20+ brands including Michelin, Goodyear, Bridgestone. Ship to your home or local ${cityName} installer.`,
  };
}

export default async function CityTiresPage({
  params,
}: {
  params: Promise<{ state: string; city: string }>;
}) {
  const { state: stateSlug, city: citySlug } = await params;
  const state = states.find((s) => s.slug === stateSlug);
  const city = state?.cities.find((c) => c.slug === citySlug);

  if (!state || !city) notFound();

  const cityName = city.name;
  const stateName = state.name;
  const abbr = state.abbreviation;

  const featuredBrands = brands.slice(0, 8);

  return (
    <div className="bg-gray-50">
      <div className="bg-navy py-12 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Link href="/tires" className="hover:text-white">Tires</Link>
            <span>/</span>
            <span className="text-gray-300">{stateName}</span>
          </div>
          <h1 className="mt-4 text-3xl font-bold sm:text-4xl">
            Tires Shipped to {cityName}, {abbr}
          </h1>
          <p className="mt-3 text-lg text-gray-300">
            Free tire shipping to {cityName}, {stateName}. Delivered to your door or your local installer.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-12">
        {/* Intro */}
        <div className="rounded-xl bg-white border border-gray-200 p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900">
            Buy Tires Online in {cityName}, {abbr}
          </h2>
          <p className="mt-4 text-gray-600 leading-relaxed">
            Ship.Tires delivers tires free to {cityName}, {stateName}. Choose from over 20 top tire brands,
            100+ models, and 800+ sizes. Whether you need all-season tires for your daily commute,
            winter tires for {stateName} weather, or performance tires for the weekend, we have you covered.
            We can ship directly to your home in {cityName} or to your preferred local tire installer.
          </p>
        </div>

        {/* How It Works */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            How to Get Tires in {cityName}
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {[
              { step: "1", title: "Find Your Tires", desc: `Browse our catalog or use the vehicle lookup to find tires that fit your car in ${cityName}.` },
              { step: "2", title: "Request a Quote", desc: "Get competitive pricing with free shipping included. We respond within hours." },
              { step: "3", title: "Get Them Installed", desc: `We ship free to ${cityName}. Have them delivered to your door or directly to your local tire shop.` },
            ].map((item) => (
              <div key={item.step} className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange text-white font-bold text-sm">
                  {item.step}
                </div>
                <h3 className="mt-3 font-bold text-gray-900">{item.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Featured Brands */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Top Tire Brands Available in {cityName}
          </h2>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {featuredBrands.map((brand) => (
              <Link
                key={brand.slug}
                href={`/tires/${brand.slug}`}
                className="rounded-xl bg-white border border-gray-200 p-4 text-center shadow-sm hover:shadow-md hover:border-blue transition-all"
              >
                <h3 className="font-bold text-gray-900">{brand.name}</h3>
                <p className="mt-1 text-xs text-gray-500">{brand.models.length} models</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Other Cities */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Also Serving in {stateName}
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {state.cities
              .filter((c) => c.slug !== citySlug)
              .map((c) => (
                <Link
                  key={c.slug}
                  href={`/${stateSlug}/${c.slug}`}
                  className="rounded-full bg-white border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-blue hover:text-white hover:border-blue transition-colors"
                >
                  {c.name}
                </Link>
              ))}
          </div>
        </div>

        {/* CTA */}
        <div className="rounded-xl bg-orange p-8 text-center text-white">
          <h2 className="text-2xl font-bold">Ready to Order Tires in {cityName}?</h2>
          <p className="mt-2 text-white/90">
            Free shipping. Fast delivery. Expert help.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/tires" className="rounded-lg bg-white px-6 py-3 text-sm font-bold text-orange hover:bg-gray-50 transition-colors">
              Browse Tires
            </Link>
            <a href="tel:+19164767689" className="rounded-lg border-2 border-white px-6 py-3 text-sm font-bold text-white hover:bg-white/10 transition-colors">
              Call (916) 476-7689
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
