import { isAdminRequest } from "@/lib/admin-auth";
import { getInventory, upsertInventoryItem } from "@/lib/distributors";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminRequest())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const offset = parseInt(url.searchParams.get("offset") || "0");
    const search = url.searchParams.get("search") || undefined;
    const brand = url.searchParams.get("brand") || undefined;

    const result = await getInventory(id, { limit, offset, search, brand });
    return Response.json(result);
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Failed to get inventory" },
      { status: 500 }
    );
  }
}

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

    if (!body.tire_id || !body.cost || !body.brand || !body.model || !body.size) {
      return Response.json(
        { error: "tire_id, cost, brand, model, and size are required" },
        { status: 400 }
      );
    }

    const item = await upsertInventoryItem({
      distributor_id: id,
      tire_id: body.tire_id,
      cost: body.cost,
      quantity: body.quantity ?? 0,
      part_number: body.part_number,
      brand: body.brand,
      model: body.model,
      size: body.size,
      manufacturer: body.manufacturer,
      description: body.description,
      fet: body.fet,
      map_pricing: body.map_pricing,
    });

    return Response.json({ item }, { status: 201 });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Failed to add inventory item" },
      { status: 500 }
    );
  }
}
