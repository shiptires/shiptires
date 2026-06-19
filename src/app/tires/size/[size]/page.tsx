import { notFound } from "next/navigation";
import Link from "next/link";
import { getTiresBySize, toSlug, getAllBrands, brandSummaryToBrand } from "@/lib/db";
import { sitePrice } from "@/lib/pricing";
import { states } from "@/data/locations";
import { buildBreadcrumbSchema } from "@/lib/breadcrumb-schema";
import type { TireRow } from "@/lib/db";
import type { Metadata } from "next";

export const revalidate = 300;

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

  return {
    title: `All ${parsed.display} Tires — Compare Prices & Brands`,
    description: `Shop all ${parsed.display} tires. Compare brands, prices, and specs. Free shipping on every tire order. Find the perfect ${parsed.display} tire for your vehicle.`,
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

  // Group by brand+model
  const grouped = new Map<string, GroupedModel>();
  for (const tire of tires) {
    const key = `${tire.make_name}|||${tire.model_name}`;
    if (!grouped.has(key)) {
      grouped.set(key, {
        brandName: tire.make_name,
        brandSlug: toSlug(tire.make_name),
        brandLogo: tire.make_image_url,
        modelName: tire.model_name,
        modelSlug: toSlug(tire.model_name),
        season: tire.season || "",
        price: sitePrice(tire.price_map),
        speedRating: tire.speed_rating ?? "",
        loadRating: tire.load_rating ?? "",
        imageUrl: tire.thumbnail_url ?? tire.image_0100_url,
        tireCount: 0,
      });
    }
    grouped.get(key)!.tireCount++;
    // Use lowest non-zero price
    const g = grouped.get(key)!;
    const sp = sitePrice(tire.price_map);
    if (sp > 0 && (g.price === 0 || sp < g.price)) {
      g.price = sp;
    }
  }

  const models = [...grouped.values()].sort((a, b) => {
    if (a.price === 0 && b.price === 0) return a.brandName.localeCompare(b.brandName);
    if (a.price === 0) return 1;
    if (b.price === 0) return -1;
    return a.price - b.price;
  });

  const breadcrumb = buildBreadcrumbSchema([
    { name: "Home", url: "https://ship.tires" },
    { name: "Tires", url: "https://ship.tires/tires" },
    { name: `${parsed.display} Tires`, url: `https://ship.tires/tires/size/${size}` },
  ]);

  const sizeSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `All ${parsed.display} Tires`,
    description: `Compare ${models.length} tires available in ${parsed.display} size.`,
    url: `https://ship.tires/tires/size/${size}`,
  };

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
                        {m.price > 0 ? (
                          <Link
                            href={`/tires/${m.brandSlug}/${m.modelSlug}`}
                            className="inline-flex items-center rounded-md bg-navy px-3 py-1.5 text-xs font-bold text-white hover:bg-navy-light transition-colors"
                          >
                            View
                          </Link>
                        ) : (
                          <Link
                            href={`/contact?tire=${encodeURIComponent(`${m.brandName} ${m.modelName}`)}&size=${encodeURIComponent(parsed.display)}`}
                            className="inline-flex items-center rounded-md bg-safety-orange px-3 py-1.5 text-xs font-bold text-white hover:bg-safety-orange/90 transition-colors"
                          >
                            Request Quote
                          </Link>
                        )}
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
        </div>
      </div>
    </>
  );
}
