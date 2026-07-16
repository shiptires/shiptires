import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  getTireById,
  getTireBySize,
  getTiresBySize,
  getModelBySlug,
  getBrandBySlug,
  tiresToModel,
  brandSummaryToBrand,
  toSlug,
} from "@/lib/db";
import type { TireRow } from "@/lib/db";
import { getVehiclesForSize } from "@/data/tire-sizes";
import { getLogoUrl } from "@/lib/api-helpers";
import { buildBreadcrumbSchema } from "@/lib/breadcrumb-schema";
import { parseUTQG, treadwearLabel } from "@/lib/utqg";
import { getSitePrice } from "@/lib/pricing";
import { resolveImage } from "@/lib/db/mappers";
import CartSidebar from "@/components/CartSidebar";
import AddToCartButton from "@/components/AddToCartButton";
import QuantityPicker from "@/components/QuantityPicker";
import TireGallery from "@/components/TireGallery";
import StickyBuyBar from "@/components/StickyBuyBar";
import RecentlyViewed from "@/components/RecentlyViewed";
import TrackView from "@/components/TrackView";
import MetaPixelViewContent from "@/components/MetaPixelViewContent";
import type { Metadata } from "next";

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  // Too many brand/model/size combos — render on-demand with ISR (revalidate = 300)
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

// ---------------------------------------------------------------------------
// Size slug helpers: "255-75r17" ↔ { width: "255", aspect: "75", rim: "17" }
// ---------------------------------------------------------------------------

function parseSizeSlug(
  slug: string
): { width: string; aspect: string; rim: string } | null {
  // Match patterns like: 255-75r17, lt255-75r17, 31-1050r15, 280-85r20
  const m = slug.match(
    /^(?:lt|p)?(\d{2,4})-(\d{2,4})r(\d{2}(?:\.\d)?)(?:lt)?$/i
  );
  if (m) return { width: m[1], aspect: m[2], rim: m[3] };

  // Match flotation sizes like: 30x9-50r15, 31x10-50r15lt, 33x12-50r15
  const fl = slug.match(
    /^(\d{2,3})x(\d{1,2})-(\d{2})r(\d{2}(?:\.\d)?)(?:lt)?$/i
  );
  if (fl) return { width: fl[1], aspect: `${fl[2]}.${fl[3]}`, rim: fl[4] };

  // Match flotation without decimal: 30x950r15
  const fl2 = slug.match(
    /^(\d{2,3})x(\d{3,4})r(\d{2}(?:\.\d)?)(?:lt)?$/i
  );
  if (fl2) return { width: fl2[1], aspect: fl2[2], rim: fl2[3] };

  // Match full-profile patterns like: 155r15, 125r12 (no aspect ratio)
  const fp = slug.match(
    /^(?:lt|p)?(\d{2,4})r(\d{2}(?:\.\d)?)(?:lt)?$/i
  );
  if (fp) return { width: fp[1], aspect: "", rim: fp[2] };

  return null;
}

function toSizeSlug(tire: TireRow): string | null {
  if (!tire.width || !tire.rim_size) return null;
  if (tire.aspect_ratio) {
    return `${tire.width}-${tire.aspect_ratio}r${tire.rim_size}`.toLowerCase();
  }
  return `${tire.width}r${tire.rim_size}`.toLowerCase();
}

function buildSize(tire: {
  width: string | null;
  aspect_ratio: string | null;
  rim_size: string | null;
  name: string;
}): string {
  if (tire.width && tire.aspect_ratio && tire.rim_size) {
    return `${tire.width}/${tire.aspect_ratio}R${tire.rim_size}`;
  }
  if (tire.width && tire.rim_size && !tire.aspect_ratio) {
    // Flotation/LT sizes — extract full size from tire name (e.g. "35X12.50R20LT")
    const flotMatch = tire.name.match(/(\d{2,3}[Xx]\d{1,2}(?:\.\d{1,2})?R\d{2}(?:LT)?)/i);
    if (flotMatch) return flotMatch[1].toUpperCase();
    return `${tire.width}R${tire.rim_size}`;
  }
  return tire.name;
}

