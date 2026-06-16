import { isAdminRequest } from "@/lib/admin-auth";
import { bulkUpsertInventory } from "@/lib/distributors";

export const maxDuration = 120;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminRequest())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const body = await req.json();

    if (!Array.isArray(body.items) || body.items.length === 0) {
      return Response.json({ error: "items array required" }, { status: 400 });
    }

    const items = body.items.map((item: {
      tire_id: number;
      cost: number;
      quantity?: number;
      part_number?: string;
      brand: string;
      model: string;
      size: string;
    }) => ({
      distributor_id: id,
      tire_id: item.tire_id,
      cost: item.cost,
      quantity: item.quantity ?? 0,
      part_number: item.part_number,
      brand: item.brand,
      model: item.model,
      size: item.size,
    }));

    const result = await bulkUpsertInventory(items);
    return Response.json(result);
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Bulk import failed" },
      { status: 500 }
    );
  }
}
