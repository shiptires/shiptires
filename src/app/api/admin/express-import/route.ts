import { isAdminRequest } from "@/lib/admin-auth";
import { processExpressLocationCsvs } from "@/lib/express-import";

export const maxDuration = 300; // 5 minutes — processing 9 CSVs + Supabase updates

export async function POST(req: Request): Promise<Response> {
  if (!(await isAdminRequest())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const fileEntries = formData.getAll("files");

    if (!fileEntries || fileEntries.length === 0) {
      return Response.json({ error: "No files uploaded" }, { status: 400 });
    }

    const files: Array<{ filename: string; content: string }> = [];

    for (const entry of fileEntries) {
      if (!(entry instanceof File)) continue;
      const content = await entry.text();
      files.push({ filename: entry.name, content });
    }

    if (files.length === 0) {
      return Response.json({ error: "No valid CSV files found" }, { status: 400 });
    }

    const result = await processExpressLocationCsvs(files);
    return Response.json(result);
  } catch (err) {
    console.error("Express import error:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Import failed" },
      { status: 500 }
    );
  }
}
