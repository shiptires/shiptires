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
import { getSitePrice, sitePrice } from "@/lib/pricing";
import CartSidebar from "@/components/CartSidebar";
import AddToCartButton from "@/components/AddToCartButton";
import QuantityPicker from "@/components/QuantityPicker";
import TireGallery from "@/components/TireGallery";
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

// ---------------------------------------------------------------------------
// Size slug helpers: "255-75r17" ↔ { width: "255", aspect: "75", rim: "17" }
// ---------------------------------------------------------------------------

function parseSizeSlug(
  slug: string
): { width: string; aspect: string; rim: string } | null {
  // Match patterns like: 255-75r17, lt255-75r17, 31-1050r15, 280-85r20
  const m = slug.match(
    /^(?:lt|p)?(\d{2,4})-(\d{2,4})r(\d{2}(?:\.\d)?)$/i
  );
  if (!m) return null;
  return { width: m[1], aspect: m[2], rim: m[3] };
}

function toSizeSlug(tire: TireRow): string | null {
  if (!tire.width || !tire.aspect_ratio || !tire.rim_size) return null;
  return `${tire.width}-${tire.aspect_ratio}r${tire.rim_size}`.toLowerCase();
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
  const price = await cachedGetSitePrice(tire.id, tire.price_map);

  return {
    title: `${tire.make_name} ${tire.model_name} ${size} Tire — $${price > 0 ? price : "Call"} | Free Shipping`,
    description: `Buy the ${tire.make_name} ${tire.model_name} in size ${size}${price > 0 ? ` for $${price}/tire` : ""}. Free shipping to your door or installer.${tire.warranty ? ` ${tire.warranty} warranty.` : ""}${tire.load_rating ? ` Load index ${tire.load_rating}.` : ""}`,
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
    cachedGetSitePrice(tire.id, tire.price_map),
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

  // Related sizes from same model (exclude current tire)
  const relatedSizes =
    model?.sizes.filter((s) => s.tireId !== tire.id).slice(0, 8) ?? [];

  // Alternative tires in the same size from other brands
  let alternatives: { brand: string; brandSlug: string; model: string; modelSlug: string; price: number; image: string | null }[] = [];
  {
    const seen = new Set<string>();
    for (const alt of sameSizeTires) {
      const key = `${toSlug(alt.make_name)}-${toSlug(alt.model_name)}`;
      if (seen.has(key)) continue;
      if (toSlug(alt.make_name) === brandSlug && toSlug(alt.model_name) === modelSlug) continue;
      const altPrice = sitePrice(alt.price_map);
      if (altPrice <= 0) continue;
      seen.add(key);
      alternatives.push({
        brand: alt.make_name,
        brandSlug: toSlug(alt.make_name),
        model: alt.model_name,
        modelSlug: toSlug(alt.model_name),
        price: altPrice,
        image: alt.thumbnail_url || alt.angle_image_url || null,
      });
      if (alternatives.length >= 6) break;
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
        {(() => {
          const fitVehicles = getVehiclesForSize(size, 12);
          if (fitVehicles.length === 0) return null;
          return (
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
          );
        })()}

        {/* Main Content */}
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
            {/* Left: Related Sizes */}
            <div className="lg:col-span-2 space-y-10">
              {relatedSizes.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Other {tire.model_name} Sizes
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    <Link
                      href={`/tires/${brandSlug}/${modelSlug}`}
                      className="text-safety-orange hover:text-safety-orange/80"
                    >
                      View all {model?.sizes.length ?? ""} sizes
                    </Link>
                  </p>
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {relatedSizes.map((s) => (
                      <Link
                        key={`${s.size}-${s.tireId}`}
                        href={`/tires/${brandSlug}/${modelSlug}/${relatedSizeSlug(s)}`}
                        className="rounded-lg border border-gray-200 bg-white p-3 text-center hover:border-safety-orange/40 transition-colors"
                      >
                        <div className="font-mono text-sm font-bold text-gray-900">
                          {s.size}
                        </div>
                        {s.price > 0 && (
                          <>
                            <div className="mt-1 text-lg font-bold text-gray-900">
                              ${s.price}
                            </div>
                            <div className="text-xs text-gray-500">/tire</div>
                          </>
                        )}
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
            </div>

            {/* Sidebar — Cart */}
            <div className="lg:col-span-1 space-y-6">
              <CartSidebar brand={tire.make_name} model={tire.model_name} />

              {/* Alternative tires in this size */}
              {alternatives.length > 0 && (
                <div className="rounded-xl border border-gray-200 bg-white p-6">
                  <h3 className="text-sm font-bold uppercase text-gray-500">
                    Other {size} Tires
                  </h3>
                  <div className="mt-3 space-y-3">
                    {alternatives.map((alt) => (
                      <Link
                        key={`${alt.brandSlug}-${alt.modelSlug}`}
                        href={`/tires/${alt.brandSlug}/${alt.modelSlug}/${sizeSlug}`}
                        className="flex items-center gap-3 rounded-lg p-2 -mx-2 hover:bg-gray-50 transition-colors"
                      >
                        {alt.image ? (
                          <Image
                            src={alt.image}
                            alt={`${alt.brand} ${alt.model}`}
                            width={40}
                            height={40}
                            className="h-10 w-10 rounded object-contain"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded bg-gray-100">
                            <svg className="h-5 w-5 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                              <circle cx="12" cy="12" r="9" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {alt.brand} {alt.model}
                          </div>
                          <div className="text-sm font-bold text-safety-orange">
                            ${alt.price}/tire
                          </div>
                        </div>
                        <svg className="h-4 w-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                      </Link>
                    ))}
                  </div>
                  <Link
                    href={`/tires/size/${sizeSlug}`}
                    className="mt-4 block text-center text-sm font-medium text-safety-orange hover:text-safety-orange/80 transition-colors"
                  >
                    View all {size} tires
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
