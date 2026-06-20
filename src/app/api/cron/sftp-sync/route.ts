import { NextResponse } from "next/server";
import { downloadFromSftp, syncTireHubInventory } from "@/lib/sftp-sync";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minute timeout

/**
 * Vercel Cron endpoint — connects to TireHub SFTP, downloads inventory CSV, syncs to DB.
 * Runs daily at 6 AM PT (13:00 UTC).
 *
 * Supports two modes:
 * 1. Direct SFTP: Set TIREHUB_SFTP_HOST, TIREHUB_SFTP_USER, TIREHUB_SFTP_PASSWORD, TIREHUB_SFTP_PATH
 * 2. HTTP fallback: Set TIREHUB_CSV_URL to fetch CSV from an HTTP endpoint instead
 */
export async function GET(request: Request) {
  // Validate cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let csvText: string;

    if (process.env.TIREHUB_SFTP_HOST) {
      // Mode 1: Direct SFTP connection
      csvText = await downloadFromSftp();
    } else if (process.env.TIREHUB_CSV_URL) {
      // Mode 2: HTTP fallback
      const headers: Record<string, string> = {};
      if (process.env.TIREHUB_CSV_AUTH) {
        headers["Authorization"] = process.env.TIREHUB_CSV_AUTH;
      }
      const csvRes = await fetch(process.env.TIREHUB_CSV_URL, {
        headers,
        signal: AbortSignal.timeout(60_000),
      });
      if (!csvRes.ok) {
        return NextResponse.json(
          { error: `Failed to fetch CSV: ${csvRes.status} ${csvRes.statusText}` },
          { status: 502 }
        );
      }
      csvText = await csvRes.text();
    } else {
      return NextResponse.json(
        { error: "No SFTP or CSV URL configured. Set TIREHUB_SFTP_HOST or TIREHUB_CSV_URL." },
        { status: 500 }
      );
    }

    if (!csvText.trim()) {
      return NextResponse.json({ error: "Empty CSV file" }, { status: 502 });
    }

    const result = await syncTireHubInventory(csvText);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error("[sftp-sync] Cron failed:", e);
    return NextResponse.json(
      { error: "Sync failed", details: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