/** Resolve a tire from either a size slug ("255-75r17") or numeric ID ("99997"). */
async function _resolveTire(
  brandSlug: string,
  modelSlug: string,
  param: string
): Promise<{ tire: TireRow; needsRedirect: boolean } | null> {
  // Try size slug first
  const parsed = parseSizeSlug(param);
  if (parsed) {
    const tire = await getTireBySize(
      brandSlug,
      modelSlug,
      parsed.width,
      parsed.aspect,
      parsed.rim
    );
    if (tire) return { tire, needsRedirect: false };
  }

  // Try numeric ID
  const id = parseInt(param);
  if (!isNaN(id)) {
    const tire = await getTireById(id);
    if (
      tire &&
      toSlug(tire.make_name) === brandSlug &&
      toSlug(tire.model_name) === modelSlug
    ) {
      return { tire, needsRedirect: true };
    }
  }

  return null;
}

// Deduplicate across generateMetadata and component within same request
const resolveTire = cache(_resolveTire);
const cachedGetModelBySlug = cache(getModelBySlug);
const cachedGetSitePrice = cache(getSitePrice);


export async function generateMetadata({
  params,
}: {
  params: Promise<{ brand: string; model: string; id: string }>;
}): Promise<Metadata> {
  const { brand: brandSlug, model: modelSlug, id: param } = await params;

  const result = await resolveTire(brandSlug, modelSlug, param);
  if (!result) return {};

  const { tire } = result;
  const size = buildSize(tire);
  const sizeSlug = toSizeSlug(tire) || param;
  const price = await cachedGetSitePrice(tire.id, tire.make_name, tire.model_name);

  return {
    title: `${tire.make_name} ${tire.model_name} ${size} Tire — $${price > 0 ? price.toFixed(2) : "Call"} | Free Shipping`,
    description: `Buy the ${tire.make_name} ${tire.model_name} in size ${size}${price > 0 ? ` for $${price.toFixed(2)}/tire` : ""}. Free shipping to your door or installer.${tire.warranty ? ` ${tire.warranty} warranty.` : ""}${tire.load_rating ? ` Load index ${tire.load_rating}.` : ""}`,
    alternates: {
      canonical: `https://ship.tires/tires/${brandSlug}/${modelSlug}/${sizeSlug}`,
    },
  };
}

