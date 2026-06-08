import { notFound } from "next/navigation";
import Link from "next/link";
import { brands } from "@/data/brands";
import QuoteRequestForm from "@/components/QuoteRequestForm";
import TireCard from "@/components/TireCard";
import AddToCartButton from "@/components/AddToCartButton";
import type { Metadata } from "next";

export async function generateStaticParams() {
  const params: { brand: string; model: string }[] = [];
  for (const brand of brands) {
    for (const model of brand.models) {
      params.push({ brand: brand.slug, model: model.slug });
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ brand: string; model: string }>;
}): Promise<Metadata> {
  const { brand: brandSlug, model: modelSlug } = await params;
  const brand = brands.find((b) => b.slug === brandSlug);
  const model = brand?.models.find((m) => m.slug === modelSlug);
  if (!brand || !model) return {};

  return {
    title: `${brand.name} ${model.name} — Prices, Sizes & Specs`,
    description: `Buy ${brand.name} ${model.name} tires from $${model.priceRange[0]}. Available in ${model.sizes.length} sizes. Free shipping. ${model.warranty} warranty.`,
  };
}

const typeLabels: Record<string, string> = {
  "all-season": "All-Season",
  winter: "Winter",
  summer: "Summer",
  performance: "Performance",
  "all-terrain": "All-Terrain",
  "mud-terrain": "Mud-Terrain",
  highway: "Highway",
  touring: "Touring",
};

