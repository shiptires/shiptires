import { notFound } from "next/navigation";
import Link from "next/link";
import { states } from "@/data/locations";
import { brands } from "@/data/brands";
import {
  toLocationSlug,
  findState,
  findCity,
  findBrand,
  getBrandUniqueSizes,
  getStateClimate,
  getTypeLabel,
  generateBrandPageIntro,
  sizeToSlug,
} from "@/lib/location-seo";
import type { Metadata } from "next";

export const dynamicParams = true;

export async function generateStaticParams() {
  const params: { state: string; city: string; brand: string }[] = [];
  // Pre-generate California
  const ca = states.find((s) => s.slug === "california");
  if (ca) {
    for (const city of ca.cities) {
      for (const brand of brands) {
        params.push({
          state: "california",
          city: toLocationSlug(city.slug),
          brand: brand.slug,
        });
      }
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ state: string; city: string; brand: string }>;
}): Promise<Metadata> {
  const { state: stateSlug, city: citySlug, brand: brandSlug } = await params;
  const state = findState(stateSlug);
  const city = state ? findCity(state, citySlug) : undefined;
  const brand = findBrand(brandSlug);
  if (!state || !city || !brand) return {};

  const sizes = getBrandUniqueSizes(brand);
  const lowestPrice = Math.min(...brand.models.map((m) => m.priceRange[0]));

  return {
    title: `${brand.name} Tires Near Me in ${city.name}, ${state.abbreviation} — ${sizes.length} Sizes Shipped Free`,
    description: `${brand.name} tires near me in ${city.name}, ${state.abbreviation}. ${brand.models.length} models, ${sizes.length} sizes shipped free from $${lowestPrice}/tire. Free shipping on all ${brand.name} tires. Ship to your door or installer near ${city.name}.`,
  };
}

