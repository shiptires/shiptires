import { NextRequest, NextResponse } from "next/server";

async function isValidAdminSession(cookieValue: string): Promise<boolean> {
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || "";
  if (!secret || !cookieValue) return false;

  const parts = cookieValue.split(".");
  if (parts.length !== 2) return false;

  const [timestamp, signature] = parts;

  // Verify HMAC using Web Crypto API (compatible with Edge and Node.js runtimes)
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

  // Check expiration (24 hours)
  const ts = parseInt(timestamp, 10);
  if (isNaN(ts)) return false;
  if (Date.now() - ts > 24 * 60 * 60 * 1000) return false;

  return true;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Intercept requests ending in .md and rewrite to markdown API
  if (pathname.endsWith(".md")) {
    const pagePath = pathname.slice(0, -3);
    const url = request.nextUrl.clone();
    url.pathname = "/api/markdown";
    url.searchParams.set("path", pagePath || "/");
    return NextResponse.rewrite(url);
  }

  // Protect /admin routes (except /admin/login)
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const sessionCookie = request.cookies.get("admin_session")?.value;

    if (!sessionCookie || !(await isValidAdminSession(sessionCookie))) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/admin/login";
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|logo.png|llm|sitemap|.*\\.(?:svg|png|jpg|jpeg|gif|webp|xml|ico)$).*)"],
};
