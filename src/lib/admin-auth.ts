import { cookies } from "next/headers";

/**
 * Verify the admin_session cookie using the same HMAC logic as proxy.ts.
 * Returns true if the session is valid and not expired (24h).
 */
export async function isAdminRequest(): Promise<boolean> {
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || "";
  if (!secret) return false;

  const cookieStore = await cookies();
  const cookieValue = cookieStore.get("admin_session")?.value;
  if (!cookieValue) return false;

  const parts = cookieValue.split(".");
  if (parts.length !== 2) return false;

  const [timestamp, signature] = parts;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(timestamp));
  const expectedSig = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  if (signature !== expectedSig) return false;

  const ts = parseInt(timestamp, 10);
  if (isNaN(ts)) return false;
  if (Date.now() - ts > 24 * 60 * 60 * 1000) return false;

  return true;
}