export default async function TireSizePage({
  params,
}: {
  params: Promise<{ brand: string; model: string; id: string }>;
}) {
  const { brand: brandSlug, model: modelSlug, id: param } = await params;

  const result = await resolveTire(brandSlug, modelSlug, param);
  if (!result) notFound();

  let { tire, needsRedirect } = result;

  // Redirect numeric IDs to canonical size slug URL
  if (needsRedirect) {
    const sizeSlug = toSizeSlug(tire);
    if (sizeSlug) {
      redirect(`/tires/${brandSlug}/${modelSlug}/${sizeSlug}`);
    }
  }

  // Parallel fetch: model data + brand (independent of each other)
  const [modelData, brandRow] = await Promise.all([
    cachedGetModelBySlug(brandSlug, modelSlug),
    getBrandBySlug(brandSlug),
  ]);

  // If resolved tire has no price but model has one for this size, use the priced tire
  if ((tire.price_map ?? 0) <= 0 && modelData) {
    const betterTire = modelData.tires.find(
      (t) =>
        t.width === tire.width &&
        t.aspect_ratio === tire.aspect_ratio &&
        t.rim_size === tire.rim_size &&
        (t.price_map ?? 0) > 0
    );
    if (betterTire) tire = betterTire;
  }

  const size = buildSize(tire);
  const sizeSlug = toSizeSlug(tire) || param;

  // Parallel fetch: price + alternatives (both depend on final tire selection)
  const altPromise = tire.width && tire.aspect_ratio && tire.rim_size
    ? getTiresBySize(tire.width, tire.aspect_ratio, tire.rim_size).catch(() => [] as TireRow[])
    : Promise.resolve([] as TireRow[]);

  const [price, sameSizeTires] = await Promise.all([
    cachedGetSitePrice(tire.id, tire.make_name, tire.model_name),
    altPromise,
  ]);

  const model = modelData
    ? tiresToModel(modelData.model, modelData.tires, modelData.brand)
    : null;

  const brand = brandRow ? brandSummaryToBrand(brandRow) : null;
  const logoUrl = brand?.logoUrl || getLogoUrl(brand?.domain || "");

  // Gallery images from model
  const gallery =
    model?.images && model.images.length > 0
      ? model.images
      : model?.image
        ? [model.image]
        : [];

  // UTQG for this specific tire
  const utqg = parseUTQG(tire.utqg ?? undefined);

  // Tire type
  const season = tire.season?.toLowerCase() ?? "";
  const terrain = tire.terrain?.toLowerCase() ?? "";
  const category = tire.category?.toLowerCase() ?? "";
  let tireType = "all-season";
  if (terrain.includes("mud")) tireType = "mud-terrain";
  else if (terrain.includes("all-terrain")) tireType = "all-terrain";
  else if (terrain.includes("highway")) tireType = "highway";
  else if (season.includes("winter")) tireType = "winter";
  else if (season.includes("summer")) tireType = "summer";
  else if (category.includes("performance") || category.includes("uhp"))
    tireType = "performance";
  else if (category.includes("touring")) tireType = "touring";
  else if (season.includes("all-season") || season.includes("all-weather"))
    tireType = "all-season";

  const typeLabel = typeLabels[tireType] || tireType;

  // Related sizes from same model (exclude current tire, only priced)
  const relatedSizes =
    model?.sizes.filter((s) => s.tireId !== tire.id && s.price > 0).slice(0, 8) ?? [];

  // Alternative tires in the same size from other brands — use price_map for speed
  let alternatives: { brand: string; brandSlug: string; model: string; modelSlug: string; price: number; image: string | null }[] = [];
  {
    const seen = new Set<string>();
    for (const alt of sameSizeTires) {
      if (alternatives.length >= 6) break;
      const key = `${toSlug(alt.make_name)}-${toSlug(alt.model_name)}`;
      if (seen.has(key)) continue;
      if (toSlug(alt.make_name) === brandSlug && toSlug(alt.model_name) === modelSlug) continue;
      seen.add(key);
      const altPrice = alt.price_map ? Number(alt.price_map) : 0;
      if (altPrice <= 0) continue;
      const altImage = resolveImage(alt.local_thumbnail, alt.thumbnail_url, alt.image_0100_url);
      if (!altImage) continue;
      alternatives.push({
        brand: alt.make_name,
        brandSlug: toSlug(alt.make_name),
        model: alt.model_name,
        modelSlug: toSlug(alt.model_name),
        price: altPrice,
        image: altImage,
      });
    }
    alternatives.sort((a, b) => a.price - b.price);
  }

  const canonicalUrl = `https://ship.tires/tires/${brandSlug}/${modelSlug}/${sizeSlug}`;
  const modelUrl = `https://ship.tires/tires/${brandSlug}/${modelSlug}`;

  const breadcrumb = buildBreadcrumbSchema([
    { name: "Home", url: "https://ship.tires" },
    { name: "All Brands", url: "https://ship.tires/tires" },
    { name: tire.make_name, url: `https://ship.tires/tires/${brandSlug}` },
    { name: tire.model_name, url: modelUrl },
    { name: size, url: canonicalUrl },
  ]);

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${tire.make_name} ${tire.model_name} ${size}`,
    description: `${tire.make_name} ${tire.model_name} tire in size ${size}.${tire.warranty ? ` ${tire.warranty} warranty.` : ""} Free shipping.`,
    image: gallery[0] || logoUrl,
    brand: { "@type": "Brand", name: tire.make_name },
    category: "Tires",
    url: canonicalUrl,
    sku: String(tire.id),
    ...(tire.gm_code && { mpn: tire.gm_code }),
    ...(tire.ean && { gtin13: tire.ean }),
    ...(tire.upc && !tire.ean && { gtin12: tire.upc }),
    additionalProperty: [
      { "@type": "PropertyValue", name: "Size", value: size },
      ...(tire.load_rating
        ? [
            {
              "@type": "PropertyValue",
              name: "Load Index",
              value: tire.load_rating,
            },
          ]
        : []),
      ...(tire.speed_rating
        ? [
            {
              "@type": "PropertyValue",
              name: "Speed Rating",
              value: tire.speed_rating,
            },
          ]
        : []),
      ...(utqg
        ? [
            {
              "@type": "PropertyValue",
              name: "UTQG Treadwear",
              value: String(utqg.treadwear),
            },
            {
              "@type": "PropertyValue",
              name: "UTQG Traction",
              value: utqg.traction,
            },
            {
              "@type": "PropertyValue",
              name: "UTQG Temperature",
              value: utqg.temperature,
            },
          ]
        : []),
    ],
    ...(price > 0 && {
      offers: {
        "@type": "Offer",
        price,
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
        seller: { "@type": "Organization", name: "Ship.Tires" },
        hasMerchantReturnPolicy: {
          "@type": "MerchantReturnPolicy",
          applicableCountry: "US",
          returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
          merchantReturnDays: 30,
          returnMethod: "https://schema.org/ReturnByMail",
          returnFees: "https://schema.org/FreeReturn",
        },
        shippingDetails: {
          "@type": "OfferShippingDetails",
          shippingRate: {
            "@type": "MonetaryAmount",
            value: 0,
            currency: "USD",
          },
          shippingDestination: {
            "@type": "DefinedRegion",
            addressCountry: "US",
          },
          deliveryTime: {
            "@type": "ShippingDeliveryTime",
            handlingTime: {
              "@type": "QuantitativeValue",
              minValue: 1,
              maxValue: 2,
              unitCode: "DAY",
            },
            transitTime: {
              "@type": "QuantitativeValue",
              minValue: 3,
              maxValue: 7,
              unitCode: "DAY",
            },
          },
        },
      },
    }),
  };

  /** Build a size slug for a related tire size */
  function relatedSizeSlug(s: { size: string; tireId?: number }): string {
    const m = s.size.match(/(\d{2,4})\s*\/\s*(\d{2,4})\s*R\s*(\d{2}(?:\.\d)?)/i);
    if (m) return `${m[1]}-${m[2]}r${m[3]}`.toLowerCase();
    return String(s.tireId ?? "");
  }

  // Vehicle fitment — moved from JSX IIFE for reuse in FAQ
  const fitVehicles = getVehiclesForSize(size, 12);

  // Auto-generated FAQ items
  const faqItems: { q: string; a: string }[] = [];
  if (price > 0) {
    faqItems.push({
      q: `How much does the ${tire.make_name} ${tire.model_name} ${size} cost?`,
      a: `The ${tire.make_name} ${tire.model_name} in size ${size} costs $${price.toFixed(2)} per tire. A set of 4 costs $${(price * 4).toFixed(2)} with free shipping included on every order at Ship.Tires.`,
    });
  }
  faqItems.push({
    q: `Is free shipping included on the ${tire.make_name} ${tire.model_name}?`,
    a: `Yes. Every ${tire.make_name} tire at Ship.Tires ships free to anywhere in the continental US — to your home or directly to your preferred installer. No minimum order required.`,
  });
  if (fitVehicles.length > 0) {
    const vehicleList = fitVehicles.slice(0, 6).map((v) => `${v.make} ${v.model}`).join(", ");
    faqItems.push({
      q: `What vehicles use ${size} tires?`,
      a: `The ${size} tire size fits vehicles including ${vehicleList}${fitVehicles.length > 6 ? " and more" : ""}. Use our vehicle lookup tool to confirm the right size for your specific year and trim.`,
    });
  }
  if (tire.warranty) {
    faqItems.push({
      q: `What is the warranty on the ${tire.make_name} ${tire.model_name}?`,
      a: `The ${tire.make_name} ${tire.model_name} comes with a ${tire.warranty} manufacturer warranty.`,
    });
  }

  const faqSchema = faqItems.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  } : null;

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
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}

      <TrackView
        id={tire.id}
        brand={tire.make_name}
        brandSlug={brandSlug}
        model={tire.model_name}
        modelSlug={modelSlug}
        size={size}
        sizeSlug={sizeSlug}
        price={price}
        image={model?.image}
      />
      <MetaPixelViewContent
        contentId={String(tire.id)}
        contentName={`${tire.make_name} ${tire.model_name} ${size}`}
        value={price}
      />

      <div className="bg-gray-50 min-h-screen">
        {/* Breadcrumb */}
        <div className="bg-white border-b border-gray-200">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Link href="/tires" className="hover:text-gray-900">
                All Brands
              </Link>
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
              <Link href={`/tires/${brandSlug}`} className="hover:text-gray-900">
                {tire.make_name}
              </Link>
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
              <Link href={`/tires/${brandSlug}/${modelSlug}`} className="hover:text-gray-900">
                {tire.model_name}
              </Link>
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
              <span className="text-gray-900 font-medium">{size}</span>
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <div className="bg-white border-b border-gray-200">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
              {/* Left: Image Gallery */}
              <div>
                {gallery.length > 0 ? (
                  <TireGallery
                    images={gallery}
                    alt={`${tire.make_name} ${tire.model_name} ${size}`}
                  />
                ) : (
                  <div className="flex h-80 items-center justify-center rounded-xl bg-gray-100">
                    <svg className="h-24 w-24 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                      <circle cx="12" cy="12" r="9" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Right: Product Info */}
              <div className="flex flex-col">
                {/* Brand logo + name */}
                <div className="flex items-center gap-3 mb-3">
                  <Image
                    src={logoUrl}
                    alt={tire.make_name}
                    width={40}
                    height={40}
                    className="h-9 w-9 object-contain"
                  />
                  <Link
                    href={`/tires/${brandSlug}`}
                    className="text-sm font-semibold text-gray-500 hover:text-safety-orange uppercase tracking-wider"
                  >
                    {tire.make_name}
                  </Link>
                </div>

                {/* Model name + size */}
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
                  {tire.model_name}
                  <span className="block text-xl sm:text-2xl text-gray-600 font-mono mt-1">
                    {size}
                  </span>
                </h1>

                {/* Type + Stock + Free Shipping */}
                <div className="mt-4 flex items-center gap-3 flex-wrap">
                  <span className="inline-flex items-center rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-sm font-medium text-blue-700">
                    {typeLabel}
                  </span>
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-green-600">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path
                        fillRule="evenodd"
                        d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
                        clipRule="evenodd"
                      />
                    </svg>
                    In Stock
                  </span>
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-green-600">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
                      />
                    </svg>
                    Free Shipping
                  </span>
                </div>

                {/* Price + Quantity */}
                {price > 0 ? (
                  <QuantityPicker
                    price={price}
                    brand={tire.make_name}
                    brandSlug={brandSlug}
                    model={tire.model_name}
                    modelSlug={modelSlug}
                    size={size}
                    loadIndex={parseInt(tire.load_rating ?? "0") || 0}
                    speedRating={tire.speed_rating ?? ""}
                    image={model?.image}
                    tireId={tire.id}
                  />
                ) : (
                  <div className="mt-5 rounded-xl bg-gray-50 border border-gray-200 p-5">
                    <span className="text-2xl font-bold text-safety-orange">
                      Call for Pricing
                    </span>
                    <p className="mt-1 text-sm text-gray-500">
                      Contact us for the best price on this tire
                    </p>
                  </div>
                )}

                {/* Tire Specs — only show cards that have data */}
                <div className="mt-5 grid grid-cols-2 gap-3">
                  {tire.load_rating && (
                    <div className="rounded-lg bg-white border border-gray-200 p-3.5">
                      <div className="text-xs text-gray-500 uppercase font-medium">
                        Load / Speed
                      </div>
                      <div className="mt-0.5 text-lg font-bold text-gray-900">
                        {tire.load_rating}
                        {tire.speed_rating && (
                          <span className="text-gray-500 ml-0.5">
                            {tire.speed_rating}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  {tire.warranty && (
                    <div className="rounded-lg bg-white border border-gray-200 p-3.5">
                      <div className="text-xs text-gray-500 uppercase font-medium">
                        Warranty
                      </div>
                      <div className="mt-0.5 text-lg font-bold text-gray-900">
                        {tire.warranty}
                      </div>
                    </div>
                  )}
                  {utqg && utqg.treadwear && (
                    <div className="rounded-lg bg-white border border-gray-200 p-3.5">
                      <div className="text-xs text-gray-500 uppercase font-medium">
                        Treadwear
                      </div>
                      <div className="mt-0.5 text-lg font-bold text-gray-900">
                        {utqg.treadwear}
                        <span className="text-sm font-normal text-gray-500 ml-1">
                          ({treadwearLabel(utqg.treadwear)})
                        </span>
                      </div>
                    </div>
                  )}
                  {tire.load_range && (
                    <div className="rounded-lg bg-white border border-gray-200 p-3.5">
                      <div className="text-xs text-gray-500 uppercase font-medium">
                        Load Range
                      </div>
                      <div className="mt-0.5 text-lg font-bold text-gray-900">
                        {tire.load_range}
                        {tire.ply_rating && (
                          <span className="text-sm font-normal text-gray-500 ml-1">
                            ({tire.ply_rating}-ply)
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Features */}
                {model && model.features.length > 0 && (
                  <div className="mt-5 flex flex-wrap gap-2">
                    {model.features.map((feature) => (
                      <span
                        key={feature}
                        className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700"
                      >
                        <svg className="h-3.5 w-3.5 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                          <path
                            fillRule="evenodd"
                            d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {feature}
                      </span>
                    ))}
                  </div>
                )}

                {/* Call CTA (shown when no price, or as secondary action) */}
                {price <= 0 && (
                  <div className="mt-6 flex flex-col gap-3">
                    <a
                      href="tel:+12792388473"
                      className="flex items-center justify-center gap-2 rounded-xl bg-safety-orange px-6 py-4 text-lg font-bold text-white hover:bg-safety-orange/90 transition-colors"
                    >
                      Call for Price
                    </a>
                  </div>
                )}

                {/* Link to all sizes */}
                <div className="mt-4 text-center">
                  <Link
                    href={`/tires/${brandSlug}/${modelSlug}`}
                    className="text-sm font-medium text-safety-orange hover:text-safety-orange/80 transition-colors"
                  >
                    View all {model?.sizes.length ?? ""} {tire.model_name} sizes
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Specifications Table */}
        <div className="bg-white border-b border-gray-200">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Specifications
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-gray-100">
                  {[
                    ["Brand", tire.make_name],
                    ["Model", tire.model_name],
                    ["Size", size, "font-mono"],
                    tire.load_rating && ["Load Index", tire.load_rating],
                    tire.speed_rating && ["Speed Rating", tire.speed_rating],
                    tire.load_range && ["Load Range", tire.load_range],
                    tire.ply_rating && ["Ply Rating", tire.ply_rating],
                    tire.weight && ["Weight", `${tire.weight} lbs`],
                    tire.tread_depth && ["Tread Depth", `${tire.tread_depth}/32"`],
                    tire.section_width && ["Section Width", `${tire.section_width}"`],
                    tire.diameter_overall && ["Overall Diameter", `${tire.diameter_overall}"`],
                    tire.max_inflation_pressure && ["Max Inflation", `${tire.max_inflation_pressure} PSI`],
                    tire.utqg && ["UTQG", tire.utqg],
                    tire.warranty && ["Warranty", tire.warranty],
                    tire.item_number && ["Part Number", tire.item_number],
                  ]
                    .filter(Boolean)
                    .map((row) => {
                      const [label, value, cls] = row as [string, string, string?];
                      return (
                        <tr key={label}>
                          <td className="py-2.5 pr-4 text-gray-500 font-medium w-1/3">
                            {label}
                          </td>
                          <td className={`py-2.5 text-gray-900 ${cls || ""}`}>
                            {value}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Vehicle Fitment */}
        {fitVehicles.length > 0 && (
          <div className="bg-white border-b border-gray-200">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
              <h2 className="text-lg font-bold text-gray-900 mb-3">
                Fits These Vehicles ({size})
              </h2>
              <div className="flex flex-wrap gap-2">
                {fitVehicles.map((v) => (
                  <Link
                    key={`${v.make}-${v.model}`}
                    href={`/tires/vehicle/${v.make.toLowerCase().replace(/[^a-z0-9]+/g, "-")}/${v.model.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                    className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200 transition-colors"
                  >
                    {v.make} {v.model}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
            {/* Left: Other tires in this size (promoted) + About */}
            <div className="lg:col-span-2 space-y-10">
              {alternatives.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Other {size} Tires
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Compare other brands available in {size} —{" "}
                    <Link
                      href={`/tires/size/${sizeSlug}`}
                      className="text-safety-orange hover:text-safety-orange/80"
                    >
                      View all {size} tires
                    </Link>
                  </p>
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {alternatives.map((alt) => (
                      <Link
                        key={`${alt.brandSlug}-${alt.modelSlug}`}
                        href={`/tires/${alt.brandSlug}/${alt.modelSlug}/${sizeSlug}`}
                        className="group flex flex-col rounded-xl border border-gray-200 bg-white overflow-hidden hover:shadow-md hover:border-safety-orange/30 transition-all"
                      >
                        <div className="flex items-center justify-center bg-gray-50 p-4 h-32">
                          {alt.image ? (
                            <Image
                              src={alt.image}
                              alt={`${alt.brand} ${alt.model}`}
                              width={100}
                              height={100}
                              className="h-24 w-24 object-contain group-hover:scale-105 transition-transform"
                            />
                          ) : (
                            <svg className="h-16 w-16 text-gray-200" fill="none" viewBox="0 0 24 24" strokeWidth={0.5} stroke="currentColor">
                              <circle cx="12" cy="12" r="9" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          )}
                        </div>
                        <div className="p-4 border-t border-gray-100">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{alt.brand}</p>
                          <h3 className="text-sm font-bold text-gray-900 group-hover:text-safety-orange transition-colors">{alt.model}</h3>
                          <div className="mt-2 flex items-baseline justify-between">
                            <span className="text-lg font-bold text-gray-900">${alt.price.toFixed(2)}<span className="text-xs text-gray-400">/tire</span></span>
                            <span className="text-xs font-bold text-safety-orange">Shop &rarr;</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* About */}
              {model?.description && (
                <div className="rounded-xl bg-white border border-gray-200 p-6">
                  <h2 className="text-lg font-bold text-gray-900">
                    About the {tire.make_name} {tire.model_name}
                  </h2>
                  <p className="mt-2 text-gray-600 leading-relaxed">
                    {model.description}
                  </p>
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
            </div>

            {/* Sidebar — Cart + Other model sizes (compact) */}
            <div className="lg:col-span-1 space-y-6">
              <CartSidebar brand={tire.make_name} model={tire.model_name} />

              {/* Other sizes of this model (compact sidebar list) */}
              {relatedSizes.length > 0 && (
                <div className="rounded-xl border border-gray-200 bg-white p-6">
                  <h3 className="text-sm font-bold uppercase text-gray-500">
                    Other {tire.model_name} Sizes
                  </h3>
                  <p className="mt-1 text-xs text-gray-400">
                    <Link
                      href={`/tires/${brandSlug}/${modelSlug}`}
                      className="text-safety-orange hover:text-safety-orange/80"
                    >
                      View all sizes
                    </Link>
                  </p>
                  <div className="mt-3 space-y-2">
                    {relatedSizes.map((s) => (
                      <Link
                        key={`${s.size}-${s.tireId}`}
                        href={`/tires/${brandSlug}/${modelSlug}/${relatedSizeSlug(s)}`}
                        className="flex items-center justify-between rounded-lg p-2 -mx-2 hover:bg-gray-50 transition-colors"
                      >
                        <span className="font-mono text-sm font-bold text-gray-900">{s.size}</span>
                        <span className="text-sm font-bold text-gray-900">${s.price.toFixed(2)}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recently Viewed */}
        <div className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
          <RecentlyViewed
            currentTireId={tire.id}
            brandSlug={brandSlug}
            modelSlug={modelSlug}
          />
        </div>
      </div>

      {/* Sticky Mobile Buy Bar */}
      {price > 0 && (
        <StickyBuyBar
          price={price}
          brand={tire.make_name}
          brandSlug={brandSlug}
          model={tire.model_name}
          modelSlug={modelSlug}
          size={size}
          loadIndex={parseInt(tire.load_rating ?? "0") || 0}
          speedRating={tire.speed_rating ?? ""}
          image={model?.image}
          tireId={tire.id}
        />
      )}
    </>
  );
}
