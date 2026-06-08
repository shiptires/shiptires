import { notFound } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import SharedCartClient from "./SharedCartClient";
import type { CartItem } from "@/lib/types";

export default async function SharedCheckoutPage({
  params,
}: {
  params: Promise<{ session_id: string }>;
}) {
  const { session_id } = await params;

  const { data, error } = await getSupabase()
    .from("cart_sessions")
    .select("*")
    .eq("id", session_id)
    .single();

  if (error || !data) notFound();

  // Check expiration
  if (new Date(data.expires_at) < new Date()) {
    return (
      <div className="bg-gray-50 min-h-[60vh]">
        <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-gray-900">Cart Link Expired</h1>
          <p className="mt-2 text-gray-500">
            This checkout link has expired. Please create a new one or browse our catalog.
          </p>
          <a href="/tires" className="mt-6 inline-block rounded-lg bg-orange px-6 py-3 text-sm font-bold text-white hover:bg-orange-dark transition-colors">
            Browse Tires
          </a>
        </div>
      </div>
    );
  }

  const items: CartItem[] = data.items;
  const subtotal = items.reduce((sum: number, i: CartItem) => sum + i.price * i.quantity, 0);
  const totalItems = items.reduce((sum: number, i: CartItem) => sum + i.quantity, 0);

  return <SharedCartClient items={items} subtotal={subtotal} totalItems={totalItems} />;
}
