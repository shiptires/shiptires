import { isAdminRequest } from "@/lib/admin-auth";
import { getSupabase } from "@/lib/supabase";
import { hashPassword } from "@/lib/dealer-auth";

/**
 * One-time seed endpoint to create the master dealer account.
 * Requires admin auth. Safe to call multiple times (checks if email exists).
 */
export async function POST() {
  if (!(await isAdminRequest())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = "xbt786@gmail.com";
  const password = "shiptires786";

  // Check if already exists
  const { data: existing } = await getSupabase()
    .from("dealers")
    .select("id")
    .eq("email", email)
    .single();

  if (existing) {
    return Response.json({ message: "Master dealer already exists", id: existing.id });
  }

  const { hash, salt } = await hashPassword(password);

  const { data: dealer, error } = await getSupabase()
    .from("dealers")
    .insert({
      business_name: "Ship.Tires Master",
      contact_name: "Admin",
      email,
      phone: "(279) 238-8473",
      business_type: "other",
      password_hash: hash,
      password_salt: salt,
      active: true,
    })
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ message: "Master dealer created", dealer });
}
