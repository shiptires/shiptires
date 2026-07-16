import { cache } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  getAllBrands,
  getModelBySlug,
  getModelsByBrand,
  getBrandBySlug,
  tiresToModel,
  brandSummaryToBrand,
  modelSummaryToModel,
  toSlug,
} from "@/lib/db";
import { getLogoUrl } from "@/lib/api-helpers";
import { buildBreadcrumbSchema } from "@/lib/breadcrumb-schema";
import { parseUTQG, treadwearLabel } from "@/lib/utqg";
import { applyDistributorPricing } from "@/lib/pricing";
import { getRankingsForModel } from "@/lib/ranking-helpers";
import { getVehiclesForSize } from "@/data/tire-sizes";
import CartSidebar from "@/components/CartSidebar";
import TireCard from "@/components/TireCard";
import AddToCartButton from "@/components/AddToCartButton";
import SizeTable from "@/components/SizeTable";
import TireGallery from "@/components/TireGallery";
import PaymentIcons from "@/components/PaymentIcons";
import type { Metadata } from "next";

// Deduplicate getModelBySlug between generateMetadata and component
const cachedGetModelBySlug = cache(getModelBySlug);

export const revalidate = 3600;

export const dynamicParams = true;

export async function generateStaticParams() {
  // 16K+ model pages — pre-render none, render on-demand with ISR (revalidate = 300)
  return [];
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ brand: string; model: string }>;
}): Promise<Metadata> {
  const { brand: brandSlug, model: modelSlug } = await params;
  const data = await cachedGetModelBySlug(brandSlug, modelSlug);
  if (!data) return {};

  const baseModel = tiresToModel(data.model, data.tires, data.brand, data.modelDetails);
  const distPricing = await applyDistributorPricing(baseModel.sizes, data.brand, data.model);
  const pricedSizes = distPricing.sizes.filter((s) => s.price > 0);
  const model = { ...baseModel, sizes: pricedSizes, priceRange: distPricing.priceRange };
  const hasPrice = model.priceRange[0] > 0;

  const fullName = `${data.brand} ${model.name}`;
  const titleBase = hasPrice
    ? `${fullName} Tires | From $${model.priceRange[0]} | Free Shipping`
    : `${fullName} Tires | ${model.sizes.length} Sizes | Free Shipping`;
  // Truncate to 60 chars for SERP display
  const title = titleBase.length > 60 ? titleBase.slice(0, 57) + "..." : titleBase;

  return {
    title,
    description: hasPrice
      ? `Buy ${fullName} tires from $${model.priceRange[0]}/tire. ${model.sizes.length} sizes available. Free shipping to your door or installer.${model.warranty ? ` ${model.warranty} warranty.` : ""} Fits Honda, Toyota, Ford, BMW & more.`
      : `Buy ${fullName} tires — ${model.sizes.length} sizes available. Free shipping. Request a quote for pricing. Fits Honda, Toyota, Ford, BMW & more.`,
    alternates: {
      canonical: `https://ship.tires/tires/${brandSlug}/${modelSlug}`,
      types: { "text/plain": `https://ship.tires/tires/${brandSlug}/${modelSlug}/llm.txt` },
    },
  };
}

