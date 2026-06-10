import { notFound } from "next/navigation";
import Link from "next/link";
import { states } from "@/data/locations";
import { brands } from "@/data/brands";
import AddToCartButton from "@/components/AddToCartButton";
import {
  toLocationSlug,
  findState,
  findCity,
  findBrand,
  getBrandUniqueSizes,
  getBrandModelsForSize,
  getOtherBrandsWithSize,
  getVehiclesForSize,
  parseTireSize,
  slugToDisplaySize,
  sizeToSlug,
  getTypeLabel,
  getStateClimate,
  generateSizePageIntro,
} from "@/lib/location-seo";
import type { Metadata } from "next";

export const dynamicParams = true;
export const revalidate = 86400; // re-validate daily

export async function generateStaticParams() {
  // All brand×size pages generated on-demand via ISR (dynamicParams=true)
  // Pre-generating 128 CA cities × 21 brands × 25+ sizes = 67K+ pages
  // exceeds Vercel's build output manifest limit
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{
    state: string;
    city: string;
    brand: string;
    size: string;
  }>;
}): Promise<Metadata> {
  const {
    state: stateSlug,
    city: citySlug,
    brand: brandSlug,
    size: sizeSlug,
  } = await params;

  const state = findState(stateSlug);
  const city = state ? findCity(state, citySlug) : undefined;
  const brand = findBrand(brandSlug);
  if (!state || !city || !brand) return {};

  const models = getBrandModelsForSize(brand, sizeSlug);
  if (models.length === 0) return {};

  const displaySize = slugToDisplaySize(sizeSlug);
  const lowestPrice = Math.min(...models.map((m) => m.sizeInfo.price));
  const vehicles = getVehiclesForSize(models[0].sizeInfo.size);
  const vehicleText =
    vehicles.length > 0 ? ` Fits ${vehicles.slice(0, 2).join(", ")}.` : "";

  return {
    title: `${brand.name} ${displaySize} Tires Near Me in ${city.name}, ${state.abbreviation} — Shipped Free from $${lowestPrice}`,
    description: `${brand.name} ${displaySize} tires near me in ${city.name}, ${state.abbreviation}. ${models.length} model${models.length > 1 ? "s" : ""} from $${lowestPrice}/tire shipped free.${vehicleText} Free shipping — ship to your door or installer near ${city.name}.`,
    alternates: { canonical: `https://ship.tires/locations/${stateSlug}/${citySlug}/${brandSlug}/${sizeSlug}` },
  };
}

