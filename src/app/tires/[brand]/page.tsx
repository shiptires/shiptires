import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  getBrandBySlug,
  getModelsByBrand,
  getDistinctSizesForBrand,
  getManufacturer,
  brandSummaryToBrand,
  modelSummaryToModel,
} from "@/lib/db";
import { getLogoUrl } from "@/lib/api-helpers";
import { getBrandLogo } from "@/lib/curated-brands";
import { buildBreadcrumbSchema } from "@/lib/breadcrumb-schema";
import { getActiveRebates, getRebatesForBrand } from "@/lib/rebates";
import { getRankingsForBrand } from "@/lib/ranking-helpers";
import { getBrandAuthority } from "@/data/brand-authority";
import BrandModelGrid from "@/components/BrandModelGrid";
import BrandModelPicker from "@/components/BrandModelPicker";
import BrandSizeLookup from "@/components/BrandSizeLookup";
import BrandPopularSizes from "@/components/BrandPopularSizes";
import VehicleLookup from "@/components/VehicleLookup";
import type { Metadata } from "next";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ brand: string }>;
}): Promise<Metadata> {
  const { brand: brandSlug } = await params;
  const brandRow = await getBrandBySlug(brandSlug);
  if (!brandRow) return {};

  const models = await getModelsByBrand(brandSlug);

  return {
    title: `Buy ${brandRow.make_name} Tires Online | ${models.length} Models | Free Shipping`,
    description: `Buy ${brandRow.make_name} tires online — compare ${models.length} models and ${brandRow.tire_count} sizes. Free shipping on every order. Find the best ${brandRow.make_name} tire for your vehicle at Ship.Tires.`,
    alternates: {
      canonical: `https://ship.tires/tires/${brandSlug}`,
      types: { "text/plain": `https://ship.tires/tires/${brandSlug}/llm.txt` },
    },
  };
}

