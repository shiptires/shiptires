import { isAdminRequest } from "@/lib/admin-auth";
import { getSupabase } from "@/lib/supabase";
import { hashPassword } from "@/lib/dealer-auth";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminRequest())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const [dealerRes, ordersRes] = await Promise.all([
    getSupabase().from("dealers").select("*").eq("id", id).single(),
    getSupabase()
      .from("dealer_orders")
      .select("*")
      .eq("dealer_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (dealerRes.error) {
    return Response.json({ error: "Dealer not found" }, { status: 404 });
  }

  return Response.json({
    dealer: dealerRes.data,
    orders: ordersRes.data ?? [],
  });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminRequest())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (body.active !== undefined) updates.active = body.active;
    if (body.business_name) updates.business_name = body.business_name;
    if (body.contact_name) updates.contact_name = body.contact_name;
    if (body.email) updates.email = body.email.toLowerCase().trim();
    if (body.phone !== undefined) updates.phone = body.phone;

    // Password reset
    if (body.new_password) {
      const { hash, salt } = await hashPassword(body.new_password);
      updates.password_hash = hash;
      updates.password_salt = salt;
    }

    const { data, error } = await getSupabase()
      .from("dealers")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ dealer: data });
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
}
