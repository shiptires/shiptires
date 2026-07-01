import { cookies } from "next/headers";

// ── Password hashing (PBKDF2 via Web Crypto — edge-compatible) ───

export async function hashPassword(
  password: string,
  existingSalt?: string
): Promise<{ hash: string; salt: string }> {
  const encoder = new TextEncoder();
  const salt = existingSalt ?? crypto.randomUUID();

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: encoder.encode(salt),
      iterations: 100_000,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );

  const hash = Array.from(new Uint8Array(bits))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return { hash, salt };
}

export async function verifyPassword(
  password: string,
  storedHash: string,
  storedSalt: string
): Promise<boolean> {
  const { hash } = await hashPassword(password, storedSalt);
  return hash === storedHash;
}

// ── Session cookies (HMAC-SHA256, mirrors admin-auth pattern) ────

/**
 * Cookie format: dealerId.timestamp.signature
 * Signature = HMAC-SHA256(dealerId.timestamp, secret)
 */
export async function createDealerSession(dealerId: string): Promise<string> {
  const secret = process.env.DEALER_SESSION_SECRET;
  if (!secret) throw new Error("DEALER_SESSION_SECRET not set");

  const timestamp = Date.now().toString();
  const payload = `${dealerId}.${timestamp}`;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  const signature = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return `${payload}.${signature}`;
}

/**
 * Verify dealer_session cookie. Returns dealer ID or null.
 */
export async function getDealerFromRequest(): Promise<string | null> {
  const secret = process.env.DEALER_SESSION_SECRET;
  if (!secret) return null;

  const cookieStore = await cookies();
  const cookieValue = cookieStore.get("dealer_session")?.value;
  if (!cookieValue) return null;

  const parts = cookieValue.split(".");
  if (parts.length !== 3) return null;

  const [dealerId, timestamp, signature] = parts;

  const payload = `${dealerId}.${timestamp}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  const expectedSig = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  if (signature !== expectedSig) return null;

  // Check 24h expiry
  const ts = parseInt(timestamp, 10);
  if (isNaN(ts)) return null;
  if (Date.now() - ts > 24 * 60 * 60 * 1000) return null;

  return dealerId;
}