export default async function BrandPage({
  params,
}: {
  params: Promise<{ brand: string }>;
}) {
  const { brand: brandSlug } = await params;
  const brandRow = await getBrandBySlug(brandSlug);

  if (!brandRow) notFound();

  const brand = brandSummaryToBrand(brandRow);
  const [modelRows, manufacturer, popularSizes, allRebates] = await Promise.all([
    getModelsByBrand(brandSlug),
    getManufacturer(brandRow.make_name),
    getDistinctSizesForBrand(brandSlug),
    getActiveRebates().catch(() => []),
  ]);
  // Sort by tire_count descending — popular models first, not alphabetical
  const sortedRows = [...modelRows]
    .filter((r) => !/retread/i.test(r.model_name))
    .sort((a, b) => (b.tire_count ?? 0) - (a.tire_count ?? 0));
  const allModels = sortedRows.map(modelSummaryToModel);
  // Only show models with real pricing (page stays alive for SEO)
  const models = allModels.filter((m) => m.priceRange[0] > 0 && m.image);
  const brandRebates = getRebatesForBrand(allRebates, brandRow.make_name);

  const logoUrl = brand.logoUrl || getBrandLogo(brandRow.make_name) || getLogoUrl(brand.domain);
  const authority = getBrandAuthority(brandSlug);
  const brandRankings = getRankingsForBrand(brandSlug);

  const breadcrumb = buildBreadcrumbSchema([
    { name: "Home", url: "https://ship.tires" },
    { name: "All Brands", url: "https://ship.tires/tires" },
    { name: brand.name, url: `https://ship.tires/tires/${brandSlug}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />

      <div className="bg-gray-50">
      {/* Brand Header */}
      <div className="bg-navy py-12 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Link href="/tires" className="hover:text-white">
              All Brands
            </Link>
            <span>/</span>
            <span className="text-gray-300">{brand.name}</span>
          </div>
          <div className="mt-6 flex items-center gap-6">
            <div className="flex-shrink-0 rounded-xl bg-white p-4">
              <Image
                src={logoUrl}
                alt={brand.name}
                width={160}
                height={160}
                className="h-20 w-20 sm:h-24 sm:w-24 object-contain"
                priority
              />
            </div>
            <div>
              <h1 className="text-3xl font-bold sm:text-4xl">
                Shop {brand.name} Tires — Ship Free
              </h1>
              <p className="mt-1 text-gray-400">
                {models.length} models{brand.tireCount ? <> &middot; {brand.tireCount.toLocaleString()} tires</> : ""} &middot; Ship free
                to your door or installer
              </p>
              {brandRankings.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {brandRankings.map((r) => (
                    <Link
                      key={`${r.categorySlug}-${r.modelSlug}`}
                      href={`/tires/${brandSlug}/${r.modelSlug}`}
                      className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 border border-amber-400/30 px-3 py-1 text-xs font-bold text-amber-300 hover:bg-amber-500/30 transition-colors"
                    >
                      <svg className="h-3.5 w-3.5 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0016.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.003 6.003 0 01-4.52 0" />
                      </svg>
                      #{r.rank} {r.category} — {r.model}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-12">
        {/* Find Your Size + Model + Vehicle Lookup */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900">
              Find by Model
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Browse {brand.name} tire lineups
            </p>
            <div className="mt-4">
              <BrandModelPicker
                brandSlug={brand.slug}
                brandName={brand.name}
                models={models.map((m) => ({
                  name: m.name,
                  slug: m.slug,
                  type: m.type,
                  sizeCount: m.sizeCount ?? 0,
                }))}
              />
            </div>
          </div>

          <div className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900">
              Find by Size
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Enter your tire size from your sidewall or door jamb sticker
            </p>
            <div className="mt-4">
              <BrandSizeLookup brandSlug={brand.slug} brandName={brand.name} />
            </div>
          </div>

          <div className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900">
              Find by Vehicle
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Select your year, make, and model to find compatible sizes
            </p>
            <div className="mt-4">
              <VehicleLookup />
            </div>
          </div>
        </div>

        {/* Active Rebates */}
        {brandRebates.length > 0 && (
          <div className="space-y-4">
            {brandRebates.map((rebate) => (
              <div
                key={rebate.id}
                className="rounded-xl border-2 border-safety-orange/30 bg-white overflow-hidden shadow-sm"
              >
                {rebate.imageHorizontalUrl && (
                  <div className="relative h-32 sm:h-44 bg-gradient-to-r from-gray-50 to-white">
                    <Image
                      src={rebate.imageHorizontalUrl}
                      alt={rebate.name}
                      fill
                      className="object-contain"
                    />
                  </div>
                )}
                <div className="p-5">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-safety-orange/10 px-3 py-1 text-xs font-bold text-safety-orange">
                      SAVE ${rebate.amount}
                    </span>
                    <span className="text-xs text-gray-500">
                      Valid {new Date(rebate.startDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })} – {new Date(rebate.endDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </div>
                  <h3 className="mt-2 text-lg font-bold text-gray-900">{rebate.name}</h3>
                  <p className="mt-1 text-sm text-gray-600">{rebate.description}</p>
                  {rebate.formUrl && (
                    <a
                      href={rebate.formUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                      </svg>
                      Download Rebate Form
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Brand Overview */}
        {authority && (
          <div className="rounded-xl bg-white border border-gray-200 p-6 sm:p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900">
              About {brand.name} Tires
            </h2>
            <div className="mt-1 flex flex-wrap gap-3 text-xs text-gray-500">
              {authority.headquarters && <span>HQ: {authority.headquarters}</span>}
              {authority.founded && <span>Est. {authority.founded}</span>}
              {authority.market && <span className="capitalize">{authority.market} segment</span>}
            </div>
            {authority.overview.split("\n\n").map((p, i) => (
              <p key={i} className="mt-3 text-gray-600 leading-relaxed">{p}</p>
            ))}
            {authority.technologies.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Key Technologies</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {authority.technologies.map((tech) => (
                    <span key={tech} className="inline-flex items-center rounded-full bg-blue/5 border border-blue/20 px-3 py-1 text-xs font-medium text-blue">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Popular Sizes */}
        {popularSizes.length > 0 && (
          <BrandPopularSizes
            sizes={popularSizes}
            brandSlug={brand.slug}
            brandName={brand.name}
          />
        )}

        {/* Models Grid */}
        {models.length > 0 ? (
          <BrandModelGrid
            models={models}
            brandSlug={brand.slug}
            brandName={brand.name}
            brandLogo={logoUrl}
          />
        ) : (
          <div className="rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
            <div className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-800">
              Catalog Loading
            </div>
            <h2 className="mt-4 text-xl font-bold text-gray-900">
              {brand.name} Tires Coming Soon
            </h2>
            <p className="mt-2 text-gray-500">
              We&apos;re currently importing the full {brand.name} catalog.
              Check back soon or contact us for availability.
            </p>
            <div className="mt-6">
              <a
                href="tel:+12792388473"
                className="inline-flex items-center gap-2 rounded-lg bg-orange px-6 py-3 text-sm font-bold text-white hover:bg-orange-light transition-colors"
              >
                Call/Text (279) 238-8473 (TIRE)
              </a>
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="rounded-xl bg-orange p-8 text-center text-white">
          <h3 className="text-xl font-bold">
            Free Shipping on Every {brand.name} Tire
          </h3>
          <p className="mt-2 text-white/90">
            Pick your size, add to cart, and we ship free to your door or local
            installer.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href={`/search?brand=${brand.slug}`}
              className="rounded-lg bg-white px-6 py-3 text-sm font-bold text-orange hover:bg-gray-50 transition-colors"
            >
              Search All {brand.name} Tires
            </Link>
            <a
              href="tel:+12792388473"
              className="rounded-lg border-2 border-white px-6 py-3 text-sm font-bold text-white hover:bg-white/10 transition-colors"
            >
              Call/Text (279) 238-8473 (TIRE)
            </a>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
