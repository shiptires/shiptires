import { createClient } from "@/lib/supabase/server";

export async function PATCH(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  // Only allow updating specific fields
  const allowed: Record<string, unknown> = {};
  if (typeof body.full_name === "string") allowed.full_name = body.full_name;
  if (typeof body.phone === "string") allowed.phone = body.phone;
  if (Array.isArray(body.saved_addresses)) allowed.saved_addresses = body.saved_addresses;
  if (Array.isArray(body.vehicles)) allowed.vehicles = body.vehicles;

  if (Object.keys(allowed).length === 0) {
    return Response.json({ error: "No valid fields to update" }, { status: 400 });
  }

  allowed.updated_at = new Date().toISOString();

  const { error } = await supabase
    .from("customer_profiles")
    .update(allowed)
    .eq("id", user.id);

  if (error) {
    return Response.json({ error: "Failed to update profile" }, { status: 500 });
  }

  return Response.json({ ok: true });
}