export default async function ModelPage({
  params,
}: {
  params: Promise<{ brand: string; model: string }>;
}) {
  const { brand: brandSlug, model: modelSlug } = await params;
  const brand = brands.find((b) => b.slug === brandSlug);
  const model = brand?.models.find((m) => m.slug === modelSlug);

  if (!brand || !model) notFound();

  const relatedModels = brand.models.filter((m) => m.slug !== model.slug).slice(0, 3);
  const similarFromOthers = brands
    .filter((b) => b.slug !== brand.slug)
    .flatMap((b) => b.models.filter((m) => m.type === model.type).map((m) => ({ model: m, brandSlug: b.slug })))
    .slice(0, 3);

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${brand.name} ${model.name}`,
    description: model.description,
    brand: { "@type": "Brand", name: brand.name },
    category: `${typeLabels[model.type] || model.type} Tires`,
    offers: {
      "@type": "AggregateOffer",
      lowPrice: model.priceRange[0],
      highPrice: model.priceRange[1],
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      offerCount: model.sizes.length,
      seller: {
        "@type": "Organization",
        name: "Ship.Tires",
      },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />

      <div className="bg-gray-50">
        {/* Breadcrumb & Header */}
        <div className="bg-navy py-10 text-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Link href="/tires" className="hover:text-white">All Brands</Link>
              <span>/</span>
              <Link href={`/tires/${brand.slug}`} className="hover:text-white">{brand.name}</Link>
              <span>/</span>
              <span className="text-gray-300">{model.name}</span>
            </div>
            <h1 className="mt-4 text-3xl font-bold sm:text-4xl">
              {brand.name} {model.name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center rounded-full bg-blue/20 px-3 py-1 text-sm font-medium text-blue-light">
                {typeLabels[model.type] || model.type}
              </span>
              <span className="text-gray-400">
                From <span className="text-xl font-bold text-white">${model.priceRange[0]}</span> — <span className="text-white">${model.priceRange[1]}</span> /tire
              </span>
              <span className="text-gray-400">|</span>
              <span className="text-gray-400">{model.sizes.length} sizes available</span>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-10">
              {/* Description */}
              <div>
                <h2 className="text-xl font-bold text-gray-900">About This Tire</h2>
                <p className="mt-3 text-gray-600 leading-relaxed">{model.description}</p>
              </div>

              {/* Features */}
              <div>
                <h2 className="text-xl font-bold text-gray-900">Key Features</h2>
                <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {model.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Specs */}
              <div>
                <h2 className="text-xl font-bold text-gray-900">Specifications</h2>
                <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
                  <div className="rounded-lg bg-white border border-gray-200 p-4">
                    <dt className="text-xs font-medium text-gray-500 uppercase">Type</dt>
                    <dd className="mt-1 text-sm font-bold text-gray-900">{typeLabels[model.type]}</dd>
                  </div>
                  <div className="rounded-lg bg-white border border-gray-200 p-4">
                    <dt className="text-xs font-medium text-gray-500 uppercase">Warranty</dt>
                    <dd className="mt-1 text-sm font-bold text-gray-900">{model.warranty}</dd>
                  </div>
                  <div className="rounded-lg bg-white border border-gray-200 p-4">
                    <dt className="text-xs font-medium text-gray-500 uppercase">Speed Ratings</dt>
                    <dd className="mt-1 text-sm font-bold text-gray-900">{model.speedRatings.join(", ")}</dd>
                  </div>
                  <div className="rounded-lg bg-white border border-gray-200 p-4">
                    <dt className="text-xs font-medium text-gray-500 uppercase">Available Sizes</dt>
                    <dd className="mt-1 text-sm font-bold text-gray-900">{model.sizes.length}</dd>
                  </div>
                  <div className="rounded-lg bg-white border border-gray-200 p-4">
                    <dt className="text-xs font-medium text-gray-500 uppercase">Price Range</dt>
                    <dd className="mt-1 text-sm font-bold text-gray-900">${model.priceRange[0]} – ${model.priceRange[1]}</dd>
                  </div>
                  <div className="rounded-lg bg-white border border-gray-200 p-4">
                    <dt className="text-xs font-medium text-gray-500 uppercase">Brand</dt>
                    <dd className="mt-1 text-sm font-bold text-gray-900">{brand.name}</dd>
                  </div>
                </dl>
              </div>

              {/* Available Sizes */}
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Available Sizes ({model.sizes.length})
                </h2>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase text-gray-500">
                        <th className="py-3 pr-4">Size</th>
                        <th className="py-3 pr-4">Load Index</th>
                        <th className="py-3 pr-4">Speed Rating</th>
                        <th className="py-3 pr-4">Est. Price</th>
                        <th className="py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {model.sizes.map((size) => (
                        <tr key={size.size} className="hover:bg-gray-50">
                          <td className="py-3 pr-4 font-medium text-gray-900">{size.size}</td>
                          <td className="py-3 pr-4 text-gray-600">{size.loadIndex}</td>
                          <td className="py-3 pr-4 text-gray-600">{size.speedRating}</td>
                          <td className="py-3 pr-4 font-bold text-gray-900">${size.price}</td>
                          <td className="py-3 flex items-center gap-2">
                            <AddToCartButton
                              brand={brand.name}
                              brandSlug={brand.slug}
                              model={model.name}
                              modelSlug={model.slug}
                              size={size.size}
                              price={size.price}
                              loadIndex={size.loadIndex}
                              speedRating={size.speedRating}
                            />
                            <Link
                              href={`/contact?tire=${encodeURIComponent(`${brand.name} ${model.name}`)}&size=${encodeURIComponent(size.size)}`}
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

              {/* Related from same brand */}
              {relatedModels.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    More from {brand.name}
                  </h2>
                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {relatedModels.map((rm) => (
                      <TireCard key={rm.slug} model={rm} brandSlug={brand.slug} />
                    ))}
                  </div>
                </div>
              )}

              {/* Similar from other brands */}
              {similarFromOthers.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Similar {typeLabels[model.type]} Tires
                  </h2>
                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {similarFromOthers.map(({ model: sm, brandSlug: bs }) => (
                      <TireCard key={sm.slug} model={sm} brandSlug={bs} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar — Quote Form */}
            <div className="lg:col-span-1">
              <div className="sticky top-32 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900">Request a Quote</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get pricing for the {brand.name} {model.name}. Free shipping included.
                </p>
                <div className="mt-4">
                  <QuoteRequestForm
                    defaultBrand={brand.name}
                    defaultModel={model.name}
                  />
                </div>
                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
                  <span>or call</span>
                  <a href="tel:+19164767689" className="font-bold text-orange hover:underline">
                    (916) 476-7689
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
