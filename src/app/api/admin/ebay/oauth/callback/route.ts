export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return new Response("Missing authorization code. eBay sign-in was declined or failed.", {
      status: 400,
      headers: { "Content-Type": "text/plain" },
    });
  }

  const clientId = process.env.EBAY_CLIENT_ID!;
  const clientSecret = process.env.EBAY_CLIENT_SECRET!;
  const ruName = "Sentinel_Health-Sentinel-ShipTi-ntsczypiw";

  // Exchange authorization code for access token + refresh token
  const tokenRes = await fetch("https://api.ebay.com/identity/v1/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: ruName,
    }),
  });

  const data = await tokenRes.json();

  if (!tokenRes.ok || data.error) {
    return new Response(
      `eBay token exchange failed:\n\n${JSON.stringify(data, null, 2)}`,
      { status: 400, headers: { "Content-Type": "text/plain" } }
    );
  }

  // Display the refresh token so it can be copied
  const html = `<!DOCTYPE html>
<html><head><title>eBay OAuth Success</title>
<style>
  body { font-family: system-ui; max-width: 800px; margin: 40px auto; padding: 20px; background: #f9fafb; }
  h1 { color: #16a34a; }
  .token-box { background: #111; color: #4ade80; padding: 16px; border-radius: 8px; word-break: break-all; font-family: monospace; font-size: 12px; max-height: 200px; overflow-y: auto; margin: 12px 0; }
  .label { font-weight: bold; margin-top: 20px; color: #374151; }
  .info { color: #6b7280; font-size: 14px; }
  .warn { background: #fef3c7; border: 1px solid #f59e0b; padding: 12px; border-radius: 8px; margin-top: 20px; font-size: 14px; }
</style></head><body>
<h1>eBay OAuth Connected!</h1>
<p class="info">Your eBay account has been authorized. Copy the refresh token below.</p>

<div class="label">Access Token (expires in ${Math.round((data.expires_in || 7200) / 3600)} hours):</div>
<div class="token-box">${data.access_token || "N/A"}</div>

<div class="label">Refresh Token (expires in ~18 months):</div>
<div class="token-box" id="rt">${data.refresh_token || "N/A"}</div>

<div class="label">Refresh Token Expiry:</div>
<p class="info">${data.refresh_token_expires_in ? Math.round(data.refresh_token_expires_in / 86400) + " days" : "N/A"}</p>

<div class="warn">
  <strong>Copy the Refresh Token above and save it.</strong> This page cannot be regenerated without signing in again.
  The refresh token is what the app uses to authenticate with eBay automatically.
</div>
</body></html>`;

  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html" },
  });
}