export default async function CityBrandPage({
  params,
}: {
  params: Promise<{ state: string; city: string; brand: string }>;
}) {
  const { state: stateSlug, city: citySlug, brand: brandSlug } = await params;
  const state = findState(stateSlug);
  const city = state ? findCity(state, citySlug) : undefined;
  const brand = findBrand(brandSlug);
  if (!state || !city || !brand) notFound();

  const uniqueSizes = getBrandUniqueSizes(brand);
  const lowestPrice = Math.min(...brand.models.map((m) => m.priceRange[0]));

  const introText = generateBrandPageIntro(
    city.name,
    state.abbreviation,
    state.name,
    stateSlug,
    brand,
    uniqueSizes.length,
    city.population
  );

  const otherBrands = brands.filter((b) => b.slug !== brandSlug);

  const schemaData = {
    "@context": "https://schema.org",
    "@type": "OfferCatalog",
    name: `${brand.name} Tires in ${city.name}, ${state.abbreviation}`,
    description: `${brand.name} tires available for free shipping to ${city.name}, ${state.abbreviation}`,
    numberOfItems: uniqueSizes.length,
    itemListElement: brand.models.map((model, idx) => ({
      "@type": "Offer",
      position: idx + 1,
      name: `${brand.name} ${model.name}`,
      priceCurrency: "USD",
      lowPrice: model.priceRange[0],
      highPrice: model.priceRange[1],
      availability: "https://schema.org/InStock",
      itemOffered: {
        "@type": "Product",
        name: `${brand.name} ${model.name}`,
        brand: { "@type": "Brand", name: brand.name },
        category: `${getTypeLabel(model.type)} Tires`,
      },
      seller: { "@type": "Organization", name: "Ship.Tires" },
      areaServed: {
        "@type": "City",
        name: city.name,
        containedInPlace: {
          "@type": "State",
          name: state.name,
        },
      },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: {
          "@type": "MonetaryAmount",
          value: "0",
          currency: "USD",
        },
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: "US",
          addressRegion: state.abbreviation,
        },
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />

      <div className="bg-gray-50">
        <div className="bg-navy py-12 text-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 text-sm text-gray-400 flex-wrap">
              <Link href="/locations" className="hover:text-white">
                Locations
              </Link>
              <span>/</span>
              <Link
                href={`/locations/${stateSlug}`}
                className="hover:text-white"
              >
                {state.name}
              </Link>
              <span>/</span>
              <Link
                href={`/locations/${stateSlug}/${citySlug}`}
                className="hover:text-white"
              >
                {city.name}
              </Link>
              <span>/</span>
              <span className="text-gray-300">{brand.name}</span>
            </div>
            <h1 className="mt-4 text-3xl font-bold sm:text-4xl">
              {brand.name} Tires Near Me in {city.name}, {state.abbreviation}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-gray-300">
              <span>
                {brand.models.length} models · {uniqueSizes.length} sizes
              </span>
              <span className="text-gray-500">|</span>
              <span>
                From{" "}
                <span className="text-xl font-bold text-white">
                  ${lowestPrice}
                </span>
                /tire
              </span>
              <span className="text-gray-500">|</span>
              <span className="text-green-400">Free Shipping</span>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-12">
          <div className="rounded-xl bg-white border border-gray-200 p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900">
              {brand.name} Tires Shipped Free to {city.name} — Find {brand.name} Near Me
            </h2>
            <p className="mt-4 text-gray-600 leading-relaxed">{introText}</p>
          </div>

          {/* Models Overview */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {brand.name} Tire Lineup
            </h2>
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
              {brand.models.map((model) => (
                <div
                  key={model.slug}
                  className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-900">{model.name}</h3>
                    <span className="rounded-full bg-blue/10 px-3 py-1 text-xs font-medium text-blue">
                      {getTypeLabel(model.type)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                    {model.description}
                  </p>
                  <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                    <span>{model.sizes.length} sizes</span>
                    <span>{model.warranty}</span>
                    <span className="font-bold text-gray-900">
                      ${model.priceRange[0]}–${model.priceRange[1]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* All Sizes */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              All {brand.name} Sizes Shipped Free to {city.name} (
              {uniqueSizes.length})
            </h2>
            <p className="mt-2 text-gray-600">
              Select a tire size to see detailed pricing, specs, and available
              models. Every size ships free to {city.name}.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {uniqueSizes.map((entry) => (
                <Link
                  key={entry.slug}
                  href={`/locations/${stateSlug}/${citySlug}/${brandSlug}/${entry.slug}`}
                  className="rounded-lg bg-white border border-gray-200 p-3 text-center shadow-sm hover:shadow-md hover:border-blue transition-all"
                >
                  <span className="font-bold text-gray-900 text-sm">
                    {entry.size}
                  </span>
                  <div className="mt-1 text-xs text-gray-500">
                    {entry.models.length}{" "}
                    {entry.models.length === 1 ? "model" : "models"}
                  </div>
                  <div className="mt-0.5 text-xs font-bold text-orange">
                    from ${entry.lowestPrice}
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Other brands in this city */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Other Brands in {city.name}
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {otherBrands.map((b) => (
                <Link
                  key={b.slug}
                  href={`/locations/${stateSlug}/${citySlug}/${b.slug}`}
                  className="rounded-full bg-white border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-blue hover:text-white hover:border-blue transition-colors"
                >
                  {b.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-xl bg-orange p-8 text-center text-white">
            <h2 className="text-2xl font-bold">
              Ship {brand.name} Tires to {city.name} — Free
            </h2>
            <p className="mt-2 text-white/90">
              Free shipping on every {brand.name} tire. Shipped to your door or installer near {city.name}. {brand.name} warranty included.
            </p>
            <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href={`/contact?brand=${encodeURIComponent(brand.name)}`}
                className="rounded-lg bg-white px-6 py-3 text-sm font-bold text-orange hover:bg-gray-50 transition-colors"
              >
                Get a Quote
              </Link>
              <a
                href="tel:+19164767689"
                className="rounded-lg border-2 border-white px-6 py-3 text-sm font-bold text-white hover:bg-white/10 transition-colors"
              >
                Call (916) 476-7689
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
