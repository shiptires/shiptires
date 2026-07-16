import Link from "next/link";
import { getSupabase } from "@/lib/supabase";
import { createClient } from "@/lib/supabase/server";
import CartClearer from "@/components/CartClearer";
import MetaPixelPurchase from "@/components/MetaPixelPurchase";
import GoogleCustomerReviews from "@/components/GoogleCustomerReviews";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order_id?: string }>;
}) {
  const { order_id } = await searchParams;

  let orderDetails: {
    email: string;
    total: number;
    items: { brand: string; model: string; size: string; qty: number; price: number }[];
  } | null = null;

  // Check if user is logged in
  let isLoggedIn = false;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    isLoggedIn = !!user;
  } catch {
    // Not logged in
  }

  if (order_id) {
    try {
      const { data: order } = await getSupabase()
        .from("tire_orders")
        .select("customer_email, total, items")
        .eq("payment_id", order_id)
        .single();

      if (order) {
        orderDetails = {
          email: order.customer_email || "",
          total: order.total || 0,
          items: order.items || [],
        };
      }
    } catch {
      // Order retrieval failed — show generic success
    }
  }

  return (
    <div className="bg-gray-50 min-h-[60vh]">
      <CartClearer />
      {orderDetails && (
        <>
          <MetaPixelPurchase
            total={orderDetails.total}
            items={orderDetails.items}
          />
          <GoogleCustomerReviews
            orderId={order_id || ""}
            email={orderDetails.email}
            estimatedDeliveryDate={(() => {
              const d = new Date();
              d.setDate(d.getDate() + 9);
              return d.toISOString().split("T")[0];
            })()}
          />
        </>
      )}
      <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
        </div>
        <h1 className="mt-6 text-3xl font-bold text-gray-900">Order Confirmed!</h1>
        <p className="mt-3 text-gray-600">
          Thank you for your purchase. Your tires will ship within 1-2 business days with free shipping.
        </p>
        <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
          Payment is processing via ACH bank transfer (1-3 business days). You&apos;ll receive a confirmation once the payment clears.
        </div>

        {orderDetails && (
          <div className="mt-8 rounded-xl bg-white border border-gray-200 p-6 text-left shadow-sm">
            <h2 className="text-lg font-bold text-gray-900">Order Details</h2>
            {orderDetails.email && (
              <p className="mt-2 text-sm text-gray-500">
                Confirmation sent to <strong>{orderDetails.email}</strong>
              </p>
            )}
            <ul className="mt-4 space-y-2">
              {orderDetails.items.map((item, i) => (
                <li key={i} className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {item.brand} {item.model} ({item.size}) &times; {item.qty}
                  </span>
                  <span className="font-medium text-gray-900">
                    ${(item.price * item.qty).toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-4 border-t border-gray-200 pt-3 flex justify-between">
              <span className="font-bold text-gray-900">Total</span>
              <span className="font-bold text-gray-900">${orderDetails.total.toFixed(2)}</span>
            </div>
          </div>
        )}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          {isLoggedIn ? (
            <Link
              href="/account/orders"
              className="rounded-lg bg-orange px-6 py-3 text-sm font-bold text-white hover:bg-orange-dark transition-colors"
            >
              View in Account
            </Link>
          ) : (
            <Link
              href="/login"
              className="rounded-lg bg-orange px-6 py-3 text-sm font-bold text-white hover:bg-orange-dark transition-colors"
            >
              Create Account to Track Orders
            </Link>
          )}
          <Link
            href="/tires"
            className="rounded-lg border border-gray-300 px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Continue Shopping
          </Link>
        </div>

        <p className="mt-8 text-sm text-gray-400">
          Questions? Call or text <a href="tel:+12792388473" className="text-orange hover:underline">(279) 238-8473 (TIRE)</a> or email{" "}
          <a href="mailto:info@ship.tires" className="text-orange hover:underline">info@ship.tires</a>
        </p>
      </div>
    </div>
  );
}
