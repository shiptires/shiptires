import { isAdminRequest } from "@/lib/admin-auth";
import { getDistributor, updateDistributor, getDistributorStats } from "@/lib/distributors";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminRequest())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const distributor = await getDistributor(id);
    if (!distributor) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }
    const stats = await getDistributorStats(id);
    return Response.json({ distributor, stats });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Failed to get distributor" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminRequest())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const body = await req.json();
    const distributor = await updateDistributor(id, body);
    return Response.json({ distributor });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Failed to update distributor" },
      { status: 500 }
    );
  }
}
