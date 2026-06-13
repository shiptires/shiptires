import { getSupabase } from "@/lib/supabase";
import Link from "next/link";
import StatusBadge from "@/components/admin/StatusBadge";

export const dynamic = "force-dynamic";

async function getStats() {
  const supabase = getSupabase();

  const [ordersRes, revenueRes, customersRes, inventoryRes] = await Promise.all([
    supabase.from("tire_orders").select("id", { count: "exact", head: true }),
    supabase.from("tire_orders").select("subtotal"),
    supabase.from("tire_customers").select("id", { count: "exact", head: true }),
    supabase.from("tire_inventory").select("id", { count: "exact", head: true }).eq("active", true),
  ]);

  const revenue = (revenueRes.data || []).reduce(
    (sum: number, o: { subtotal: number | null }) => sum + (o.subtotal || 0),
    0
  );

  return {
    totalOrders: ordersRes.count || 0,
    revenue,
    activeCustomers: customersRes.count || 0,
    inventorySKUs: inventoryRes.count || 0,
  };
}

async function getRecentOrders() {
  const { data } = await getSupabase()
    .from("tire_orders")
    .select("id, customer_phone, items, subtotal, status, created_at")
    .order("created_at", { ascending: false })
    .limit(10);
  return data || [];
}

async function getRecentConversations() {
  const { data } = await getSupabase()
    .from("sms_messages")
    .select("phone, body, direction, created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  const messages = data || [];
  // Deduplicate by phone, keep most recent
  const seen = new Map<string, (typeof messages)[number]>();
  for (const msg of messages) {
    if (!seen.has(msg.phone)) seen.set(msg.phone, msg);
  }
  return Array.from(seen.values()).slice(0, 10);
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function summarizeItems(items: Array<{ brand?: string; model?: string; size?: string; quantity?: number }>) {
  if (!items || items.length === 0) return "—";
  const first = items[0];
  const label = `${first.brand || ""} ${first.model || ""} ${first.size || ""}`.trim();
  if (items.length === 1) return `${label} x${first.quantity || 1}`;
  return `${label} +${items.length - 1} more`;
}

export default async function AdminDashboard() {
  const [stats, recentOrders, recentConvos] = await Promise.all([
    getStats(),
    getRecentOrders(),
    getRecentConversations(),
  ]);

  const statCards = [
    { label: "Total Orders", value: stats.totalOrders.toLocaleString() },
    { label: "Revenue", value: formatCurrency(stats.revenue) },
    { label: "Customers", value: stats.activeCustomers.toLocaleString() },
    { label: "Inventory SKUs", value: stats.inventorySKUs.toLocaleString() },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white rounded-lg border border-gray-200 p-5">
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className="text-2xl font-semibold text-gray-900 mt-1">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent orders */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Recent Orders</h2>
            <Link href="/admin/orders" className="text-sm text-safety-orange hover:text-orange-700">
              View all
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {recentOrders.length === 0 ? (
              <p className="px-5 py-8 text-center text-gray-400 text-sm">No orders yet</p>
            ) : (
              recentOrders.map((order: Record<string, unknown>) => (
                <div key={String(order.id)} className="px-5 py-3 flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {String(order.customer_phone)}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {summarizeItems(order.items as Array<{ brand?: string; model?: string; size?: string; quantity?: number }>)}
                    </p>
                  </div>
                  <div className="ml-4 flex items-center gap-3 shrink-0">
                    <span className="text-sm text-gray-600">
                      {formatCurrency(Number(order.subtotal) || 0)}
                    </span>
                    <StatusBadge status={String(order.status)} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent SMS conversations */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Recent SMS</h2>
            <Link href="/admin/conversations" className="text-sm text-safety-orange hover:text-orange-700">
              View all
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {recentConvos.length === 0 ? (
              <p className="px-5 py-8 text-center text-gray-400 text-sm">No conversations yet</p>
            ) : (
              recentConvos.map((msg: Record<string, unknown>) => (
                <Link
                  key={String(msg.phone)}
                  href={`/admin/conversations/${encodeURIComponent(String(msg.phone))}`}
                  className="block px-5 py-3 hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">{String(msg.phone)}</span>
                    <span className="text-xs text-gray-400">{formatDate(String(msg.created_at))}</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {msg.direction === "outbound" ? "You: " : ""}
                    {String(msg.body)}
                  </p>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
