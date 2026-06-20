import { isAdminRequest } from "@/lib/admin-auth";
import { getSupabase } from "@/lib/supabase";

/**
 * POST /api/admin/distributors/[id]/api-key
 *
 * Generate a new API key for a distributor. Returns the raw key ONCE —
 * only the hash is stored in the database. If the distributor already has
 * a key, this replaces it (old key stops working immediately).
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminRequest())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    // Verify distributor exists
    const { data: distributor } = await getSupabase()
      .from("distributors")
      .select("id, name, slug")
      .eq("id", id)
      .single();

    if (!distributor) {
      return Response.json({ error: "Distributor not found" }, { status: 404 });
    }

    // Generate a secure random API key
    const rawKey = generateApiKey(distributor.slug);
    const keyHash = await hashApiKey(rawKey);
    const keyPrefix = rawKey.slice(0, 8);

    // Store hash + prefix
    const { error } = await getSupabase()
      .from("distributors")
      .update({ api_key_hash: keyHash, api_key_prefix: keyPrefix })
      .eq("id", id);

    if (error) {
      return Response.json(
        { error: `Failed to save API key: ${error.message}` },
        { status: 500 }
      );
    }

    return Response.json({
      ok: true,
      apiKey: rawKey,
      prefix: keyPrefix,
      warning: "Save this key now — it cannot be retrieved again. Only the hash is stored.",
      usage: {
        endpoint: "POST https://ship.tires/api/feeds/inventory-upload",
        curlExample: `curl -X POST https://ship.tires/api/feeds/inventory-upload -H "Authorization: Bearer ${rawKey}" -H "Content-Type: text/csv" --data-binary @inventory.csv`,
      },
    });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Failed to generate API key" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/distributors/[id]/api-key
 *
 * Revoke a distributor's API key.
 */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminRequest())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    const { error } = await getSupabase()
      .from("distributors")
      .update({ api_key_hash: null, api_key_prefix: null })
      .eq("id", id);

    if (error) {
      return Response.json(
        { error: `Failed to revoke key: ${error.message}` },
        { status: 500 }
      );
    }

    return Response.json({ ok: true, message: "API key revoked" });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Failed to revoke key" },
      { status: 500 }
    );
  }
}

// ── Helpers ─────────────────────────────────────────────────

function generateApiKey(slug: string): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `st_${slug}_${hex}`;
}

async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
