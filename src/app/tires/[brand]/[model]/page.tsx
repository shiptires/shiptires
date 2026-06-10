import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  getModelBySlug,
  getModelsByBrand,
  getBrandBySlug,
  tiresToModel,
  brandSummaryToBrand,
  modelSummaryToModel,
  toSlug,
} from "@/lib/db";
import { getLogoUrl } from "@/lib/api-helpers";
import CartSidebar from "@/components/CartSidebar";
import TireCard from "@/components/TireCard";
import AddToCartButton from "@/components/AddToCartButton";
import SizeTable from "@/components/SizeTable";
import TireImageLightbox from "@/components/TireImageLightbox";
import type { Metadata } from "next";

export const revalidate = 300;

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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ brand: string; model: string }>;
}): Promise<Metadata> {
  const { brand: brandSlug, model: modelSlug } = await params;
  const data = await getModelBySlug(brandSlug, modelSlug);
  if (!data) return {};

  const model = tiresToModel(data.model, data.tires);
  const hasPrice = model.priceRange[0] > 0;

  return {
    title: `Shop ${data.brand} ${model.name} Tires — Prices, Sizes & Ship Free`,
    description: hasPrice
      ? `Shop ${data.brand} ${model.name} tires from $${model.priceRange[0]}. ${model.sizes.length} sizes available. Ship free to your door or installer.${model.warranty ? ` ${model.warranty} warranty.` : ""} Fits Honda, Toyota, Ford, BMW & more.`
      : `Shop ${data.brand} ${model.name} tires — ${model.sizes.length} sizes available. Ship free. Request a quote for pricing. Fits Honda, Toyota, Ford, BMW & more.`,
    alternates: { canonical: `https://ship.tires/tires/${brandSlug}/${modelSlug}` },
  };
}

export default async function ModelPage({
  params,
}: {
  params: Promise<{ brand: string; model: string }>;
}) {
  const { brand: brandSlug, model: modelSlug } = await params;
  const data = await getModelBySlug(brandSlug, modelSlug);

  if (!data) notFound();

  const model = tiresToModel(data.model, data.tires);
  const brandRow = await getBrandBySlug(brandSlug);
  const brand = brandRow ? brandSummaryToBrand(brandRow) : null;
  const logoUrl = brand?.logoUrl || getLogoUrl(brand?.domain || "");

  // Related models from same brand
  const allModels = await getModelsByBrand(brandSlug);
  const relatedModels = allModels
    .filter((m) => toSlug(m.model_name) !== modelSlug)
    .slice(0, 3)
    .map(modelSummaryToModel);

  const hasPrice = model.priceRange[0] > 0;

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${data.brand} ${model.name}`,
    description: model.description,
    image: model.image || logoUrl,
    brand: { "@type": "Brand", name: data.brand },
    category: `${typeLabels[model.type] || model.type} Tires`,
    ...(hasPrice && {
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
    }),
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
              <Link href={`/tires/${brandSlug}`} className="hover:text-white">{data.brand}</Link>
              <span>/</span>
              <span className="text-gray-300">{model.name}</span>
            </div>
            <div className="mt-4 flex items-start gap-6">
              {model.image && (
                <div className="hidden sm:block flex-shrink-0 rounded-xl bg-white p-2">
                  <TireImageLightbox src={model.image} alt={`${data.brand} ${model.name}`}>
                    <Image
                      src={model.image}
                      alt={`${data.brand} ${model.name}`}
                      width={120}
                      height={120}
                      className="h-24 w-24 object-contain"
                      unoptimized
                    />
                  </TireImageLightbox>
                </div>
              )}
              <div>
                <h1 className="text-3xl font-bold sm:text-4xl">
                  Shop & Ship {data.brand} {model.name} — Free Delivery
                </h1>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center rounded-full bg-blue/20 px-3 py-1 text-sm font-medium text-blue-light">
                    {typeLabels[model.type] || model.type}
                  </span>
                  {hasPrice ? (
                    <span className="text-gray-400">
                      From <span className="text-xl font-bold text-white">${model.priceRange[0]}</span> — <span className="text-white">${model.priceRange[1]}</span> /tire
                    </span>
                  ) : (
                    <span className="text-safety-orange font-bold">Call for Pricing</span>
                  )}
                  <span className="text-gray-400">|</span>
                  <span className="text-gray-400">{model.sizes.length} sizes available</span>
                </div>
              </div>
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
              {model.features.length > 0 && (
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
              )}

              {/* Specs */}
              <div>
                <h2 className="text-xl font-bold text-gray-900">Specifications</h2>
                <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
                  <div className="rounded-lg bg-white border border-gray-200 p-4">
                    <dt className="text-xs font-medium text-gray-500 uppercase">Type</dt>
                    <dd className="mt-1 text-sm font-bold text-gray-900">{typeLabels[model.type]}</dd>
                  </div>
                  {model.warranty && (
                    <div className="rounded-lg bg-white border border-gray-200 p-4">
                      <dt className="text-xs font-medium text-gray-500 uppercase">Warranty</dt>
                      <dd className="mt-1 text-sm font-bold text-gray-900">{model.warranty}</dd>
                    </div>
                  )}
                  {model.speedRatings.length > 0 && (
                    <div className="rounded-lg bg-white border border-gray-200 p-4">
                      <dt className="text-xs font-medium text-gray-500 uppercase">Speed Ratings</dt>
                      <dd className="mt-1 text-sm font-bold text-gray-900">{model.speedRatings.join(", ")}</dd>
                    </div>
                  )}
                  <div className="rounded-lg bg-white border border-gray-200 p-4">
                    <dt className="text-xs font-medium text-gray-500 uppercase">Available Sizes</dt>
                    <dd className="mt-1 text-sm font-bold text-gray-900">{model.sizes.length}</dd>
                  </div>
                  {hasPrice && (
                    <div className="rounded-lg bg-white border border-gray-200 p-4">
                      <dt className="text-xs font-medium text-gray-500 uppercase">Price Range</dt>
                      <dd className="mt-1 text-sm font-bold text-gray-900">${model.priceRange[0]} – ${model.priceRange[1]}</dd>
                    </div>
                  )}
                  <div className="rounded-lg bg-white border border-gray-200 p-4">
                    <dt className="text-xs font-medium text-gray-500 uppercase">Brand</dt>
                    <dd className="mt-1 text-sm font-bold text-gray-900">{data.brand}</dd>
                  </div>
                </dl>
              </div>

              {/* Available Sizes — Grouped by Wheel Size */}
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Available Sizes ({model.sizes.length})
                </h2>
                <div className="mt-4">
                  <SizeTable
                    sizes={model.sizes}
                    brand={data.brand}
                    brandSlug={brandSlug}
                    modelName={model.name}
                    modelSlug={model.slug}
                    tireImage={model.image}
                  />
                </div>
              </div>

              {/* Related from same brand */}
              {relatedModels.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    More from {data.brand}
                  </h2>
                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {relatedModels.map((rm) => (
                      <TireCard
                        key={rm.slug}
                        model={rm}
                        brandSlug={brandSlug}
                        brandName={data.brand}
                        brandLogo={logoUrl}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar — Live Cart */}
            <div className="lg:col-span-1">
              <CartSidebar brand={data.brand} model={model.name} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
