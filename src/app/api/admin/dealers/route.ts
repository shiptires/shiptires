import { isAdminRequest } from "@/lib/admin-auth";
import { getSupabase } from "@/lib/supabase";
import { hashPassword } from "@/lib/dealer-auth";

export async function GET() {
  if (!(await isAdminRequest())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [applicationsRes, dealersRes] = await Promise.all([
    getSupabase()
      .from("dealer_applications")
      .select("*")
      .order("created_at", { ascending: false }),
    getSupabase()
      .from("dealers")
      .select("*")
      .order("created_at", { ascending: false }),
  ]);

  return Response.json({
    applications: applicationsRes.data ?? [],
    dealers: dealersRes.data ?? [],
  });
}

export async function POST(req: Request) {
  if (!(await isAdminRequest())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { application_id, password } = body;

    if (!application_id || !password) {
      return Response.json({ error: "Application ID and password are required" }, { status: 400 });
    }

    // Get the application
    const { data: app, error: appError } = await getSupabase()
      .from("dealer_applications")
      .select("*")
      .eq("id", application_id)
      .single();

    if (appError || !app) {
      return Response.json({ error: "Application not found" }, { status: 404 });
    }

    // Hash the password
    const { hash, salt } = await hashPassword(password);

    // Create the dealer account
    const { data: dealer, error: dealerError } = await getSupabase()
      .from("dealers")
      .insert({
        application_id: app.id,
        business_name: app.business_name,
        contact_name: app.contact_name,
        email: app.email.toLowerCase().trim(),
        phone: app.phone,
        street: app.street,
        city: app.city,
        state: app.state,
        zip: app.zip,
        business_type: app.business_type,
        estimated_monthly_volume: app.estimated_monthly_volume,
        tax_id: app.tax_id,
        website: app.website,
        password_hash: hash,
        password_salt: salt,
        active: true,
      })
      .select()
      .single();

    if (dealerError) {
      return Response.json({ error: `Failed to create dealer: ${dealerError.message}` }, { status: 500 });
    }

    // Update application status
    await getSupabase()
      .from("dealer_applications")
      .update({ status: "approved", updated_at: new Date().toISOString() })
      .eq("id", application_id);

    return Response.json({ dealer });
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
}
