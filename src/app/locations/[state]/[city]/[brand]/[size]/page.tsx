import { notFound } from "next/navigation";
import Link from "next/link";
import { states } from "@/data/locations";
import AddToCartButton from "@/components/AddToCartButton";
import {
  getBrandBySlug,
  getTiresByBrandAndSize,
  getTiresBySize,
  getDistinctSizesForBrand,
  brandSummaryToBrand,
  tireRowToSize,
  tiresToModel,
} from "@/lib/db";
import {
  toLocationSlug,
  findState,
  findCity,
  getVehiclesForSize,
  parseTireSize,
  slugToDisplaySize,
  sizeToSlug,
  getTypeLabel,
  getStateClimate,
} from "@/lib/location-seo";
import { sitePrice } from "@/lib/pricing";
import type { Metadata } from "next";

export const revalidate = 300;
export const dynamicParams = true;

function parseSizeSlug(sizeSlug: string): { width: string; aspect: string; rim: string } | null {
  const m = sizeSlug.match(/^(\d+)-(\d+)r(\d+)$/i);
  if (!m) return null;
  return { width: m[1], aspect: m[2], rim: m[3] };
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
  const brandRow = await getBrandBySlug(brandSlug);
  const parsed = parseSizeSlug(sizeSlug);
  if (!state || !city || !brandRow || !parsed) return {};

  const brand = brandSummaryToBrand(brandRow);
  const tires = await getTiresByBrandAndSize(brandSlug, parsed.width, parsed.aspect, parsed.rim);
  if (tires.length === 0) return {};

  const displaySize = slugToDisplaySize(sizeSlug);
  const models = new Set(tires.map((t) => t.model_name));
  const prices = tires.map((t) => sitePrice(t.price_map)).filter((p) => p > 0);
  const lowestPrice = prices.length > 0 ? Math.min(...prices) : 0;

  const vehicles = getVehiclesForSize(`${parsed.width}/${parsed.aspect}R${parsed.rim}`);
  const vehicleText =
    vehicles.length > 0 ? ` Fits ${vehicles.slice(0, 2).join(", ")}.` : "";

  return {
    title: `${brand.name} ${displaySize} Tires Near Me in ${city.name}, ${state.abbreviation} — ${lowestPrice > 0 ? `From $${lowestPrice}` : "Shipped Free"}`,
    description: `${brand.name} ${displaySize} tires near me in ${city.name}, ${state.abbreviation}. ${models.size} model${models.size > 1 ? "s" : ""} shipped free.${vehicleText} Free shipping to your door or installer near ${city.name}.`,
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
  const brandRow = await getBrandBySlug(brandSlug);
  const parsed = parseSizeSlug(sizeSlug);
  if (!state || !city || !brandRow || !parsed) notFound();

  const brand = brandSummaryToBrand(brandRow);
  const tires = await getTiresByBrandAndSize(brandSlug, parsed.width, parsed.aspect, parsed.rim);
  if (tires.length === 0) notFound();

  const displaySize = slugToDisplaySize(sizeSlug);
  const realSize = `${parsed.width}/${parsed.aspect}R${parsed.rim}`;
  const climate = getStateClimate(stateSlug);

  // Group tires by model
  const modelMap = new Map<string, typeof tires>();
  for (const t of tires) {
    const key = t.model_name;
    if (!modelMap.has(key)) modelMap.set(key, []);
    modelMap.get(key)!.push(t);
  }
  const modelEntries = Array.from(modelMap.entries()).map(([name, rows]) => ({
    model: tiresToModel(name, rows, brand.name),
    tire: rows[0],
    sizeInfo: tireRowToSize(rows[0]),
  }));

  // Prices
  const allPrices = modelEntries.map((e) => sitePrice(e.sizeInfo.price)).filter((p) => p > 0);
  const lowestPrice = allPrices.length > 0 ? Math.min(...allPrices) : 0;

  // Vehicles
  const vehicles = getVehiclesForSize(realSize);
  const sizeInfo = parseTireSize(realSize);

  // Other brands with this size
  const allSizeTires = await getTiresBySize(parsed.width, parsed.aspect, parsed.rim);
  const otherBrandMap = new Map<string, { count: number; minPrice: number }>();
  for (const t of allSizeTires) {
    if (t.make_name === brandRow.make_name) continue;
    const existing = otherBrandMap.get(t.make_name);
    const price = sitePrice(t.price_map);
    if (existing) {
      existing.count++;
      if (price > 0 && (existing.minPrice === 0 || price < existing.minPrice)) {
        existing.minPrice = price;
      }
    } else {
      otherBrandMap.set(t.make_name, { count: 1, minPrice: price });
    }
  }
  const otherBrands = Array.from(otherBrandMap.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 9);

  // Related sizes from same brand
  const brandSizes = await getDistinctSizesForBrand(brandSlug);
  const relatedSizes = brandSizes
    .filter((s) => !(s.width === parsed.width && s.aspect_ratio === parsed.aspect && s.rim_size === parsed.rim))
    .slice(0, 12);

  // Schema
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${brand.name} ${displaySize} Tires in ${city.name}, ${state.abbreviation}`,
    numberOfItems: modelEntries.length,
    itemListElement: modelEntries.map((entry, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      item: {
        "@type": "Product",
        name: `${brand.name} ${entry.model.name} ${realSize}`,
        brand: { "@type": "Brand", name: brand.name },
        category: `${getTypeLabel(entry.model.type)} Tires`,
        ...(sitePrice(entry.sizeInfo.price) > 0
          ? {
              offers: {
                "@type": "Offer",
                price: sitePrice(entry.sizeInfo.price),
                priceCurrency: "USD",
                availability: "https://schema.org/InStock",
                seller: { "@type": "Organization", name: "Ship.Tires" },
                shippingDetails: {
                  "@type": "OfferShippingDetails",
                  shippingRate: { "@type": "MonetaryAmount", value: "0", currency: "USD" },
                  shippingDestination: {
                    "@type": "DefinedRegion",
                    addressCountry: "US",
                    addressRegion: state.abbreviation,
                  },
                },
              },
            }
          : {}),
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
              <Link href="/locations" className="hover:text-white">Locations</Link>
              <span>/</span>
              <Link href={`/locations/${stateSlug}`} className="hover:text-white">{state.name}</Link>
              <span>/</span>
              <Link href={`/locations/${stateSlug}/${citySlug}`} className="hover:text-white">{city.name}</Link>
              <span>/</span>
              <Link href={`/locations/${stateSlug}/${citySlug}/${brandSlug}`} className="hover:text-white">{brand.name}</Link>
              <span>/</span>
              <span className="text-gray-300">{displaySize}</span>
            </div>
            <h1 className="mt-4 text-3xl font-bold sm:text-4xl">
              Shop & Ship {brand.name} {displaySize} Tires to {city.name},{" "}
              {state.abbreviation} — Free Delivery
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-gray-300">
              <span>
                {modelEntries.length} {modelEntries.length === 1 ? "model" : "models"} available
              </span>
              {lowestPrice > 0 && (
                <>
                  <span className="text-gray-500">|</span>
                  <span>
                    From <span className="text-xl font-bold text-white">${lowestPrice}</span>/tire
                  </span>
                </>
              )}
              <span className="text-gray-500">|</span>
              <span className="text-green-400">Shipped Free to {city.name}</span>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-10">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Buy {brand.name} {displaySize} Tires Near Me in {city.name} — Free Shipping
                </h2>
                <p className="mt-3 text-gray-600 leading-relaxed">
                  Looking for {brand.name} {displaySize} tires near me in {city.name}, {state.abbreviation}?
                  Ship.Tires ships {modelEntries.length} {brand.name} model{modelEntries.length > 1 ? "s" : ""} in
                  this size directly to {city.name} with free shipping. With {climate} to navigate,
                  having the right {displaySize} tires is essential.
                  {vehicles.length > 0 && ` This size commonly fits the ${vehicles.slice(0, 3).join(", ")}${vehicles.length > 3 ? `, and ${vehicles.length - 3} more` : ""}.`}
                  {lowestPrice > 0 ? ` Prices start at $${lowestPrice} per tire with free shipping.` : " Contact us for pricing — every order ships free."}
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
                        <th className="py-3 pr-4">Price</th>
                        <th className="py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {modelEntries.map(({ model, sizeInfo: si }) => (
                        <tr key={model.slug} className="hover:bg-gray-50">
                          <td className="py-3 pr-4">
                            <Link
                              href={`/tires/${brandSlug}/${model.slug}`}
                              className="font-medium text-blue hover:underline"
                            >
                              {model.name}
                            </Link>
                          </td>
                          <td className="py-3 pr-4 text-gray-600">{getTypeLabel(model.type)}</td>
                          <td className="py-3 pr-4 text-gray-600">{si.loadIndex || "—"}</td>
                          <td className="py-3 pr-4 text-gray-600">{si.speedRating || "—"}</td>
                          <td className="py-3 pr-4 font-bold text-gray-900">
                            {sitePrice(si.price) > 0 ? `$${sitePrice(si.price).toFixed(2)}` : "Quote"}
                          </td>
                          <td className="py-3 flex items-center gap-2">
                            {sitePrice(si.price) > 0 ? (
                              <AddToCartButton
                                brand={brand.name}
                                brandSlug={brand.slug}
                                model={model.name}
                                modelSlug={model.slug}
                                size={si.size}
                                price={sitePrice(si.price)}
                                loadIndex={si.loadIndex}
                                speedRating={si.speedRating}
                              />
                            ) : (
                              <Link
                                href={`/contact?tire=${encodeURIComponent(`${brand.name} ${model.name}`)}&size=${encodeURIComponent(realSize)}&city=${encodeURIComponent(city.name)}`}
                                className="inline-flex items-center rounded-md bg-orange px-3 py-1.5 text-xs font-bold text-white hover:bg-orange/90 transition-colors"
                              >
                                Request Quote
                              </Link>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Size Specs */}
              {sizeInfo && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {displaySize} Tire Specifications
                  </h2>
                  <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
                    <div className="rounded-lg bg-white border border-gray-200 p-4">
                      <dt className="text-xs font-medium text-gray-500 uppercase">Width</dt>
                      <dd className="mt-1 text-sm font-bold text-gray-900">{sizeInfo.width}mm</dd>
                    </div>
                    <div className="rounded-lg bg-white border border-gray-200 p-4">
                      <dt className="text-xs font-medium text-gray-500 uppercase">Aspect Ratio</dt>
                      <dd className="mt-1 text-sm font-bold text-gray-900">{sizeInfo.aspectRatio}%</dd>
                    </div>
                    <div className="rounded-lg bg-white border border-gray-200 p-4">
                      <dt className="text-xs font-medium text-gray-500 uppercase">Rim Diameter</dt>
                      <dd className="mt-1 text-sm font-bold text-gray-900">{sizeInfo.rimDiameter}&quot;</dd>
                    </div>
                    <div className="rounded-lg bg-white border border-gray-200 p-4">
                      <dt className="text-xs font-medium text-gray-500 uppercase">Sidewall Height</dt>
                      <dd className="mt-1 text-sm font-bold text-gray-900">{sizeInfo.sidewall}mm</dd>
                    </div>
                    <div className="rounded-lg bg-white border border-gray-200 p-4">
                      <dt className="text-xs font-medium text-gray-500 uppercase">Overall Diameter</dt>
                      <dd className="mt-1 text-sm font-bold text-gray-900">{sizeInfo.diameter}&quot;</dd>
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
                    The {displaySize} is a popular tire size found on these vehicles.
                    If you drive any of these in {city.name}, the {brand.name} options above are compatible.
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
                    {otherBrands.map(([brandName, info]) => {
                      const slug = brandName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
                      return (
                        <Link
                          key={brandName}
                          href={`/locations/${stateSlug}/${citySlug}/${slug}/${sizeSlug}`}
                          className="rounded-lg bg-white border border-gray-200 p-4 shadow-sm hover:shadow-md hover:border-blue transition-all"
                        >
                          <h3 className="font-bold text-gray-900 text-sm">{brandName}</h3>
                          <p className="mt-1 text-xs text-gray-500">
                            {info.count} {info.count === 1 ? "tire" : "tires"}
                          </p>
                          {info.minPrice > 0 && (
                            <p className="mt-0.5 text-xs font-bold text-orange">from ${info.minPrice}</p>
                          )}
                        </Link>
                      );
                    })}
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
                    {relatedSizes.map((entry) => {
                      const slug = sizeToSlug(`${entry.width}/${entry.aspect_ratio}R${entry.rim_size}`);
                      return (
                        <Link
                          key={slug}
                          href={`/locations/${stateSlug}/${citySlug}/${brandSlug}/${slug}`}
                          className="rounded-lg bg-white border border-gray-200 p-2 text-center text-sm hover:border-blue transition-colors"
                        >
                          <span className="font-medium text-gray-900">
                            {entry.width}/{entry.aspect_ratio}R{entry.rim_size}
                          </span>
                          <div className="text-xs text-gray-500">{entry.count} tires</div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-32 space-y-6">
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900">Get a Quote</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {brand.name} {displaySize} shipped free to {city.name}.
                  </p>
                  <div className="mt-4 space-y-3">
                    <Link
                      href={`/contact?tire=${encodeURIComponent(brand.name)}&size=${encodeURIComponent(realSize)}&city=${encodeURIComponent(city.name)}`}
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

                {/* Find Installer */}
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                  <h3 className="font-bold text-gray-900">Ship to an Installer</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Find rated tire installers near {city.name}.
                  </p>
                  <Link
                    href="/installers"
                    className="mt-3 block w-full rounded-lg bg-blue py-2.5 text-center text-sm font-bold text-white hover:bg-blue/90 transition-colors"
                  >
                    Find Installers
                  </Link>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                  <h3 className="font-bold text-gray-900">Shipping to {city.name}</h3>
                  <ul className="mt-3 space-y-2 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      <span className="mt-0.5 text-green-500">✓</span>
                      Free shipping to {city.name}, {state.abbreviation}
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-0.5 text-green-500">✓</span>
                      Ship to home or local installer
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-0.5 text-green-500">✓</span>
                      3-7 business days delivery
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-0.5 text-green-500">✓</span>
                      Manufacturer warranty included
                    </li>
                  </ul>
                </div>

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
