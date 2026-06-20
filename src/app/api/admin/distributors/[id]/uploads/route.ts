import { isAdminRequest } from "@/lib/admin-auth";
import { getSupabase } from "@/lib/supabase";

/**
 * GET /api/admin/distributors/[id]/uploads
 *
 * Returns upload history for a distributor, most recent first.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminRequest())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    const { data, error } = await getSupabase()
      .from("distributor_uploads")
      .select("id, method, filename, rows_total, rows_matched, rows_unmatched, rows_zeroed, errors, duration_ms, ip_address, created_at")
      .eq("distributor_id", id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ uploads: data || [] });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Failed to fetch uploads" },
      { status: 500 }
    );
  }
}
