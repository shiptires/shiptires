import { getDealerFromRequest } from "@/lib/dealer-auth";
import { getSupabase } from "@/lib/supabase";

export async function GET() {
  const dealerId = await getDealerFromRequest();

  if (!dealerId) {
    return Response.json({ authenticated: false });
  }

  const { data: dealer, error } = await getSupabase()
    .from("dealers")
    .select("id, business_name, email, contact_name")
    .eq("id", dealerId)
    .eq("active", true)
    .single();

  if (error || !dealer) {
    return Response.json({ authenticated: false });
  }

  return Response.json({
    authenticated: true,
    dealer: {
      id: dealer.id,
      business_name: dealer.business_name,
      email: dealer.email,
      contact_name: dealer.contact_name,
    },
  });
}
