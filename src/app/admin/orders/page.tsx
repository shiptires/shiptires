import { getSupabase } from "@/lib/supabase";
import StatusBadge from "@/components/admin/StatusBadge";
import OrderStatusUpdater from "./OrderStatusUpdater";

export const dynamic = "force-dynamic";

const STATUSES = ["all", "pending", "checkout_sent", "paid", "shipped", "delivered", "cancelled"];

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

interface OrderItem {
  brand?: string;
  model?: string;
  size?: string;
  quantity?: number;
  price?: number;
}

function summarizeItems(items: OrderItem[]) {
  if (!items || items.length === 0) return "—";
  const first = items[0];
  const label = `${first.brand || ""} ${first.model || ""} ${first.size || ""}`.trim();
  if (items.length === 1) return `${label} x${first.quantity || 1}`;
  return `${label} +${items.length - 1} more`;
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; expanded?: string }>
}) {
  const { status: filterStatus, expanded: expandedId } = await searchParams;
  const activeFilter = filterStatus || "all";

  let query = getSupabase()
    .from("tire_orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (activeFilter !== "all") {
    query = query.eq("status", activeFilter);
  }

  const { data: orders } = await query;
  const allOrders = orders || [];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Orders</h1>

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {STATUSES.map((s) => (
          <a
            key={s}
            href={s === "all" ? "/admin/orders" : `/admin/orders?status=${s}`}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              activeFilter === s
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {s === "all" ? "All" : s.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
          </a>
        ))}
      </div>

      {/* Orders table */}
      <div className="bg-white rounded-lg border border-gray-200">
        {allOrders.length === 0 ? (
          <p className="px-5 py-12 text-center text-gray-400 text-sm">No orders found</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-500">Date</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Phone</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Items</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Subtotal</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Checkout</th>
              </tr>
            </thead>
            <tbody>
              {allOrders.map((order: Record<string, unknown>) => {
                const isExpanded = expandedId === String(order.id);
                const items = (order.items || []) as OrderItem[];
                return (
                  <OrderRow
                    key={String(order.id)}
                    order={order}
                    items={items}
                    isExpanded={isExpanded}
                    activeFilter={activeFilter}
                  />
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function OrderRow({
  order,
  items,
  isExpanded,
  activeFilter,
}: {
  order: Record<string, unknown>;
  items: OrderItem[];
  isExpanded: boolean;
  activeFilter: string;
}) {
  const toggleUrl = isExpanded
    ? activeFilter === "all"
      ? "/admin/orders"
      : `/admin/orders?status=${activeFilter}`
    : activeFilter === "all"
      ? `/admin/orders?expanded=${order.id}`
      : `/admin/orders?status=${activeFilter}&expanded=${order.id}`;

  return (
    <>
      <tr className="border-b border-gray-100 hover:bg-gray-50">
        <td className="py-3 px-4 text-gray-600">{formatDate(String(order.created_at))}</td>
        <td className="py-3 px-4 font-medium text-gray-900">{String(order.customer_phone)}</td>
        <td className="py-3 px-4 text-gray-600">{summarizeItems(items)}</td>
        <td className="py-3 px-4 text-gray-900">{formatCurrency(Number(order.subtotal) || 0)}</td>
        <td className="py-3 px-4"><StatusBadge status={String(order.status)} /></td>
        <td className="py-3 px-4">
          <div className="flex items-center gap-2">
            {order.checkout_url ? (
              <a
                href={String(order.checkout_url)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-xs"
              >
                Link
              </a>
            ) : null}
            <a href={toggleUrl} className="text-gray-400 hover:text-gray-600 text-xs">
              {isExpanded ? "▲" : "▼"}
            </a>
          </div>
        </td>
      </tr>
      {isExpanded && (
        <tr className="bg-gray-50 border-b border-gray-100">
          <td colSpan={6} className="px-4 py-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Order Items</h4>
                <div className="space-y-2">
                  {items.map((item, i) => (
                    <div key={i} className="text-sm">
                      <span className="font-medium">{item.brand} {item.model}</span>{" "}
                      <span className="text-gray-500">{item.size} x{item.quantity}</span>{" "}
                      <span className="text-gray-700">{formatCurrency((item.price || 0) * (item.quantity || 1))}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Update Status</h4>
                <OrderStatusUpdater
                  orderId={String(order.id)}
                  currentStatus={String(order.status)}
                />
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
