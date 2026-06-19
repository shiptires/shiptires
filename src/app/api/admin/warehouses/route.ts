import { isAdminRequest } from "@/lib/admin-auth";
import { getSupabase } from "@/lib/supabase";
import { invalidateWarehouseCache } from "@/lib/warehouses";

// GET — list all warehouses
export async function GET() {
  if (!(await isAdminRequest())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { data, error } = await getSupabase()
      .from("warehouses")
      .select("*")
      .order("is_default", { ascending: false })
      .order("distributor_name")
      .order("location_name");

    if (error) throw error;
    return Response.json({ warehouses: data || [] });
  } catch (e) {
    console.error("Warehouses fetch error:", e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Failed to fetch warehouses" },
      { status: 500 }
    );
  }
}

// POST — create or update a warehouse
export async function POST(req: Request) {
  if (!(await isAdminRequest())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      id,
      distributor_name,
      location_name,
      street1,
      street2,
      city,
      state,
      postal_code,
      country,
      phone,
      contact_name,
      is_default,
      active,
    } = body;

    if (!distributor_name || !location_name || !street1 || !city || !state || !postal_code) {
      return Response.json(
        { error: "distributor_name, location_name, street1, city, state, and postal_code are required" },
        { status: 400 }
      );
    }

    const row = {
      distributor_name,
      location_name,
      street1,
      street2: street2 || null,
      city,
      state,
      postal_code,
      country: country || "US",
      phone: phone || null,
      contact_name: contact_name || null,
      is_default: is_default ?? false,
      active: active ?? true,
    };

    // If setting as default, clear other defaults first
    if (row.is_default) {
      await getSupabase()
        .from("warehouses")
        .update({ is_default: false })
        .eq("is_default", true);
    }

    let result;
    if (id) {
      // Update existing
      const { data, error } = await getSupabase()
        .from("warehouses")
        .update(row)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      result = data;
    } else {
      // Insert new
      const { data, error } = await getSupabase()
        .from("warehouses")
        .insert(row)
        .select()
        .single();
      if (error) throw error;
      result = data;
    }

    invalidateWarehouseCache();
    return Response.json({ warehouse: result });
  } catch (e) {
    console.error("Warehouse save error:", e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Failed to save warehouse" },
      { status: 500 }
    );
  }
}

// DELETE — deactivate a warehouse
export async function DELETE(req: Request) {
  if (!(await isAdminRequest())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await req.json();

    if (!id) {
      return Response.json({ error: "id is required" }, { status: 400 });
    }

    const { error } = await getSupabase()
      .from("warehouses")
      .update({ active: false })
      .eq("id", id);

    if (error) throw error;

    invalidateWarehouseCache();
    return Response.json({ deleted: true });
  } catch (e) {
    console.error("Warehouse delete error:", e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Failed to delete warehouse" },
      { status: 500 }
    );
  }
}
