import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { states } from "@/data/locations";
import { getAllBrands, brandSummaryToBrand, getTiresBySize, toSlug } from "@/lib/db";
import { findState, findCity } from "@/lib/location-seo";
import { getSitePriceBatch } from "@/lib/pricing";
import { buildBreadcrumbSchema } from "@/lib/breadcrumb-schema";

export const revalidate = 3600;

function parseSizeSlug(slug: string) {
  const match = slug.match(/^(\d{2,3})-(\d{2,3})r(\d{2,3}(?:\.\d)?)$/i);
  if (!match) return null;
  return { width: match[1], aspect: match[2], rim: match[3], display: `${match[1]}/${match[2]}R${match[3]}` };
}

export async function generateMetadata({ params }: { params: Promise<{ state: string; city: string; size: string }> }): Promise<Metadata> {
  const { state: stateSlug, city: citySlug, size } = await params;
  const parsed = parseSizeSlug(size);
  const state = findState(stateSlug);
  const city = state ? findCity(state, citySlug) : undefined;
  if (!parsed || !state || !city) return {};

  return {
    title: `Shop & Ship ${parsed.display} Tires to ${city.name}, ${state.abbreviation} — Free Delivery`,
    description: `Shop ${parsed.display} tires and ship free to ${city.name}, ${state.abbreviation}. Compare brands and prices. Free delivery to your door or installer in ${city.name}.`,
    alternates: { canonical: `https://ship.tires/locations/${stateSlug}/${citySlug}/size/${size}` },
  };
}

