import { isAdminRequest } from "@/lib/admin-auth";
import { getDistributor } from "@/lib/distributors";
import { processInventoryUpload, logUpload } from "@/lib/inventory-upload";

export const maxDuration = 300;

/**
 * POST /api/admin/distributors/[id]/inventory/upload
 *
 * Admin-authenticated CSV upload endpoint.
 * Accepts multipart form with CSV file or raw CSV body.
 * Uses the same processInventoryUpload() logic as the external API.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminRequest())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Verify distributor exists
  const distributor = await getDistributor(id);
  if (!distributor) {
    return Response.json({ error: "Distributor not found" }, { status: 404 });
  }

  // Extract CSV text from request
  let csvText: string;
  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return Response.json(
        { error: 'No file found. Send a CSV file with field name "file".' },
        { status: 400 }
      );
    }
    csvText = await file.text();
  } else {
    try {
      csvText = await req.text();
    } catch {
      return Response.json(
        { error: "Could not read request body." },
        { status: 400 }
      );
    }
  }

  if (!csvText.trim()) {
    return Response.json({ error: "Empty CSV content" }, { status: 400 });
  }

  try {
    const result = await processInventoryUpload(csvText, distributor.id);

    // Log the upload with method "admin"
    await logUpload(distributor.id, result, "admin" as "api" | "sftp", undefined, "admin-ui");

    return Response.json({
      ok: true,
      distributor: distributor.name,
      ...result,
    });
  } catch (e) {
    console.error(`[admin-upload] Upload failed for ${distributor.slug}:`, e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Upload processing failed" },
      { status: 500 }
    );
  }
}
