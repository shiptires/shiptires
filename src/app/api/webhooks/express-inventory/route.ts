import { processExpressLocationCsvs, getLocationForFilename } from "@/lib/express-import";
import JSZip from "jszip";

export const maxDuration = 300;

export async function POST(req: Request): Promise<Response> {
  // Bearer token auth — matches the cron secret pattern
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.EXPRESS_WEBHOOK_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const contentType = req.headers.get("content-type") || "";
    const files: Array<{ filename: string; content: string }> = [];

    if (contentType.includes("multipart/form-data")) {
      // Direct file upload (multipart form)
      const formData = await req.formData();
      const entries = formData.getAll("files");

      for (const entry of entries) {
        if (!(entry instanceof File)) continue;

        if (entry.name.endsWith(".zip")) {
          // Zip file — extract CSVs
          const buffer = await entry.arrayBuffer();
          const zip = await JSZip.loadAsync(buffer);
          for (const [name, file] of Object.entries(zip.files)) {
            if (file.dir) continue;
            const basename = name.split("/").pop() || name;
            if (!basename.endsWith(".csv")) continue;
            if (!getLocationForFilename(basename)) continue;
            const content = await file.async("string");
            files.push({ filename: basename, content });
          }
        } else if (entry.name.endsWith(".csv")) {
          const content = await entry.text();
          files.push({ filename: entry.name, content });
        }
      }
    } else {
      // Raw zip body (Google Apps Script sends base64-encoded zip)
      const body = await req.json();
      if (!body.zipBase64) {
        return Response.json({ error: "Expected { zipBase64: '...' } or multipart form" }, { status: 400 });
      }

      const buffer = Uint8Array.from(atob(body.zipBase64), (c) => c.charCodeAt(0));
      const zip = await JSZip.loadAsync(buffer);
      for (const [name, file] of Object.entries(zip.files)) {
        if (file.dir) continue;
        const basename = name.split("/").pop() || name;
        if (!basename.endsWith(".csv")) continue;
        if (!getLocationForFilename(basename)) continue;
        const content = await file.async("string");
        files.push({ filename: basename, content });
      }
    }

    if (files.length === 0) {
      return Response.json({ error: "No recognized Express Tire CSV files found" }, { status: 400 });
    }

    const result = await processExpressLocationCsvs(files);
    return Response.json(result);
  } catch (err) {
    console.error("[express-webhook] Error:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Import failed" },
      { status: 500 }
    );
  }
}
