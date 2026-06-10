import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  getBrandBySlug,
  getModelsByBrand,
  getManufacturer,
  brandSummaryToBrand,
  modelSummaryToModel,
} from "@/lib/db";
import { getLogoUrl } from "@/lib/api-helpers";
import TireCard from "@/components/TireCard";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ brand: string }>;
}): Promise<Metadata> {
  const { brand: brandSlug } = await params;
  const brandRow = getBrandBySlug(brandSlug);
  if (!brandRow) return {};

  const models = getModelsByBrand(brandSlug);

  return {
    title: `${brandRow.make_name} Tires — All Models & Sizes`,
    description: `Shop ${brandRow.make_name} tires with free shipping. Browse ${models.length} models. ${brandRow.tire_count} tires available.`,
    alternates: { canonical: `https://ship.tires/tires/${brandSlug}` },
  };
}

export default async function BrandPage({
  params,
}: {
  params: Promise<{ brand: string }>;
}) {
  const { brand: brandSlug } = await params;
  const brandRow = getBrandBySlug(brandSlug);

  if (!brandRow) notFound();

  const brand = brandSummaryToBrand(brandRow);
  const modelRows = getModelsByBrand(brandSlug);
  const models = modelRows.map(modelSummaryToModel);
  const manufacturer = getManufacturer(brandRow.make_name);

  const logoUrl = brand.logoUrl || getLogoUrl(brand.domain);

  return (
    <div className="bg-gray-50">
      {/* Brand Header */}
      <div className="bg-navy py-12 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link href="/tires" className="text-sm text-gray-400 hover:text-white">
              All Brands
            </Link>
            <span className="text-gray-600">/</span>
            <span className="text-sm text-gray-300">{brand.name}</span>
          </div>
          <div className="mt-6 flex items-center gap-6">
            <div className="flex-shrink-0 rounded-xl bg-white p-3">
              <Image
                src={logoUrl}
                alt={brand.name}
                width={80}
                height={80}
                className="h-16 w-16 object-contain"
                unoptimized
              />
            </div>
            <div>
              <h1 className="text-3xl font-bold sm:text-4xl">Shop & Ship {brand.name} Car, Truck & SUV Tires — Free Delivery</h1>
              <p className="mt-1 text-gray-400">
                {models.length} models &middot; {brand.tireCount} tires
              </p>
            </div>
          </div>
          {manufacturer?.dot_reg_url && (
            <p className="mt-4 max-w-3xl text-gray-300">
              Manufacturer registered with the US Department of Transportation.
            </p>
          )}
        </div>
      </div>

      {/* Models Grid */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {models.length > 0 ? (
          <>
            <h2 className="text-2xl font-bold text-gray-900">
              All {brand.name} Models ({models.length})
            </h2>
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {models.map((model) => (
                <TireCard
                  key={model.slug}
                  model={model}
                  brandSlug={brand.slug}
                  brandName={brand.name}
                  brandLogo={logoUrl}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
            <div className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-800">
              Catalog Loading
            </div>
            <h2 className="mt-4 text-xl font-bold text-gray-900">
              {brand.name} Tires Coming Soon
            </h2>
            <p className="mt-2 text-gray-500">
              We&apos;re currently importing the full {brand.name} catalog. Check back soon or contact us for availability.
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
        <div className="mt-12 rounded-xl bg-navy p-8 text-center text-white">
          <h3 className="text-xl font-bold">Need Help Choosing a {brand.name} Tire?</h3>
          <p className="mt-2 text-gray-400">
            Our tire experts can help you find the perfect {brand.name} tire for your vehicle.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <a
              href="tel:+12792388473"
              className="inline-flex items-center gap-2 rounded-lg bg-orange px-6 py-3 text-sm font-bold text-white hover:bg-orange-light transition-colors"
            >
              Call/Text (279) 238-8473 (TIRE)
            </a>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-600 px-6 py-3 text-sm font-bold text-white hover:bg-navy-light transition-colors"
            >
              Request a Quote
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
