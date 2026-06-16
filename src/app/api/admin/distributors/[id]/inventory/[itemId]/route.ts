import { isAdminRequest } from "@/lib/admin-auth";
import { deleteInventoryItem } from "@/lib/distributors";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  if (!(await isAdminRequest())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { itemId } = await params;
    await deleteInventoryItem(itemId);
    return Response.json({ success: true });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Failed to delete" },
      { status: 500 }
    );
  }
}
