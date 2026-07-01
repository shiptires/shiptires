import { isAdminRequest } from "@/lib/admin-auth";
import { getSupabase } from "@/lib/supabase";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminRequest())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const { status } = body;

    if (!status || !["approved", "rejected"].includes(status)) {
      return Response.json({ error: "Status must be 'approved' or 'rejected'" }, { status: 400 });
    }

    const { data, error } = await getSupabase()
      .from("dealer_applications")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ application: data });
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
}
