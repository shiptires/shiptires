import { createHash } from "crypto";

const VERIFICATION_TOKEN = process.env.EBAY_DELETION_VERIFICATION_TOKEN || "";

function computeChallengeResponse(challengeCode: string, endpoint: string): string {
  const hash = createHash("sha256");
  hash.update(challengeCode);
  hash.update(VERIFICATION_TOKEN);
  hash.update(endpoint);
  return hash.digest("hex");
}

// eBay sends GET with challenge_code query param during endpoint verification
export async function GET(req: Request) {
  const url = new URL(req.url);
  const challengeCode = url.searchParams.get("challenge_code");

  if (!challengeCode) {
    return Response.json({ error: "Missing challenge_code" }, { status: 400 });
  }

  // Endpoint URL must match exactly what's registered in eBay Developer Portal
  const endpoint = "https://ship.tires/api/admin/ebay/deletion";
  const challengeResponse = computeChallengeResponse(challengeCode, endpoint);

  return Response.json({ challengeResponse }, {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

// eBay sends POST when a user deletes their account
export async function POST(req: Request) {
  try {
    const body = await req.json();
    // Log for auditing — Ship.Tires doesn't store eBay user data,
    // so no deletion action is needed beyond acknowledgment
    console.log("[ebay-deletion] Received account deletion notification:", JSON.stringify(body));
  } catch {
    // Accept even if body parsing fails
  }

  return new Response(null, { status: 200 });
}
