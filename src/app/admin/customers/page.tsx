import { getSupabase } from "@/lib/supabase";
import Link from "next/link";

export const dynamic = "force-dynamic";

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams;

  let query = getSupabase()
    .from("tire_customers")
    .select("*")
    .order("created_at", { ascending: false });

  if (q) {
    query = query.or(`phone.ilike.%${q}%,name.ilike.%${q}%`);
  }

  const { data: customers } = await query;
  const allCustomers = customers || [];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Customers</h1>

      {/* Search */}
      <form className="mb-6">
        <input
          type="text"
          name="q"
          defaultValue={q || ""}
          placeholder="Search by phone or name..."
          className="w-full max-w-md px-3 py-2 border border-gray-300 rounded text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </form>

      {/* Customers table */}
      <div className="bg-white rounded-lg border border-gray-200">
        {allCustomers.length === 0 ? (
          <p className="px-5 py-12 text-center text-gray-400 text-sm">No customers found</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-500">Phone</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Name</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Email</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Vehicles</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Orders</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Last Order</th>
              </tr>
            </thead>
            <tbody>
              {allCustomers.map((customer: Record<string, unknown>) => {
                const vehicles = Array.isArray(customer.vehicles) ? customer.vehicles : [];
                return (
                  <tr key={String(customer.id)} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <Link
                        href={`/admin/customers/${encodeURIComponent(String(customer.phone))}`}
                        className="font-medium text-blue-600 hover:text-blue-800"
                      >
                        {String(customer.phone)}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-gray-900">{String(customer.name || "—")}</td>
                    <td className="py-3 px-4 text-gray-600">{String(customer.email || "—")}</td>
                    <td className="py-3 px-4 text-gray-600">{vehicles.length}</td>
                    <td className="py-3 px-4 text-gray-600">{Number(customer.order_count) || 0}</td>
                    <td className="py-3 px-4 text-gray-500">{formatDate(customer.last_order_at as string | null)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
