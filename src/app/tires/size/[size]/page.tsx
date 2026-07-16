import { notFound } from "next/navigation";
import Link from "next/link";
import { getTiresBySize, toSlug, getAllBrands, brandSummaryToBrand } from "@/lib/db";
import { resolveImage } from "@/lib/db/mappers";
import { states } from "@/data/locations";
import { buildBreadcrumbSchema } from "@/lib/breadcrumb-schema";
import { getVehiclesForSize } from "@/data/tire-sizes";
import { getSitePriceBatch } from "@/lib/pricing";
import type { TireRow } from "@/lib/db";
import type { Metadata } from "next";

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  return [];
}

function parseSizeSlug(slug: string): { width: string; aspect: string; rim: string; display: string } | null {
  // slug format: "225-65r17" or "225-50r17" or "275-80r22.5"
  const match = slug.match(/^(\d{2,3})-(\d{2,3})r(\d{2,3}(?:\.\d)?)$/i);
  if (!match) return null;
  return {
    width: match[1],
    aspect: match[2],
    rim: match[3],
    display: `${match[1]}/${match[2]}R${match[3]}`,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ size: string }>;
}): Promise<Metadata> {
  const { size } = await params;
  const parsed = parseSizeSlug(size);
  if (!parsed) return {};

  // Fetch tires and get real pricing from distributor/competitor pipeline
  const tires = await getTiresBySize(parsed.width, parsed.aspect, parsed.rim);
  const metaPriceMap = await getSitePriceBatch(
    tires.filter((t) => t.id).map((t) => ({
      id: t.id,
      brand: t.make_name,
      model: t.model_name,
      weight: t.weight ? parseFloat(t.weight) || null : null,
      rimSize: t.rim_size ? parseInt(t.rim_size) || null : null,
    }))
  );
  const prices = [...metaPriceMap.values()].filter((p) => p > 0);
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;

  // Get vehicle names for description
  const vehicles = getVehiclesForSize(parsed.display, 4);
  const vehicleText = vehicles.length > 0
    ? ` Fits ${vehicles.map((v) => `${v.make} ${v.model}`).join(", ")}.`
    : "";

  const title = minPrice > 0
    ? `${parsed.display} Tires for Sale | From $${minPrice} | Free Shipping`
    : `${parsed.display} Tires for Sale | Free Shipping`;

  return {
    title,
    description: `Buy ${parsed.display} tires — compare prices and brands. ${minPrice > 0 ? `Starting at $${minPrice}/tire. ` : ""}Free shipping on every order.${vehicleText}`,
    alternates: {
      canonical: `https://ship.tires/tires/size/${size}`,
      types: { "text/plain": `https://ship.tires/tires/size/${size}/llm.txt` },
    },
  };
}

interface GroupedModel {
  brandName: string;
  brandSlug: string;
  brandLogo: string | null;
  modelName: string;
  modelSlug: string;
  season: string;
  price: number;
  speedRating: string;
  loadRating: string;
  imageUrl: string | null;
  tireCount: number;
}

