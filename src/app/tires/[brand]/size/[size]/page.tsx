import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { getBrandBySlug, getTiresByBrandAndSize, getDistinctSizesForBrand, brandSummaryToBrand, toSlug, getAllBrands } from "@/lib/db";
import { sitePrice } from "@/lib/pricing";
import { buildBreadcrumbSchema } from "@/lib/breadcrumb-schema";
import { states } from "@/data/locations";

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  return [];
}

function parseSizeSlug(slug: string) {
  const match = slug.match(/^(\d{2,3})-(\d{2,3})r(\d{2,3}(?:\.\d)?)$/i);
  if (!match) return null;
  return { width: match[1], aspect: match[2], rim: match[3], display: `${match[1]}/${match[2]}R${match[3]}` };
}

export async function generateMetadata({ params }: { params: Promise<{ brand: string; size: string }> }): Promise<Metadata> {
  const { brand: brandSlug, size } = await params;
  const parsed = parseSizeSlug(size);
  const brandRow = await getBrandBySlug(brandSlug);
  if (!parsed || !brandRow) return {};
  return {
    title: `Shop ${brandRow.make_name} ${parsed.display} Tires — Ship Free | Ship.Tires`,
    description: `Shop ${brandRow.make_name} ${parsed.display} tires online and ship free. Compare models, prices, and specs. Find ${brandRow.make_name} ${parsed.display} tires for your vehicle at Ship.Tires.`,
    alternates: { canonical: `https://ship.tires/tires/${brandSlug}/size/${size}` },
  };
}

