import { isAdminRequest } from "@/lib/admin-auth";
import { findBestWarehouse } from "@/lib/warehouses";

/**
 * POST /api/admin/warehouses/suggest
 *
 * Finds the best warehouse for a given tire and customer ZIP,
 * optimized by total landed cost (tire cost + estimated shipping).
 *
 * Body: { customerZip: string, tireId: number, distributorSlug?: string }
 * Returns: { warehouse, distance, stock, tireCost, estShipping, totalLandedCost, alternatives }
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

    const result = await findBestWarehouse(
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
      tireCost: result.tireCost,
      estShipping: result.estShipping,
      totalLandedCost: result.totalLandedCost,
      alternatives: result.alternatives.map((alt) => ({
        warehouse: {
          id: alt.warehouse.id,
          label: alt.warehouse.label,
          city: alt.warehouse.city,
          state: alt.warehouse.state,
        },
        distance: Math.round(alt.distance),
        stock: alt.stock,
        tireCost: alt.tireCost,
        estShipping: alt.estShipping,
        totalLandedCost: alt.totalLandedCost,
      })),
    });
  } catch (e) {
    console.error("Warehouse suggest error:", e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Failed to find warehouse" },
      { status: 500 }
    );
  }
}
