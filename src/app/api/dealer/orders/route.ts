import { getDealerFromRequest } from "@/lib/dealer-auth";
import { getSupabase } from "@/lib/supabase";

export async function GET() {
  const dealerId = await getDealerFromRequest();
  if (!dealerId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: orders, error } = await getSupabase()
    .from("dealer_orders")
    .select("*")
    .eq("dealer_id", dealerId)
    .order("created_at", { ascending: false });

  if (error) {
    return Response.json({ error: "Failed to fetch orders" }, { status: 500 });
  }

  return Response.json({ orders: orders ?? [] });
}