export default async function SizePage({
  params,
}: {
  params: Promise<{ size: string }>;
}) {
  const { size } = await params;
  const parsed = parseSizeSlug(size);

  if (!parsed) notFound();

  const tires = await getTiresBySize(parsed.width, parsed.aspect, parsed.rim);

  const allBrandRows = await getAllBrands();
  const allBrands = allBrandRows.map(brandSummaryToBrand);
  const topCities = states.flatMap((s) => s.cities.map((c) => ({ ...c, state: s }))).sort((a, b) => b.population - a.population).slice(0, 20);

  // Get real pricing from distributor/competitor pipeline
  const priceMap = await getSitePriceBatch(
    tires.filter((t) => t.id).map((t) => ({
      id: t.id,
      brand: t.make_name,
      model: t.model_name,
      weight: t.weight ? parseFloat(t.weight) || null : null,
      rimSize: t.rim_size ? parseInt(t.rim_size) || null : null,
    }))
  );

  // Group by brand+model (exclude retreads — not consumer products)
  const grouped = new Map<string, GroupedModel>();
  for (const tire of tires) {
    if (/retread/i.test(tire.model_name) || /retread/i.test(tire.name ?? "")) continue;
    const key = `${tire.make_name}|||${tire.model_name}`;
    const tirePrice = priceMap.get(tire.id) ?? 0;
    if (!grouped.has(key)) {
      grouped.set(key, {
        brandName: tire.make_name,
        brandSlug: toSlug(tire.make_name),
        brandLogo: tire.make_image_url,
        modelName: tire.model_name,
        modelSlug: toSlug(tire.model_name),
        season: tire.season || "",
        price: tirePrice,
        speedRating: tire.speed_rating ?? "",
        loadRating: tire.load_rating ?? "",
        imageUrl: resolveImage(tire.local_thumbnail, tire.thumbnail_url, tire.image_0100_url) ?? null,
        tireCount: 0,
      });
    }
    grouped.get(key)!.tireCount++;
    // Use lowest non-zero price
    const g = grouped.get(key)!;
    if (tirePrice > 0 && (g.price === 0 || tirePrice < g.price)) {
      g.price = tirePrice;
    }
  }

  // Show all models, priced first then unpriced
  const models = [...grouped.values()]
    .sort((a, b) => {
      if (a.price > 0 && b.price <= 0) return -1;
      if (a.price <= 0 && b.price > 0) return 1;
      if (a.price > 0 && b.price > 0) return a.price - b.price;
      return a.modelName.localeCompare(b.modelName);
    });

  const breadcrumb = buildBreadcrumbSchema([
    { name: "Home", url: "https://ship.tires" },
    { name: "Tires", url: "https://ship.tires/tires" },
    { name: `${parsed.display} Tires`, url: `https://ship.tires/tires/size/${size}` },
  ]);

  const sizeSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${parsed.display} Tires for Sale`,
    description: `Compare ${models.length} tires available in ${parsed.display} size.`,
    url: `https://ship.tires/tires/size/${size}`,
  };

  // Data for content enrichment and FAQ
  const minPrice = models.length > 0 ? models[0].price : 0;
  const vehicles = getVehiclesForSize(parsed.display, 8);
  const seasons = [...new Set(models.map((m) => m.season).filter(Boolean))];
  const brandNames = [...new Set(models.map((m) => m.brandName))].slice(0, 6);

  // Auto-generated FAQ items
  const faqItems: { q: string; a: string }[] = [];
  if (minPrice > 0) {
    faqItems.push({
      q: `How much do ${parsed.display} tires cost?`,
      a: `${parsed.display} tires at Ship.Tires start at $${minPrice} per tire with free shipping on every order. Prices vary by brand and model — compare ${models.length} options to find the best fit for your budget.`,
    });
  }
  if (vehicles.length > 0) {
    const vehicleList = vehicles.slice(0, 6).map((v) => `${v.make} ${v.model}`).join(", ");
    faqItems.push({
      q: `What vehicles use ${parsed.display} tires?`,
      a: `Vehicles that use ${parsed.display} tires include ${vehicleList}${vehicles.length > 6 ? " and more" : ""}. Use our vehicle lookup tool to confirm the right size for your specific year and trim level.`,
    });
  }
  if (seasons.length > 0) {
    faqItems.push({
      q: `What types of ${parsed.display} tires are available?`,
      a: `Ship.Tires carries ${parsed.display} tires in ${seasons.join(", ")} types from ${brandNames.join(", ")}${brandNames.length < models.length ? " and more" : ""}. Browse all ${models.length} options to find the right tire for your driving needs.`,
    });
  }
  faqItems.push({
    q: `Does Ship.Tires offer free shipping on ${parsed.display} tires?`,
    a: `Yes. Every ${parsed.display} tire at Ship.Tires ships free to anywhere in the continental US — to your door or directly to your preferred installer. No minimum order required.`,
  });

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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(sizeSchema) }}
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

      <div className="bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="bg-navy py-12 text-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Link href="/tires" className="hover:text-white">All Brands</Link>
              <span>/</span>
              <span className="text-gray-300">{parsed.display} Tires</span>
            </div>
            <h1 className="mt-4 text-3xl font-bold sm:text-4xl">
              All {parsed.display} Tires
            </h1>
            <p className="mt-2 text-gray-400">
              {models.length} tires available in {parsed.display} — Free shipping on all orders
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          {/* Content Enrichment — intro paragraph + vehicle pills */}
          {models.length > 0 && (
            <div className="mb-8 rounded-xl bg-white border border-gray-200 p-6 shadow-sm">
              <p className="text-gray-600 leading-relaxed">
                Shop {models.length} {parsed.display} tires from {brandNames.join(", ")}
                {brandNames.length < [...new Set(models.map((m) => m.brandName))].length ? " and more" : ""}
                {minPrice > 0 ? ` — starting at $${minPrice}/tire` : ""}. Every tire ships free to your door or installer anywhere in the continental US.
              </p>
              {vehicles.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-2">
                    Vehicles That Use {parsed.display} Tires
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {vehicles.map((v) => (
                      <Link
                        key={`${v.make}-${v.model}`}
                        href={`/tires/vehicle/${v.make.toLowerCase().replace(/[^a-z0-9]+/g, "-")}/${v.model.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                        className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700 hover:bg-gray-200 transition-colors"
                      >
                        {v.make} {v.model}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {models.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
              <h2 className="text-xl font-bold text-gray-900">No {parsed.display} Tires Found</h2>
              <p className="mt-2 text-gray-500">
                We don&apos;t currently have tires in this size. Contact us and we&apos;ll help find what you need.
              </p>
              <a
                href="tel:+12792388473"
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-orange px-6 py-3 text-sm font-bold text-white"
              >
                Call/Text (279) 238-8473
              </a>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-200 text-left text-xs font-medium uppercase text-gray-500">
                    <th className="py-3 pr-4">Brand</th>
                    <th className="py-3 pr-4">Model</th>
                    <th className="py-3 pr-4">Season</th>
                    <th className="py-3 pr-4">Speed</th>
                    <th className="py-3 pr-4">Load</th>
                    <th className="py-3 pr-4">Price</th>
                    <th className="py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {models.map((m) => (
                    <tr key={`${m.brandSlug}-${m.modelSlug}`} className="hover:bg-gray-50">
                      <td className="py-4 pr-4 font-bold text-gray-900">{m.brandName}</td>
                      <td className="py-4 pr-4">
                        <Link
                          href={`/tires/${m.brandSlug}/${m.modelSlug}`}
                          className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {m.modelName}
                        </Link>
                      </td>
                      <td className="py-4 pr-4 text-gray-600">{m.season || "—"}</td>
                      <td className="py-4 pr-4 text-gray-600">{m.speedRating || "—"}</td>
                      <td className="py-4 pr-4 text-gray-600">{m.loadRating || "—"}</td>
                      <td className="py-4 pr-4 font-bold text-gray-900">
                        {m.price > 0 ? `$${m.price}` : "—"}
                      </td>
                      <td className="py-4">
                        <Link
                          href={`/tires/${m.brandSlug}/${m.modelSlug}`}
                          className="inline-flex items-center rounded-md bg-navy px-3 py-1.5 text-xs font-bold text-white hover:bg-navy-light transition-colors"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Vehicle lookup cross-link */}
          <div className="mt-12 rounded-xl bg-gray-100 p-8 text-center">
            <h3 className="text-lg font-bold text-gray-900">What vehicles use {parsed.display} tires?</h3>
            <p className="mt-2 text-gray-600">
              Use our vehicle lookup tool to find compatible tire sizes for your car, truck, or SUV.
            </p>
            <Link
              href="/vehicle-lookup"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-navy px-6 py-3 text-sm font-bold text-white hover:bg-navy-light transition-colors"
            >
              Vehicle Lookup Tool
            </Link>
          </div>

          {/* Shop by Brand */}
          {allBrands.length > 0 && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold text-gray-900">Shop {parsed.display} by Brand</h2>
              <p className="mt-1 text-sm text-gray-500">Compare {parsed.display} tires from top brands — all ship free</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {allBrands.slice(0, 20).map((b) => (
                  <Link key={b.slug} href={`/tires/${b.slug}/size/${size}`} className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 hover:border-blue hover:text-blue transition-colors">
                    {b.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Ship to Your City */}
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900">Ship {parsed.display} Tires to Your City</h2>
            <p className="mt-1 text-sm text-gray-500">Free shipping to every city in the continental US</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {topCities.map((c) => (
                <Link key={`${c.state.slug}-${c.slug}`} href={`/locations/${c.state.slug}/${c.slug}/size/${size}`} className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:border-blue hover:text-blue transition-colors">
                  {c.name}, {c.state.abbreviation}
                </Link>
              ))}
            </div>
          </div>

          {/* FAQ */}
          {faqItems.length > 0 && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Frequently Asked Questions — {parsed.display} Tires
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
      </div>
    </>
  );
}