export default async function ModelPage({
  params,
}: {
  params: Promise<{ brand: string; model: string }>;
}) {
  const { brand: brandSlug, model: modelSlug } = await params;
  const data = await cachedGetModelBySlug(brandSlug, modelSlug);

  if (!data) notFound();

  const baseModel = tiresToModel(data.model, data.tires, data.brand, data.modelDetails);

  // Apply distributor pricing — all prices from Express Tire, never TireWeb MAP
  const distPricing = await applyDistributorPricing(baseModel.sizes, data.brand, data.model);
  // Filter to only sizes with real pricing for public display (page stays alive for SEO)
  const pricedSizes = distPricing.sizes.filter((s) => s.price > 0);
  const model = { ...baseModel, sizes: pricedSizes, priceRange: distPricing.priceRange };

  const [brandRow, allModels] = await Promise.all([
    getBrandBySlug(brandSlug),
    getModelsByBrand(brandSlug),
  ]);
  const brand = brandRow ? brandSummaryToBrand(brandRow) : null;
  const logoUrl = brand?.logoUrl || getLogoUrl(brand?.domain || "");
  const relatedModels = allModels
    .filter((m) => toSlug(m.model_name) !== modelSlug)
    .map(modelSummaryToModel)
    .filter((m) => m.image)
    .slice(0, 3);

  const hasPrice = model.priceRange[0] > 0;

  const breadcrumb = buildBreadcrumbSchema([
    { name: "Home", url: "https://ship.tires" },
    { name: "All Brands", url: "https://ship.tires/tires" },
    { name: data.brand, url: `https://ship.tires/tires/${brandSlug}` },
    { name: model.name, url: `https://ship.tires/tires/${brandSlug}/${modelSlug}` },
  ]);

  const canonicalUrl = `https://ship.tires/tires/${brandSlug}/${modelSlug}`;

  // UTQG: find representative data from first size that has it
  const representativeUtqg = (() => {
    for (const s of model.sizes) {
      const parsed = parseUTQG(s.utqg);
      if (parsed) return parsed;
    }
    return null;
  })();

  // Ranking appearances
  const rankings = getRankingsForModel(brandSlug, modelSlug);

  const utqgSchemaProps = representativeUtqg
    ? [
        { "@type": "PropertyValue", name: "UTQG Treadwear", value: String(representativeUtqg.treadwear) },
        { "@type": "PropertyValue", name: "UTQG Traction", value: representativeUtqg.traction },
        { "@type": "PropertyValue", name: "UTQG Temperature", value: representativeUtqg.temperature },
      ]
    : [];

  // Auto-generated FAQ items
  const faqItems: { q: string; a: string }[] = [];
  if (hasPrice) {
    faqItems.push({
      q: `How much do ${data.brand} ${model.name} tires cost?`,
      a: `${data.brand} ${model.name} tires start at $${model.priceRange[0].toFixed(2)} per tire${model.priceRange[1] > model.priceRange[0] ? ` (up to $${model.priceRange[1].toFixed(2)} depending on size)` : ""}. A set of 4 starts at $${(model.priceRange[0] * 4).toFixed(2)} with free shipping included on every order at Ship.Tires.`,
    });
  }
  if (model.sizes.length > 0) {
    const sizeList = model.sizes.slice(0, 6).map((s) => s.size).join(", ");
    faqItems.push({
      q: `What sizes does the ${data.brand} ${model.name} come in?`,
      a: `The ${data.brand} ${model.name} is available in ${model.sizes.length} sizes including ${sizeList}${model.sizes.length > 6 ? " and more" : ""}. All sizes ship free at Ship.Tires.`,
    });
  }
  faqItems.push({
    q: `Does Ship.Tires offer free shipping on ${data.brand} ${model.name} tires?`,
    a: `Yes. Every ${data.brand} ${model.name} tire ships free to anywhere in the continental US — to your door or directly to your installer. No minimum order required.`,
  });
  if (model.warranty) {
    faqItems.push({
      q: `What warranty do ${data.brand} ${model.name} tires have?`,
      a: `The ${data.brand} ${model.name} comes with a ${model.warranty} manufacturer warranty. Check individual size listings for specific warranty details.`,
    });
  }

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${data.brand} ${model.name}`,
    description: model.description,
    image: model.image || logoUrl,
    brand: { "@type": "Brand", name: data.brand },
    category: "Tires",
    url: canonicalUrl,
    ...(utqgSchemaProps.length > 0 && { additionalProperty: utqgSchemaProps }),
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

  // Gallery images
  const gallery = model.images && model.images.length > 0 ? model.images : model.image ? [model.image] : [];

  // Popular sizes: first 6 sorted by load index, deduplicated by size string
  const popularSizes = (() => {
    const seen = new Set<string>();
    return [...model.sizes]
      .filter((s) => s.price > 0)
      .sort((a, b) => (b.loadIndex || 0) - (a.loadIndex || 0))
      .filter((s) => {
        if (seen.has(s.size)) return false;
        seen.add(s.size);
        return true;
      })
      .slice(0, 6);
  })();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      {faqItems.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}

      <div className="bg-gray-50 min-h-screen">
        {/* Breadcrumb */}
        <div className="bg-white border-b border-gray-200">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Link href="/tires" className="hover:text-gray-900">All Brands</Link>
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
              <Link href={`/tires/${brandSlug}`} className="hover:text-gray-900">{data.brand}</Link>
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
              <span className="text-gray-900 font-medium">{model.name}</span>
            </div>
          </div>
        </div>

        {/* Hero Section — Large Image + Key Info */}
        <div className="bg-white border-b border-gray-200">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">

              {/* Left: Large Image Gallery */}
              <div>
                <TireGallery images={gallery} alt={`${data.brand} ${model.name}`} />
              </div>

              {/* Right: Product Info */}
              <div className="flex flex-col">
                {/* Brand logo + name */}
                <div className="flex items-center gap-3 mb-3">
                  <Image
                    src={logoUrl}
                    alt={data.brand}
                    width={40}
                    height={40}
                    className="h-9 w-9 object-contain"
                  />
                  <Link href={`/tires/${brandSlug}`} className="text-sm font-semibold text-gray-500 hover:text-safety-orange uppercase tracking-wider">
                    {data.brand}
                  </Link>
                </div>

                {/* Model name */}
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
                  {model.name}
                </h1>

                {/* Description excerpt */}
                {model.description && (
                  <p className="mt-2 text-sm text-gray-600 leading-relaxed line-clamp-2">
                    {model.description}
                  </p>
                )}

                {/* Ranking badges */}
                {rankings.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {rankings.map((r) => (
                      <Link
                        key={r.categorySlug}
                        href={`/rankings#${r.categorySlug}`}
                        className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-sm font-bold text-amber-700 hover:bg-amber-100 transition-colors"
                      >
                        <svg className="h-4 w-4 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0016.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.003 6.003 0 01-4.52 0" />
                        </svg>
                        #{r.rank} {r.category} — {r.score}/10
                      </Link>
                    ))}
                  </div>
                )}

                {/* Type + Stock */}
                <div className="mt-4 flex items-center gap-3">
                  <span className="inline-flex items-center rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-sm font-medium text-blue-700">
                    {typeLabels[model.type] || model.type}
                  </span>
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-green-600">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
                    </svg>
                    In Stock
                  </span>
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-green-600">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                    </svg>
                    Free Shipping
                  </span>
                </div>

                {/* Price */}
                <div className="mt-5 rounded-xl bg-gray-50 border border-gray-200 p-5">
                  {hasPrice ? (
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm text-gray-500">Starting at</span>
                        <span className="text-4xl font-bold text-gray-900">${model.priceRange[0].toFixed(2)}</span>
                        <span className="text-lg text-gray-500">/tire</span>
                      </div>
                      {model.priceRange[1] > model.priceRange[0] && (
                        <p className="mt-1 text-sm text-gray-500">Up to ${model.priceRange[1].toFixed(2)} depending on size</p>
                      )}
                      <p className="mt-1 text-sm font-medium text-green-600">
                        Set of 4 from ${(model.priceRange[0] * 4).toFixed(2)} — Free shipping included
                      </p>
                    </div>
                  ) : (
                    <div>
                      <span className="text-2xl font-bold text-safety-orange">Call for Pricing</span>
                      <p className="mt-1 text-sm text-gray-500">Contact us for the best price on this tire</p>
                    </div>
                  )}
                </div>

                {/* Quick specs */}
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-white border border-gray-200 p-3.5">
                    <div className="text-xs text-gray-500 uppercase font-medium">Sizes</div>
                    <div className="mt-0.5 text-lg font-bold text-gray-900">{model.sizes.length} available</div>
                  </div>
                  {model.warranty && (
                    <div className="rounded-lg bg-white border border-gray-200 p-3.5">
                      <div className="text-xs text-gray-500 uppercase font-medium">Warranty</div>
                      <div className="mt-0.5 text-lg font-bold text-gray-900">{model.warranty}</div>
                    </div>
                  )}
                  {representativeUtqg && representativeUtqg.treadwear && (
                    <div className="rounded-lg bg-white border border-gray-200 p-3.5">
                      <div className="text-xs text-gray-500 uppercase font-medium">Treadwear</div>
                      <div className="mt-0.5 text-lg font-bold text-gray-900">
                        {representativeUtqg.treadwear}
                        <span className="text-sm font-normal text-gray-500 ml-1">({treadwearLabel(representativeUtqg.treadwear)})</span>
                      </div>
                    </div>
                  )}
                  {model.speedRatings.length > 0 && (
                    <div className="rounded-lg bg-white border border-gray-200 p-3.5">
                      <div className="text-xs text-gray-500 uppercase font-medium">Speed Rating</div>
                      <div className="mt-0.5 text-lg font-bold text-gray-900">{model.speedRatings.join(", ")}</div>
                    </div>
                  )}
                  {representativeUtqg && representativeUtqg.traction && (
                    <div className="rounded-lg bg-white border border-gray-200 p-3.5">
                      <div className="text-xs text-gray-500 uppercase font-medium">Traction</div>
                      <div className="mt-0.5 text-lg font-bold text-gray-900">Grade {representativeUtqg.traction}</div>
                    </div>
                  )}
                  {representativeUtqg && representativeUtqg.temperature && (
                    <div className="rounded-lg bg-white border border-gray-200 p-3.5">
                      <div className="text-xs text-gray-500 uppercase font-medium">Temperature</div>
                      <div className="mt-0.5 text-lg font-bold text-gray-900">Grade {representativeUtqg.temperature}</div>
                    </div>
                  )}
                </div>

                {/* Features */}
                {model.features.length > 0 && (
                  <div className="mt-5 flex flex-wrap gap-2">
                    {model.features.map((feature) => (
                      <span key={feature} className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700">
                        <svg className="h-3.5 w-3.5 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                          <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
                        </svg>
                        {feature}
                      </span>
                    ))}
                  </div>
                )}

                {/* CTA buttons */}
                <div className="mt-6 flex flex-col gap-4">
                  <a
                    href="#sizes"
                    className="flex items-center justify-center gap-2 rounded-xl bg-safety-orange px-6 py-3.5 text-base font-bold text-white hover:bg-safety-orange/90 transition-colors"
                  >
                    Select Your Size
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                    </svg>
                  </a>
                  <PaymentIcons compact />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Popular Sizes Quick-Pick */}
        {popularSizes.length > 0 && (
          <div className="bg-white border-b border-gray-200">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Popular Sizes</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {popularSizes.map((size) => (
                  <Link
                    key={`${size.size}-${size.tireId}`}
                    href={`/tires/${brandSlug}/${modelSlug}/${size.size.toLowerCase().replace(/\//g, "-").replace(/\./g, "-")}`}
                    className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-center hover:border-safety-orange/40 hover:shadow-md transition-all block"
                  >
                    <div className="font-mono text-sm font-bold text-gray-900">{size.size}</div>
                    <div className="mt-1 text-lg font-bold text-gray-900">${size.price.toFixed(2)}</div>
                    <div className="text-xs text-gray-500">/tire</div>
                    <div className="mt-2 text-xs font-bold text-safety-orange">
                      Shop Size &rarr;
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* About — Features & Benefits (above sizes for visibility) */}
        {(model.detailedFeatures?.length || model.benefits?.length) ? (
          <div className="bg-white border-b border-gray-200">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Key Features */}
                {model.detailedFeatures && model.detailedFeatures.length > 0 && (
                  <div>
                    <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3">Key Features</h2>
                    <ul className="space-y-2">
                      {model.detailedFeatures.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <svg className="h-4 w-4 mt-0.5 flex-shrink-0 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                            <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
                          </svg>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Benefits */}
                {model.benefits && model.benefits.length > 0 && (
                  <div>
                    <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3">Benefits</h2>
                    <ul className="space-y-2">
                      {model.benefits.map((benefit, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <svg className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z" />
                          </svg>
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Manufacturer link */}
              {model.manufacturerUrl && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <a
                    href={model.manufacturerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-navy hover:text-safety-orange transition-colors"
                  >
                    View on {data.brand}&apos;s website
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                    </svg>
                  </a>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {/* Main Content */}
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
            {/* Left: Sizes + About + Related */}
            <div className="lg:col-span-2 space-y-10">
              {/* All Sizes */}
              <div id="sizes">
                <h2 className="text-2xl font-bold text-gray-900">
                  All Sizes ({model.sizes.length})
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Select your size below. Every tire ships free.
                </p>
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

              {/* About — full description + vehicle fitment */}
              {model.description && (
                <div className="rounded-xl bg-white border border-gray-200 p-6">
                  <h2 className="text-lg font-bold text-gray-900">About the {data.brand} {model.name}</h2>
                  <p className="mt-2 text-gray-600 leading-relaxed">{model.description}</p>

                  {/* Vehicle fitment — show which cars/trucks use these sizes */}
                  {(() => {
                    const seen = new Set<string>();
                    const vehicles: { make: string; model: string; makeSlug: string; modelSlug: string }[] = [];
                    for (const s of model.sizes) {
                      for (const v of getVehiclesForSize(s.size, 20)) {
                        const key = `${v.make}|${v.model}`;
                        if (!seen.has(key)) {
                          seen.add(key);
                          vehicles.push({
                            ...v,
                            makeSlug: v.make.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
                            modelSlug: v.model.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
                          });
                        }
                      }
                    }
                    if (vehicles.length === 0) return null;
                    const display = vehicles.slice(0, 12);
                    return (
                      <div className="mt-4">
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-2">
                          Fits These Vehicles
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {display.map((v) => (
                            <Link
                              key={`${v.make}-${v.model}`}
                              href={`/tires/vehicle/${v.makeSlug}/${v.modelSlug}`}
                              className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700 hover:bg-gray-200 transition-colors"
                            >
                              {v.make} {v.model}
                            </Link>
                          ))}
                          {vehicles.length > 12 && (
                            <span className="inline-flex items-center rounded-full bg-gray-50 px-3 py-1 text-sm text-gray-500">
                              +{vehicles.length - 12} more
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* FAQ */}
              {faqItems.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">
                    Frequently Asked Questions
                  </h2>
                  <div className="space-y-3">
                    {faqItems.map((item) => (
                      <details key={item.q} className="group rounded-lg border border-gray-200 bg-white">
                        <summary className="flex cursor-pointer items-center justify-between px-5 py-4 text-sm font-bold text-gray-900">
                          {item.q}
                          <svg className="h-4 w-4 flex-shrink-0 text-gray-400 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                          </svg>
                        </summary>
                        <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed">{item.a}</div>
                      </details>
                    ))}
                  </div>
                </div>
              )}

              {/* Related from same brand */}
              {relatedModels.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    More {data.brand} Tires
                  </h2>
                  <div className="mt-4 space-y-3">
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

            {/* Sidebar — Cart */}
            <div className="lg:col-span-1">
              <CartSidebar brand={data.brand} model={model.name} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
