import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { getMakeContent, getModelsForMake, vehicleMakes } from "@/data/vehicle-content";
import { searchTires } from "@/lib/db";
import type { TireRow } from "@/lib/db";
import { isCuratedBrand } from "@/lib/curated-brands";
import { buildBreadcrumbSchema } from "@/lib/breadcrumb-schema";

export const revalidate = 300;

// Generate all vehicle make pages at build time
export function generateStaticParams() {
  return vehicleMakes.map((m) => ({ make: m.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ make: string }>;
}): Promise<Metadata> {
  const { make } = await params;
  const content = getMakeContent(make);
  const makeName = content?.name ?? make.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    title: `Shop ${makeName} Tires — Find Tires for Your ${makeName} | Ship Free`,
    description: `Find the right tires for your ${makeName}. Browse all ${makeName} models, compare tire sizes and brands. Free shipping on every order. Shop ${makeName} tires and ship free at Ship.Tires.`,
    alternates: { canonical: `https://ship.tires/tires/vehicle/${make}` },
  };
}

export default async function VehicleMakePage({
  params,
}: {
  params: Promise<{ make: string }>;
}) {
  const { make } = await params;
  const content = getMakeContent(make);
  const makeName = content?.name ?? make.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const models = getModelsForMake(make);

  // Fetch a few sample tires for this make to show images — filter to curated brands
  const sampleResult = await searchTires({ query: makeName, limit: 50, page: 1 });
  const sampleTires = sampleResult.tires.filter((t) => isCuratedBrand(t.make_name)).slice(0, 12);

  // Group sample tires by model for image display
  const tiresByModel = new Map<string, TireRow[]>();
  for (const tire of sampleTires) {
    const key = tire.model_name;
    if (!tiresByModel.has(key)) tiresByModel.set(key, []);
    tiresByModel.get(key)!.push(tire);
  }

  const breadcrumb = buildBreadcrumbSchema([
    { name: "Home", url: "https://ship.tires" },
    { name: "Shop by Vehicle", url: "https://ship.tires/vehicle-lookup" },
    { name: makeName, url: `https://ship.tires/tires/vehicle/${make}` },
  ]);

  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${makeName} Tires`,
    description: `Find and shop tires for all ${makeName} models. ${models.length} models available with free shipping.`,
    url: `https://ship.tires/tires/vehicle/${make}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />

      <div className="bg-gray-50 min-h-screen">
        {/* Hero */}
        <div className="bg-navy py-12 text-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Link href="/tires" className="hover:text-white transition-colors">All Brands</Link>
              <span>/</span>
              <Link href="/vehicle-lookup" className="hover:text-white transition-colors">Shop by Vehicle</Link>
              <span>/</span>
              <span className="text-gray-300">{makeName}</span>
            </div>
            <h1 className="mt-4 text-3xl font-bold sm:text-4xl lg:text-5xl">
              Find Tires for Your {makeName}
            </h1>
            <p className="mt-3 max-w-3xl text-lg text-gray-300">
              {content?.intro ?? `Shop tires for all ${makeName} models. Compare sizes, brands, and prices with free shipping on every order.`}
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          {/* Brand Overview */}
          {content?.overview && (
            <div className="mb-12 rounded-xl bg-white border border-gray-200 p-6 sm:p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900">
                About {makeName} Vehicles
              </h2>
              {content.overview.split("\n\n").map((paragraph, i) => (
                <p key={i} className="mt-3 text-gray-600 leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>
          )}

          {/* Tire Selection Guide */}
          {content?.tireGuide && (
            <div className="mb-12 rounded-xl bg-white border border-gray-200 p-6 sm:p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900">
                {makeName} Tire Decision Guide
              </h2>
              <p className="mt-3 text-gray-600 leading-relaxed">
                {content.tireGuide}
              </p>
              {content.popularBrands.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Recommended Brands</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {content.popularBrands.map((brand) => {
                      const brandSlug = brand.toLowerCase().replace(/[^a-z0-9]+/g, "-");
                      return (
                        <Link
                          key={brand}
                          href={`/tires/${brandSlug}`}
                          className="inline-flex items-center rounded-full bg-blue/5 border border-blue/20 px-3 py-1 text-sm font-medium text-blue hover:bg-blue/10 transition-colors"
                        >
                          {brand}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Models Grid */}
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {makeName} Tires by Model
          </h2>

          {models.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {models.map((m) => {
                // Find a sample tire image for this model
                const modelTires = sampleTires.filter(
                  (t) => t.model_name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") === m.modelSlug ||
                    t.model_name.toLowerCase() === m.model.toLowerCase()
                );
                const sampleImage = modelTires[0]?.thumbnail_url ?? modelTires[0]?.image_0100_url ?? null;

                return (
                  <Link
                    key={m.modelSlug}
                    href={`/tires/vehicle/${make}/${m.modelSlug}`}
                    className="group flex items-start gap-4 rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-safety-orange"
                  >
                    {/* Tire image */}
                    <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                      {sampleImage ? (
                        <Image
                          src={sampleImage}
                          alt={`${makeName} ${m.model} tire`}
                          width={64}
                          height={64}
                          className="object-contain"
                        />
                      ) : (
                        <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <circle cx="12" cy="12" r="10" strokeWidth="2" />
                          <circle cx="12" cy="12" r="3" strokeWidth="2" />
                        </svg>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-safety-orange transition-colors">
                        {makeName} {m.model}
                      </h3>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {m.sizes.slice(0, 3).map((size) => (
                          <span
                            key={size}
                            className="rounded bg-gray-100 px-2 py-0.5 text-xs font-mono text-gray-600"
                          >
                            {size}
                          </span>
                        ))}
                        {m.sizes.length > 3 && (
                          <span className="text-xs text-gray-400">+{m.sizes.length - 3} more</span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-safety-orange font-semibold">
                        Shop Tires &rarr;
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
              <h3 className="text-xl font-bold text-gray-900">Models Coming Soon</h3>
              <p className="mt-2 text-gray-500">
                Use our vehicle lookup tool to find tires for your specific {makeName} model.
              </p>
              <Link
                href="/vehicle-lookup"
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-safety-orange px-6 py-3 text-sm font-bold text-white hover:opacity-90 transition-opacity"
              >
                Vehicle Lookup
              </Link>
            </div>
          )}

          {/* Featured Tires for this make */}
          {sampleTires.length > 0 && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Popular {makeName} Tires
              </h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {sampleTires.slice(0, 8).map((tire) => {
                  const brandSlug = tire.make_name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
                  const modelSlug = tire.model_name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
                  const imgSrc = tire.thumbnail_url ?? tire.image_0100_url;
                  return (
                    <Link
                      key={tire.id}
                      href={`/tires/${brandSlug}/${modelSlug}`}
                      className="group rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md hover:border-safety-orange transition-all"
                    >
                      <div className="aspect-square bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden mb-3">
                        {imgSrc ? (
                          <Image
                            src={imgSrc}
                            alt={tire.name}
                            width={160}
                            height={160}
                            className="object-contain max-h-full"
                            />
                        ) : (
                          <svg className="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
                            <circle cx="12" cy="12" r="3" strokeWidth="1.5" />
                          </svg>
                        )}
                      </div>
                      <p className="text-xs font-bold uppercase text-gray-500">{tire.make_name}</p>
                      <h3 className="text-sm font-bold text-gray-900 group-hover:text-safety-orange transition-colors truncate">
                        {tire.model_name}
                      </h3>
                      {tire.width && tire.aspect_ratio && tire.rim_size && (
                        <p className="text-xs font-mono text-gray-500 mt-1">
                          {tire.width}/{tire.aspect_ratio}R{tire.rim_size}
                        </p>
                      )}
                      {tire.season && (
                        <span className="mt-1 inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                          {tire.season}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* FAQ Section */}
          {content?.faqs && content.faqs.length > 0 && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {makeName} Tire FAQ
              </h2>
              <div className="space-y-4">
                {content.faqs.map((faq, i) => (
                  <div key={i} className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900">{faq.q}</h3>
                    <p className="mt-2 text-gray-600 leading-relaxed">{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ship Free CTA */}
          <div className="mt-12 rounded-xl bg-navy p-8 text-center text-white">
            <h3 className="text-xl font-bold">Every {makeName} Tire Ships Free</h3>
            <p className="mt-2 text-gray-400">
              Free shipping to your home or one of 10,000+ installers nationwide.
              Call our US-based tire experts for personalized recommendations.
            </p>
            <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <a
                href="tel:+12792388473"
                className="inline-flex items-center gap-2 rounded-lg bg-safety-orange px-6 py-3 text-sm font-bold text-white hover:opacity-90 transition-opacity"
              >
                Call/Text (279) 238-TIRE
              </a>
              <Link
                href="/vehicle-lookup"
                className="inline-flex items-center gap-2 rounded-lg border border-gray-600 px-6 py-3 text-sm font-bold text-white hover:bg-white/10 transition-colors"
              >
                Find Tires by Vehicle
              </Link>
            </div>
          </div>

          {/* Other Makes */}
          <div className="mt-12">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Shop Tires by Vehicle Make</h2>
            <div className="flex flex-wrap gap-2">
              {vehicleMakes
                .filter((m) => m.slug !== make)
                .map((m) => (
                  <Link
                    key={m.slug}
                    href={`/tires/vehicle/${m.slug}`}
                    className="rounded-full border border-gray-200 bg-white px-3 py-1 text-sm text-gray-700 hover:border-safety-orange hover:text-safety-orange transition-colors"
                  >
                    {m.name}
                  </Link>
                ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
