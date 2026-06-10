import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string; brand?: string }>
}) {
  const { q, type, brand } = await searchParams;

  let query = getSupabase()
    .from("tire_inventory")
    .select("*")
    .eq("active", true)
    .order("brand_name", { ascending: true })
    .order("model_name", { ascending: true })
    .order("size", { ascending: true });

  if (q) {
    query = query.or(`size.ilike.%${q}%,brand_name.ilike.%${q}%,model_name.ilike.%${q}%`);
  }
  if (type) {
    query = query.eq("tire_type", type);
  }
  if (brand) {
    query = query.eq("brand_slug", brand);
  }

  const { data: inventory } = await query;
  const allItems = inventory || [];

  // Get unique brands and types for filters
  const brands = [...new Set(allItems.map((i: Record<string, unknown>) => String(i.brand_slug)))].sort();
  const types = [...new Set(allItems.map((i: Record<string, unknown>) => String(i.tire_type)))].sort();
  const brandNames = new Map<string, string>();
  for (const item of allItems) {
    const rec = item as Record<string, unknown>;
    brandNames.set(String(rec.brand_slug), String(rec.brand_name));
  }

  // Count unique brands
  const uniqueBrands = new Set(allItems.map((i: Record<string, unknown>) => String(i.brand_slug)));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
        <p className="text-sm text-gray-500">
          {allItems.length} SKUs across {uniqueBrands.size} brands
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <form className="flex flex-wrap gap-3 items-center w-full">
          <input
            type="text"
            name="q"
            defaultValue={q || ""}
            placeholder="Search size, brand, model..."
            className="px-3 py-2 border border-gray-300 rounded text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-64"
          />
          <select
            name="type"
            defaultValue={type || ""}
            className="px-3 py-2 border border-gray-300 rounded text-sm text-gray-900 bg-white"
          >
            <option value="">All Types</option>
            {types.map((t) => (
              <option key={t} value={t}>
                {t.replace("-", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              </option>
            ))}
          </select>
          <select
            name="brand"
            defaultValue={brand || ""}
            className="px-3 py-2 border border-gray-300 rounded text-sm text-gray-900 bg-white"
          >
            <option value="">All Brands</option>
            {brands.map((b) => (
              <option key={b} value={b}>
                {brandNames.get(b) || b}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
          >
            Filter
          </button>
          {(q || type || brand) && (
            <a href="/admin/inventory" className="text-sm text-gray-500 hover:text-gray-700">
              Clear
            </a>
          )}
        </form>
      </div>

      {/* Inventory table */}
      <div className="bg-white rounded-lg border border-gray-200">
        {allItems.length === 0 ? (
          <p className="px-5 py-12 text-center text-gray-400 text-sm">No inventory found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Brand</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Model</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Type</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Size</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Price</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Warranty</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Active</th>
                </tr>
              </thead>
              <tbody>
                {allItems.map((item: Record<string, unknown>) => (
                  <tr key={String(item.id)} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">{String(item.brand_name)}</td>
                    <td className="py-3 px-4 text-gray-700">{String(item.model_name)}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                        {String(item.tire_type).replace("-", " ")}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-900 font-mono text-xs">{String(item.size)}</td>
                    <td className="py-3 px-4 text-gray-900">{formatCurrency(Number(item.price))}</td>
                    <td className="py-3 px-4 text-gray-500">{String(item.warranty || "—")}</td>
                    <td className="py-3 px-4">
                      {item.active ? (
                        <span className="text-green-600 text-xs font-medium">Active</span>
                      ) : (
                        <span className="text-red-600 text-xs font-medium">Inactive</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
