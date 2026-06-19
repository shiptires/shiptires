import { NextResponse } from "next/server";
import { syncTireHubInventory } from "@/lib/sftp-sync";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minute timeout

/**
 * Vercel Cron endpoint — downloads TireHub inventory CSV via SFTP and syncs to DB.
 * Runs daily at 6 AM PT (13:00 UTC).
 *
 * Since Vercel serverless can't run native SFTP/SSH libraries, this route
 * fetches the CSV via an SFTP-to-HTTP bridge URL (set in TIREHUB_CSV_URL env var).
 *
 * The bridge can be:
 * - A Hetzner-hosted script that pulls from SFTP and serves via HTTP
 * - An SFTP gateway service (e.g., sftpgateway.com, or a custom Lambda)
 * - A pre-signed URL if TireHub uploads to S3/GCS
 *
 * Alternatively, if TIREHUB_CSV_URL is not set, this can be triggered manually
 * via POST /api/admin/sftp-sync with the CSV content in the request body.
 */
export async function GET(request: Request) {
  // Validate cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const csvUrl = process.env.TIREHUB_CSV_URL;
  if (!csvUrl) {
    return NextResponse.json(
      { error: "TIREHUB_CSV_URL not configured" },
      { status: 500 }
    );
  }

  try {
    // Fetch CSV from SFTP bridge
    const headers: Record<string, string> = {};
    if (process.env.TIREHUB_CSV_AUTH) {
      headers["Authorization"] = process.env.TIREHUB_CSV_AUTH;
    }

    const csvRes = await fetch(csvUrl, {
      headers,
      signal: AbortSignal.timeout(60_000), // 60s to download the file
    });

    if (!csvRes.ok) {
      return NextResponse.json(
        {
          error: `Failed to fetch CSV: ${csvRes.status} ${csvRes.statusText}`,
        },
        { status: 502 }
      );
    }

    const csvText = await csvRes.text();
    if (!csvText.trim()) {
      return NextResponse.json(
        { error: "Empty CSV file received" },
        { status: 502 }
      );
    }

    // Run the sync
    const result = await syncTireHubInventory(csvText);

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (e) {
    console.error("[sftp-sync] Cron failed:", e);
    return NextResponse.json(
      {
        error: "Sync failed",
        details: e instanceof Error ? e.message : String(e),
      },
      { status: 500 }
    );
  }
}
