import { cookies } from "next/headers";
import { getSupabase } from "@/lib/supabase";
import { verifyPassword, createDealerSession, getDealerFromRequest, hashPassword } from "@/lib/dealer-auth";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return Response.json({ error: "Email and password are required" }, { status: 400 });
    }

    const { data: dealer, error } = await getSupabase()
      .from("dealers")
      .select("id, email, password_hash, password_salt, active, business_name")
      .eq("email", email.toLowerCase().trim())
      .single();

    if (error || !dealer) {
      return Response.json({ error: "Invalid email or password" }, { status: 401 });
    }

    if (!dealer.active) {
      return Response.json({ error: "Account is disabled. Contact info@ship.tires for assistance." }, { status: 401 });
    }

    const valid = await verifyPassword(password, dealer.password_hash, dealer.password_salt);
    if (!valid) {
      return Response.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const cookieValue = await createDealerSession(dealer.id);

    const cookieStore = await cookies();
    cookieStore.set("dealer_session", cookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 24 * 60 * 60,
    });

    return Response.json({ success: true });
  } catch (err) {
    console.error("Dealer auth error:", err);
    return Response.json({ error: err instanceof Error ? err.message : "Invalid request" }, { status: 400 });
  }
}

export async function PATCH(req: Request) {
  try {
    const dealerId = await getDealerFromRequest();
    if (!dealerId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { current_password, new_password } = await req.json();

    if (!current_password || !new_password) {
      return Response.json({ error: "Current and new passwords are required" }, { status: 400 });
    }

    if (new_password.length < 8) {
      return Response.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const { data: dealer, error } = await getSupabase()
      .from("dealers")
      .select("password_hash, password_salt")
      .eq("id", dealerId)
      .single();

    if (error || !dealer) {
      return Response.json({ error: "Dealer not found" }, { status: 404 });
    }

    const valid = await verifyPassword(current_password, dealer.password_hash, dealer.password_salt);
    if (!valid) {
      return Response.json({ error: "Current password is incorrect" }, { status: 401 });
    }

    const { hash, salt } = await hashPassword(new_password);

    await getSupabase()
      .from("dealers")
      .update({ password_hash: hash, password_salt: salt, updated_at: new Date().toISOString() })
      .eq("id", dealerId);

    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
}
