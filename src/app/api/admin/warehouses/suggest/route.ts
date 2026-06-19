import { isAdminRequest } from "@/lib/admin-auth";
import { findNearestWarehouse } from "@/lib/warehouses";

/**
 * POST /api/admin/warehouses/suggest
 *
 * Finds the nearest warehouse with stock for a given tire and customer ZIP.
 *
 * Body: { customerZip: string, tireId: number, distributorSlug?: string }
 * Returns: { warehouse, distance, stock } or { warehouse: null }
 */
export async function POST(req: Request) {
  if (!(await isAdminRequest())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { customerZip, tireId, distributorSlug } = await req.json();

    if (!customerZip || !tireId) {
      return Response.json(
        { error: "customerZip and tireId are required" },
        { status: 400 }
      );
    }

    const result = await findNearestWarehouse(
      customerZip,
      tireId,
      distributorSlug
    );

    if (!result) {
      return Response.json({ warehouse: null, message: "No stocked warehouse found" });
    }

    return Response.json({
      warehouse: {
        id: result.warehouse.id,
        label: result.warehouse.label,
        distributor_name: result.warehouse.distributorName,
        location_name: result.warehouse.label.split(" — ")[1] || result.warehouse.label,
        postal_code: result.warehouse.postalCode,
        city: result.warehouse.city,
        state: result.warehouse.state,
      },
      distance: Math.round(result.distance),
      stock: result.stock,
    });
  } catch (e) {
    console.error("Warehouse suggest error:", e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Failed to find warehouse" },
      { status: 500 }
    );
  }
}
