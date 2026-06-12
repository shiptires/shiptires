import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const orderId = url.searchParams.get("id");

  if (orderId) {
    // Single order detail
    const { data: order, error } = await supabase
      .from("tire_orders")
      .select("*")
      .eq("id", orderId)
      .eq("auth_user_id", user.id)
      .single();

    if (error || !order) {
      return Response.json({ error: "Order not found" }, { status: 404 });
    }

    return Response.json({ order });
  }

  // All orders for this user
  const { data: orders, error } = await supabase
    .from("tire_orders")
    .select("*")
    .eq("auth_user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return Response.json({ error: "Failed to fetch orders" }, { status: 500 });
  }

  return Response.json({ orders: orders || [] });
}
