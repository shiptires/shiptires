import { isAdminRequest } from "@/lib/admin-auth";
import { syncTireHubInventory } from "@/lib/sftp-sync";

export const maxDuration = 300;

/**
 * POST /api/admin/sftp-sync
 *
 * Manual trigger for TireHub SFTP inventory sync.
 * Accepts either:
 *   - JSON body with { csvUrl } to fetch from a URL
 *   - JSON body with { csvText } to parse directly (for testing/pasting)
 *   - No body — fetches from TIREHUB_CSV_URL env var
 */
export async function POST(req: Request) {
  if (!(await isAdminRequest())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let csvText: string;
    const body = await req.json().catch(() => ({}));

    if (body.csvText) {
      // Direct CSV text provided (testing/paste)
      csvText = body.csvText;
    } else {
      // Fetch from URL
      const csvUrl = body.csvUrl || process.env.TIREHUB_CSV_URL;
      if (!csvUrl) {
        return Response.json(
          { error: "No CSV source. Provide csvUrl, csvText, or set TIREHUB_CSV_URL." },
          { status: 400 }
        );
      }

      const headers: Record<string, string> = {};
      if (process.env.TIREHUB_CSV_AUTH) {
        headers["Authorization"] = process.env.TIREHUB_CSV_AUTH;
      }

      const res = await fetch(csvUrl, {
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