export default async function SizePage({
  params,
}: {
  params: Promise<{
    state: string;
    city: string;
    brand: string;
    size: string;
  }>;
}) {
  const {
    state: stateSlug,
    city: citySlug,
    brand: brandSlug,
    size: sizeSlug,
  } = await params;

  const state = findState(stateSlug);
  const city = state ? findCity(state, citySlug) : undefined;
  const brand = findBrand(brandSlug);
  if (!state || !city || !brand) notFound();

  const models = getBrandModelsForSize(brand, sizeSlug);
  if (models.length === 0) notFound();

  const displaySize = slugToDisplaySize(sizeSlug);
  const realSize = models[0].sizeInfo.size; // original format from data
  const lowestPrice = Math.min(...models.map((m) => m.sizeInfo.price));
  const vehicles = getVehiclesForSize(realSize);
  const sizeInfo = parseTireSize(realSize);
  const otherBrands = getOtherBrandsWithSize(brandSlug, sizeSlug);
  const allBrandSizes = getBrandUniqueSizes(brand);
  const relatedSizes = allBrandSizes
    .filter((s) => s.slug !== sizeSlug)
    .slice(0, 12);
  const climate = getStateClimate(stateSlug);

  const introText = generateSizePageIntro(
    city.name,
    state.abbreviation,
    state.name,
    stateSlug,
    brand.name,
    displaySize,
    vehicles,
    lowestPrice,
    city.population
  );

  // Product schema for each model variant
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${brand.name} ${displaySize} Tires in ${city.name}, ${state.abbreviation}`,
    numberOfItems: models.length,
    itemListElement: models.map(({ model, sizeInfo: si }, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      item: {
        "@type": "Product",
        name: `${brand.name} ${model.name} ${realSize}`,
        description: model.description,
        image: `https://img.logo.dev/${brand.domain}?token=pk_X-1ZO13GSgeOoUrIuJ6MYw&size=120&format=png`,
        brand: { "@type": "Brand", name: brand.name },
        category: `${getTypeLabel(model.type)} Tires`,
        size: realSize,
        offers: {
          "@type": "Offer",
          price: si.price,
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
          seller: { "@type": "Organization", name: "Ship.Tires" },
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
          areaServed: {
            "@type": "City",
            name: city.name,
            containedInPlace: {
              "@type": "State",
              name: state.name,
            },
          },
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
        {/* Header */}
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
              <Link
                href={`/locations/${stateSlug}/${citySlug}/${brandSlug}`}
                className="hover:text-white"
              >
                {brand.name}
              </Link>
              <span>/</span>
              <span className="text-gray-300">{displaySize}</span>
            </div>
            <h1 className="mt-4 text-3xl font-bold sm:text-4xl">
              Shop & Ship {brand.name} {displaySize} Tires to {city.name},{" "}
              {state.abbreviation} — Free Delivery
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-gray-300">
              <span>
                {models.length} {models.length === 1 ? "model" : "models"}{" "}
                available
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
              <span className="text-green-400">Shipped Free to {city.name}</span>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-10">
              {/* Intro */}
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Buy {brand.name} {displaySize} Tires Near Me in {city.name} — Free Shipping
                </h2>
                <p className="mt-3 text-gray-600 leading-relaxed">
                  {introText}
                </p>
              </div>

              {/* Models table */}
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {brand.name} Models in {displaySize}
                </h2>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase text-gray-500">
                        <th className="py-3 pr-4">Model</th>
                        <th className="py-3 pr-4">Type</th>
                        <th className="py-3 pr-4">Load</th>
                        <th className="py-3 pr-4">Speed</th>
                        <th className="py-3 pr-4">Warranty</th>
                        <th className="py-3 pr-4">Price</th>
                        <th className="py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {models.map(({ model, sizeInfo: si }) => (
                        <tr key={model.slug} className="hover:bg-gray-50">
                          <td className="py-3 pr-4">
                            <Link
                              href={`/tires/${brandSlug}/${model.slug}`}
                              className="font-medium text-blue hover:underline"
                            >
                              {model.name}
                            </Link>
                          </td>
                          <td className="py-3 pr-4 text-gray-600">
                            {getTypeLabel(model.type)}
                          </td>
                          <td className="py-3 pr-4 text-gray-600">
                            {si.loadIndex}
                          </td>
                          <td className="py-3 pr-4 text-gray-600">
                            {si.speedRating}
                          </td>
                          <td className="py-3 pr-4 text-gray-600">
                            {model.warranty}
                          </td>
                          <td className="py-3 pr-4 font-bold text-gray-900">
                            ${si.price}
                          </td>
                          <td className="py-3 flex items-center gap-2">
                            <AddToCartButton
                              brand={brand.name}
                              brandSlug={brand.slug}
                              model={model.name}
                              modelSlug={model.slug}
                              size={si.size}
                              price={si.price}
                              loadIndex={si.loadIndex}
                              speedRating={si.speedRating}
                            />
                            <Link
                              href={`/contact?tire=${encodeURIComponent(`${brand.name} ${model.name}`)}&size=${encodeURIComponent(realSize)}&city=${encodeURIComponent(city.name)}`}
                              className="inline-flex items-center rounded-md bg-gray-200 px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-300 transition-colors"
                            >
                              Get Quote
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Model Details */}
              {models.map(({ model, sizeInfo: si }) => (
                <div
                  key={model.slug}
                  className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900">
                      {brand.name} {model.name}
                    </h3>
                    <span className="rounded-full bg-blue/10 px-3 py-1 text-xs font-medium text-blue">
                      {getTypeLabel(model.type)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">
                    {model.description}
                  </p>
                  <ul className="mt-3 grid grid-cols-1 gap-1 sm:grid-cols-2">
                    {model.features.map((f) => (
                      <li
                        key={f}
                        className="flex items-start gap-2 text-sm text-gray-700"
                      >
                        <svg
                          className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 flex items-center gap-4 text-sm">
                    <span className="font-bold text-gray-900">
                      ${si.price}/tire
                    </span>
                    <span className="text-gray-500">{model.warranty}</span>
                    <div className="ml-auto flex items-center gap-2">
                      <AddToCartButton
                        brand={brand.name}
                        brandSlug={brand.slug}
                        model={model.name}
                        modelSlug={model.slug}
                        size={si.size}
                        price={si.price}
                        loadIndex={si.loadIndex}
                        speedRating={si.speedRating}
                      />
                      <Link
                        href={`/contact?tire=${encodeURIComponent(`${brand.name} ${model.name}`)}&size=${encodeURIComponent(realSize)}&city=${encodeURIComponent(city.name)}`}
                        className="rounded-md bg-gray-200 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-300 transition-colors"
                      >
                        Get Quote
                      </Link>
                    </div>
                  </div>
                </div>
              ))}

              {/* Size Specs */}
              {sizeInfo && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {displaySize} Tire Specifications
                  </h2>
                  <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
                    <div className="rounded-lg bg-white border border-gray-200 p-4">
                      <dt className="text-xs font-medium text-gray-500 uppercase">
                        Width
                      </dt>
                      <dd className="mt-1 text-sm font-bold text-gray-900">
                        {sizeInfo.width}mm
                      </dd>
                    </div>
                    <div className="rounded-lg bg-white border border-gray-200 p-4">
                      <dt className="text-xs font-medium text-gray-500 uppercase">
                        Aspect Ratio
                      </dt>
                      <dd className="mt-1 text-sm font-bold text-gray-900">
                        {sizeInfo.aspectRatio}%
                      </dd>
                    </div>
                    <div className="rounded-lg bg-white border border-gray-200 p-4">
                      <dt className="text-xs font-medium text-gray-500 uppercase">
                        Rim Diameter
                      </dt>
                      <dd className="mt-1 text-sm font-bold text-gray-900">
                        {sizeInfo.rimDiameter}&quot;
                      </dd>
                    </div>
                    <div className="rounded-lg bg-white border border-gray-200 p-4">
                      <dt className="text-xs font-medium text-gray-500 uppercase">
                        Sidewall Height
                      </dt>
                      <dd className="mt-1 text-sm font-bold text-gray-900">
                        {sizeInfo.sidewall}mm
                      </dd>
                    </div>
                    <div className="rounded-lg bg-white border border-gray-200 p-4">
                      <dt className="text-xs font-medium text-gray-500 uppercase">
                        Overall Diameter
                      </dt>
                      <dd className="mt-1 text-sm font-bold text-gray-900">
                        {sizeInfo.diameter}&quot;
                      </dd>
                    </div>
                  </dl>
                </div>
              )}

              {/* Vehicles */}
              {vehicles.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Vehicles That Use {displaySize} Tires
                  </h2>
                  <p className="mt-2 text-gray-600">
                    The {displaySize} is a popular tire size found on these
                    vehicles. If you drive any of these in {city.name}, the{" "}
                    {brand.name} options above are compatible.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {vehicles.map((v) => (
                      <span
                        key={v}
                        className="rounded-full bg-white border border-gray-200 px-4 py-2 text-sm text-gray-700"
                      >
                        {v}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Other Brands with this size */}
              {otherBrands.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Other {displaySize} Tires Near Me in {city.name}
                  </h2>
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {otherBrands.slice(0, 9).map(({ brand: ob, lowestPrice: lp, modelCount }) => (
                      <Link
                        key={ob.slug}
                        href={`/locations/${stateSlug}/${citySlug}/${ob.slug}/${sizeSlug}`}
                        className="rounded-lg bg-white border border-gray-200 p-4 shadow-sm hover:shadow-md hover:border-blue transition-all"
                      >
                        <h3 className="font-bold text-gray-900 text-sm">
                          {ob.name}
                        </h3>
                        <p className="mt-1 text-xs text-gray-500">
                          {modelCount}{" "}
                          {modelCount === 1 ? "model" : "models"}
                        </p>
                        <p className="mt-0.5 text-xs font-bold text-orange">
                          from ${lp}
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Related Sizes */}
              {relatedSizes.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    More {brand.name} Sizes in {city.name}
                  </h2>
                  <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                    {relatedSizes.map((entry) => (
                      <Link
                        key={entry.slug}
                        href={`/locations/${stateSlug}/${citySlug}/${brandSlug}/${entry.slug}`}
                        className="rounded-lg bg-white border border-gray-200 p-2 text-center text-sm hover:border-blue transition-colors"
                      >
                        <span className="font-medium text-gray-900">
                          {entry.size}
                        </span>
                        <div className="text-xs text-gray-500">
                          ${entry.lowestPrice}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-32 space-y-6">
                {/* Quote Card */}
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900">
                    Get a Quote
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {brand.name} {displaySize} shipped free to {city.name}. Free shipping on every order.
                  </p>
                  <div className="mt-4 space-y-3">
                    <Link
                      href={`/contact?tire=${encodeURIComponent(`${brand.name}`)}&size=${encodeURIComponent(realSize)}&city=${encodeURIComponent(city.name)}`}
                      className="block w-full rounded-lg bg-orange py-3 text-center text-sm font-bold text-white hover:bg-orange-dark transition-colors"
                    >
                      Request Quote
                    </Link>
                    <a
                      href="tel:+12792388473"
                      className="block w-full rounded-lg border-2 border-orange py-3 text-center text-sm font-bold text-orange hover:bg-orange/5 transition-colors"
                    >
                      Call/Text (279) 238-8473 (TIRE)
                    </a>
                  </div>
                </div>

                {/* Shipping Info */}
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                  <h3 className="font-bold text-gray-900">
                    Shipping to {city.name}
                  </h3>
                  <ul className="mt-3 space-y-2 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      <svg
                        className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Free shipping to {city.name}, {state.abbreviation}
                    </li>
                    <li className="flex items-start gap-2">
                      <svg
                        className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Ship to home or local installer
                    </li>
                    <li className="flex items-start gap-2">
                      <svg
                        className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Tires shipped fast — 3-7 business days
                    </li>
                    <li className="flex items-start gap-2">
                      <svg
                        className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Manufacturer warranty included
                    </li>
                  </ul>
                </div>

                {/* Nearby cities */}
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                  <h3 className="font-bold text-gray-900">Nearby Cities</h3>
                  <ul className="mt-3 space-y-1">
                    {state.cities
                      .filter((c) => c.slug !== city.slug)
                      .sort((a, b) => b.population - a.population)
                      .slice(0, 8)
                      .map((c) => (
                        <li key={c.slug}>
                          <Link
                            href={`/locations/${stateSlug}/${toLocationSlug(c.slug)}/${brandSlug}/${sizeSlug}`}
                            className="text-sm text-blue hover:underline"
                          >
                            {brand.name} {displaySize} in {c.name}
                          </Link>
                        </li>
                      ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
