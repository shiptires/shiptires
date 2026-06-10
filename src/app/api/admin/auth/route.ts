import { createHmac } from "crypto";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const { password } = await req.json();
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      return Response.json({ error: "Admin not configured" }, { status: 500 });
    }

    if (password !== adminPassword) {
      return Response.json({ error: "Invalid password" }, { status: 401 });
    }

    const secret = process.env.ADMIN_SESSION_SECRET || adminPassword;
    const timestamp = Date.now().toString();
    const signature = createHmac("sha256", secret).update(timestamp).digest("hex");
    const cookieValue = `${timestamp}.${signature}`;

    const cookieStore = await cookies();
    cookieStore.set("admin_session", cookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 24 * 60 * 60, // 24 hours
    });

    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
}
