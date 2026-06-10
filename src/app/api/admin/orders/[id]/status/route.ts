import { getSupabase } from "@/lib/supabase";

const VALID_STATUSES = ["pending", "checkout_sent", "paid", "shipped", "delivered", "cancelled"];

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const { status } = await req.json();

    if (!VALID_STATUSES.includes(status)) {
      return Response.json({ error: "Invalid status" }, { status: 400 });
    }

    const { data, error } = await getSupabase()
      .from("tire_orders")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json(data);
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
}
