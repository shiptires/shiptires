import { isAdminRequest } from "@/lib/admin-auth";
import { listDistributors, createDistributor } from "@/lib/distributors";

export async function GET() {
  if (!(await isAdminRequest())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const distributors = await listDistributors();
    return Response.json({ distributors });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Failed to list distributors" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  if (!(await isAdminRequest())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    if (!body.name) {
      return Response.json({ error: "Name is required" }, { status: 400 });
    }
    const distributor = await createDistributor(body);
    return Response.json({ distributor }, { status: 201 });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Failed to create distributor" },
      { status: 500 }
    );
  }
}