export default async function BrandSizePage({ params }: { params: Promise<{ brand: string; size: string }> }) {
  const { brand: brandSlug, size } = await params;
  const parsed = parseSizeSlug(size);
  if (!parsed) notFound();

  const brandRow = await getBrandBySlug(brandSlug);
  if (!brandRow) notFound();

  const brand = brandSummaryToBrand(brandRow);
  const tires = await getTiresByBrandAndSize(brandSlug, parsed.width, parsed.aspect, parsed.rim);
  const allSizes = await getDistinctSizesForBrand(brandSlug);
  const allBrandRows = await getAllBrands();

  // Group tires by model (exclude retreads — not consumer products)
  const grouped = new Map<string, { modelName: string; modelSlug: string; season: string; price: number; speedRating: string; loadRating: string; imageUrl: string | null; tireCount: number }>();
  for (const tire of tires) {
    if (/retread/i.test(tire.model_name) || /retread/i.test(tire.name ?? "")) continue;
    const key = tire.model_name;
    if (!grouped.has(key)) {
      grouped.set(key, {
        modelName: tire.model_name,
        modelSlug: toSlug(tire.model_name),
        season: tire.season || "",
        price: sitePrice(tire.price_map),
        speedRating: tire.speed_rating ?? "",
        loadRating: tire.load_rating ?? "",
        imageUrl: tire.thumbnail_url ?? tire.image_0100_url ?? null,
        tireCount: 0,
      });
    }
    const g = grouped.get(key)!;
    g.tireCount++;
    const sp = sitePrice(tire.price_map);
    if (sp > 0 && (g.price === 0 || sp < g.price)) {
      g.price = sp;
    }
  }

  // Only show models with real pricing (hide no-price items from public display)
  const models = [...grouped.values()]
    .filter((m) => m.price > 0)
    .sort((a, b) => a.price - b.price);

  // Top 20 cities for cross-links
  const topCities = states
    .flatMap((s) => s.cities.map((c) => ({ ...c, state: s })))
    .sort((a, b) => b.population - a.population)
    .slice(0, 20);

  // Other brands that have this size (for cross-links)
  const otherBrands = allBrandRows
    .filter((b) => toSlug(b.make_name) !== brandSlug)
    .slice(0, 20);

  // Other sizes for this brand (for cross-links) - top 20
  const otherSizes = allSizes
    .filter((s) => `${s.width}-${s.aspect_ratio}r${s.rim_size}`.toLowerCase() !== size.toLowerCase())
    .slice(0, 20);

  const breadcrumb = buildBreadcrumbSchema([
    { name: "Home", url: "https://ship.tires" },
    { name: brand.name, url: `https://ship.tires/tires/${brandSlug}` },
    { name: `${parsed.display}`, url: `https://ship.tires/tires/${brandSlug}/size/${size}` },
  ]);

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${brand.name} ${parsed.display} Tires`,
    description: `${models.length} ${brand.name} tire models available in ${parsed.display} size.`,
    url: `https://ship.tires/tires/${brandSlug}/size/${size}`,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }} />

      <div className="bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="bg-navy py-12 text-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center gap-2 text-sm text-gray-400">
              <Link href="/" className="hover:text-white">Home</Link>
              <span>/</span>
              <Link href={`/tires/${brandSlug}`} className="hover:text-white">{brand.name}</Link>
              <span>/</span>
              <span className="text-gray-300">{parsed.display}</span>
            </nav>
            <h1 className="mt-4 text-3xl font-bold sm:text-4xl">
              Shop {brand.name} {parsed.display} Tires — Ship Free
            </h1>
            <p className="mt-2 text-gray-400">
              {models.length} {brand.name} models available in {parsed.display} — Free shipping on all orders
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-12">
          {/* Tire table */}
          {models.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
              <h2 className="text-xl font-bold text-gray-900">No {brand.name} {parsed.display} Tires Found</h2>
              <p className="mt-2 text-gray-500">
                We don&apos;t currently have {brand.name} tires in {parsed.display}. Try browsing all {brand.name} sizes or contact us.
              </p>
              <div className="mt-4 flex justify-center gap-3">
                <Link href={`/tires/${brandSlug}`} className="rounded-lg bg-navy px-6 py-3 text-sm font-bold text-white hover:bg-navy-light transition-colors">
                  All {brand.name} Tires
                </Link>
                <Link href={`/tires/size/${size}`} className="rounded-lg border border-gray-300 px-6 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors">
                  All {parsed.display} Tires
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-200 text-left text-xs font-medium uppercase text-gray-500">
                    <th className="py-3 pr-4">Model</th>
                    <th className="py-3 pr-4">Season</th>
                    <th className="py-3 pr-4">Speed</th>
                    <th className="py-3 pr-4">Load</th>
                    <th className="py-3 pr-4">From</th>
                    <th className="py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {models.map((m) => (
                    <tr key={m.modelSlug} className="hover:bg-gray-50">
                      <td className="py-4 pr-4">
                        <Link href={`/tires/${brandSlug}/${m.modelSlug}`} className="font-bold text-blue-600 hover:text-blue-800 hover:underline">
                          {m.modelName}
                        </Link>
                      </td>
                      <td className="py-4 pr-4 text-gray-600">{m.season || "—"}</td>
                      <td className="py-4 pr-4 text-gray-600">{m.speedRating || "—"}</td>
                      <td className="py-4 pr-4 text-gray-600">{m.loadRating || "—"}</td>
                      <td className="py-4 pr-4 font-bold text-gray-900">{m.price > 0 ? `$${m.price}` : "—"}</td>
                      <td className="py-4">
                        <Link href={`/tires/${brandSlug}/${m.modelSlug}`} className="inline-flex items-center rounded-md bg-navy px-3 py-1.5 text-xs font-bold text-white hover:bg-navy-light transition-colors">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* What vehicles use this size */}
          <div className="rounded-xl bg-white border border-gray-200 p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900">What Vehicles Use {parsed.display} Tires?</h2>
            <p className="mt-2 text-gray-600">
              The {parsed.display} tire size is commonly found on midsize sedans, SUVs, and crossovers. Use our vehicle lookup tool to confirm your exact fitment.
            </p>
            <Link href="/vehicle-lookup" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-navy px-6 py-3 text-sm font-bold text-white hover:bg-navy-light transition-colors">
              Vehicle Lookup Tool
            </Link>
          </div>

          {/* Other brands in this size */}
          {otherBrands.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Other Brands in {parsed.display}</h2>
              <p className="mt-1 text-sm text-gray-500">Compare {parsed.display} tires from other top brands</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {otherBrands.map((b) => {
                  const slug = toSlug(b.make_name);
                  return (
                    <Link key={slug} href={`/tires/${slug}/size/${size}`} className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 hover:border-blue hover:text-blue transition-colors">
                      {b.make_name}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Other sizes from this brand */}
          {otherSizes.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Other {brand.name} Sizes</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {otherSizes.map((s) => {
                  const sizeSlug = `${s.width}-${s.aspect_ratio}r${s.rim_size}`.toLowerCase();
                  const display = `${s.width}/${s.aspect_ratio}R${s.rim_size}`;
                  return (
                    <Link key={sizeSlug} href={`/tires/${brandSlug}/size/${sizeSlug}`} className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm font-mono text-gray-700 hover:border-blue hover:text-blue transition-colors">
                      {display}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Ship to city */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Ship {brand.name} {parsed.display} to Your City</h2>
            <p className="mt-1 text-sm text-gray-500">Free shipping to every city in the continental US</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {topCities.map((c) => (
                <Link key={`${c.state.slug}-${c.slug}`} href={`/locations/${c.state.slug}/${c.slug}`} className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:border-blue hover:text-blue transition-colors">
                  {c.name}, {c.state.abbreviation}
                </Link>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="rounded-xl bg-orange p-8 text-center text-white">
            <h3 className="text-xl font-bold">Free Shipping on Every {brand.name} Tire</h3>
            <p className="mt-2 text-white/90">Shop {brand.name} {parsed.display} tires and ship free to your door or installer.</p>
            <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link href={`/tires/${brandSlug}`} className="rounded-lg bg-white px-6 py-3 text-sm font-bold text-orange hover:bg-gray-50 transition-colors">
                All {brand.name} Tires
              </Link>
              <a href="tel:+12792388473" className="rounded-lg border-2 border-white px-6 py-3 text-sm font-bold text-white hover:bg-white/10 transition-colors">
                Call/Text (279) 238-8473 (TIRE)
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
