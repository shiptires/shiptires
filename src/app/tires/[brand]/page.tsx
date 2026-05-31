import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { brands } from "@/data/brands";
import { getLogoUrl } from "@/lib/api-helpers";
import TireCard from "@/components/TireCard";
import type { Metadata } from "next";

export async function generateStaticParams() {
  return brands.map((brand) => ({ brand: brand.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ brand: string }>;
}): Promise<Metadata> {
  const { brand: brandSlug } = await params;
  const brand = brands.find((b) => b.slug === brandSlug);
  if (!brand) return {};

  return {
    title: `${brand.name} Tires — All Models & Sizes`,
    description: `Shop ${brand.name} tires with free shipping. Browse ${brand.models.length} models including ${brand.models.slice(0, 3).map((m) => m.name).join(", ")} and more.`,
  };
}

export default async function BrandPage({
  params,
}: {
  params: Promise<{ brand: string }>;
}) {
  const { brand: brandSlug } = await params;
  const brand = brands.find((b) => b.slug === brandSlug);

  if (!brand) notFound();

  const logoUrl = getLogoUrl(brand.domain);

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
              <h1 className="text-3xl font-bold sm:text-4xl">{brand.name} Tires</h1>
              <p className="mt-1 text-gray-400">
                {brand.country} &middot; Founded {brand.founded} &middot; {brand.models.length} models
              </p>
            </div>
          </div>
          <p className="mt-4 max-w-3xl text-gray-300">{brand.description}</p>
        </div>
      </div>

      {/* Models Grid */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-gray-900">
          All {brand.name} Models ({brand.models.length})
        </h2>
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {brand.models.map((model) => (
            <TireCard key={model.slug} model={model} brandSlug={brand.slug} />
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 rounded-xl bg-navy p-8 text-center text-white">
          <h3 className="text-xl font-bold">Need Help Choosing a {brand.name} Tire?</h3>
          <p className="mt-2 text-gray-400">
            Our tire experts can help you find the perfect {brand.name} tire for your vehicle.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <a
              href="tel:+19164767689"
              className="inline-flex items-center gap-2 rounded-lg bg-orange px-6 py-3 text-sm font-bold text-white hover:bg-orange-light transition-colors"
            >
              Call (916) 476-7689
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
