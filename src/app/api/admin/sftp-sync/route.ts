import { isAdminRequest } from "@/lib/admin-auth";
import { downloadFromSftp, syncTireHubInventory } from "@/lib/sftp-sync";

export const maxDuration = 300;

/**
 * POST /api/admin/sftp-sync
 *
 * Manual trigger for TireHub inventory sync. Tries in order:
 *   1. Request body { csvText } — direct CSV content (for testing)
 *   2. Request body { csvUrl } — fetch from URL
 *   3. Direct SFTP connection (TIREHUB_SFTP_* env vars)
 *   4. HTTP fallback (TIREHUB_CSV_URL env var)
 */
export async function POST(req: Request) {
  if (!(await isAdminRequest())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let csvText: string;
    const body = await req.json().catch(() => ({}));

    if (body.csvText) {
      // Direct CSV text (testing/paste)
      csvText = body.csvText;
    } else if (body.csvUrl) {
      // Fetch from provided URL
      const res = await fetch(body.csvUrl, { signal: AbortSignal.timeout(60_000) });
      if (!res.ok) {
        return Response.json(
          { error: `Failed to fetch CSV: ${res.status} ${res.statusText}` },
          { status: 502 }
        );
      }
      csvText = await res.text();
    } else if (process.env.TIREHUB_SFTP_HOST) {
      // Direct SFTP connection
      csvText = await downloadFromSftp();
    } else if (process.env.TIREHUB_CSV_URL) {
      // HTTP fallback
      const headers: Record<string, string> = {};
      if (process.env.TIREHUB_CSV_AUTH) {
        headers["Authorization"] = process.env.TIREHUB_CSV_AUTH;
      }
      const res = await fetch(process.env.TIREHUB_CSV_URL, {
        headers,
        signal: AbortSignal.timeout(60_000),
      });
      if (!res.ok) {
        return Response.json(
          { error: `Failed to fetch CSV: ${res.status} ${res.statusText}` },
          { status: 502 }
        );
      }
      csvText = await res.text();
    } else {
      return Response.json(
        { error: "No CSV source. Provide csvText, csvUrl, or set TIREHUB_SFTP_HOST." },
        { status: 400 }
      );
    }

    if (!csvText.trim()) {
      return Response.json({ error: "Empty CSV content" }, { status: 400 });
    }

    const result = await syncTireHubInventory(csvText);
    return Response.json({ ok: true, ...result });
  } catch (e) {
    console.error("[sftp-sync] Manual sync failed:", e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Sync failed" },
      { status: 500 }
    );
  }
}
