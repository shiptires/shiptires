import { getSupabase } from "@/lib/supabase";
import Link from "next/link";
import StatusBadge from "@/components/admin/StatusBadge";

export const dynamic = "force-dynamic";

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

function formatDateShort(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ phone: string }>
}) {
  const { phone } = await params;
  const decodedPhone = decodeURIComponent(phone);
  const supabase = getSupabase();

  const [customerRes, ordersRes, messagesRes] = await Promise.all([
    supabase.from("tire_customers").select("*").eq("phone", decodedPhone).single(),
    supabase.from("tire_orders").select("*").eq("customer_phone", decodedPhone).order("created_at", { ascending: false }),
    supabase.from("sms_messages").select("*").eq("phone", decodedPhone).order("created_at", { ascending: true }),
  ]);

  const customer = customerRes.data;
  const orders = ordersRes.data || [];
  const messages = messagesRes.data || [];

  if (!customer) {
    return (
      <div>
        <Link href="/admin/customers" className="text-blue-600 hover:text-blue-800 text-sm">
          &larr; Back to Customers
        </Link>
        <p className="mt-4 text-gray-500">Customer not found.</p>
      </div>
    );
  }

  const vehicles = Array.isArray(customer.vehicles) ? customer.vehicles : [];

  return (
    <div>
      <Link href="/admin/customers" className="text-blue-600 hover:text-blue-800 text-sm">
        &larr; Back to Customers
      </Link>

      <div className="mt-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{customer.name || customer.phone}</h1>
        {customer.name && <p className="text-gray-500">{customer.phone}</p>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile info */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-3">Profile</h2>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-gray-500">Phone</dt>
              <dd className="text-gray-900">{customer.phone}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Email</dt>
              <dd className="text-gray-900">{customer.email || "—"}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Orders</dt>
              <dd className="text-gray-900">{customer.order_count}</dd>
            </div>
            <div>
              <dt className="text-gray-500">SMS Opted Out</dt>
              <dd className="text-gray-900">{customer.sms_opted_out ? "Yes" : "No"}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Created</dt>
              <dd className="text-gray-900">{formatDate(customer.created_at)}</dd>
            </div>
            {customer.notes && (
              <div>
                <dt className="text-gray-500">Notes</dt>
                <dd className="text-gray-900">{customer.notes}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Vehicles */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-3">Vehicles ({vehicles.length})</h2>
          {vehicles.length === 0 ? (
            <p className="text-gray-400 text-sm">No vehicles on file</p>
          ) : (
            <div className="space-y-3">
              {vehicles.map((v: Record<string, unknown>, i: number) => (
                <div key={i} className="text-sm border-b border-gray-100 pb-2 last:border-0">
                  <p className="font-medium text-gray-900">
                    {String(v.year || "")} {String(v.make || "")} {String(v.model || "")}
                  </p>
                  {v.size ? <p className="text-gray-500">Tire size: {String(v.size)}</p> : null}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Shipping address */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-3">Shipping Address</h2>
          {customer.shipping_address ? (
            <div className="text-sm text-gray-900">
              {(() => {
                const addr = customer.shipping_address as Record<string, string>;
                return (
                  <>
                    <p>{addr.address1}</p>
                    {addr.address2 && <p>{addr.address2}</p>}
                    <p>{addr.city}, {addr.state} {addr.zip}</p>
                  </>
                );
              })()}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No address on file</p>
          )}
        </div>
      </div>

      {/* Order history */}
      <div className="mt-6 bg-white rounded-lg border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Order History ({orders.length})</h2>
        </div>
        {orders.length === 0 ? (
          <p className="px-5 py-8 text-center text-gray-400 text-sm">No orders</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-500">Date</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Items</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Subtotal</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order: Record<string, unknown>) => {
                const items = (order.items || []) as Array<{ brand?: string; model?: string; size?: string; quantity?: number }>;
                return (
                  <tr key={String(order.id)} className="border-b border-gray-100">
                    <td className="py-3 px-4 text-gray-600">{formatDate(String(order.created_at))}</td>
                    <td className="py-3 px-4 text-gray-900">
                      {items.map((item, j) => (
                        <div key={j}>
                          {item.brand} {item.model} {item.size} x{item.quantity}
                        </div>
                      ))}
                    </td>
                    <td className="py-3 px-4 text-gray-900">{formatCurrency(Number(order.subtotal) || 0)}</td>
                    <td className="py-3 px-4"><StatusBadge status={String(order.status)} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* SMS History */}
      <div className="mt-6 bg-white rounded-lg border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">SMS History ({messages.length})</h2>
          <Link
            href={`/admin/conversations/${encodeURIComponent(decodedPhone)}`}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            View full thread
          </Link>
        </div>
        <div className="p-5 space-y-3 max-h-96 overflow-y-auto">
          {messages.length === 0 ? (
            <p className="text-center text-gray-400 text-sm">No messages</p>
          ) : (
            messages.map((msg: Record<string, unknown>) => (
              <div
                key={String(msg.id)}
                className={`flex ${msg.direction === "outbound" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                    msg.direction === "outbound"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-900"
                  }`}
                >
                  <p>{String(msg.body)}</p>
                  <p className={`text-xs mt-1 ${msg.direction === "outbound" ? "text-blue-200" : "text-gray-400"}`}>
                    {formatDateShort(String(msg.created_at))}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