export default async function CitySizePage({ params }: { params: Promise<{ state: string; city: string; size: string }> }) {
  const { state: stateSlug, city: citySlug, size } = await params;
  const parsed = parseSizeSlug(size);
  if (!parsed) notFound();

  const state = findState(stateSlug);
  const city = state ? findCity(state, citySlug) : undefined;
  if (!state || !city) notFound();

  const tires = await getTiresBySize(parsed.width, parsed.aspect, parsed.rim);
  const allBrandRows = await getAllBrands();
  const brands = allBrandRows.map(brandSummaryToBrand);

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

  // Group tires by brand+model
  const grouped = new Map<string, { brandName: string; brandSlug: string; modelName: string; modelSlug: string; season: string; price: number; speedRating: string; loadRating: string; tireCount: number }>();
  for (const tire of tires) {
    const key = `${tire.make_name}|||${tire.model_name}`;
    const tirePrice = priceMap.get(tire.id) ?? 0;
    if (!grouped.has(key)) {
      grouped.set(key, {
        brandName: tire.make_name,
        brandSlug: toSlug(tire.make_name),
        modelName: tire.model_name,
        modelSlug: toSlug(tire.model_name),
        season: tire.season || "",
        price: tirePrice,
        speedRating: tire.speed_rating ?? "",
        loadRating: tire.load_rating ?? "",
        tireCount: 0,
      });
    }
    const g = grouped.get(key)!;
    g.tireCount++;
    if (tirePrice > 0 && (g.price === 0 || tirePrice < g.price)) {
      g.price = tirePrice;
    }
  }

  const models = [...grouped.values()].sort((a, b) => {
    if (a.price === 0 && b.price === 0) return a.brandName.localeCompare(b.brandName);
    if (a.price === 0) return 1;
    if (b.price === 0) return -1;
    return a.price - b.price;
  });

  // Group models by brand for display
  const byBrand = new Map<string, typeof models>();
  for (const m of models) {
    if (!byBrand.has(m.brandName)) byBrand.set(m.brandName, []);
    byBrand.get(m.brandName)!.push(m);
  }

  // Popular sizes for cross-links
  const popularSizes = ["225-65r17","265-70r16","205-55r16","235-45r18","275-55r20","195-65r15","245-40r19","215-55r17","255-70r18","285-45r22","245-65r17","275-60r20"];
  const otherSizes = popularSizes.filter((s) => s !== size);

  // Nearby cities
  const nearbyCities = state.cities
    .filter((c) => c.slug !== city.slug)
    .sort((a, b) => b.population - a.population)
    .slice(0, 12);

  const breadcrumb = buildBreadcrumbSchema([
    { name: "Home", url: "https://ship.tires" },
    { name: "Locations", url: "https://ship.tires/locations" },
    { name: state.name, url: `https://ship.tires/locations/${stateSlug}` },
    { name: city.name, url: `https://ship.tires/locations/${stateSlug}/${citySlug}` },
    { name: parsed.display, url: `https://ship.tires/locations/${stateSlug}/${citySlug}/size/${size}` },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />

      <div className="bg-gray-50 min-h-screen">
        <div className="bg-navy py-12 text-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center gap-2 text-sm text-gray-400 flex-wrap">
              <Link href="/" className="hover:text-white">Home</Link>
              <span>/</span>
              <Link href="/locations" className="hover:text-white">Locations</Link>
              <span>/</span>
              <Link href={`/locations/${stateSlug}`} className="hover:text-white">{state.name}</Link>
              <span>/</span>
              <Link href={`/locations/${stateSlug}/${citySlug}`} className="hover:text-white">{city.name}</Link>
              <span>/</span>
              <span className="text-gray-300">{parsed.display}</span>
            </nav>
            <h1 className="mt-4 text-3xl font-bold sm:text-4xl">
              Shop & Ship {parsed.display} Tires to {city.name}, {state.abbreviation}
            </h1>
            <p className="mt-2 text-gray-400">
              {models.length} tires in {parsed.display} — Free shipping to {city.name}
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-12">
          {/* Tires by brand */}
          {models.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
              <h2 className="text-xl font-bold text-gray-900">No {parsed.display} Tires Found</h2>
              <p className="mt-2 text-gray-500">
                Contact us to check availability for {parsed.display} tires shipped to {city.name}.
              </p>
              <a href="tel:+12792388473" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-orange px-6 py-3 text-sm font-bold text-white">
                Call/Text (279) 238-8473
              </a>
            </div>
          ) : (
            <div className="space-y-8">
              {[...byBrand.entries()].map(([brandName, brandModels]) => {
                const brandSlug = brandModels[0].brandSlug;
                return (
                  <div key={brandName}>
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-xl font-bold text-gray-900">{brandName}</h2>
                      <Link href={`/locations/${stateSlug}/${citySlug}/${brandSlug}/${size}`} className="text-sm font-medium text-blue-600 hover:underline">
                        View all {brandName} {parsed.display} →
                      </Link>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase text-gray-500">
                            <th className="py-2 pr-4">Model</th>
                            <th className="py-2 pr-4">Season</th>
                            <th className="py-2 pr-4">From</th>
                            <th className="py-2"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {brandModels.map((m) => (
                            <tr key={m.modelSlug} className="hover:bg-gray-50">
                              <td className="py-3 pr-4">
                                <Link href={`/tires/${m.brandSlug}/${m.modelSlug}`} className="font-medium text-blue-600 hover:underline">
                                  {m.modelName}
                                </Link>
                              </td>
                              <td className="py-3 pr-4 text-gray-600">{m.season || "—"}</td>
                              <td className="py-3 pr-4 font-bold text-gray-900">{m.price > 0 ? `$${m.price}` : "—"}</td>
                              <td className="py-3">
                                <Link href={`/tires/${m.brandSlug}/${m.modelSlug}`} className="inline-flex items-center rounded-md bg-navy px-3 py-1.5 text-xs font-bold text-white hover:bg-navy-light transition-colors">
                                  View
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Other popular sizes in this city */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Other Popular Sizes in {city.name}</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {otherSizes.map((s) => {
                const d = s.replace(/^(\d+)-(\d+)r(.+)$/i, "$1/$2R$3");
                return (
                  <Link key={s} href={`/locations/${stateSlug}/${citySlug}/size/${s}`} className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-mono text-gray-700 hover:border-blue hover:text-blue transition-colors">
                    {d}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Nearby cities */}
          {nearbyCities.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Ship {parsed.display} Tires Nearby</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {nearbyCities.map((c) => (
                  <Link key={c.slug} href={`/locations/${stateSlug}/${c.slug}/size/${size}`} className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:border-blue hover:text-blue transition-colors">
                    {c.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="rounded-xl bg-orange p-8 text-center text-white">
            <h3 className="text-xl font-bold">Ship {parsed.display} Tires Free to {city.name}</h3>
            <p className="mt-2 text-white/90">Free delivery to your door or local installer in {city.name}, {state.abbreviation}.</p>
            <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link href={`/locations/${stateSlug}/${citySlug}`} className="rounded-lg bg-white px-6 py-3 text-sm font-bold text-orange hover:bg-gray-50 transition-colors">
                All Tires in {city.name}
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
